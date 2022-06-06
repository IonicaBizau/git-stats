"use strict";

const Ul = require("ul")
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
    , Spawn = ChildProcess.spawn
    , IterateObject = require("iterate-object")
    ;

// Constants
const DATE_FORMAT = "MMM D, YYYY"
    , DEFAULT_STORE = Abs("~/.git-stats")
    , DEFAULT_DATA = {
        commits: {}
      }
    , CONFIG_PATH = Abs("~/.git-stats-config.js")
    ;


class GitStats {
    /**
     * GitStats
     *
     * @name GitStats
     * @function
     * @param {String} dataPath Path to the data file.
     * @return {GitStats} The `GitStats` instance.
     */
    constructor (dataPath) {
        this.path = Abs(Deffy(dataPath, DEFAULT_STORE));
        this.config = {};
    }

    /**
     * getConfig
     * Fetches the configuration object from file (`~/.git-stats-config.js`).
     *
     * @name getConfig
     * @function
     * @param {Function} callback The callback function.
     * @return {Object|Undefined} If no callback is provided, the configuration object will be returned.
     */
    getConfig (callback) {
        let data = {}
          , err = null
          ;

        try {
            data = require(CONFIG_PATH);
        } catch (err) {
            if (err.code === "MODULE_NOT_FOUND") {
                err = null;
                data = {};
            }
        }

        if (callback) {
            return callback(err, data);
        } else {
            if (err) {
                throw err;
            }
        }

        return data;
    }

    /**
     * initConfig
     * Inits the configuration field (`this.config`).
     *
     * @name initConfig
     * @function
     * @param {Object|String} input The path to a custom git-stats configuration file or the configuration object.
     * @param {Function} callback The callback function.
     */
    initConfig (input, callback) {

        const self = this;

        if (Typpy(input, Function)) {
            callback = input;
            input = null;
        }

        input = input || CONFIG_PATH;

        // Handle object input
        if (Typpy(input, Object)) {
            this.config = Ul.deepMerge(input, GitStats.DEFAULT_CONFIG);
            callback && callback(null, this.config);
            return this.config;
        }

        if (callback) {
            this.getConfig(function (err, data) {
                if (err) { return callback(err); }
                self.initConfig(data, callback);
            });
        } else {
            this.initConfig(this.getConfig());
        }
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
     *  - `_data` (Object): If this field is provided, it should be the content of the git-stats data file as object. It will be modified in-memory and then returned.
     *  - `save` (Boolean): If `false`, the result will *not* be saved in the file.
     *
     * @param {Function} callback The callback function.
     * @return {GitStats} The `GitStats` instance.
     */
    record (data, callback) {

        const self = this;

        // Validate data
        callback = callback || function (err) { if (err) throw err; };
        data = Object(data);

        if (typeof data.date === "string") {
            data.date = new Moment(new Date(data.date));
        }

        if (!/^moment|date$/.test(Typpy(data.date))) {
            callback(new Error("The date field should be a string or a date object."));
            return GitStats;
        } else if (Typpy(data.date, Date)) {
            data.date = Moment(data.date);
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

        function modify (err, stats) {

            const commits = stats.commits
                , day = data.date.format(DATE_FORMAT)
                , today = commits[day] = Object(commits[day])
                ;

            today[data.hash] = 1;

            if (data.save === false) {
                callback(null, stats);
            } else {
                self.save(stats, callback);
            }

            return stats;
        }

        // Check if we have input data
        if (data._data) {
            return modify(null, data._data);
        } else {
            // Get stats
            self.get(modify);
        }

        return self;
    }

    /**
     * removeCommit
     * Deletes a specifc commit from the history.
     *
     * @name record
     * @function
     * @param {Object} data The commit data containing:
     *
     *  - `date` (String|Date): The date object or a string in a format that can be parsed. If not provided, the hash object will be searched in all dates.
     *  - `hash` (String): The commit hash.
     *  - `_data` (Object): If this field is provided, it should be the content of the git-stats data file as object. It will be modified in-memory and then returned.
     *  - `save` (Boolean): If `false`, the result will *not* be saved in the file.
     *
     * @param {Function} callback The callback function.
     * @return {GitStats} The `GitStats` instance.
     */
    removeCommit (data, callback) {

        const self = this;

        // Validate data
        callback = callback || function (err) { if (err) throw err; };
        data = Object(data);

        if (typeof data.date === "string") {
            data.date = new Moment(new Date(data.date));
        }

        if (!/^moment|date$/.test(Typpy(data.date))) {
            data.date = null;
        } else if (Typpy(data.date, Date)) {
            data.date = Moment(data.date);
        }

        if (typeof data.hash !== "string" || !data.hash) {
            callback(new Error("Invalid hash."));
            return GitStats;
        }

        function modify (err, stats) {

            if (err) { return callback(err); }
            if (!data.date) {
                IterateObject(stats.commits, function (todayObj) {
                    delete todayObj[data.hash];
                });
            } else {
                const commits = stats.commits
                    , day = data.date.format(DATE_FORMAT)
                    , today = commits[day] = Object(commits[day])
                    ;

                delete today[data.hash];
            }

            if (data.save === false) {
                callback(null, stats);
            } else {
                self.save(stats, callback);
            }

            return stats;
        }

        // Check if we have input data
        if (data._data) {
            return modify(null, data._data);
        } else {
            // Get stats
            self.get(modify);
        }

        return self;
    }

    /**
     * get
     * Gets the git stats.
     *
     * @name get
     * @function
     * @param {Function} callback The callback function.
     * @return {GitStats} The `GitStats` instance.
     */
    get (callback) {
        const self = this;
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
    }

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
    save (stats, callback) {
        WriteJson(this.path, stats, callback);
        return this;
    }

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
    iterateDays (data, callback) {

        if (typeof data === "function") {
            callback = data;
            data = undefined;
        }

        // Merge the defaults
        data.end = data.end || Moment();
        data.start = data.start || Moment().subtract(1, "years");
        data.format = data.format || DATE_FORMAT;

        let start = new Moment(data.start.format(DATE_FORMAT), DATE_FORMAT)
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
    }

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
    graph (data, callback) {

        if (typeof data === "function") {
            callback = data;
            data = undefined;
        }

        const self = this;

        // Get commits
        self.get(function (err, stats) {
            if (err) { return callback(err); }

            let cDayObj = null
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
    }

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
    calendar (data, callback) {

        const self = this;

        self.graph(data, function (err, graph) {
            if (err) { return callback(err); }

            let cal = { total: 0, days: {}, cStreak: 0, lStreak: 0, max: 0 }
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
    }

    /**
     * ansiCalendar
     * Creates the ANSI contributions calendar.
     *
     * @name ansiCalendar
     * @function
     * @param {Object} options The object passed to the `calendar` method.
     * @param {Function} callback The callback function.
     * @return {GitStats} The `GitStats` instance.
     */
    ansiCalendar (options, callback) {

        if (typeof options === "function") {
            callback = options;
            options = undefined;
        }

        const self = this;

        self.graph(options, function (err, graph) {
            let cal = []
              , data = {
                    theme: options.theme
                  , start: options.start
                  , end: options.end
                  , firstDay: options.firstDay
                  , cal: cal
                  , raw: options.raw
                }
              ;

            self.iterateDays(options, function (cDay) {
                const cDayObj = graph[cDay];
                if (!cDayObj) { return; }
                cal.push([cDay, cDayObj.c]);
            });

            callback(null, CliGhCal(cal, data));
        });

        return self;
    }

    /**
     * authors
     * Creates an array with the authors of a git repository.
     *
     * @name authors
     * @function
     * @param {String|Object} options The repo path or an object containing the following fields:
     *
     *  - `repo` (String): The repository path.
     *  - `start` (String): The start date.
     *  - `end` (String): The end date.
     *
     * @param {Function} callback The callback function.
     * @return {GitStats} The `GitStats` instance.
     */
    authors (options, callback) {
        const repo = new Gry(options.repo);
        repo.exec(['shortlog', '-s', '-n', '--all', '--since', options.start.toString(), '--until', options.end.toString()], function (err, stdout) {
            if (err) { return callback(err); }
            const lines = stdout.split("\n");
            const pieData = stdout.split("\n").map(function (c) {
                const splits = c.split("\t").map(function (cc) {
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
    }

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
     *  - `raw` (Boolean): If `true`, the raw JSON will be displayed.
     *
     * @param {Function} callback The callback function.
     * @return {GitStats} The `GitStats` instance.
     */
    authorsPie (options, callback) {

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

        let self = this
          , repo = new Gry(options.repo)
          , pie = null
          , pieData = []
          ;

        self.authors(options, function (err, authors) {
            if (err) { return callback(err); }
            if (authors.length > 50) {
                let others = {
                    value: authors.slice(50).reduce(function (a, b) {
                        return a + b.value;
                    }, 0)
                  , label: "Others"
                };
                authors = authors.slice(0, 50);
                authors.push(others);
            }

            let data = {
                legend: true
              , flat: true
              , no_ansi: options.no_ansi
              , authors: authors
            };

            callback(null, options.raw ? data : new CliPie(options.radius, authors, data).toString());
        });

        return self;
    }

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
     *  - `raw` (Boolean): If `true`, the raw JSON will be displayed.
     *
     * @param {Function} callback The callback function.
     * @return {GitStats} The `GitStats` instance.
     */
    globalActivity (options, callback) {

        if (typeof options === "string") {
            options = {
                repo: options
            };
        }

        options.repo = Abs(options.repo);

        if (!IsThere(options.repo)) {
            return callback(new Error("The repository folder doesn't exist."));
        }

        let commits = {}
          , today = null
          , cal = []
          ;

        let logArgs = ["log","--since", options.start.format(DATE_FORMAT), "--until", options.end.format(DATE_FORMAT)]
        if(options.author){
            logArgs = logArgs.concat(["--author", options.author])
        }

        GitLogParser(Spawn("git",logArgs , { cwd: options.repo }).stdout).on("commit", function(commit) {
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
            let data = {
                theme: options.theme
              , start: options.start
              , end: options.end
              , cal: cal
              , raw: options.raw
            };
            callback(null, CliGhCal(cal, data));
        });

        return this;
    }
}

// Defaults
GitStats.CONFIG_PATH = CONFIG_PATH
GitStats.DEFAULT_CONFIG = {
    // Dark theme by default
    theme: "DARK"

    // This defaults in library
  , path: undefined

    // This defaults in cli-gh-cal
  , first_day: undefined

    // This defaults to *one year ago*
  , since: undefined

    // This defaults to *now*
  , until: undefined

    // Don't show authors by default
  , authors: false

    // No global activity by default
  , global_activity: false
};

module.exports = GitStats;
