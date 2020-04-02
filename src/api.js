import axios from 'axios'
import Home from './modules/home/api/index'
import Space from './modules/space/api/index'
import User from './modules/user/api/index'

axios.interceptors.request.use(config => {
  return config
}, error => {
  return Promise.reject(error)
})

axios.defaults.headers.common['Authorization'] = 'AUTH_TOKEN';
axios.defaults.headers['Content-Type'] = 'application/json; charset=UTF-8'; //默认是JSON格式
/**
 * 公共上行信息
 * @type {{}}
 */
global.getRequestParam = function() {
  let param = localStorage.getItem("bian-requestParam");
  if (!param){
    param = {
      plat:'wechat',
      build:'999999',
      token:'',
      platVersion:'1.0.1',
      mchId:''
    }
    param = JSON.stringify(param)
    localStorage.setItem("bian-requestParam",param)
  }
  return JSON.parse(param);
}

/*获取平台参数*/
global.getPlat = function() {
  let param = localStorage.getItem("bian-requestParam");
  param = JSON.parse(param);
  return param.plat
}

global.$axios = axios.create({
  baseURL: '/api/v1',
  validateStatus: function(status) {
    return status < 400;
  },
  params: getRequestParam()
});

global.$API = {
  home:Home,
  space:Space,
  user:User
}
