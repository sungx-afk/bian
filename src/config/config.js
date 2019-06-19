const config_server = {
    flags:[
        "https://wx.todonow.com/api/file/down/QXKXpvVEAeJAmvDyyYynkP.png",
        "https://wx.todonow.com/api/file/down/MssxhgxZNhPPH4X6ykRqqw.png",
        "https://wx.todonow.com/api/file/down/9J2GCRrm49W88Qe1zHHhL3.png"
    ],
    uploader_model: 'qiniu',
    server_api:"/ftask/api",
    server_user:"/ftask/proxy",//ftask/proxy
    project_timestamp:1532928708424,//1546271999000  1532928708424
    server_app02:'http://test-imapi.yugusoft.com',
    server_im:'im.yugusoft.com:17001',
    third_platform_company:['TJ4tcc426SHZKTjowvvYPz']//'9zXANLgz6Aj5YcLzvK42La'
}

// if(window.location.href.indexOf('test') >= 0 || window.location.href.indexOf('localhost') >= 0) {
//   config_server.server_app02 = 'https://test-imapi.yugusoft.com';
//   config_server.server_app02 = 'test-im.yugusoft.com:17002';
// }


global.config_server = config_server;



export default config_server


