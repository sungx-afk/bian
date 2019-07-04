import * as types from './mutation-types'

// initial state
const state = {
  cropData:null
}

// getters
const getters = {
  cropData: state => state.cropData,
}

// actions
const actions = {
  setCropImageData ({commit, state}, data){
    commit(types.SET_CROPPER_IMAGE_DATA,data)
  },
  resetCropImageData({commit, state}){
    commit(types.RESET_CROPPER_IMAGE_DATA)
  }
}

// mutations
const mutations = {
  [types.SET_CROPPER_IMAGE_DATA] (state,data){
    state.cropData = data
  },
  [types.RESET_CROPPER_IMAGE_DATA] (state){
    state.cropData = null
  }
}

export default {
	namespaced: true,
	state,
	getters,
	actions,
	mutations
}
