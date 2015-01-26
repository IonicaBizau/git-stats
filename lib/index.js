// Dependencies
var FsExtra = require("fs-extra")
  , Ul = require("ul")
  , Moment = require("moment")
  ;

const STORE_PATH = Ul.USER_DIR + "/.git-stats";

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
        var day = data.date.format("MMM DDD, YYYY")
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
 * @param {Object} data The stats filter. **Not yet implemented**.
 * @param {Function} callback The callback function.
 * @return {undefined}
 */
GitStats.get = function (data, callback) {
    if (typeof data === "function") {
        callback = data;
        data = {};
    }
    FsExtra.readJSON(STORE_PATH, callback);
};
