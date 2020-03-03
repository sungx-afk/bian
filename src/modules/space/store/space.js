import * as types from './mutation-types'

// initial state
const state = {
  cropData:null,
  detailShowTab:true
}

// getters
const getters = {
  cropData: state => state.cropData,
  detailShowTab: state => state.detailShowTab
}

// actions
const actions = {
  setCropImageData ({commit, state}, data){
    commit(types.SET_CROPPER_IMAGE_DATA,data)
  },
  resetCropImageData({commit, state}){
    commit(types.RESET_CROPPER_IMAGE_DATA)
  },
  setDetailShowTab({commit, state},flag){
    commit(types.DETAIL_SHOW_TAB,flag)
  }
}

// mutations
const mutations = {
  [types.SET_CROPPER_IMAGE_DATA] (state,data){
    state.cropData = data
  },
  [types.RESET_CROPPER_IMAGE_DATA] (state){
    state.cropData = null
  },
  [types.DETAIL_SHOW_TAB] (state,flag){
    state.detailShowTab = flag
  }
}

export default {
	namespaced: true,
	state,
	getters,
	actions,
	mutations
}
