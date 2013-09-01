var cluster = require('cluster');
var http = require('http');
var fs = require('fs');
var leveling =require('../core/leveling.js');

var getAllUserConf=function(){
    var jsonString=fs.readFileSync("../conf/test.json") ;
    var userConfList=JSON.parse(jsonString)["accounts"];
    return userConfList;
};
var getUserByLoginId=function(login_Id){
    var userConfList= getAllUserConf();
    for(var i= 0;i<userConfList.length;i++){
        if(userConfList[i]["login_id"]==login_Id){
            return userConfList[i];
        }
    }
    return null;
};

if (cluster.isMaster) {

    var userConfList=getAllUserConf();
    userConfList.forEach(function(userConf) {
        leveling.startJob(userConf,new Date(),-30,function(startTaskTime){
            console.log(userConf["login_id"]+"  "+startTaskTime+"'s task is complete");
        });
    });

}

