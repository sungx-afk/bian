import qs from 'qs'

export default {
  getReportList({start,limit,status},successCb, errorCb){

    let param = {
      start,
      limit,
      status:0
    }
    if (status !== undefined){
      param.status = status
    }

    $axios.get(`/complaints?` + qs.stringify(param, {indices: false})).then(function (response) {
      successCb && successCb(response.data)
    }).catch(function (error) {
      errorCb && errorCb(error)
    });
  },
}
