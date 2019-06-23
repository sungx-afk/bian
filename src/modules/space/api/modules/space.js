import qs from 'qs'

export default {
  getSpaceDetail({sid},successCb, errorCb){
    $axios.get(`/spaces/${sid}`).then(function (response) {
      successCb && successCb(response.data)
    }).catch(function (error) {
      errorCb &&  errorCb(error)
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
    };

    $axios.put(`/spaces/${sid}/config`, JSON.stringify(param)).then(response => {
      successCb && successCb(response.data)
    }).catch(error => {
      errorCb && errorCb(error)
    })
  },
  createSpace({name,users},successCb, errorCb) {
    let param = {
      name,
      spaceUsers:users
    }

    $axios.post(`/spaces`, JSON.stringify(param)).then(response => {
      successCb && successCb(response.data)
    }).catch(error => {
      errorCb && errorCb(error)
    })
  },
  deleteSpace({sid},successCb, errorCb) {
    $axios.delete(`/spaces/${sid}`).then(response => {
      successCb && successCb(response.data)
    }).catch(error => {
      errorCb && errorCb(error)
    })
  },
  renameSpace({sid,name},successCb, errorCb) {
    let param = {
      name
    }

    $axios.put(`/spaces/${sid}`, JSON.stringify(param)).then(response => {
      successCb && successCb(response.data)
    }).catch(error => {
      errorCb && errorCb(error)
    })
  },
  updateSpaceUser({sid,user},successCb, errorCb) {

    let userId = user.id
    delete user.id

    $axios.put(`/spaces/${sid}/space_users/${userId}`, JSON.stringify(user)).then(response => {
      successCb && successCb(response.data)
    }).catch(error => {
      errorCb && errorCb(error)
    })
  },
  deleteFriend({sid,userId},successCb, errorCb){

    $axios.post(`/spaces/${sid}/config/friends?_method=delete`,JSON.stringify([userId])).then(response => {
      successCb && successCb(response.data)
    }).catch(error => {
      errorCb && errorCb(error)
    })
  },
  updateSpaceConfig({sid,viewScope,commentScope},successCb, errorCb){

    let param = {}

    if (viewScope) {
      param.viewScope = viewScope
    }

    if (commentScope) {
      param.commentScope = commentScope;
    }

    $axios.put(`/spaces/${sid}/config`, JSON.stringify(param)).then(response => {
      successCb && successCb(response.data)
    }).catch(error => {
      errorCb && errorCb(error)
    })
  },
  postIssue({sid,data},successCb, errorCb) {

    let param = {
      data
    }
    $axios.post(`/subject/${sid}/comments`, qs.stringify(param)).then(response => {
      successCb && successCb(response.data)
    }).catch(error => {
      errorCb && errorCb(error)
    })
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
  getIssueDetail({sid,cid},successCb, errorCb){

    $axios.get(`/subject/${sid}/comments/${cid}`).then(function (response) {
      successCb && successCb(response.data)
    }).catch(function (error) {
      errorCb && errorCb(error)
    });
  },

  sendComment({sid,data},successCb, errorCb) {
    $axios.post(`/subject/${sid}/comments`, JSON.stringify(data)).then(response => {
      successCb && successCb(response.data)
    }).catch(error => {
      errorCb && errorCb(error)
    })
  },

  deleteComment({sid,cid},successCb, errorCb) {
    $axios.delete(`/subject/${sid}/comments/${cid}`).then(response => {
      successCb && successCb(response.data)
    }).catch(error => {
      errorCb && errorCb(error)
    })
  },

  filesQiniuUploadTicket({ reqType, name, expand, size, resId }, successCb, errorCb) {
    const params = {
      req_type: reqType,
      name: name,
      expand: expand,
      size: size
    }
    if(!!resId){
      params.res_id = resId;
    }

    $axios.get(`files/qiniu/token`, { params }).then((response) => {
      successCb && successCb(response.data)
    }).catch((error) => {
      errorCb && errorCb(error)
    })
  },

  mkFileRequest({url,data,headers},successCb, errorCb){
    let config = {
      method: 'POST',
      url: url,
      headers:headers,
      data:data
    }
    $axios(config).then((response) => {
      successCb && successCb(response.data)
    }).catch((error) => {
      errorCb && errorCb(error)
    });
  },
  getWxQrCode({scene},successCb, errorCb) {

    let param = {
      scene
    }
    $axios.get(`/wx/qrcode/create?`+qs.stringify(param, { indices: false })).then(function (response) {
      successCb && successCb(response.data)
    }).catch(function (error) {
      errorCb && errorCb(error)
    });
  },
}
