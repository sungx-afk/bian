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
}
