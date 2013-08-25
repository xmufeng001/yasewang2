var fs = require('fs');

var userDateList=[] ;

exports.saveOrUpdateUser=function(user){
    for(var i=0;i<userDateList.length;i++){
         if(userDateList[i].login_id==user.login_id){
             if(user.login_id){userDateList[i].login_id=user.login_id} ;
             if(user.host){userDateList[i].host=user.host} ;
             if(user.name){userDateList[i].name=user.name} ;
             if(user.town_level){userDateList[i].town_level=user.town_level} ;
             if(user.gold){userDateList[i].gold=user.gold} ;
             if(user.ap){userDateList[i].ap=user.ap} ;
             if(user.bc){userDateList[i].bc=user.bc} ;
             if(user.friendship_point){userDateList[i].friendship_point=user.friendship_point} ;
             if(user.user_id){userDateList[i].user_id=user.user_id} ;
             if(user.next_exp){userDateList[i].next_exp=user.next_exp} ;
             if(user.bar_number){userDateList[i].bar_number=user.bar_number} ;
             if(user.host){userDateList[i].host=user.host} ;
             if(user.session_id){userDateList[i].session_id=user.session_id} ;
             if(user.cookie){userDateList[i].cookie=user.cookie} ;
             if(user.ex_gauge){userDateList[i].ex_gauge=user.ex_gauge} ;

             return  userDateList[i];
         }
    }
    userDateList.push(user);
    return user;
}
exports.getUserByLoginId=function(login_id){
    return getUserByLoginId(login_id);
}
var getUserByLoginId=function(login_id){
    for(var i=0;i<userDateList.length;i++){
        if(userDateList[i].login_id==login_id){
            return  userDateList[i];
        }
    }
    return null;
}
exports.deletePutDownFairybattle=function(userData){
    if(!userData["fairybattle"]){
        userData["fairybattle"]=[];
    }
    var newFairybattleList=[];
    var fairybattleList= userData["fairybattle"];
    for(var i=0;i<fairybattleList.length;i++){
        if(fairybattleList[i].put_down=="1"){
            newFairybattleList.push(fairybattleList[i]);
        }
    }
    userData["fairybattle"]=newFairybattleList;
    return userData;
}
exports.saveOrUpdateFairybattle=function(userData,fairybattle){
//    var userData=getUserByLoginId(login_id) ;
    if(!userData["fairybattle"]){
        userData["fairybattle"]=[];
    }
    var fairybattleList= userData["fairybattle"];
    for(var i=0;i<fairybattleList.length;i++){
        if(fairybattleList[i].serial_id==fairybattle.serial_id){
            if(fairybattle.put_down){fairybattleList[i].put_down=fairybattle.put_down} ;
            if(fairybattle.licked){fairybattleList[i].licked=fairybattle.licked} ;
            return   fairybattleList[i];
        }
    }
    fairybattle.licked=false;
    fairybattleList.push(fairybattle);
    return fairybattle;
}
exports.getMostImportantFairybattle=function(userDate){
    if(!(userDate["fairybattle"]&&userDate["fairybattle"].length>0)){
        return null;
    }
    var mostImportantFairybattle;
    var fairybattleList= userDate["fairybattle"];
    for(var i=0;i<fairybattleList.length;i++){
        var fairybattle=fairybattleList[i];
        if(!fairybattle.licked&&fairybattle.put_down=="1"){  //没舔过的,还没死的
            if(!mostImportantFairybattle){
                mostImportantFairybattle=fairybattle;
            }else if(fairybattle.name.indexOf("觉醒")!=-1){
                mostImportantFairybattle=fairybattle;
                break;
            }else if(fairybattle.start_time>mostImportantFairybattle.start_time){
                mostImportantFairybattle=fairybattle;
            }
        }
    }
    return mostImportantFairybattle;
}

exports.getMostValueFairybattle=function(userDate){
//    var userDate=getUserByLoginId(login_id) ;
    if(!(userDate["fairybattle"]&&userDate["fairybattle"].length>0)){
        return null;
    }
    var mostValueFairybattle;
    var fairybattleList= userDate["fairybattle"];
    for(var i=0;i<fairybattleList.length;i++){
        var fairybattle=fairybattleList[i];
        if(fairybattle.put_down=="1"){  //没舔过的,还没死的
            if(!mostValueFairybattle){
                mostValueFairybattle=fairybattle;
            }else if(fairybattle.name.indexOf("觉醒")!=-1){
                mostValueFairybattle=fairybattle;
                break;
            }else if(fairybattle.start_time>mostValueFairybattle.start_time){
                mostValueFairybattle=fairybattle;
            }
        }
    }
    return mostValueFairybattle;
}

exports.getUserList=function(){
    return userDateList;
}

exports.browser_headers={ "User-Agent": "Mozilla/5.0 (Windows NT 6.2; WOW64) AppleWebKit/537.31 (KHTML, like Gecko) Chrome/26.0.1410.64 Safari/537.31",
    'Accept-Encoding': 'gzip, deflate',
    'Content-Type': 'application/x-www-form-urlencoded',
    Host: 'game1-CBT.ma.sdo.com:10001',
    Connection: 'Keep-Alive' };
exports.andorid_headers={ "User-Agent": "Million/100 (GT-I9100; GT-I9100; 4.0.3) samsung/GT-I9100/GT-I9100:4.0.3/IML74K/ZSLPG:user/release-keys",
    'Accept-Encoding': 'gzip, deflate',
    'Content-Type': 'application/x-www-form-urlencoded',
    Host: 'game1-CBT.ma.sdo.com:10001',
    Connection: 'Keep-Alive' };

exports.game1_host='game1-CBT.ma.sdo.com:10001';
exports.game2_host='game2-CBT.ma.sdo.com:10001';

var game1Lv4UserListJsonString=fs.readFileSync(__dirname+"./../conf/game1-CBT_lv4UserList.json") ;
var game1Lv4UserList=JSON.parse(game1Lv4UserListJsonString);
var game2Lv4UserListJsonString=fs.readFileSync(__dirname+"./../conf/game2-CBT_lv4UserList.json") ;
var game2Lv4UserList=JSON.parse(game2Lv4UserListJsonString);

exports.getRandomLv4UserId=function(userData){
//    var userData=getUserByLoginId(login_id);
    if(userData["host"]&&userData["host"].indexOf("2")==-1){
        var lv4_userIds_length=game1Lv4UserList.length;
        var randomIndex=Math.floor(Math.random()*lv4_userIds_length);
        return game1Lv4UserList[randomIndex];
    }else{
        var lv4_userIds_length=game2Lv4UserList.length;
        var randomIndex=Math.floor(Math.random()*lv4_userIds_length);
        return game2Lv4UserList[randomIndex];
    }

}