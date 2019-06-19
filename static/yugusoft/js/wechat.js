var wechatConfig = {
	default:{
		suite_name:"",
		token:"",
		comp_id:"",
		configData:null
	},
	init:function(){
		var me = this;
		me.initParams(function(){
			me.getConfigData();
		})
	},
	initParams:function(cb){
		var me = this;
		var suite_name = me.getRequest('suite_name');
		var token = me.getRequest('token');
		var comp_id = me.getRequest('comp_id');

		if(suite_name){
			me.default.suite_name = suite_name
		}
		if(token){
			me.default.token = token
		}
		if(comp_id){
			me.default.comp_id = comp_id
		}
		if(suite_name && token && comp_id ){
			cb();
		}


	},
	getRequest:function(key){
		var url = window.location.href; //获取url中"?"符后的字串
		var box = url.split('?');
		url = '?'+box[box.length-1];
	    var theRequest = new Object();
	    if (url.indexOf("?") != -1) {
	        var str = url.substr(1);
	        strs = str.split("&");
	        for(var i = 0; i < strs.length; i ++) {
	            theRequest[strs[i].split("=")[0]]=decodeURI(strs[i].split("=")[1]);
	        }
	    }
	    if(key){
	        return theRequest[key];
	    }else{
	        return theRequest;
	    }
	},
	getConfigData:function(){
		var me = this;
		var url = config_server.formal.app01 + '/ftask/api/weixin/suite/'+me.default.suite_name+'/js_auth_signature.json';
		var source = window.location.href;
		var box = source.split('#');
		var path = '';
		if(box[0] != ''){
			path = box[0];
		}
		var param = {
			token:me.default.token,
			comp_id:me.default.comp_id,
			url:path
		}
		 httpAgent(url, "GET", param, function(str){
		 	if(str.signature){
		 		me.default.configData = str;
		 		me.config();
		 	}
		 },function(){

		 });
	},
	config:function(){
		var me = this;
		var str = me.default.configData;
		wx.config({
		    debug: false, // 开启调试模式,调用的所有api的返回值会在客户端alert出来，若要查看传入的参数，可以在pc端打开，参数信息会通过log打出，仅在pc端时才会打印。
		    appId: str.corp_id, // 必填，企业号的唯一标识，此处填写企业号corpid
		    timestamp: str.time_stamp, // 必填，生成签名的时间戳
		    nonceStr: str.nonce_str, // 必填，生成签名的随机串
		    signature: str.signature,// 必填，签名，见附录1
		    jsApiList: [
		    	'openEnterpriseChat',
      			'openEnterpriseContact'
		    ] // 必填，需要使用的JS接口列表，所有JS接口列表见附录2
		});
		wx.ready(function(){
		    // config信息验证后会执行ready方法，所有接口调用都必须在config接口获得结果之后，config是一个客户端的异步操作，所以如果需要在页面加载时就调用相关接口，则须把相关接口放在ready函数中调用来确保正确执行。对于用户触发时才调用的接口，则可以直接调用，不需要放在ready函数中。
		    wx.hideOptionMenu();

		});
		wx.error(function(res){
		    // config信息验证失败会执行error函数，如签名过期导致验证失败，具体错误信息可以打开config的debug模式查看，也可以在返回的res参数中查看，对于SPA可以在这里更新签名。
		});
	}
}


wechatConfig.init();