"use strict";
const http = require("http");
const service = require('./Release/nodeService');
const events = require('events');

const client = new service.client();
const info  = {
    version:'1.5.0',
    deviceType: 2,
    deviceInfo: 'pc-windows',
    appName: 'nodeImsdk',
    netType:'wifi',
    mac: '12345',
    local: 'zh_CN'
};
//证书和数据库目录
const clientId = client.startup('C:\\Users\\PUGE\\Documents\\GitHub\\doodServer\\sql','C:\\Users\\PUGE\\Documents\\GitHub\\doodServer\\Release\\linkdood.crt',info);

const notify = new events.EventEmitter();
const auth = client.authService();
const contact = client.contactService();
const chat = client.chatService();
let list = "";

chat.regMsgNoticeCb(function(message){
	console.log('接收到新消息:');
	console.log(message);
});	

function landing(postdata,response){
	console.log(`[尝试]登陆`);
	const local = auth.login('008617791430604', '1', 1, 'vrv',function(resp){
		let msg={};
		switch(resp.code){
			case 0:{
				console.log(`[成功]登录 ID:${resp.userId}`);
				msg={"code":0,"msg":resp.userId};
				notify.emit('getContactList');
				break;
			}
			case 113:{
				console.log('[失败]已经登陆过了!');
				msg={"code":113,"msg":"[失败]已经登陆过了!"};
				response.write(JSON.stringify(msg));
				response.end();
				break;
			}
		}
	});	
	//获取好友列表
	notify.on('getContactList', function(data){
		console.log("[尝试]获取好友列表");
		contact.getContactList(function(contacts){
			const msg={"code":0,"msg":contacts,"userId":15151};
			console.log(msg);
			response.write(JSON.stringify(msg));
			response.end();
		});
	});
}


//返回好友列表
function friend(postdata,response){
	contact.getContactList(function(contacts){
		const msg={"code":0,"msg":contacts};
		console.log(msg);
		response.write(JSON.stringify(msg));
		response.end();
	});
	
}	
//收到未知命令
function def(response){
	const msg={"code":999,"msg":"未知命令"};
	response.write(JSON.stringify(msg));
	response.end();
}
let server = function(request,response){  
    response.writeHead(200,{
		"Content-Type":"text/json",
		"Access-Control-Allow-Origin":"*",
		"Access-Control-Allow-Methods":"POST",
		"Access-Control-Allow-Headers":"x-requested-with,content-type"
	});
    if(request.method === "GET"){
        response.write("收到GET请求");
        response.end();
    }else{
        let postdata = "";
        request.addListener("data",function(postchunk){
            postdata += postchunk;
        });
        request.addListener("end",function(){
			console.log(`[收到消息]${postdata}`);
			switch(postdata){
				case "Landing":landing(postdata,response);break;
				case "friendsList":friend(postdata,response);break;
				default:def(response);
			}
        });
    }
};

http.createServer(server).listen(3000);  
console.log("正在监听!");  