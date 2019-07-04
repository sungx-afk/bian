import * as types from './mutation-types'

// initial state
const state = {
  token: '',
  user: {
    id:''
  },
  expire:false
}

// getters
const getters = {
  token: state => state.token,
  user: state => state.user,
  expire:state => state.expire
}

// actions
const actions = {
  loginWithCode ({commit, state ,dispatch}, {code}){
    $API.user.loginWithCode({code},rsp=>{
      commit(types.UPDATE_USER,rsp)
    })
  },
  loginWithUid ({commit, state ,dispatch}, {uid}){
    $API.user.loginWithUid({uid},rsp=>{
      commit(types.UPDATE_USER,rsp)
    })
  },
  fetchMyInfo({commit, state ,dispatch}, {token}){
    $API.user.fetchMyInfo({},rsp=>{
      if (rsp.result == -10001){
        commit(types.TOKEN_EXPIRE,rsp)
      }else{
        commit(types.UPDATE_USER,{user:rsp,token})
      }
    })
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
      localStorage.setItem("bian-requestParam",JSON.stringify(param))
      $axios.defaults.params = param;//重新修改全局联网配置
    }
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
  }
}

export default {
  namespaced: true,
  state,
  getters,
  actions,
  mutations
}
