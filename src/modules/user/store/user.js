import * as types from './mutation-types'
import { setPageTitle } from '@/config/utils'
import { setLocale } from '@/i18n'

// 本地公共参数（含 token）的 key 前缀：getLocalTokenKey() 会在其后拼上 window.app_id
const LOCAL_PARAM_KEY_PREFIX = 'bian-requestParam'

// 清空本地保存的 token。
// 注意不能用 getLocalTokenKey() 只清一个 key：登录写入 token 时 window.app_id 还是空的，
// token 落在默认 key（bian-requestParam）里；而退出登录时 window.app_id 已赋值，
// getLocalTokenKey() 变成 bian-requestParam-<appId>，只清它会漏掉真正存 token 的那一份，
// 表现就是「退出登录后杀掉 App 重开又自动登录」。
// 这里遍历所有同前缀的 key 一律把 token 置空，兼容历史数据。
function clearStoredTokens () {
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)
      if (!k || k.indexOf(LOCAL_PARAM_KEY_PREFIX) !== 0) continue
      const raw = localStorage.getItem(k)
      if (!raw) continue
      try {
        const param = JSON.parse(raw)
        if (param && typeof param === 'object'){
          param.token = ''
          localStorage.setItem(k, JSON.stringify(param))
        }
      } catch (e) {}
    }
  } catch (e) {}
}

// 同步清掉全局请求参数里的 token，避免退出后发出的请求还带旧 token
function clearRequestToken () {
  let comm = getRequestParam()
  if (comm){
    comm.token = ''
    $axios.defaults.params = comm
  }
}

// initial state
const state = {
  token: '',
  user:null,
  user_setting_keys:['bgm_play_state','bgm_key','public_space_close'],
  user_setting:null,
  expire:false,
  merchant:null,//殡仪馆数据
}

// getters
const getters = {
  token: state => state.token,
  user: state => state.user,
  userSetting: state => state.user_setting,
  expire:state => state.expire,
  merchant:state => state.merchant,
}

// actions
const actions = {
  // Apple 登录：identityToken 由后端校验后返回本站 token
  loginWithApple ({commit, state ,dispatch}, payload){
    return new Promise((resolve, reject) => {
      $API.user.loginWithApple(payload,rsp=>{
        commit(types.UPDATE_USER,rsp)
        dispatch('getUserSetting');
        if(rsp.merchant_id){
          dispatch('getMerchantInfo',{id:rsp.merchant_id});
        }
        resolve();
      },error=>{
        console.log('apple login error',error)
        reject(error)
      })
    })
  },
  // 微信登录：authorization code 由后端校验后返回本站 token
  loginWithWechat ({commit, state ,dispatch}, payload){
    return new Promise((resolve, reject) => {
      $API.user.loginWithWechat(payload,rsp=>{
        commit(types.UPDATE_USER,rsp)
        dispatch('getUserSetting');
        if(rsp.merchant_id){
          dispatch('getMerchantInfo',{id:rsp.merchant_id});
        }
        resolve();
      },error=>{
        console.log('wechat login error',error)
        reject(error)
      })
    })
  },
  loginWithUid ({commit, state ,dispatch}, {uid}){
    return new Promise((resolve, reject) => {
      $API.user.loginWithUid({uid},rsp=>{
        commit(types.UPDATE_USER,rsp)
        dispatch('getUserSetting');
        if(rsp.merchant_id){
          dispatch('getMerchantInfo',{id:rsp.merchant_id});
        }
        resolve();
      }, error => reject(error))
    })
  },
  fetchMyInfo({commit, state ,dispatch}, {token}){
    return new Promise((resolve, reject) => {
      commit(types.UPDATE_LOCAL_TOKEN,{token,cb:() => {
        $API.user.fetchMyInfo({},rsp=>{
          if (rsp.result == -10001){
            commit(types.TOKEN_EXPIRE,rsp)
          }else{
            commit(types.UPDATE_USER,{user:rsp,token})
            dispatch('getUserSetting');
            if(rsp.merchant_id){
              dispatch('getMerchantInfo',{id:rsp.merchant_id});
            }
            resolve();
          }
        })
      }})
    })

  },
  getUserSetting({commit, state}){
    return new Promise((resolve, reject) => {
      let key = state.user_setting_keys
      $API.user.getUserSetting({ key:key }, rsp => {
        commit(types.GET_USER_SETTING, rsp)
        resolve(rsp);
      })
    })
  },
  setUserSetting({commit, state},{key,value}){
    return new Promise((resolve, reject) => {
      $API.user.setUserSetting({ key,value }, rsp => {
        commit(types.SET_USER_SETTING, {key,value})
        resolve(rsp);
      })
    })
  },
  updateRequestParams({commit, state},data){
    commit(types.UPDATE_REQUEST_PARAMS, data)
  },
  updateUserInfo({commit, state},user){
    commit(types.UPDATE_USER_INFO, user)
  },
  getMerchantInfo({commit, state},{id}){
    return new Promise((resolve, reject) => {
      $API.user.getMerchantInfo({id}, rsp => {
        commit(types.UPDATE_MERCHANT, rsp)
        resolve(rsp);
      })
    })
  },
  updateMerchantName({commit, state},{name}){
    commit(types.UPDATE_MERCHANT_NAME, {name})
  },
  // 退出登录 / 注销：清空登录态（Vuex 内存 + 本地 token）
  // 必须连 Vuex 一起清：否则跳登录页后 Login.vue 的 created 检测到 user 还在，会立刻弹回首页
  clearLogin({commit}){
    commit(types.CLEAR_USER)
  },

}

// mutations
const mutations = {
  [types.UPDATE_USER] (state,data) {
    state.user = data.user
    state.token = data.token
    state.expire = false
    let page_title = data.user.merchant_name || '彼岸思念'
    setPageTitle(page_title);
    //更新token到bian-requestParam
    let key = getLocalTokenKey();
    let raw = localStorage.getItem(key)
    // key 会随 window.app_id 变化，换 key 后可能还没有公共参数记录：
    // 这里用默认参数兜底初始化，保证 token 一定落盘（否则重启后登录态丢失）
    let param = raw ? JSON.parse(raw) : getRequestParam()
    param.token = data.token
    let app_id = window.app_id || data.user.appId || '';
    window.app_id = app_id;
    param.app_id = app_id;
    localStorage.setItem(key,JSON.stringify(param))
    $axios.defaults.params = param;//重新修改全局联网配置
    if (data.user && data.user.language) {
      try {
        if (!localStorage.getItem('bian_language')) {
          setLocale(data.user.language)
        }
      } catch (e) {}
    }
  },
  [types.UPDATE_USER_INFO] (state, user) {
    state.user = Object.assign({}, state.user, user)
  },
  [types.SET_USER_SETTING] (state,data){
    state.user_setting[data.key] = data.value
  },
  [types.GET_USER_SETTING] (state,rsp){
    state.user_setting = rsp
  },
  [types.TOKEN_EXPIRE] (state,rsp){
    // 同样按前缀清，避免过期 token 仍留在默认 key 里被下次启动捡回来
    clearStoredTokens()
    clearRequestToken()
    state.expire = true
  },
  // 退出登录 / 注销：清空用户、token、设置与馆方信息，并清掉本地 token
  [types.CLEAR_USER] (state) {
    state.user = null
    state.token = ''
    state.user_setting = null
    state.merchant = null
    state.expire = false
    // 清本地 token（含 window.app_id 造成的另一份，见 clearStoredTokens 注释）
    clearStoredTokens()
    // window.app_id 会改变 getLocalTokenKey() 的取值，清掉它让后续读写回到默认 key，
    // 与冷启动（window.app_id 未赋值）时读取的 key 保持一致
    window.app_id = ''
    clearRequestToken()
    localStorage.removeItem('bian-query')
  },
  [types.UPDATE_REQUEST_PARAMS](state,data){
    let key = getLocalTokenKey();
    let param = localStorage.getItem(key)
    if (param){
      param = JSON.parse(param)
    }else {
      param = {
        plat:'h5',
        build:'999999',
        token:'',
        platVersion:'1.0.1',
        mchId:''
      }
    }
    if (data.mchId){
      param.mchId = data.mchId
    }
    if(window.app_id){
      param.app_id = data.app_id
    }
    localStorage.setItem(key,JSON.stringify(param))
    $axios.defaults.params = param;//重新修改全局联网配置
  },
  [types.UPDATE_MERCHANT] (state,rsp){
    state.merchant = rsp
  },
  [types.UPDATE_MERCHANT_NAME] (state,{name}){
    state.user.merchant_name = name
  },
  [types.UPDATE_LOCAL_TOKEN] (state,{token,cb}){
    //更新token到bian-requestParam
    let key = getLocalTokenKey();
    let raw = localStorage.getItem(key)
    let param = raw ? JSON.parse(raw) : getRequestParam()
    param.token = token
    localStorage.setItem(key,JSON.stringify(param))
    $axios.defaults.params = param;//重新修改全局联网配置
    setTimeout(() => {//这里稍微延迟一下，因为如果是直接token过来登陆的，不延迟的话，第一个my接口会用老的token，导致过期
      cb && cb();
    },500)
  },








}

export default {
  namespaced: true,
  state,
  getters,
  actions,
  mutations
}
