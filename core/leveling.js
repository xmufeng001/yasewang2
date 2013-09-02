var cronJob = require('cron').CronJob;
var app_conf = require('./../app-conf');
var fs = require('fs');
var request = require('request');
var async = require('async');
var moment = require('moment');
var querystring = require('querystring');
var xmlreader = require("xmlreader");
var userInfo = require("./userInfo");


var startJob = function (userConf, startTime, timeOutMinutes, onTimeOut) {

    async.waterfall([
        function (callback) {
            if (userConf["login_paramters"]) {
                loginFromAndroid(userConf, callback);
            } else {
                login(userConf, callback);
            }
        },
        function (userConf, userData, callback) {
            var intervalId = setInterval(function () {
                if (moment().add('minutes', timeOutMinutes).isAfter(startTime)) {
                    if (intervalId) {
                        console.log(userConf["login_id"] + "____________________________________________clearInterval:" + new Date());
                        clearInterval(intervalId);
                        if (onTimeOut) {
                            console.log("onTimeOut:" + new Date());
                            onTimeOut(startTime);
                        }
                        return;
                    }
                }
                async.waterfall([
                    function (callback) {
                        mainmenu(userConf, userData, callback);
                    } ,
                    function (userConf, userData, callback) {
                        fairyselect(userConf, userData, callback);
                    } ,
                    function (userConf, userData, callback) {
                        var ap = userData["ap"]["current"];
                        var max_ap = userData["ap"]["max"];
                        var bc = userData["bc"]["current"];
                        var max_bc = userData["bc"]["max"];
                        console.log(userConf["login_id"] + " :当前的状态是:" + userData["name"] +
                            " lv:" + userData["town_level"] + ",bc:[" + bc + "/" + max_bc +
                            "],ap:[" + ap + "/" + max_ap + "]");

                        if (userConf["map"] && ap > 2) {
                            async.waterfall([
                                function (callback) {
                                    area(userConf, userData, callback);
                                },
                                function (userConf, userData, area_name, area_id, callback) {
                                    floor(userConf, userData, area_name, area_id, callback);
                                } ,
                                function (userConf, userData, area_name, area_id, floor_id, cost, callback) {
                                    if (ap >= cost) {
                                        explore(userConf, userData, area_name, area_id, floor_id, cost);
                                    }
                                }
                            ], function (err, result) {
                                console.error(error);
                            });
                        }

                        var awakenFairy = userInfo.getAwakentFairybattle(userData);
                        var importantFairy = userInfo.getMostImportantFairybattle(userData);
                        var valueFairy = userInfo.getMostValueFairybattle(userData);


                        if (awakenFairy && userConf["lick_awaken_only"] && bc > 4) {
                            async.waterfall([
                                function (callback) {
                                    savedeckcard(userConf, userData, "lick_card_post", callback);
                                },
                                function (userConf, userData, callback) {
                                    console.log(userConf["login_id"] + " :开始舔怪" + " fairybattle " + importantFairy.serial_id + " lv:" + importantFairy.lv + " " + importantFairy.name);
                                    fairybattle(userConf, userData, importantFairy);
                                }
                            ], function (err, result) {
                                console.error(error);
                            });
                        } else if (importantFairy && userConf["lick"] && bc > 4) {
                            async.waterfall([
                                function (callback) {
                                    savedeckcard(userConf, userData, "lick_card_post", callback);
                                },
                                function (userConf, userData, callback) {
                                    console.log(userConf["login_id"] + " :开始舔怪" + " fairybattle " + importantFairy.serial_id + " lv:" + importantFairy.lv + " " + importantFairy.name);
                                    fairybattle(userConf, userData, importantFairy);
                                }
                            ], function (err, result) {
                                console.error(error);
                            });
                        } else if (valueFairy && userConf["bolo"] && bc > 57 && parseInt(userData["ex_gauge"]) > 90) {
                            async.waterfall([
                                function (callback) {
                                    console.log(userConf["login_id"] + "开始大刀" + ":fairybattle:" + valueFairy.serial_id + " lv:" + valueFairy.lv + " " + valueFairy.name);
                                    savedeckcard(userConf, userData, "bolo_card_post", callback);
                                },
                                function (userConf, userData, callback) {
                                    fairybattle(userConf, userData, valueFairy);
                                }
                            ], function (err, result) {
                                console.error(error);
                            });
                        } else if (valueFairy && userConf["lick_more"] && bc > 80) {
                            async.waterfall([
                                function (callback) {
                                    savedeckcard(userConf, userData, "lick_card_post", callback);
                                },
                                function (userConf, userData, callback) {
                                    console.log(userConf["login_id"] + "开始无聊舔怪" + ":fairybattle:" + valueFairy.serial_id + " lv:" + valueFairy.lv + " " + valueFairy.name);
                                    fairybattle(userConf, userData, valueFairy);
                                }
                            ], function (err, result) {
                                console.error(error);
                            });
                        }
                        else if ((userConf["friend_battle"] && bc > 25) || (userConf["friend_battle"] && !userConf["lick"] && bc > 4)) {
                            async.waterfall([
                                function (callback) {
                                    savedeckcard(userConf, userData, "friend_battle_card_post", callback);
                                },
                                function (userConf, userData, callback) {
                                    battle(userConf, userData);
                                }
                            ], function (err, result) {
                                console.error(error);
                            });
                        }
                        if (userConf["bc_water"] && bc < 5) {
                            useritem(userConf, userData, "2");  //红水
                        }
                        else if (userConf["ap_water"] && ap < 2) {
                            useritem(userConf, userData, "1");  //绿水
                        }

                    }
                ], function (err, result) {
                    console.error(err);
                });

            }, 20000);
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
                            var cookieString = userConf["cookie"];
                            if (response.headers['set-cookie']) {
                                var cookieString = response.headers['set-cookie'].toString();
                                cookieString = cookieString.substring(cookieString.lastIndexOf("S="), cookieString.lastIndexOf(";"));
                            }
                            var userData = { host: host, login_id: login_id, cookie: cookieString};
                            // var userData=userInfo.saveOrUpdateUser(user);
                            callback(null, userConf, userData);
                        }else{
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
                        }

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

var loginFromAndroid = function (userConf, callback) {
    console.log(userConf["login_id"] + ":loginFromAndroid");
    var login_id = userConf["login_id"];
    var login_paramters = userConf["login_paramters"];
    var host = userConf["host"];
    var headers = userInfo.andorid_headers;
    headers["Host"] = host ? host : userInfo.game1_host;
    var uri = "connect/app/login?cyt=1";
    var requestObject = {
        headers: headers,
        uri: "http://" + headers["Host"] + "/" + uri,
        body: login_paramters
    };
    if (app_conf["proxy"]) {
        requestObject["proxy"] = "http://" + app_conf["proxyAddress"] + ":" + app_conf["proxyPort"]
    }
    request.post(requestObject, function (error, response, body) {
            if (!error && response.statusCode == 200) {
                if (body) {
                    try {
                        var cookieString = userConf["cookie"];
                        if (response.headers['set-cookie']) {
                            var cookieString = response.headers['set-cookie'].toString();
                            cookieString = cookieString.substring(cookieString.lastIndexOf("S="), cookieString.lastIndexOf(";"));
                        }

                        var userData = { host: host, login_id: login_id, cookie: cookieString};
                        // var userData=userInfo.saveOrUpdateUser(user);
                        callback(null, userConf, userData);

                    } catch (error) {
                        console.error(userConf["login_id"] + " server errors:" + error);

                    }

                } else {
                    throw new Error(' response.statusCode:' + response.statusCode);
                }
            } else {
                console.error(error);
            }
        }


    );
}

var mainmenu = function (userConf, userData, callback) {
    console.log(userConf["login_id"] + ":mainmenu");
    var login_id = userConf["login_id"];
    var host = userConf["host"];
    var headers = userInfo.browser_headers;
    headers["Host"] = host ? host : userInfo.game1_host;
    headers["Cookie"] = userData["cookie"];
    var uri = "connect/app/mainmenu?cyt=1";
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
                        var session_id = result.response.header.session_id.text();
                        var name = result.response.header.your_data.name.text();
                        var town_level = result.response.header.your_data.town_level.text();
                        var gold = result.response.header.your_data.gold.text();
                        var ap = {current: parseInt(result.response.header.your_data.ap.current.text()), max: parseInt(result.response.header.your_data.ap.max.text())};
                        var bc = {current: parseInt(result.response.header.your_data.bc.current.text()), max: parseInt(result.response.header.your_data.bc.max.text())};
                        var friendship_point = result.response.header.your_data.friendship_point.text();
                        var user_id = result.response.body.login.user_id.text();
                        var ex_gauge = result.response.header.your_data.ex_gauge.text();
                        var user = {name: name, town_level: town_level, gold: gold, ap: ap, bc: bc, friendship_point: friendship_point, ex_gauge: ex_gauge, user_id: user_id, login_id: login_id, session_id: session_id, cookie: "S=" + session_id};
                        if (user.login_id) {
                            userData.login_id = user.login_id
                        }
                        ;
                        if (user.host) {
                            userData.host = user.host
                        }
                        ;
                        if (user.name) {
                            userData.name = user.name
                        }
                        ;
                        if (user.town_level) {
                            userData.town_level = user.town_level
                        }
                        ;
                        if (user.gold) {
                            userData.gold = user.gold
                        }
                        ;
                        if (user.ap) {
                            userData.ap = user.ap
                        }
                        ;
                        if (user.bc) {
                            userData.bc = user.bc
                        }
                        ;
                        if (user.friendship_point) {
                            userData.friendship_point = user.friendship_point
                        }
                        ;
                        if (user.user_id) {
                            userData.user_id = user.user_id
                        }
                        ;
                        if (user.next_exp) {
                            userData.next_exp = user.next_exp
                        }
                        ;
                        if (user.bar_number) {
                            userData.bar_number = user.bar_number
                        }
                        ;
                        if (user.host) {
                            userData.host = user.host
                        }
                        ;
                        if (user.session_id) {
                            userData.session_id = user.session_id
                        }
                        ;
                        if (user.cookie) {
                            userData.cookie = user.cookie
                        }
                        ;
                        if (user.ex_gauge) {
                            userData.ex_gauge = user.ex_gauge
                        }
                        ;

//                        userInfo.saveOrUpdateUser(user);
//                        userData = userInfo.getUserByLoginId(login_id);
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

var savedeckcard = function (userConf, userData, cardType, callback) {
    console.log(userConf["login_id"] + ":savedeckcard for " + cardType);
    var login_id = userConf["login_id"];
    var host = userConf["host"];
    var headers = userInfo.andorid_headers;
    headers["Host"] = host ? host : userInfo.game1_host;
    headers["Cookie"] = userData["cookie"]
    var uri = "connect/app/cardselect/savedeckcard?cyt=1";
    var cardPostData = userConf[cardType];
    var requestObject = {
        headers: headers,
        uri: "http://" + headers["Host"] + "/" + uri,
        body: cardPostData
    };
    if (app_conf["proxy"]) {
        requestObject["proxy"] = "http://" + app_conf["proxyAddress"] + ":" + app_conf["proxyPort"]
    }
    request.post(requestObject, function (error, response, body) {
            if (!error && response.statusCode == 200) {
                if (body) {
                    console.log(userData["login_id"] + ": change card success");
                    callback(null, userConf, userData);
                } else {
                    throw new Error(' response.statusCode:' + response.statusCode);
                }
            } else {
                console.error(error);
            }
        }
    );
};

var fairyselect = function (userConf, userData, callback) {
    console.log(userConf["login_id"] + ":fairyselect");
    var login_id = userConf["login_id"];
    var host = userConf["host"];
    var headers = userInfo.browser_headers;
    headers["Host"] = host ? host : userInfo.game1_host;
    headers["Cookie"] = userData["cookie"]
    var uri = "connect/app/menu/fairyselect?cyt=1";
    var requestObject = {
        headers: headers,
        uri: "http://" + headers["Host"] + "/" + uri
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
                        }
                        try {
                            var fairy_event_list = result.response.body.fairy_select.fairy_event;
                            for (var i = 1; i < fairy_event_list.count(); i++) {
                                var user_id = fairy_event_list.at(i).user.id.text();
                                var user_name = fairy_event_list.at(i).user.name.text();
                                var serial_id = fairy_event_list.at(i).fairy.serial_id.text();
                                var name = fairy_event_list.at(i).fairy.name.text();
                                var lv = fairy_event_list.at(i).fairy.lv.text();
                                var put_down = fairy_event_list.at(i).put_down.text();
                                var start_time = fairy_event_list.at(i).start_time.text();
                                var fairybattle = {user_id: user_id, user_name: user_name, serial_id: serial_id, name: name, lv: lv, put_down: put_down, start_time: start_time, login_id: login_id};

                                fairybattle = userInfo.saveOrUpdateFairybattle(userData, fairybattle);

                            }
                            userData = userInfo.deletePutDownFairybattle(userData);

//                            console.log(userData["fairybattle"]);


                        } catch (e) {
                            console.log(userConf["login_id"] + e);
                        }
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

var fairybattle = function (userConf, userData, fairy) {
    var login_id = userConf["login_id"];
    var host = userConf["host"];
    var headers = userInfo.browser_headers;
    headers["Host"] = host ? host : userInfo.game1_host;
    headers["Cookie"] = userData["cookie"];
    var uri = "connect/app/exploration/fairybattle?cyt=1";
    var postDate = {serial_id: fairy.serial_id, user_id: fairy.user_id}; //serial_id=12085861&user_id=291
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
                    var resultMessage;
                    xmlreader.read(body, function (errors, result) {
                        if (errors) {
                            console.log("errors:" + errors);
                        }
                        if (result.response.header.error.code.text() != "0") {
                            console.error(userConf["login_id"] + " server errors:" + result.response.header.error.message.text());
                            resultMessage = result.response.header.error.message.text();
                            fairy.licked = true;
                            fairy = userInfo.saveOrUpdateFairybattle(userData, fairy);
                        } else {
                            var winner = result.response.body.battle_result.winner.text();
                            var before_gold = result.response.body.battle_result.before_gold.text();
                            var after_gold = result.response.body.battle_result.after_gold.text();
                            var before_exp = result.response.body.battle_result.before_exp.text();
                            var after_exp = result.response.body.battle_result.after_exp.text();
                            var before_count = result.response.body.battle_result.special_item.before_count.text();
                            var after_count = result.response.body.battle_result.special_item.after_count.text();
                            resultMessage = userConf["login_id"] + " 舔怪成功 " + fairy.lv + " " + fairy.name + " ,gold:" + before_gold + "->" + after_gold + " ,exp:" + before_exp + "->" + after_exp + ",bra:" + before_count + "->" + after_count;
                            fairy.licked = true;
                            fairy = userInfo.saveOrUpdateFairybattle(userData, fairy);
                        }
                        console.log(resultMessage);


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


var area = function (userConf, userData, callback) {
    var login_id = userConf["login_id"];
    var host = userConf["host"];
    var headers = userInfo.browser_headers;
    headers["Host"] = host ? host : userInfo.game1_host;
    headers["Cookie"] = userData["cookie"];
    var uri = "connect/app/exploration/area?cyt=1";
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
                        } else {
                            var area_info_list = result.response.body.exploration_area.area_info_list.area_info;
                            var change_map=userConf["change_map"]?userConf["change_map"]:false;
                            if (!change_map) {
                                var hasNotCompleteSpecialTodayMap = false;

                                for (var i = 0; i < area_info_list.count(); i++) {
                                    var area_info = area_info_list.at(i);
                                    if (app_conf["special_today_map"].indexOf(area_info.name.text()) != -1 && area_info.area_type.text() === "1"&& area_info.prog_area.text() != "100") {     //今日地图还没走完
                                        var id = area_info.id.text();
                                        var name = area_info.name.text();
                                        console.log(userConf["login_id"] + " 选择大图|" + "默认的今日特殊地图:" + name + "|" + id);
                                        callback(null, userConf, userData, name, id);
                                        hasNotCompleteSpecialTodayMap=true;
                                        break;
                                    }
                                }
                                if(!hasNotCompleteSpecialTodayMap){
                                    var hasNotCompleteTodayMap=false;
                                    for (var i = 0; i < area_info_list.count(); i++) {
                                        var area_info = area_info_list.at(i);
                                        if (app_conf["today_map"].indexOf(area_info.name.text()) != -1 && area_info.area_type.text() === "1") {     //今日地图还没走完
                                            var id = area_info.id.text();
                                            var name = area_info.name.text();
                                            console.log(userConf["login_id"] + " 选择大图|" + "默认的今日地图:" + name + "|" + id);
                                            callback(null, userConf, userData, name, id);
                                            hasNotCompleteTodayMap=true;
                                            break;
                                        }
                                    }
                                    if(!hasNotCompleteTodayMap){
                                        for (var i = 0; i < area_info_list.count(); i++) {
                                            var area_info = area_info_list.at(i);
                                            if (app_conf["special_today_map"].indexOf(area_info.name.text()) != -1 && area_info.area_type.text() === "1") {     //今日地图还没走完
                                                var id = area_info.id.text();
                                                var name = area_info.name.text();
                                                console.log(userConf["login_id"] + " 选择大图|" + "周末的今日特殊地图:" + name + "|" + id);
                                                callback(null, userConf, userData, name, id);
                                                break;
                                            }
                                        }
                                    }

                                }


                            } else {
                                var hasNotCompleteSpecialTodayMap = false;
                                for (var i = 0; i < area_info_list.count(); i++) {
                                    var area_info = area_info_list.at(i);
                                    if (app_conf["special_today_map"].indexOf(area_info.name.text()) != -1 && area_info.area_type.text() === "1" && area_info.prog_area.text() != "100") {     //今日地图还没走完
                                        var id = area_info.id.text();
                                        var name = area_info.name.text();
                                        console.log(userConf["login_id"] + " 选择大图|" + "未完的今日地图:" + name + "|" + id);
                                        callback(null, userConf, userData, name, id);
                                        hasNotCompleteSpecialTodayMap = true;
                                        break;
                                    }
                                }
                                if (!hasNotCompleteSpecialTodayMap) {
                                    var hasNotCompleteTodayMap = false;
                                    for (var i = 0; i < area_info_list.count(); i++) {
                                        var area_info = area_info_list.at(i);
                                        if (app_conf["today_map"].indexOf(area_info.name.text()) != -1 && area_info.area_type.text() === "1" && area_info.prog_area.text() != "100") {     //今日地图还没走完
                                            var id = area_info.id.text();
                                            var name = area_info.name.text();
                                            console.log(userConf["login_id"] + " 选择大图|" + "未完的今日地图:" + name + "|" + id);
                                            callback(null, userConf, userData, name, id);
                                            hasNotCompleteTodayMap = true;
                                            break;
                                        }
                                    }
                                    if (!hasNotCompleteTodayMap) {
                                        var hasNotCompleteEventMap = false;
                                        for (var i = 0; i < area_info_list.count(); i++) {
                                            var area_info = area_info_list.at(i);
                                            if (area_info.area_type.text() === "1" && area_info.prog_area.text() != "100") {     //活动地图还没走完
                                                var id = area_info.id.text();
                                                var name = area_info.name.text();
                                                console.log(userConf["login_id"] + " 选择大图|" + "未完的活动地图:" + name + "|" + id);
                                                callback(null, userConf, userData, name, id);
                                                hasNotCompleteEventMap = true;
                                                break;
                                            }
                                        }
                                        if (!hasNotCompleteEventMap) {
                                            var hasEventMap = false
                                            for (var i = 0; i < area_info_list.count(); i++) {
                                                var area_info = area_info_list.at(i);
                                                if (area_info.area_type.text() === "1") {     //活动地图走完也走
                                                    var id = area_info.id.text();
                                                    var name = area_info.name.text();
                                                    console.log(userConf["login_id"] + " 选择大图|" + "已经完成全部的活动地图:" + name + "|" + id);
                                                    callback(null, userConf, userData, name, id);
                                                    hasEventMap = true;
                                                    break;
                                                }
                                            }
                                            if (!hasEventMap) {
                                                var hasNotCompleteMap = false;
                                                for (var i = 0; i < area_info_list.count(); i++) {
                                                    var area_info = area_info_list.at(i);
                                                    if (area_info.prog_area.text() != "100") {     //活动地图木有，随便找没走完的地图走了算了
                                                        var id = area_info.id.text();
                                                        var name = area_info.name.text();
                                                        console.log(userConf["login_id"] + " 选择大图|" + "未完的正常地图:" + name + "|" + id);
                                                        callback(null, userConf, userData, name, id);
                                                        hasNotCompleteMap = true;
                                                        break;
                                                    }
                                                }
                                                if (!hasNotCompleteMap) {
                                                    var area_info = area_info_list.at(0);
                                                    var id = area_info.id.text();
                                                    var name = area_info.name.text();
                                                    console.log(userConf["login_id"] + " 选择大图|" + "已经完成的正常地图:" + name + "|" + id);
                                                    callback(null, userConf, userData, name, id);
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
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
var floor = function (userConf, userData, area_name, area_id, callback) {
    var login_id = userConf["login_id"];
    var host = userConf["host"];
    var headers = userInfo.browser_headers;
    headers["Host"] = host ? host : userInfo.game1_host;
    headers["Cookie"] = userData["cookie"];
    var uri = "connect/app/exploration/floor?cyt=1";
    var postDate = {
        area_id: area_id
    };
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
                        } else {
                            var floor_info_list = result.response.body.exploration_floor.floor_info_list.floor_info;

                            var hasNotCompleteEventFloor = false;
                            for (var i = 0; i < floor_info_list.count(); i++) {
                                var floor_info = floor_info_list.at(i);
                                if (floor_info.progress.text() != "100") {     //活动地图还没走完
                                    var floor_id = floor_info.id.text();
                                    var cost = parseInt(floor_info.cost.text());
                                    console.log(userConf["login_id"] + " 选择子图|" + "未完的地图:" + area_name + "|floor_id:" + floor_id + "|cost:" + cost);
                                    callback(null, userConf, userData, area_name, area_id, floor_id, cost);
                                    hasNotCompleteEventFloor = true;
                                    break;
                                }
                            }
                            if (!hasNotCompleteEventFloor) {
                                var floor_info = floor_info_list.at(0);
                                var floor_id = floor_info.id.text();
                                var cost = parseInt(floor_info.cost.text());
                                console.log(userConf["login_id"] + " 选择子图|" + "已完成的地图:" + area_name + "|floor_id:" + floor_id + "|cost:" + cost);
                                callback(null, userConf, userData, area_name, area_id, floor_id, cost);
                            }


                        }
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


var explore = function (userConf, userData, area_name, area_id, floor_id, cost) {
    console.log(userConf["login_id"] + ":explore");
    var login_id = userConf["login_id"];
    var host = userConf["host"];
    var headers = userInfo.browser_headers;
    headers["Host"] = host ? host : userInfo.game1_host;
    headers["Cookie"] = userData["cookie"]
    var uri = "connect/app/exploration/explore?cyt=1";
    var today_map = app_conf["today_map"];
    var postDate = {
        area_id: area_id,
        auto_build: "1",
        floor_id: floor_id
    };
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
                    if (body) {
                        xmlreader.read(body, function (errors, result) {
                            if (errors) {
                                console.log("errors:" + errors);
                                return;
                            }
                            var resultMessage;
                            if (result.response.header.error.code.text() != "0") {
                                resultMessage = userConf["login_id"] + " server errors:" + result.response.header.error.message.text()
                            } else {
                                var exploreResult = result.response.body.explore;
                                var event_type = exploreResult.event_type.text();
                                var progress = exploreResult.progress.text();
                                var gold = exploreResult.gold.text();
                                var get_exp = exploreResult.get_exp ? exploreResult.get_exp.text() : 0;
                                var before_count = exploreResult.special_item?exploreResult.special_item.before_count.text():0;
                                var after_count = exploreResult.special_item?exploreResult.special_item.after_count.text():0;

                                resultMessage = userConf["login_id"] + "event_type:" + event_type + "|progress:" + progress + "|gold:" + gold + "|get_exp:" + get_exp + "|活动物品:" + before_count + "->" + after_count;
//                                if(event_type=="2"){
//                                    var oppoName=exploreResult.encounter.name.text();;
//                                    console.log(userConf["login_id"] +" "+oppoName +" 问好");
//                                }else if(event_type=="3"){
//                                    var master_card_id=exploreResult.user_card.master_card_id;
//                                    console.log(userConf["login_id"] +" 获得卡牌 "+master_card_id);
//                                }else if(event_type=="13"){
//                                    console.log(userConf["login_id"] +" "+13);
//                                }

                            }
                            console.log(resultMessage);

                        });
                    }
                } else {
                    throw new Error(' response.statusCode:' + response.statusCode);
                }
            } else {
                console.error(error);
            }
        }
    );
};

var battle = function (userConf, userData) {
    var login_id = userConf["login_id"];
    var host = userConf["host"];
    var headers = userInfo.browser_headers;
    headers["Host"] = host ? host : userInfo.game1_host;
    headers["Cookie"] = userData["cookie"];
    var lv4UserId = userInfo.getRandomLv4UserId(userData);
    console.log(userConf["login_id"] + ": battle vs " + lv4UserId);

    var uri = "connect/app/battle/battle?cyt=1";
    var postDate = { lake_id: '1',
        parts_id: '1',
        user_id: lv4UserId
    };
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
                    var resultMessage;
                    xmlreader.read(body, function (errors, result) {
                        if (errors) {
                            console.log("errors:" + errors);
                            return;
                        }
                        if (result.response.header.error.code.text() != "0") {
                            resultMessage = userConf["login_id"] + " server errors:" + result.response.header.error.message.text()
                            return;
                        } else {
                            var winner = result.response.body.battle_result.winner.text();
                            var before_exp = result.response.body.battle_result.before_exp.text();
                            var after_exp = result.response.body.battle_result.after_exp.text();
                            resultMessage = userConf["login_id"] + " :欺负小朋友成功,exp:" + before_exp + "->" + after_exp;
                        }
                        console.log(resultMessage);

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

var useritem = function (userConf, userData, item_id) {
    var login_id = userConf["login_id"];
    var host = userConf["host"];
    var headers = userInfo.browser_headers;
    headers["Host"] = host ? host : userInfo.game1_host;
    headers["Cookie"] = userData["cookie"];
    var lv4UserId = userInfo.getRandomLv4UserId(login_id);
    var action = item_id == "1" ? "喝绿" : "喝红";
    console.log(userConf["login_id"] + ": " + action);

    var uri = "connect/app/item/use?cyt=1";
    var postDate = { item_id: item_id};
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
                            return;
                        }
                        if (result.response.header.error.code.text() != "0") {
                            resultMessage = userConf["login_id"] + " server errors:" + result.response.header.error.message.text();
                            console.log(resultMessage);
                            return;
                        }

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
exports.startJob = function (userConf, startTime, timeOutMinutes, onTimeOut) {
    startJob(userConf, startTime, timeOutMinutes, onTimeOut);
}


