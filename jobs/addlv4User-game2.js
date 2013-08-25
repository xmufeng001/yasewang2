var cronJob = require('cron').CronJob;
//var app_conf = require('./../app-conf');
//var mock_client = require('./../mock_client');
//var http_content_util=require('./../http_content_util');
//var log = require('./../logger');
var fs = require('fs');
var request = require('request');
var async = require('async')
var moment = require('moment');
var querystring = require('querystring');
var xmlreader = require("xmlreader");
var userInfo = require("./../core/userInfo");


var login = function (userConf,callback) {
    var login_id=userConf["login_id"];
    var password=userConf["password"];
    var host=userConf["host"];
    var headers = userInfo.browser_headers;
    headers["Host"] = host?host:userInfo.game2_host;
    var postDate = {login_id: login_id, password:password};
    var uri = "connect/app/login?cyt=1"
    var requestObject = {
        headers: headers,
        uri: "http://" + headers["Host"] + "/" + uri,
        body: querystring.stringify(postDate)
    };
    requestObject["proxy"] = "http://" + "localhost" + ":" + 8888;
    request.post(requestObject, function (error, response, body) {
            if (!error && response.statusCode == 200) {
                if (body) {
                    console.dir(response.headers['set-cookie']);
                    var cookieString = response.headers['set-cookie'].toString();
                    xmlreader.read(body, function(errors, result){
                            if(errors){
                                console.log(errors)
                            }
                            var session_id = result.response.header.session_id.text();
                            var name = result.response.header.your_data.name.text();
                            var town_level = result.response.header.your_data.town_level.text();
                            var gold = result.response.header.your_data.gold.text();
                            var ap = {current: result.response.header.your_data.ap.current.text(), max: result.response.header.your_data.ap.max.text()};
                            var bc = {current: result.response.header.your_data.bc.current.text(), max: result.response.header.your_data.bc.max.text()};
                            var friendship_point = result.response.header.your_data.friendship_point.text();
                            var user_id = result.response.body.login.user_id.text();
                            var user = {name: name, town_level: town_level, gold: gold, ap: ap, bc: bc, friendship_point: friendship_point, user_id: user_id, login_id: login_id,session_id:session_id,cookie:"S="+session_id};
                            userInfo.saveOrUpdateUser(user);
                            var userData=userInfo.getUserByLoginId(login_id);
                            callback(null,userData);
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

var player_search = function (userData) {
    var headers = userInfo.browser_headers;
    headers["Host"] = userInfo.game2_host;
    headers["Cookie"]=userData["cookie"];

    var uri = "connect/app/menu/player_search?cyt=1"
    var requestObject = {
        headers: headers,
        uri: "http://" + headers["Host"] + "/" + uri
    };
    requestObject["proxy"] = "http://" + "localhost" + ":" + 8888;

    request.post(requestObject, function (error, response, body) {
            if (!error && response.statusCode == 200) {
                if (body) {
                    xmlreader.read(body, function(errors, result){
                        if(errors){
                            console.log(errors)
                        }
                        try{
                            var jsonString=fs.readFileSync("./../conf/game2-CBT_lv4UserList.json") ;
                            var lv4userList=JSON.parse(jsonString);
                            var userList=result.response.body.player_search.user_list.user;
                            for(var i = 0; i < userList.count(); i++){
//                            console.log( userList.at(i).id.text());
//                            console.log( userList.at(i).town_level.text());
                                var new_user_id=userList.at(i).id.text();
                                var town_level=userList.at(i).town_level.text();
                                var master_card_id=userList.at(i).leader_card.master_card_id.text();
                                var next_exp=userList.at(i).next_exp.text();
                                if(town_level=="4"&&next_exp=="80"&&(master_card_id=="81"||master_card_id=="11"||master_card_id=="45")){
                                    lv4userList.forEach(function(userId) {
                                        if(lv4userList.indexOf(userId)==-1){
                                            lv4userList.push(userId);
                                        }
                                    });
                                    var alreadyHasThisUser=false;
                                    for(var j = 0; j < lv4userList.length; j++){
                                        if(lv4userList[j]==new_user_id){
                                            alreadyHasThisUser=true;
                                            break;
                                        }

                                    }
                                    if(!alreadyHasThisUser){
                                        lv4userList.push(new_user_id);
                                    }
                                }
                            }
                            console.log(lv4userList.length);
                            fs.writeFileSync("./../conf/game2-CBT_lv4UserList.json", JSON.stringify(lv4userList));

                        }catch (e){
                            console.log(e);

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


async.waterfall(
    [
    function(callback){
        var userConf={
            "login_id": "15899563412",
            "password": "123123123",
            "status" :1 ,
            "host":"game2-CBT.ma.sdo.com:10001"
        };
        login(userConf,callback);
    },

    function(userData, callback){
        var lv4userList=[];
        var startTime=new Date();
        var intervalId=setInterval(function () {
            if (moment().add('minutes', -20
            ).isAfter(startTime)) {
                if(intervalId){
                    console.log("____________________________________________clearInterval:"+new Date());
                    clearInterval(intervalId);
                    return;
                }
            }
            player_search(userData);

        }, 3000);




    }],
    function (err, result) {
    console.error(error);
    });




