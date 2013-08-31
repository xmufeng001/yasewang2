var cluster = require('cluster');
var http = require('http');
var fs = require('fs');
var leveling =require('../core/leveling.js');

var getAllUserConf=function(){
    var jsonString=fs.readFileSync("../conf/game1-CBT_month_account.json") ;
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
        console.dir(userConf);
        var worker = cluster.fork();
        worker.send(userConf);
        //-------------------------listener-------------------------
        worker.on('exit', function(code, signal) {
            console.log(userConf.login_id+"is on exit'");
            if( signal ) {
                console.log("worker was killed by signal: "+signal);
            } else if( code !== 0 ) {
                console.log("worker exited with error code: "+code);
            } else {
                console.log("worker success!");
            }
            userConf=getUserByLoginId(userConf["login_id"]);
            if(userConf){
                console.dir(userConf);
                var worker = cluster.fork();
                worker.send(userConf);
            }else{
                console.log(userConf.login_id+"is deleted'");
            }

        });
        worker.on('fork', function(worker) {
            console.log(userConf.login_id+"is on fork'");
        });
        worker.on('online', function(worker) {
            console.log(userConf.login_id+"is on online'");
        });

        worker.on('disconnect', function(worker) {
            console.log(userConf.login_id+"is on disconnect'");
        });
        worker.on('message', function(message) {
            if(message.cmd=="reset"){
                userConf=getUserByLoginId(userConf["login_id"]);
                if(userConf){
                    console.dir(userConf);
                    worker.send(userConf);
                }else{
                    console.log(userConf.login_id+"is deleted'");
                }
            }
        });
    });

} else {
    process.on('message', function(userConf) {
        if(userConf.status==7){
            var timeOutMinutes=userConf["resetInterval"]?userConf["resetInterval"]:-10;
            leveling.startJob(userConf,new Date(),timeOutMinutes,function(startTaskTime){
                console.log(userConf["login_id"]+"  "+startTaskTime+"'s task is complete");
                process.send({ cmd: 'reset' });
            });
        }
    });

}

