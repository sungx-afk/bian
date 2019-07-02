import qs from 'qs'
import axios from 'axios'

export default {

  getLoginCode({url},successCb, errorCb){
    let appid = 'wxdb43de2e1083005a'

    url = `https://open.weixin.qq.com/connect/oauth2/authorize?appid=${appid}&redirect_uri=${url}&response_type=code&scope=snsapi_userinfo&state=mystate#wechat_redirect`
    axios.get(url).then(function (response) {
        successCb && successCb(response)
      }).catch(function (error) {
        errorCb && errorCb(error)
      });
  },

  loginWithCode({code},successCb, errorCb){
    let param = {
      code
    }
    $axios.get(`/users/oauth2/wechat/service/login_by_code?`+qs.stringify(param, { indices: false })).then(function (response) {
      successCb && successCb(response.data)
    }).catch(function (error) {
      errorCb &&  errorCb(error)
    });
  },
  fetchMyInfo({},successCb, errorCb){
    $axios.get(`/users/my`).then(function (response) {
      successCb && successCb(response.data)
    }).catch(function (error) {
      errorCb &&  errorCb(error)
    });
  }
}
