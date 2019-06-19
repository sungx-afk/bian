import axios from 'axios'
import Home from './modules/home/api/home'
import Dialog from '@/modules/widget/dialog'

import store from './store/index';



axios.interceptors.request.use(config => {
  return config
}, error => {
  return Promise.reject(error)
})

// axios.defaults.baseURL = 'http://localhost:8092/';
axios.defaults.headers.common['Authorization'] = 'AUTH_TOKEN';
axios.defaults.headers.post['Content-Type'] = 'application/x-www-form-urlencoded; charset=UTF-8';
axios.defaults.headers.post['Content-Type'] = 'application/x-www-form-urlencoded; charset=UTF-8';
/**
 * 公共上行信息
 * @type {{}}
 */
global.getRequestParam = function() {
  let param = localStorage.getItem("requestParam");
  let storeParam = store.getters['userStore/requestParam'];
  if (!param){
    if(storeParam){
      param = JSON.stringify(storeParam);
    }else{
      param = JSON.stringify({plat:'web',build:'999999'})
    }
  }
  // console.log(param)

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
  if(response && response.data.result == 0){
    return response
  }else{
    if(response && response.data.result == 4){//资源不存在
      const url = '#/error?content='+response.data.msg || "资源丢失了";
      window.location.replace(url);
    }else if(response && (response.data.result == -20009 || response.data.result == -20001 || response.data.result == -20002)){//登录失败
      return response
    }else{
      let msg = response.data.msg || "",content="";
      // if(response.config && response.config.url){
      //   content = '错误地址：'+ response.config.url;
      // }
      Dialog({
        title:msg,
        cancelShow:false,
        content:content
      })
    }
  }
}, (error) => {
  if (error.response && error.response.data && error.response.data.location) {
    window.location = error.response.data.location
  } else {
    window.location.href = '#/error';
    return Promise.reject(error)
  }
})



// $req.use(unauthorizedRedirect)
global.$API = {
  home:Home,
}
