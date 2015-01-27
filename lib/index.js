// Dependencies
var FsExtra = require("fs-extra")
  , Ul = require("ul")
  , Moment = require("moment")
  ;

// Constants
const STORE_PATH = Ul.USER_DIR + "/.git-stats"
    , LEVELS = 5
    , SQUARES = ["⬚", "O", "▢", "▤", "▣", "⬛"]
    , DAYS = {
        Sun: 0
      , Mon: 1
      , Tue: 2
      , Wed: 3
      , Thu: 4
      , Fri: 5
      , Sat: 6
      }
    , DAYS_ARR = [
        "Sun"
      , "Mon"
      , "Tue"
      , "Wed"
      , "Thu"
      , "Fri"
      , "Sat"
      ]
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
 * @return {undefined}
 */
GitStats.record = function (data, callback) {

    // Validate data
    callback = callback || function (err) { if (err) throw err; };
    data = Object(data);
    if (typeof data.date === "string") {
        data.date = new Moment(new Date(data.date));
    }

    if (!data.date || !/^Moment|Date$/.test(data.date.constructor.name)) {
        return callback(new Error("The date field should be a string or a date object."));
    }

    if (typeof data.hash !== "string" || !data.hash) {
        return callback(new Error("Invalid hash."));
    }

    if (typeof data.url !== "string" || !data.url) {
        return callback(new Error("Invalid url field."));
    }

    // Get stats
    GitStats.get(function (err, stats) {
        stats = stats || {};
        var day = data.date.format("MMM D, YYYY")
          , today = stats[day] = Object(stats[day])
          , repo = today[data.url] = Object(today[data.url])
          ;

        repo[data.hash] = { date: data.date };

        FsExtra.writeJSON(STORE_PATH, stats, callback);
    });
};

/**
 * get
 * Gets the git stats.
 *
 * @name get
 * @function
 * @param {Function} callback The callback function.
 * @return {undefined}
 */
GitStats.get = function (callback) {
    FsExtra.readJSON(STORE_PATH, callback);
};

GitStats.iterateDays = function (data, callback) {

    if (typeof data === "function") {
        callback = data;
        data = undefined;
    }

    // Merge the defaults
    data = Ul.merge({
        end: Moment()
      , start: Moment().subtract(1, "years")
      , format: "MMM D, YYYY"
    }, data);

    var start = data.start
      , end = data.end
      , cDay = null
      ;

    while (!start.isAfter(end)) {
        cDay = start.format(data.format);
        callback(cDay, start);
        start.add(1, "days")
    }
};

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
};

GitStats.calendar = function (data, callback) {
    GitStats.graph(data, function (err, graph) {
        if (err) { return callback(err); }
        var cal = { total: 0, days: {}, cStreak: 0, lStreak: 0 }
          , cDay = null
          , days = Object.keys(graph)
          , max = 0
          ;

        days.forEach(function (c) {
            cDay = graph[c];
            cal.total += cDay.c;
            if (cDay.c > max) {
                max = cDay.c;
            }

            if (cDay.c > 0) {
                if (++cal.cStreak > cal.lStreak) {
                    cal.lStreak = cal.cStreak;
                }
            } else {
                cal.cStreak = 0;
            }
        });

        days.forEach(function (c) {
            cDay = graph[c];
            cal.days[c] = {
                c: cDay.c
              , level: cDay.c === 0 ? 0 : LEVELS - Math.floor(max / (cDay.c + 2))
            };
        });

        callback(null, cal);
    });
};

GitStats.ansiCalendar = function (data, callback) {

    if (typeof data === "function") {
        callback = data;
        data = undefined;
    }

    var year = []
      , cWeek = [" ", " ", " ", " ", " ", " ", " "]
      , sDay = ""
      , cDayObj = null
      , strYear = ""
      , w = 0
      , d = 0
      ;


    GitStats.calendar(data, function (err, cal) {
        if (err) { return callback(err); }
        GitStats.iterateDays(function (cDay, mDay) {
            sDay = mDay.format("ddd");
            cDayObj = cal.days[cDay];

            if (sDay === "Sun" && Object.keys(cWeek).length) {
                year.push(cWeek);
                cWeek = [" ", " ", " ", " ", " ", " ", " "];
            }

            if (!cDayObj) return;

            cWeek[DAYS[sDay]] = SQUARES[cDayObj.level];
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

        strYear = strYear.trimRight().split("\n").map(function (c, i) {
            return DAYS_ARR[i] + c;
        }).join("\n");

        strYear +=
            "\n" +  "Total commits: " + cal.total
          + "\n" +  "Current Streak: " + cal.cStreak
          + "\n" +  "Longest Streak: " + cal.lStreak
          ;


        callback(null, strYear);
    });
};
