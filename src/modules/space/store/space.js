import * as types from './mutation-types'

// initial state
const state = {
  spaceDetail:null,
  cropData:null,
  detailShowTab:true,
}

// getters
const getters = {
  spaceDetail: state => state.spaceDetail,
  cropData: state => state.cropData,
  detailShowTab: state => state.detailShowTab
}

// actions
const actions = {
  getSpaceDetail({commit,state},{sid,scene}){
    return new Promise((resolve, reject) => {
      $API.space.getSpaceDetail({
        sid,
        scene
      }, (rsp)=>{
        commit(types.GET_SPACE_DETAIL, rsp)
        resolve(rsp)
      },error=>{
        reject(error)
      })
    })
  },
  updateSpaceUser({commit,state},{sid,user}){
    return new Promise((resolve, reject) => {
      $API.space.updateSpaceUser({sid, user}, rsp=>{
        commit(types.UPDATE_SPACE_USER,user)
        resolve(rsp)
      }, error=>{
        reject(error)
      })
    })
  },
  clearSpaceDetail({commit,state}){
    commit(types.CLEAR_SPACE_DETAIL);
  },
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

  [types.GET_SPACE_DETAIL] (state,rsp){
    state.spaceDetail = rsp
  },
  [types.UPDATE_SPACE_USER] (state,user){
    let spaceUsers = state.spaceDetail.spaceUsers
    let index = spaceUsers.findIndex(item=>{
      return item.id === user.id
    })
    if (index > -1){
      state.spaceDetail.spaceUsers.splice(index,1,user)
    }
  },
  [types.CLEAR_SPACE_DETAIL] (state){
    state.spaceDetail = null
  },
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
