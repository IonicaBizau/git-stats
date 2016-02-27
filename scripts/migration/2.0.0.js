#!/usr/bin/env node

// Dependencies
var ReadJson = require("r-json")
  , WriteJson = require("w-json")
  , Abs = require("abs")
  , Logger = require("bug-killer")
  ;

// Constants
const DATA_FILE = Abs("~/.git-stats");

function migrate() {
    try {
        var data = ReadJson(DATA_FILE)
    } catch (e) {
        if (e.code === "ENOENT") {
            return;
        }
        Logger.log(e);
    }

    data.commits = data.commits || {};
    var newStats = { commits: data.commits };
    delete data.commits;
    Object.keys(data).forEach(function (day) {
        var cDay = newStats.commits[day] = newStats.commits[day] || {};
        Object.keys(data[day]).map(function (c) {
            Object.keys(data[day][c]).map(function (h) {
                cDay[h] = 1;
            });
        });
    });

    WriteJson(DATA_FILE, newStats);
}

migrate();

