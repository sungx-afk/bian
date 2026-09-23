import axios from 'axios'
import config_server from './config/config'
import { appPlat, isNative } from './native/platform'
import { installHttpAdapter } from './native/http'
import Home from './modules/home/api/index'
import Space from './modules/space/api/index'
import User from './modules/user/api/index'
import Report from './modules/report/api/index'
import Mortuary from './modules/mortuary/api/index'

axios.interceptors.request.use(config => {
  return config
}, error => {
  return Promise.reject(error)
})

axios.defaults.headers.common['Authorization'] = 'AUTH_TOKEN';
// Content-Type 只给"带请求体"的方法设（POST / PUT / PATCH），
// 不给 GET 设：App 内页面源是 capacitor://localhost（跨域），GET 带 Content-Type
// 会被判定为非简单请求，多一次 OPTIONS 预检，还可能被 CORS 直接拦掉。
// 注意：PATCH/PUT 必须设，否则 axios 会退回 application/x-www-form-urlencoded，
// 而请求体是 JSON，后端会直接返回 415。
const JSON_CONTENT_TYPE = 'application/json; charset=UTF-8'; //默认是JSON格式
axios.defaults.headers.post['Content-Type'] = JSON_CONTENT_TYPE;
axios.defaults.headers.put['Content-Type'] = JSON_CONTENT_TYPE;
axios.defaults.headers.patch['Content-Type'] = JSON_CONTENT_TYPE;
/**
 * 公共上行信息
 * @type {{}}
 */
global.getRequestParam = function() {
  let key = getLocalTokenKey();
  let param = localStorage.getItem(key);
  if (!param){
    param = {
      // 以前写死 wechat，App 内会导致后端按微信渠道处理登录/订单；改为按实际环境取值
      plat: appPlat(),
      build:'999999',
      token:'',
      platVersion:'1.0.1',
      mchId:''
    }
    param = JSON.stringify(param)
    localStorage.setItem(key,param)
  }
  return JSON.parse(param);
}

/*获取平台参数*/
global.getPlat = function() {
  let key = getLocalTokenKey();
  let param = localStorage.getItem(key);
  param = JSON.parse(param);
  return param.plat
}

global.getLocalTokenKey = function() {
 let req_key = "bian-requestParam";
 if(window.app_id){
   req_key = req_key + '-' + window.app_id;
 }
 return req_key;
}

// App 内页面是从 capacitor://localhost 加载的，相对路径 /api/v1 会被解析成
// capacitor://localhost/api/v1（404），必须用绝对地址；H5 保持相对路径走同源部署。
const API_BASE_URL = isNative() ? `${config_server.domain}/api/v1` : '/api/v1';

global.$axios = axios.create({
  baseURL: API_BASE_URL,
  validateStatus: function(status) {
    return status < 400;
  },
  params: getRequestParam()
});

// App 内改用原生网络层发请求（绕开 WebView 的跨域限制与 OPTIONS 预检）
installHttpAdapter(global.$axios)

global.$axios.interceptors.response.use((response) => {
  /*新增拦截器，处理服务器返回*/
  //console.log("interceptors.response",response)
  // if (response && response.data && response.data.result == -10001){
  //   window.location.href = '/home';
  //   return Promise.reject(response.data.msg || 'error')
  // }
  return response
}, (error) => {
  if (error.response && error.response.data && error.response.data.location) {
    window.location = error.response.data.location
  } else {
    // window.location.href = '/error';
    return Promise.reject(error)
  }
})

global.$API = {
  home:Home,
  space:Space,
  user:User,
  report:Report,
  mortuary:Mortuary,
}
