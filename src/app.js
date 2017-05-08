// Tell to jslint that this is a node.js program
/*jslint node: true */
"use strict";

var debug = require("debug")("main");
var schedule = require("node-schedule");
var worker = require("./worker.js");

// Runs every 1 hour
var a = schedule.scheduleJob("0 0 */1 * * *", function () {
  debug("%s Get summary scheduled", new Date());
  worker.get_summary();
});

// Runs every 2 hours
var b = schedule.scheduleJob("2 0 */2 * * *", function () {
  debug("%s Get notes scheduled", new Date());
  worker.get_detailed_notes();
});

debug("%s process started, do a run of collect data", new Date());
worker.init_collect_data();
