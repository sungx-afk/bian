import qs from 'qs'

export default {
  getSpaceList(successCb, errorCb){
    $axios.get(`/spaces`+qs.stringify('', { indices: false })).then(function (response) {
      successCb(response.data)
    }).catch(function (error) {
      errorCb(error)
    });
  },

  getSpacesVisited(successCb,errorCb) {

    $axios.get(`/spaces/visited`+qs.stringify('', { indices: false })).then(function (response) {
      successCb(response.data)
    }).catch(function (error) {
      errorCb(error)
    });
  },
}
