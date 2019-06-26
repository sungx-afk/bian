import axios from 'axios'
import Home from './modules/home/api/index'
import Space from './modules/space/api/index'

import store from './store/index';



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
  // let param = localStorage.getItem("requestParam");
  // let storeParam = store.getters['userStore/requestParam'];
  // if (!param){
  //   if(storeParam){
  //     param = JSON.stringify(storeParam);
  //   }else{
  //     param = JSON.stringify({plat:'wechat',build:'999999',token:'014eb57b-0715-4572-8376-8478d779b666',platVersion:'1.0.1'})
  //   }
  // }
  let param = JSON.stringify({plat:'wechat',build:'999999',token:'014eb57b-0715-4572-8376-8478d779b666',platVersion:'1.0.1'})
  return JSON.parse(param);
}


global.$axios = axios.create({
  baseURL: '/',
  validateStatus: function(status) {
    return status < 400;
  },
  params: getRequestParam()
});



global.$axios.interceptors.response.use((response) => {
  /*新增拦截器，处理服务器返回*/
  if(response){
    return response
  }else{
    //TODO
  }
}, (error) => {
  if (error.response && error.response.data && error.response.data.location) {
    window.location = error.response.data.location
  } else {
    window.location.href = '#/error';
    return Promise.reject(error)
  }
})

global.$API = {
  home:Home,
  space:Space
}
