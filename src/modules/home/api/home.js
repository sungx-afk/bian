import qs from 'qs'

export default {

  //https://ba.yugusoft.com/spaces?token=48dd8cc7-7c23-4a90-a40e-308b30cba24c&plat=weapp&platVersion=1.0.0
  getSpaceList({}, successCb, errorCb){
    $axios.get(`/spaces`+qs.stringify('', { indices: false })).then(function (response) {
      successCb(response.data)
    }).catch(function (error) {
      errorCb(error)
    });
  },
}
