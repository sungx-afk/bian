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
  loginWithUid({uid},successCb, errorCb){
    let param = {
      uid
    }
    $axios.get(`/user/sessions/uid?`+qs.stringify(param, { indices: false })).then(function (response) {
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
  },
  setUserSetting({key,value},successCb, errorCb){
    let param = {
      key,
      value
    }
    $axios.post(`/users/setting`,JSON.stringify(param)).then(function (response) {
      successCb && successCb(response.data)
    }).catch(function (error) {
      errorCb &&  errorCb(error)
    });
  },
  getUserSetting({key},successCb, errorCb){
    let param = {
      key
    }
    $axios.get(`/users/setting?`+qs.stringify(param, { indices: false })).then(function (response) {
      successCb && successCb(response.data)
    }).catch(function (error) {
      errorCb &&  errorCb(error)
    });
  },
  getJsAuthSignature({url},successCb, errorCb){
    // url = encodeURIComponent(url)
    let param = {
      url
    }
    $axios.get(`/users/oauth2/wechat/service/js_auth_signature?`+qs.stringify(param, { indices: false })).then(function (response) {
      successCb && successCb(response.data)
    }).catch(function (error) {
      errorCb &&  errorCb(error)
    });
  }
}
