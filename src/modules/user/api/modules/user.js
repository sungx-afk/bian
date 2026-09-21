import qs from 'qs'

export default {

  loginWithCode({code,app_id},successCb, errorCb){
    let param = {
      code
    }
    if(app_id){
      param.app_id = app_id;
    }
    $axios.get(`/users/oauth2/wechat/service/login_by_code?`+qs.stringify(param, { indices: false })).then(function (response) {
      successCb && successCb(response.data)
    }).catch(function (error) {
      errorCb &&  errorCb(error)
    });
  },
  // Apple 登录：App 内拿到 identityToken 后交给后端校验并换取本站 token
  // 后端需实现 /users/oauth2/apple/service/login_by_token（校验 JWT、建号/绑号、下发 token）
  loginWithApple({identityToken,authorizationCode,email,fullName,appleUserId},successCb, errorCb){
    let param = {
      identity_token: identityToken,
      authorization_code: authorizationCode,
      email,
      full_name: fullName,
      apple_user_id: appleUserId
    }
    $axios.post(`/users/oauth2/apple/service/login_by_token`,JSON.stringify(param)).then(function (response) {
      successCb && successCb(response.data)
    }).catch(function (error) {
      errorCb &&  errorCb(error)
    });
  },
  // 注销账号：审核 5.1.1(v) 要求在 App 内能删除账号（后端需实现清除/脱敏逻辑）
  deleteAccount({},successCb, errorCb){
    $axios.post(`/users/my/delete`,JSON.stringify({})).then(function (response) {
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
  },
  getMerchantInfo({id},successCb, errorCb){
    // url = encodeURIComponent(url)
    let param = {
    }
    $axios.get(`/merchant/${id}?`+qs.stringify(param, { indices: false })).then(function (response) {
      successCb && successCb(response.data)
    }).catch(function (error) {
      errorCb &&  errorCb(error)
    });
  },



}
