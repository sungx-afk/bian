import qs from 'qs'

export default {

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
