var http = require('http');
var fs = require('fs');
var salecard =require('../core/salecard.js');

var getAllUserConf=function(){
    var game1_common_account_string=fs.readFileSync("../conf/game1-CBT_common_account.json") ;
    var game1_common_account_list=JSON.parse(game1_common_account_string)["accounts"];
    var game1_vip_account_string=fs.readFileSync("../conf/game1-CBT_vip_account.json") ;
    var game1_vip_account_list=JSON.parse(game1_vip_account_string)["accounts"];
    var game1_month_account_string=fs.readFileSync("../conf/game1-CBT_month_account.json") ;
    var game1_month_account_list=JSON.parse(game1_month_account_string)["accounts"];
    var game2_common_account_string=fs.readFileSync("../conf/game2-CBT_common_account.json") ;
    var game2_common_account_list=JSON.parse(game2_common_account_string)["accounts"];
    var game2_vip_account_string=fs.readFileSync("../conf/game2-CBT_vip_account.json") ;
    var game2_vip_account_list=JSON.parse(game2_vip_account_string)["accounts"];
    var all_account_list=[];
    all_account_list=all_account_list.concat(game1_common_account_list);
    all_account_list=all_account_list.concat(game1_vip_account_list);
    all_account_list=all_account_list.concat(game1_month_account_list);
    all_account_list=all_account_list.concat(game2_common_account_list);
    all_account_list=all_account_list.concat(game2_vip_account_list);
    return all_account_list;
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


var userConfList=getAllUserConf();
userConfList.forEach(function(userConf) {
    if(userConf["login_id"]=="15953906196"){
        salecard.startSaleCards(userConf);
    }
});

