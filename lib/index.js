// Dependencies
var Ul = require("ul")
  , Fs = require("fs")
  , Moment = require("moment")
  , CliBox = require("cli-box")
  ;

// Constants
const STORE_PATH = Ul.USER_DIR + "/.git-stats"
    , LEVELS = [
        "⬚"
      , "▢"
      , "▤"
      , "▣"
      , "■"
      ]
    , DAYS = [
        "Sun"
      , "Mon"
      , "Tue"
      , "Wed"
      , "Thu"
      , "Fri"
      , "Sat"
      ]
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
        callback(new Error("Invalid url field. This commit is not recorded into the git-stats history since you didn't added the remote url. You can import the previous commits using the git-stats-importer tool."));
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
 * Iterate the days, calling the callback function for each day.
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
    data = Ul.merge({
        end: Moment()
      , start: Moment().subtract(1, "years")
      , format: DATE_FORMAT
    }, data);

    var start = data.start
      , end = data.end
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

        levels = Math.ceil(cal.max / (LEVELS.length * 3));
        days.forEach(function (c) {
            cDay = graph[c];
            cal.days[c] = {
                c: cDay.c
              , level: !levels
              ? 0 : (cLevel = Math.floor(cDay.c / levels )) >= 5
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

    var year = []
      , months = []
      , cWeek = [" ", " ", " ", " ", " ", " ", " "]
      , monthHack = "MM"
      , sDay = ""
      , cDayObj = null
      , strYear = ""
      , w = 0
      , d = 0
      , dataClone = {
            start: data.start ? Moment(data.start.format(DATE_FORMAT), DATE_FORMAT) : null
          , end: data.end ? Moment(data.end.format(DATE_FORMAT), DATE_FORMAT) : null
        }
      ;

    GitStats.calendar(data, function (err, cal) {
        if (err) { return callback(err); }
        GitStats.iterateDays(dataClone, function (cDay, mDay) {
            sDay = mDay.format("ddd");
            if (mDay.format("D") === "1") {
                months.push(mDay.format("MMM"));
            }

            cDayObj = cal.days[cDay];
            if (!cDayObj) return;

            if (sDay === "Sun" && Object.keys(cWeek).length) {
                year.push(cWeek);
                cWeek = [" ", " ", " ", " ", " ", " ", " "];
            }

            cWeek[DAYS.indexOf(sDay)] = LEVELS[cDayObj.level];
        });

        if (cWeek.length) {
            year.push(cWeek);
        }

        for (d = 0; d < 7; ++d) {
            for (w = 0; w < year.length; ++w) {
                strYear += " " + year[w][d];
            }
            strYear += "\n";
        }

        // Add day names
        strYear = strYear.split("\n").map(function (c, i) {
            if (i > 6) { return; }
            return DAYS[i] + c;
        }).join("\n");

        monthHack = "MMM";
        strYear = monthHack + months.join("      ") + "\n" + strYear;
        strYear +=
             new Array(5 + 2 * Math.ceil(365 / 7)).join("-")
          + "\n" + "Contributions in the last year: " + cal.total
          + " | " + "Longest Streak: " + cal.lStreak + " days"
          + " | " + "Current Streak: " + cal.cStreak + " days"
          + " | " + "Max a day: " + cal.max
          ;

        strYear = new CliBox({
            w: 10
          , h: 10
          , marks: {
                nw: "╔"
              , n:  "═"
              , ne: "╗"
              , e:  "║"
              , se: "╝"
              , s:  "═"
              , sw: "╚"
              , w:  "║"
              , b: " "
            }
        }, {
            text: strYear
          , stretch: true
          , hAlign: "left"
        }).toString();

        strYear = strYear.replace(monthHack, new Array(monthHack.length + 1).join(" "));

        callback(null, strYear);
    });

    return GitStats;
};
