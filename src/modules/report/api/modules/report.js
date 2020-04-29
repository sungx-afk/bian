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
  handleReport({rid,status},successCb, errorCb){
    let param = {
      status
    }
    $axios.put(`/complaints/${rid}`,qs.stringify(param, { indices: false }),{headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }}).then(function (response) {
      successCb && successCb(response.data)
    }).catch(function (error) {
      errorCb && errorCb(error)
    });
  },
  getSpaceDetail({sid,scene,quiet = 1}, successCb, errorCb) {
    let url = `/spaces/${sid}`
    let param = {}

    if (scene){
      param.scene = scene
    }
    if (quiet){
      param.quiet = 1
    }
    if (Object.keys(param).length > 0){
      url = url + '?' + qs.stringify(param, {indices: false})
    }
    $axios.get(url).then(function (response) {
      successCb && successCb(response.data)
    }).catch(function (error) {
      errorCb && errorCb(error)
    });
  },
  getIssueDetail({sid, cid}, successCb, errorCb) {

    $axios.get(`/subject/${sid}/comments/${cid}`).then(function (response) {
      successCb && successCb(response.data)
    }).catch(function (error) {
      errorCb && errorCb(error)
    });
  },
  getComments({subject_id, start, limit}, successCb, errorCb) {
    let param = {
      start,
      limit
    }

    $axios.get(`/subject/${subject_id}/all_comments?` + qs.stringify(param, {indices: false})).then(function (response) {
      successCb && successCb(response.data)
    }).catch(function (error) {
      errorCb && errorCb(error)
    });
  }
}
