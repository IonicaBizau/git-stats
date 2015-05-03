// Dependencies
var Ul = require("ul")
  , Fs = require("fs")
  , Moment = require("moment")
  , CliBox = require("cli-box")
  , Couleurs = require("couleurs")()
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

    var year = []
      , months = new Array(52) // Stores the months depending on their first week
      , cWeek = [" ", " ", " ", " ", " ", " ", " "]
      , monthHack = "MM"
      , sDay = ""
      , cDayObj = null
      , strYear = ""
      , strMonths = ""
      , w = 0
      , d = 0
      , when = "the last year"
      , dataClone = {
            start: data.start ? Moment(data.start.format(DATE_FORMAT), DATE_FORMAT) : null
          , end: data.end ? Moment(data.end.format(DATE_FORMAT), DATE_FORMAT) : null
        }
      ;

    dataClone.s = data.start.format(DATE_FORMAT);
    dataClone.e = data.end.format(DATE_FORMAT);

    if (Moment().subtract(1, "years").format(DATE_FORMAT) !== dataClone.s
        || Moment().format(DATE_FORMAT) !== dataClone.e) {
        when = [Couleurs.bold(dataClone.s), Couleurs.bold(dataClone.e)].join(" – ");
    }

    GitStats.calendar(data, function (err, cal) {
        if (err) { return callback(err); }
        GitStats.iterateDays(dataClone, function (cDay, mDay) {
            sDay = mDay.format("ddd");

            cDayObj = cal.days[cDay];
            if (!cDayObj) return;

            if (sDay === "Sun" && Object.keys(cWeek).length) {
                year.push(cWeek);
                cWeek = [" ", " ", " ", " ", " ", " ", " "];
            }

            // Store the new month this week
            if (mDay.format("D") === "1") {
                months[year.length] = mDay.format("MMM");
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

        // Months label
        monthHack = "MMMM"; //Left padding

        for (var i = 0; i < months.length; i++) {
            // The length of strMonths should always be 2*(i+1) (at the i-th column)
            if (!months[i]) {
                strMonths += new Array(2*(i+1)-strMonths.length+1).join(" ");
            } else {
                strMonths += months[i];
            }
        }

        strYear = monthHack + strMonths + "\n" + strYear;
        strYear +=
             new Array(5 + 2 * Math.ceil(365 / 7)).join("-")
          + "\n" + "Commits in " + when + ": " + cal.total
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
