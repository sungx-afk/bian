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
      commit(types.LOGIN_WITH_CODE,rsp)
    })
  },
  fetchMyInfo({commit, state ,dispatch}, {token}){
    $API.user.fetchMyInfo({},rsp=>{
      commit(types.FETCH_MY_INFO,{rsp,token})
    })
  }
}

// mutations
const mutations = {
  [types.LOGIN_WITH_CODE] (state,data) {
    if (data.user && data.token){
      state.user = data.user
      state.token = data.token
      state.expire = false
      //更新token到bian-requestParam
      let param = localStorage.getItem("bian-requestParam")
      if (param){
        param = JSON.parse(param)
        param.token = data.token
        localStorage.setItem("bian-requestParam",JSON.stringify(param))
      }
    }
  },
  [types.FETCH_MY_INFO] (state,data) {
    if (data.rsp && data.rsp.result == -10001){
      let param = localStorage.getItem("bian-requestParam")
      if (param){
        param = JSON.parse(param)
        param.token = ''
        localStorage.setItem("bian-requestParam",JSON.stringify(param))
      }
      state.expire = true
      return
    }
    state.user = data.rsp
    state.token = data.token
    state.expire = false
    //更新token到bian-requestParam
    let param = localStorage.getItem("bian-requestParam")
    if (param){
      param = JSON.parse(param)
      param.token = data.token
      localStorage.setItem("bian-requestParam",JSON.stringify(param))
    }
  },
}

export default {
  namespaced: true,
  state,
  getters,
  actions,
  mutations
}
