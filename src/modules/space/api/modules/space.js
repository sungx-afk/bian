import qs from 'qs'

export default {
  getSpaceDetail({sid},successCb, errorCb){
    $axios.get(`/spaces/${sid}`).then(function (response) {
      successCb && successCb(response.data)
    }).catch(function (error) {
      errorCb &&  errorCb(error)
    });
  },

  fetchIssueList({sid,start,limit,type},successCb, errorCb) {
    let param = {
      start,
      limit,
      type
    }

    $axios.get(`/subject/${sid}/comments?`+qs.stringify(param, { indices: false })).then(function (response) {
      successCb && successCb(response.data)
    }).catch(function (error) {
      errorCb && errorCb(error)
    });
  },
  deleteIssue({sid,cid},successCb, errorCb) {
    $axios.post(`/subject/${args.sid}/comments/${args.cid}`, qs.stringify({_method: 'DELETE'})).then(response => {
      successCb && successCb(response.data)
    }).catch(error => {
      errorCb && errorCb(error)
    })
  },
}
