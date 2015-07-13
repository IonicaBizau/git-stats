// Dependencies
var Ul = require("ul")
  , Abs = require("abs")
  , ReadJson = require("r-json")
  , WriteJson = require("w-json")
  , Moment = require("moment")
  , Gry = require("gry")
  , IsThere = require("is-there")
  , CliPie = require("cli-pie")
  , CliGhCal = require("cli-gh-cal")
  , GitLogParser = require("gitlog-parser").parse
  , ChildProcess = require("child_process")
  , Deffy = require("deffy")
  , Typpy = require("typpy")
  , Exec = ChildProcess.exec
  , Spawn = ChildProcess.spawn
  ;

// Constants
const DATE_FORMAT = "MMM D, YYYY"
    , DEFAULT_STORE = Abs("~/.git-stats")
    , DEFAULT_DATA = {
        commits: {}
      }
    ;

/**
 * GitStats
 *
 * @name GitStats
 * @function
 * @param {String} dataPath Path to the data file.
 * @return {GitStats} The `GitStats` instance.
 */
function GitStats(dataPath) {
    this.path = Abs(Deffy(dataPath, DEFAULT_STORE));
}

/**
 * record
 * Records a new commit.
 *
 * @name record
 * @function
 * @param {Object} data The commit data containing:
 *
 *  - `date` (String|Date): The date object or a string in a format that can be parsed.
 *  - `url` (String): The repository remote url.
 *  - `hash` (String): The commit hash.
 *
 * @param {Function} callback The callback function.
 * @return {GitStats} The `GitStats` instance.
 */
GitStats.prototype.record = function (data, callback) {

    var self = this;

    // Validate data
    callback = callback || function (err) { if (err) throw err; };
    data = Object(data);

    if (typeof data.date === "string") {
        data.date = new Moment(new Date(data.date));
    }

    if (!/^moment|date$/.test(Typpy(data.date))) {
        callback(new Error("The date field should be a string or a date object."));
        return GitStats;
    }

    if (typeof data.hash !== "string" || !data.hash) {
        callback(new Error("Invalid hash."));
        return GitStats;
    }

    // This is not used, but remains here just in case we need
    // it in the future
    if (typeof data.url !== "string" || !data.url) {
        delete data.url;
    }

    // Get stats
    self.get(function (err, stats) {

        var commits = stats.commits
          , day = data.date.format(DATE_FORMAT)
          , today = commits[day] = Object(commits[day])
          ;

        today[data.hash] = 1;

        self.save(stats, callback);
    });

    return self;
};

/**
 * get
 * Gets the git stats.
 *
 * @name get
 * @function
 * @param {Function} callback The callback function.
 * @return {GitStats} The `GitStats` instance.
 */
GitStats.prototype.get = function (callback) {
    var self = this;
    ReadJson(self.path, function (err, data) {

        if (err && err.code === "ENOENT") {
           return self.save(DEFAULT_DATA, function (err) {
               callback(err, DEFAULT_DATA);
           });
        }

        if (err) { return callback(err); }
        callback(null, data);
    });
    return self;
};

/**
 * save
 * Saves the provided stats.
 *
 * @name save
 * @function
 * @param {Object} stats The stats to be saved.
 * @param {Function} callback The callback function.
 * @return {GitStats} The `GitStats` instance.
 */
GitStats.prototype.save = function (stats, callback) {
    WriteJson(this.path, stats, callback);
    return this;
};

/**
 * iterateDays
 * Iterate through the days, calling the callback function on each day.
 *
 * @name iterateDays
 * @function
 * @param {Object} data An object containing the following fields:
 *
 *  - `start` (Moment): A `Moment` date object representing the start date (default: *an year ago*).
 *  - `end` (Moment): A `Moment` date object representing the end date (default: *now*).
 *  - `format` (String): The format of the date (default: `"MMM D, YYYY"`).
 *
 * @param {Function} callback The callback function called with the current day formatted (type: string) and the `Moment` date object.
 * @return {GitStats} The `GitStats` instance.
 */
GitStats.prototype.iterateDays = function (data, callback) {

    if (typeof data === "function") {
        callback = data;
        data = undefined;
    }

    // Merge the defaults
    data.end = data.end || Moment();
    data.start = data.start || Moment().subtract(1, "years");
    data.format = data.format || DATE_FORMAT;

    var start = new Moment(data.start.format(DATE_FORMAT), DATE_FORMAT)
      , end = new Moment(data.end.format(DATE_FORMAT), DATE_FORMAT)
      , tomrrow = Moment(end.format(DATE_FORMAT), DATE_FORMAT).add(1, "days")
      , endStr = tomrrow.format(DATE_FORMAT)
      , cDay = null
      ;

    while (start.format(DATE_FORMAT) !== endStr) {
        cDay = start.format(data.format);
        callback(cDay, start);
        start.add(1, "days");
    }

    return this;
};

/**
 * graph
 * Creates an object with the stats on the provided period (default: *last year*).
 *
 * @name graph
 * @function
 * @param {Object} data The object passed to the `iterateDays` method.
 * @param {Function} callback The callback function.
 * @return {GitStats} The `GitStats` instance.
 */
GitStats.prototype.graph = function (data, callback) {

    if (typeof data === "function") {
        callback = data;
        data = undefined;
    }

    var self = this;

    // Get commits
    self.get(function (err, stats) {
        if (err) { return callback(err); }

        var cDayObj = null
          , year = {}
          ;

        // Iterate days
        self.iterateDays(data, function (cDay) {
            cDayObj = Object(stats.commits[cDay]);
            cDayObj = year[cDay] = {
                _: cDayObj
              , c: Object.keys(cDayObj).length
            };
        });

        callback(null, year);
    });

    return self;
};

/**
 * calendar
 * Creates the calendar data for the provided period (default: *last year*).
 *
 * @name calendar
 * @function
 * @param {Object} data The object passed to the `graph` method.
 * @param {Function} callback The callback function.
 * @return {GitStats} The `GitStats` instance.
 */
GitStats.prototype.calendar = function (data, callback) {

    var self = this;

    self.graph(data, function (err, graph) {
        if (err) { return callback(err); }

        var cal = { total: 0, days: {}, cStreak: 0, lStreak: 0, max: 0 }
          , cDay = null
          , days = Object.keys(graph)
          , levels = null
          , cLevel = 0
          ;

        days.forEach(function (c) {
            cDay = graph[c];
            cal.total += cDay.c;
            if (cDay.c > cal.max) {
                cal.max = cDay.c;
            }

            if (cDay.c > 0) {
                if (++cal.cStreak > cal.lStreak) {
                    cal.lStreak = cal.cStreak;
                }
            } else {
                cal.cStreak = 0;
            }
        });

        levels = cal.max / (LEVELS.length * 2);
        days.forEach(function (c) {
            cDay = graph[c];
            cal.days[c] = {
                c: cDay.c
              , level: !levels
              ? 0 : (cLevel = Math.round(cDay.c / levels)) >= 4
              ? 4 : !cLevel && cDay.c > 0 ? 1 : cLevel
            };
        });

        callback(null, cal);
    });
    return self;
};

/**
 * ansiCalendar
 * Creates the ANSI contributions calendar.
 *
 * @name ansiCalendar
 * @function
 * @param {Object} data The object passed to the `calendar` method.
 * @param {Function} callback The callback function.
 * @return {GitStats} The `GitStats` instance.
 */
GitStats.prototype.ansiCalendar = function (data, callback) {

    if (typeof data === "function") {
        callback = data;
        data = undefined;
    }

    var self = this;

    self.graph(data, function (err, graph) {
        var cal = [];

        self.iterateDays(data, function (cDay) {
            cDayObj = graph[cDay];
            if (!cDayObj) { return; }
            cal.push([cDay, cDayObj.c]);
        });

        callback(null, CliGhCal(cal, {
            theme: data.theme
          , start: data.start
          , end: data.end
          , firstDay: data.firstDay
        }));
    });

    return self;
};

/**
 * authors
 * Creates an array with the authors of a git repository.
 *
 * @name authors
 * @function
 * @param {String|Object} options The repo path or an object containing the following fields:
 *
 *  - `repo` (String): The repository path.
 *
 * @param {Function} callback The callback function.
 * @return {GitStats} The `GitStats` instance.
 */
GitStats.prototype.authors = function (options, callback) {
    var repo = new Gry(options.repo);
    repo.exec("shortlog -s -n --all", function (err, stdout) {
        if (err) { return callback(err); }
        lines = stdout.split("\n");
        pieData = stdout.split("\n").map(function (c) {
            var splits = c.split("\t").map(function (cc) {
                return cc.trim();
            });
            return {
                value: parseInt(splits[0])
              , label: splits[1]
            };
        });
        callback(null, pieData);
    });
    return this;
};

/**
 * authorsPie
 * Creates the authors pie.
 *
 * @name authorsPie
 * @function
 * @param {String|Object} options The repo path or an object containing the following fields:
 *
 *  - `repo` (String): The repository path.
 *  - `radius` (Number): The pie radius.
 *  - `no_ansi` (Boolean): If `true`, the pie will not contain ansi characters.
 *
 * @param {Function} callback The callback function.
 * @return {GitStats} The `GitStats` instance.
 */
GitStats.prototype.authorsPie = function (options, callback) {

    if (typeof options === "string") {
        options = {
            repo: options
        };
    }

    options = Ul.merge(options, {
        radius: process.stdout.rows / 2 || 20
    });

    if (!IsThere(options.repo)) {
        return callback(new Error("The repository folder doesn't exist."));
    }

    var self = this
      , repo = new Gry(options.repo)
      , pie = null
      , pieData = []
      ;

    self.authors(options, function (err, authors) {
        if (err) { return callback(err); }
        if (authors.length > 50) {
            var others = {
                value: authors.slice(50).reduce(function (a, b) {
                    return a + b.value;
                }, 0)
              , label: "Others"
            };
            authors = authors.slice(0, 50);
            authors.push(others);
        }

        pie = new CliPie(options.radius, authors, {
            legend: true
          , flat: true
          , no_ansi: options.no_ansi
        });

        callback(null, pie.toString());
    });

    return self;
};

/**
 * globalActivity
 * Creates the global contributions calendar (all commits made by all committers).
 *
 * @name globalActivity
 * @function
 * @param {String|Object} options The repo path or an object containing the following fields:
 *
 *  - `repo` (String): The repository path.
 *  - `start` (String): The start date.
 *  - `end` (String): The end date.
 *  - `theme` (String|Object): The calendar theme.
 *
 * @param {Function} callback The callback function.
 * @return {GitStats} The `GitStats` instance.
 */
GitStats.prototype.globalActivity = function (options, callback) {

    if (typeof options === "string") {
        options = {
            repo: options
        };
    }

    options.repo = Abs(options.repo);

    if (!IsThere(options.repo)) {
        return callback(new Error("The repository folder doesn't exist."));
    }

    var commits = {}
      , today = null
      , cal = []
      ;

    GitLogParser(Spawn("git", ["log", "--since", options.start.format(DATE_FORMAT), "--until", options.end.format(DATE_FORMAT)], { cwd: options.repo }).stdout).on("commit", function(commit) {
        if (!commit) { return; }
        today = Moment(commit.date).format(DATE_FORMAT);
        commits[today] = commits[today] || 0;
        ++commits[today];
    }).on("error", function (err) {
        callback(err);
    }).on("finish", function () {
        Object.keys(commits).forEach(function (c) {
            cal.push([c, commits[c]])
        });
        callback(null, CliGhCal(cal, {
            theme: options.theme
          , start: options.start
          , end: options.end
        }));
    });

    return this;
};

module.exports = GitStats;
