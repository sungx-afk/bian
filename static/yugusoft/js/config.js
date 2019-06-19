/**
 * Created by liushuang on 16/8/29.
 */
var config_server = {
    test:{
        file:'http://test-file01.yugusoft.com',
        app01:'http://test-app01.yugusoft.com',
        app02:'http://test-app02.yugusoft.com',
        im:'test-im.yugusoft.com:17001'
    },
    formal:{
        file:'http://file01.yugusoft.com',
        app01:'http://app01.yugusoft.com',
        app02:'http://app02.yugusoft.com',
        im:'im.yugusoft.com:17001'
    },
    testHttps:{
        file:'http://test-file01.yugusoft.com',
        app01:'https://test-app01.yugusoft.com',
        app02:'https://test-app02.yugusoft.com',
        im:'test-im.yugusoft.com:17001'
    },
    formalHttps:{
        file:'http://file01.yugusoft.com',
        app01:'https://app01.yugusoft.com',
        app02:'https://app02.yugusoft.com',
        im:'im.yugusoft.com:17001'
    },
    flags:[
        "http://app01.yugusoft.com/ftask/api/file/down/G1cWNzc9DX4bAFWapZXta9.png",
        "http://app01.yugusoft.com/ftask/api/file/down/Y3Zz4MisaG52WxoUoqYa8F.png",
        "http://app01.yugusoft.com/ftask/api/file/down/TpgxMCN5xpAEYnbjutXotG.png"
    ],
    email_special_settings:false,
    uploader_model: 'qiniu',
}

if(config_server.formal.app01.indexOf('bjev.com.cn') > 0){
    config_server.email_special_settings = true;
}


var url = window.location.href;
if(document.location.protocol == 'https:'){
    config_server.formal = config_server.formalHttps;
    config_server.test = config_server.testHttps;
}
if(url.indexOf('test-app01')>0 ){
    config_server.formal = config_server.test;    
}

if(url.indexOf('localhost') >0 || url.indexOf('10.0.0.53') > 0){
    var host = window.location.host;
    config_server.test.app01 =  '';
    config_server.formal.app01 = '';
}












