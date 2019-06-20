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

  getSpaceEvents({sid,start,limit},successCb, errorCb) {
    let param = {
      start,
      limit
    }

    $axios.get(`/spaces/${sid}/events?`+qs.stringify(param, { indices: false })).then(function (response) {
      successCb && successCb(response.data)
    }).catch(function (error) {
      errorCb && errorCb(error)
    });
  },
  getSpaceVisitorList({sid,start,limit},successCb, errorCb){
    let param = {
      start,
      limit
    }

    $axios.get(`/spaces/${sid}/visited?`+qs.stringify(param, { indices: false })).then(function (response) {
      successCb && successCb(response.data)
    }).catch(function (error) {
      errorCb && errorCb(error)
    });
  },

  updateBlacklist({sid,list},successCb, errorCb) {

    let param = {
      blackListIds: list,
      _method:'PUT'
    };

    $axios.post(`/spaces/${args.sid}/config`, qs.stringify(param)).then(response => {
      successCb && successCb(response.data)
    }).catch(error => {
      errorCb && errorCb(error)
    })
  },
}
