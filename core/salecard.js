var cronJob = require('cron').CronJob;
var app_conf = require('./../app-conf');
var fs = require('fs');
var request = require('request');
var async = require('async');
var moment = require('moment');
var querystring = require('querystring');
var xmlreader = require("xmlreader");
var userInfo = require("./userInfo");


var startSaleCards = function (userConf) {

    async.waterfall([
        function (callback) {
            login(userConf, callback);
        } ,
        function (userConf, userData, willSaleCards, callback) {

            for(var i = 0; i < willSaleCards.length; i=i+30){
                var subWillSaleCards=willSaleCards.slice(i,30);
                saleCard(userConf, userData, subWillSaleCards);
            }
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
                        var user_card_list = result.response.header.your_data.owner_card_list.user_card;

                        var willSaleCards = [];
                        for (var i = 1; i < user_card_list.count(); i++) {
                            var serial_id = user_card_list.at(i).serial_id.text();
                            var master_card_id = user_card_list.at(i).master_card_id.text();
                            var holography = user_card_list.at(i).holography.text();
                            var hp = user_card_list.at(i).hp.text();
                            var power = user_card_list.at(i).power.text();
                            var critical = user_card_list.at(i).critical.text();
                            var lv = user_card_list.at(i).lv.text();
                            var lv_max = user_card_list.at(i).lv_max.text();
                            var exp = user_card_list.at(i).exp.text();
                            var max_exp = user_card_list.at(i).max_exp.text();
                            var next_exp = user_card_list.at(i).next_exp.text();
                            var exp_diff = user_card_list.at(i).exp_diff.text();
                            var exp_per = user_card_list.at(i).exp_per.text();
                            var sale_price = user_card_list.at(i).sale_price.text();
                            var material_price = user_card_list.at(i).material_price.text();
                            var evolution_price = user_card_list.at(i).evolution_price.text();
                            var plus_limit_count = user_card_list.at(i).plus_limit_count.text();
                            var limit_over = user_card_list.at(i).limit_over.text();
                            if (lv == "1" && sale_price <= 170) { //出售一星和二星卡
                                willSaleCards.push(serial_id);
                            }
                        }

                        callback(null, userConf, userData, willSaleCards);
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

var saleCard = function (userConf, userData, willSaleCards, callback) {
    console.log(userConf["login_id"] + ":sell");
    var login_id = userConf["login_id"];
    var host = userConf["host"];
    var headers = userInfo.browser_headers;
    headers["Host"] = host ? host : userInfo.game1_host;
    headers["Cookie"] = userData["cookie"];
    var uri = "connect/app/trunk/sell?cyt=1";
    var serial_id_list_string = willSaleCards.join(',');
    var postDate = {serial_id: serial_id_list_string}; //serial_id=12085861&user_id=291
    var requestObject = {
        headers: headers,
        uri: "http://" + headers["Host"] + "/" + uri,
        body: querystring.stringify(postDate)
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

exports.startSaleCards = function (userConf) {
    startSaleCards(userConf);
}


