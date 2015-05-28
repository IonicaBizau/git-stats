// Dependencies
var Ul = require("ul")
  , Fs = require("fs")
  , Moment = require("moment")
  , CliBox = require("cli-box")
  , Couleurs = require("couleurs")()
  , Gry = require("gry")
  , IsThere = require("is-there")
  , CliPie = require("cli-pie")
  , CliGhCal = require("cli-gh-cal")
  ;

// Constants
const STORE_PATH = Ul.USER_DIR + "/.git-stats"
    , DATE_FORMAT = "MMM D, YYYY"
    ;

// Constructor
var GitStats = module.exports = {};

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
 * @return {GitStats} The `GitStats` object.
 */
GitStats.record = function (data, callback) {

    // Validate data
    callback = callback || function (err) { if (err) throw err; };
    data = Object(data);
    if (typeof data.date === "string") {
        data.date = new Moment(new Date(data.date));
    }

    if (!data.date || !/^Moment|Date$/.test(data.date.constructor.name)) {
        callback(new Error("The date field should be a string or a date object."));
        return GitStats;
    }

    if (typeof data.hash !== "string" || !data.hash) {
        callback(new Error("Invalid hash."));
        return GitStats;
    }

    if (typeof data.url !== "string" || !data.url) {
        callback(new Error("Invalid url field. This commit is not recorded into the git-stats history since you haven't added the remote url. You can import the previous commits using the git-stats-importer tool."));
        return GitStats;
    }

    // Get stats
    GitStats.get(function (err, stats) {
        stats = stats || {};
        var day = data.date.format(DATE_FORMAT)
          , today = stats[day] = Object(stats[day])
          , repo = today[data.url] = Object(today[data.url])
          ;

        repo[data.hash] = { date: data.date };

        GitStats.save(stats, callback);
    });

    return GitStats;
};

/**
 * get
 * Gets the git stats.
 *
 * @name get
 * @function
 * @param {Function} callback The callback function.
 * @return {GitStats} The `GitStats` object.
 */
GitStats.get = function (callback) {
    Fs.readFile(STORE_PATH, "utf-8", function (err, data) {

        if (err && err.code === "ENOENT") {
           return GitStats.save({}, function (err) {
               callback(err, {});
           });
        }

        if (err) { return callback(err); }
        try {
            data = JSON.parse(data);
        } catch (e) {
            return callback(e);
        }
        callback(null, data);
    });
    return GitStats;
};

/**
 * save
 * Saves the provided stats.
 *
 * @name save
 * @function
 * @param {Object} stats The stats to be saved.
 * @param {Function} callback The callback function.
 * @return {GitStats} The `GitStats` object.
 */
GitStats.save = function (stats, callback) {
    Fs.writeFile(STORE_PATH, JSON.stringify(stats, null, 1), callback);
    return GitStats;
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
 * @return {GitStats} The `GitStats` object.
 */
GitStats.iterateDays = function (data, callback) {

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

    return GitStats;
};

/**
 * graph
 * Creates an object with the stats on the provided period (default: *last year*).
 *
 * @name graph
 * @function
 * @param {Object} data The object passed to the `iterateDays` method.
 * @param {Function} callback The callback function.
 * @return {GitStats} The `GitStats` object.
 */
GitStats.graph = function (data, callback) {

    if (typeof data === "function") {
        callback = data;
        data = undefined;
    }

    // Get commits
    GitStats.get(function (err, stats) {
        if (err) { return callback(err); }

        var cDayObj = null
          , year = {}
          ;

        // Iterate days
        GitStats.iterateDays(data, function (cDay) {
            cDayObj = year[cDay] = {
                _: stats[cDay] || {}
              , c: 0
            };

            Object.keys(cDayObj._).forEach(function (c) {
                cDayObj.c += Object.keys(cDayObj._[c]).length;
            });
        });

        callback(null, year);
    });

    return GitStats;
};

/**
 * calendar
 * Creates the calendar data for the provided period (default: *last year*).
 *
 * @name calendar
 * @function
 * @param {Object} data The object passed to the `graph` method.
 * @param {Function} callback The callback function.
 * @return {GitStats} The `GitStats` object.
 */
GitStats.calendar = function (data, callback) {
    GitStats.graph(data, function (err, graph) {
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
    return GitStats;
};

/**
 * ansiCalendar
 * Creates the ANSI contributions calendar.
 *
 * @name ansiCalendar
 * @function
 * @param {Object} data The object passed to the `calendar` method.
 * @param {Function} callback The callback function.
 * @return {GitStats} The `GitStats` object.
 */
GitStats.ansiCalendar = function (data, callback) {

    if (typeof data === "function") {
        callback = data;
        data = undefined;
    }

    GitStats.graph(data, function (err, graph) {
        var cal = [];

        GitStats.iterateDays(data, function (cDay) {
            cDayObj = graph[cDay];
            if (!cDayObj) { return; }
            cal.push([cDay, cDayObj.c]);
        });

        callback(null, CliGhCal(cal, {
            theme: data.theme
          , start: data.start
          , end: data.end
        }));
    });

    return GitStats;
};

GitStats.authorsPie = function (options, callback) {
    if (typeof options === "string") {
        options = {
            repo: options
        };
    }

    options = Ul.merge(options, {
        radius: process.stdout.rows / 2 || 20
    });

    if (!IsThere.sync(options.repo)) {
        return callback(new Error("Repository is missing."));
    }

    var repo = new Gry(options.repo)
      , pie = null
      , pieData = []
      ;

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

        pie = new CliPie(options.radius, pieData, {
            legend: true
          , flat: true
          , no_ansi: options.no_ansi
        });

        callback(null, pie.toString());
    });
};
