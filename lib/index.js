// Dependencies
var FsExtra = require("fs-extra")
  , Ul = require("ul")
  ;

const STORE_PATH = Ul.USER_DIR + "/.git-stats";

// Constructor
var GitStats = module.exports = {};

GitStats.record = function (data, callback) {
    FsExtra.readJSON(STORE_PATH, function (err, stats) {
        stats = stats || {};
        var thisRepo = stats[data.url] = Object(stats[data.url]);
        thisRepo[data.hash] = { date: data.date };
        FsExtra.writeJSON(STORE_PATH, stats, callback);
    });
};

GitStats.get = function (data, callback) {
    if (typeof data === "function") {
        callback = data;
        data = {};
    }
    FsExtra.readJSON(STORE_PATH, callback);
};
