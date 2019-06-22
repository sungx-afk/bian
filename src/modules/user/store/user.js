import * as types from './mutation-types'

// initial state
const state = {
  token: '',
  user: {
    id:1000738
  },
}

// getters
const getters = {
  token: state => state.token,
  user: state => state.user,
}

// actions
const actions = {

}

// mutations
const mutations = {

}

export default {
  namespaced: true,
  state,
  getters,
  actions,
  mutations
}
