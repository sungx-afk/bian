import qs from 'qs'

export default {
  getSpaceList(successCb, errorCb){
    $axios.get(`/spaces`).then(function (response) {
      successCb && successCb(response.data)
    }).catch(function (error) {
      errorCb && errorCb(error)
    });
  },

  getSpacesVisited(successCb,errorCb) {

    $axios.get(`/spaces/visited`).then(function (response) {
      successCb && successCb(response.data)
    }).catch(function (error) {
      errorCb && errorCb(error)
    });
  },
  deleteSpaceVisited({sid},successCb,errorCb) {
    $axios.delete(`/spaces/visited/${sid}`).then(response => {
      successCb && successCb(response.data)
    }).catch(error => {
      errorCb && errorCb(error)
    })
  },
  clearSpaceVisited(successCb,errorCb) {
    $axios.delete('/spaces/visited/all').then(response => {
      successCb && successCb(response.data)
    }).catch(error => {
      errorCb && errorCb(error)
    })
  },
}
