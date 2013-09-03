var cronJob = require('cron').CronJob;
var app_conf = require('./../app-conf');
var fs = require('fs');
var request = require('request');
var async = require('async');
var moment = require('moment');
var querystring = require('querystring');
var xmlreader = require("xmlreader");
var userInfo = require("./userInfo");


var startReceivecards = function (userConf) {

    async.waterfall([
        function (callback) {
            login(userConf, callback);
        } ,
        function (userConf, userData, callback) {
            receivecards(userConf, userData);

        }

    ], function (err, result) {
        console.error(error);
    });
}


var login = function (userConf, callback) {
    console.log(userConf["login_id"] + ":login");
    var login_id = userConf["login_id"];
    var password = userConf["password"];
    var host = userConf["host"];
    var headers = userInfo.browser_headers;
    headers["Host"] = host ? host : userInfo.game1_host;
    var postDate = {login_id: login_id, password: password};
    var uri = "connect/app/login?cyt=1";
    var requestObject = {
        headers: headers,
        uri: "http://" + headers["Host"] + "/" + uri,
        body: querystring.stringify(postDate)
    };
    if (app_conf["proxy"]) {
        requestObject["proxy"] = "http://" + app_conf["proxyAddress"] + ":" + app_conf["proxyPort"]
    }
    request.post(requestObject, function (error, response, body) {
            if (!error && response.statusCode == 200) {
                if (body) {
                    xmlreader.read(body, function (errors, result) {
                        if (errors) {
                            console.log("errors:" + errors);
                        }
                        if (result.response.header.error.code.text() != "0") {
                            console.error(userConf["login_id"] + " server errors:" + result.response.header.error.message.text());
                            return;
                        }
                        var session_id = result.response.header.session_id.text();
                        var name = result.response.header.your_data.name.text();
                        var town_level = result.response.header.your_data.town_level.text();
                        var gold = parseInt(result.response.header.your_data.gold.text());
                        var ap = {current: parseInt(result.response.header.your_data.ap.current.text()), max: parseInt(result.response.header.your_data.ap.max.text())};
                        var bc = {current: parseInt(result.response.header.your_data.bc.current.text()), max: parseInt(result.response.header.your_data.bc.max.text())};
                        var friendship_point = parseInt(result.response.header.your_data.friendship_point.text());
                        var user_id = result.response.body.login.user_id.text();
                        var userData = {name: name, town_level: town_level, gold: gold, ap: ap, bc: bc, friendship_point: friendship_point, user_id: user_id, host: host, login_id: login_id, session_id: session_id, cookie: "S=" + session_id};

                        callback(null, userConf, userData);
                    });


                } else {
                    throw new Error(' response.statusCode:' + response.statusCode);
                }
            } else {
                console.error(error);
            }
        }


    );
}

var receivecards = function (userConf, userData) {
    console.log(userConf["login_id"] + ":fairyrewards");
    var login_id = userConf["login_id"];
    var host = userConf["host"];
    var headers = userInfo.browser_headers;
    headers["Host"] = host ? host : userInfo.game1_host;
    headers["Cookie"] = userData["cookie"];
    var uri = "connect/app/menu/fairyrewards?cyt=1";
    var requestObject = {
        headers: headers,
        uri: "http://" + headers["Host"] + "/" + uri
    };
    if (app_conf["proxy"]) {
        requestObject["proxy"] = "http://" + app_conf["proxyAddress"] + ":" + app_conf["proxyPort"]
    }

    request(requestObject, function (error, response, body) {
            if (!error && response.statusCode == 200) {
                if (body) {

                    xmlreader.read(body, function (errors, result) {
                        if (errors) {
                            console.log("errors:" + errors);
                        }
                        if (result.response.header.error.code.text() != "0") {
                            console.error(userConf["login_id"] + " server errors:" + result.response.header.error.message.text());
                            return;
                        }
                       console(body);
                    });
                } else {
                    throw new Error(' response.statusCode:' + response.statusCode);
                }
            } else {
                console.error(error);
            }
        }


    );
}

exports.startReceivecards = function (userConf) {
    startReceivecards(userConf);
}


