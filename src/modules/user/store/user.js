import * as types from './mutation-types'

// initial state
const state = {
  token: '',
  user:null,
  user_setting_keys:['bgm_play_state','bgm_key','public_space_close'],
  user_setting:null,
  expire:false
}

// getters
const getters = {
  token: state => state.token,
  user: state => state.user,
  userSetting: state => state.user_setting,
  expire:state => state.expire
}

// actions
const actions = {
  loginWithCode ({commit, state ,dispatch}, {code,app_id}){
    $API.user.loginWithCode({code,app_id},rsp=>{
      commit(types.UPDATE_USER,rsp)
      dispatch('getUserSetting');
    })
  },
  loginWithUid ({commit, state ,dispatch}, {uid}){
    $API.user.loginWithUid({uid},rsp=>{
      commit(types.UPDATE_USER,rsp)
      dispatch('getUserSetting');
    })
  },
  fetchMyInfo({commit, state ,dispatch}, {token}){
    $API.user.fetchMyInfo({},rsp=>{
      if (rsp.result == -10001){
        commit(types.TOKEN_EXPIRE,rsp)
      }else{
        commit(types.UPDATE_USER,{user:rsp,token})
        dispatch('getUserSetting');
      }
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
  }
}

// mutations
const mutations = {
  [types.UPDATE_USER] (state,data) {
    state.user = data.user
    state.token = data.token
    state.expire = false
    //更新token到bian-requestParam
    let param = localStorage.getItem("bian-requestParam")
    if (param){
      param = JSON.parse(param)
      param.token = data.token
      let app_id = window.app_id || data.user.appId || '';
      window.app_id = app_id;
      param.app_id = app_id;
      localStorage.setItem("bian-requestParam",JSON.stringify(param))
      $axios.defaults.params = param;//重新修改全局联网配置
    }
  },
  [types.SET_USER_SETTING] (state,data){
    state.user_setting[data.key] = data.value
  },
  [types.GET_USER_SETTING] (state,rsp){
    state.user_setting = rsp
  },
  [types.TOKEN_EXPIRE] (state,rsp){
    let param = localStorage.getItem("bian-requestParam")
    if (param){
      param = JSON.parse(param)
      param.token = ''
      localStorage.setItem("bian-requestParam",JSON.stringify(param))
      $axios.defaults.params = param;//重新修改全局联网配置
    }
    state.expire = true
  },
  [types.UPDATE_REQUEST_PARAMS](state,data){
    let param = localStorage.getItem("bian-requestParam")
    if (param){
      param = JSON.parse(param)
    }else {
      param = {
        plat:'wechat',
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
    localStorage.setItem("bian-requestParam",JSON.stringify(param))
    $axios.defaults.params = param;//重新修改全局联网配置
  }
}

export default {
  namespaced: true,
  state,
  getters,
  actions,
  mutations
}
