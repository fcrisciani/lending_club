// Tell to jslint that this is a node.js program
/*jslint node: true */
"use strict";

var debug = require("debug")("worker");

var lc = require("node-lending-club-api");
var elasticsearch = require('elasticsearch');
var fs = require('fs');

var lcApiKey = fs.readFileSync("/run/secrets/lending_club_key", "utf8", "r").trim()
var ACCOUNT_ID = fs.readFileSync("/run/secrets/lending_club_account", "utf8", "r").trim()

var client = new elasticsearch.Client({
  host: 'elasticsearch:9200',
  log: 'warning'
});

lc.init({ apiKey: lcApiKey });

function get_summary() {
  var crawling_date = new Date();
  lc.accounts.summary(ACCOUNT_ID, function (error_lc, data) {
    //debug("%s Summary data:", new Date(), JSON.stringify(data));
    if (!error_lc) {
      debug("%s Correctly retrieved summary", new Date());
      data.crawlingDate = crawling_date.toISOString();
      client.index({
        index: "lending_club-" + crawling_date.getFullYear() + "." + (crawling_date.getMonth()+1),
        type: "summary",
        body: data
      }, function (error_els, response) {
        if (error_els) {
          debug("%s there was an error: %s", new Date(), error_els);
        }
      });
    } else {
      debug("%s there was an error on lending_club_api: %s", new Date(), error_lc);
    }
  });
}
exports.get_summary = get_summary;

function get_detailed_notes() {
  var crawling_date = new Date();
  lc.accounts.detailedNotes(ACCOUNT_ID, function (error_lc, data) {
    //debug("%s NOTES data:", new Date(), JSON.stringify(data));
    if (!error_lc) {
      debug("%s Retrieved %d notes", new Date(), data.myNotes.length);
      for (var i = data.myNotes.length - 1; i >= 0; i--) {
        data.myNotes[i].crawlingDate = crawling_date.toISOString();
        data.myNotes[i].loanDetailLink = "https://www.lendingclub.com/browse/loanDetail.action?loan_id=" + data.myNotes[i].loanId;
        client.index({
          index: "lending_club-" + crawling_date.getFullYear() + "." + (crawling_date.getMonth()+1),
          type: "notes",
          body: data.myNotes[i]
        }, function (error_els, response) {
          if (error_els) {
            debug("%s there was an error: %s", new Date(), error_els);
          }
        });
      }
    } else {
      debug("%s there was an error on lending_club: %s", new Date(), error_lc);
    }
  });
}
exports.get_detailed_notes = get_detailed_notes;

exports.init_collect_data = function () {
  var crawling_date = new Date().toISOString();
  get_summary(crawling_date);
  setTimeout(get_detailed_notes, 2000, crawling_date);
};
