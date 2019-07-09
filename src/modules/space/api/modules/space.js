import qs from 'qs'
import axios from 'axios'
import base64 from 'js-base64'

export default {
  getSpaceDetail({sid}, successCb, errorCb) {
    $axios.get(`/spaces/${sid}`).then(function (response) {
      successCb && successCb(response.data)
    }).catch(function (error) {
      errorCb && errorCb(error)
    });
  },
  deleteIssue({sid, cid}, successCb, errorCb) {
    $axios.delete(`/subject/${sid}/comments/${cid}`).then(response => {
      successCb && successCb(response.data)
    }).catch(error => {
      errorCb && errorCb(error)
    })
  },

  getSpaceEvents({sid, start, limit}, successCb, errorCb) {
    let param = {
      start,
      limit
    }

    $axios.get(`/spaces/${sid}/events?` + qs.stringify(param, {indices: false})).then(function (response) {
      successCb && successCb(response.data)
    }).catch(function (error) {
      errorCb && errorCb(error)
    });
  },
  getSpaceVisitorList({sid, start, limit}, successCb, errorCb) {
    let param = {
      start,
      limit
    }

    $axios.get(`/spaces/${sid}/visited?` + qs.stringify(param, {indices: false})).then(function (response) {
      successCb && successCb(response.data)
    }).catch(function (error) {
      errorCb && errorCb(error)
    });
  },

  updateBlacklist({sid, list}, successCb, errorCb) {

    let param = {
      blackListIds: list,
    };

    $axios.put(`/spaces/${sid}/config`, JSON.stringify(param)).then(response => {
      successCb && successCb(response.data)
    }).catch(error => {
      errorCb && errorCb(error)
    })
  },
  createSpace({name, users}, successCb, errorCb) {
    let param = {
      name,
      spaceUsers: users
    }

    $axios.post(`/spaces`, JSON.stringify(param)).then(response => {
      successCb && successCb(response.data)
    }).catch(error => {
      errorCb && errorCb(error)
    })
  },
  deleteSpace({sid}, successCb, errorCb) {
    $axios.delete(`/spaces/${sid}`).then(response => {
      successCb && successCb(response.data)
    }).catch(error => {
      errorCb && errorCb(error)
    })
  },
  renameSpace({sid, name}, successCb, errorCb) {
    let param = {
      name
    }

    $axios.put(`/spaces/${sid}`, JSON.stringify(param)).then(response => {
      successCb && successCb(response.data)
    }).catch(error => {
      errorCb && errorCb(error)
    })
  },
  updateSpaceUser({sid, user}, successCb, errorCb) {

    $axios.put(`/spaces/${sid}/space_users/${user.id}`, JSON.stringify(user)).then(response => {
      successCb && successCb(response.data)
    }).catch(error => {
      errorCb && errorCb(error)
    })
  },
  updateSpaceUserNotice({sid, userId, deathNotice}, successCb, errorCb) {

    let data = {
      deathNotice: deathNotice
    }

    $axios.put(`/spaces/${sid}/space_users/${userId}/death_notice`, JSON.stringify(data)).then(response => {
      successCb && successCb(response.data)
    }).catch(error => {
      errorCb && errorCb(error)
    })
  },
  addFriend({sid, userId}, successCb, errorCb) {
    $axios.post(`/spaces/${sid}/config/friends`, JSON.stringify([userId])).then(response => {
      successCb && successCb(response.data)
    }).catch(error => {
      errorCb && errorCb(error)
    })
  },
  deleteFriend({sid, userId}, successCb, errorCb) {

    $axios.post(`/spaces/${sid}/config/friends?_method=delete`, JSON.stringify([userId])).then(response => {
      successCb && successCb(response.data)
    }).catch(error => {
      errorCb && errorCb(error)
    })
  },
  updateSpaceConfig({sid, viewScope, commentScope}, successCb, errorCb) {

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
  postIssue({sid, data}, successCb, errorCb) {
    $axios.post(`/subject/${sid}/comments`, JSON.stringify(data)).then(response => {
      successCb && successCb(response.data)
    }).catch(error => {
      errorCb && errorCb(error)
    })
  },
  fetchIssueList({sid, start, limit, type}, successCb, errorCb) {
    let param = {
      start,
      limit,
      type
    }

    $axios.get(`/subject/${sid}/comments?` + qs.stringify(param, {indices: false})).then(function (response) {
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

  sendComment({sid, data}, successCb, errorCb) {
    $axios.post(`/subject/${sid}/comments`, JSON.stringify(data)).then(response => {
      successCb && successCb(response.data)
    }).catch(error => {
      errorCb && errorCb(error)
    })
  },

  deleteComment({sid, cid}, successCb, errorCb) {
    $axios.delete(`/subject/${sid}/comments/${cid}`).then(response => {
      successCb && successCb(response.data)
    }).catch(error => {
      errorCb && errorCb(error)
    })
  },

<<<<<<< HEAD
  modifyCouplets({sid, uid, left, right}, successCb, errorCb) {
=======
  modifyCouplets({sid,left,right},successCb, errorCb){
>>>>>>> f0839941bbb7f68f49364d24373782a3b05c5afe
    let param = {
      left,
      right
    }
    $axios.put(`/spaces/${sid}/couplets`, JSON.stringify(param)).then(response => {
      successCb && successCb(response.data)
    }).catch(error => {
      errorCb && errorCb(error)
    })
  },
  getPriceTag({test}, successCb, errorCb) {
    let url = `/pay/price_tags`
    if (test !== undefined && test !== null) {
      let param = {test}
      url += '?'
      url += qs.stringify(param, {indices: false})
    }
    $axios.get(url).then(function (response) {
      successCb && successCb(response.data)
    }).catch(function (error) {
      errorCb && errorCb(error)
    });
  },
  placeOrder({price_tag_id, test}, successCb, errorCb) {
    let param = {
      price_tag_id,
    }
    let url = `/pay/weixin/service/prepare/order`
    if (test !== undefined && test !== null) {
      let param = {test}
      url += '?'
      url += qs.stringify(param, {indices: false})
    }
    $axios.post(url, JSON.stringify(param)).then(response => {
      successCb && successCb(response.data)
    }).catch(error => {
      errorCb && errorCb(error)
    })
  },
  getChargeLogs({type, start, limit}, successCb, errorCb) {
    let param = {
      start,
      limit
    }
    if (type) {
      param.type = type
    }
    $axios.get(`/amount/logs?` + qs.stringify(param, {indices: false})).then(function (response) {
      successCb && successCb(response.data)
    }).catch(function (error) {
      errorCb && errorCb(error)
    });
  },
  filesQiniuUploadTicket({reqType, name, expand, size}, successCb, errorCb) {
    const params = {
      req_type: reqType,
      name: name,
      expand: expand,
      size: size
    }

    $axios.get(`/files/qiniu/token`, {params}).then((response) => {
      successCb && successCb(response.data)
    }).catch((error) => {
      errorCb && errorCb(error)
    })
  },

  filesQiniuUpload({data, token, key}, successCb, errorCb) {

    let base64Key = base64.Base64.encode(key)
    base64Key = base64Key.replace(/\+/g, '-') // Convert '+' to '-'
      .replace(/\//g, '_') // Convert '/' to '_'

    let url = `https://upload.qiniup.com/putb64/-1/key/${base64Key}`
    data = data.replace(/^data:image\/\w+;base64,/, "");//截掉base64前面头

    axios.post(url, data, {
      headers: {
        'Authorization': 'UpToken ' + token,
        'Content-Type': 'application/octet-stream'
      }
    })
      .then(function (response) {
        successCb && successCb(response.data)
      })
      .catch(function (error) {
        errorCb && errorCb(error)
      });
  },

  getWxQrCode({scene}, successCb, errorCb) {

    let param = {
      scene,
      with_image: 1
    }
    $axios.get(`/wx/qrcode/create?` + qs.stringify(param, {indices: false})).then(function (response) {
      successCb && successCb(response.data)
    }).catch(function (error) {
      errorCb && errorCb(error)
    });
  },
<<<<<<< HEAD

  buy({spaceId, spaceUserId, productId}, successCb, errorCb) {
    $axios.post(`/buy`, JSON.stringify({spaceId, spaceUserId, productId})).then(response => {
=======
  buyProduct({productId,spaceId,spaceUserId},successCb, errorCb){
    let param = {
      productId,
      spaceId,
      spaceUserId
    }
    $axios.post(`/buy`, JSON.stringify(param)).then(response => {
>>>>>>> f0839941bbb7f68f49364d24373782a3b05c5afe
      successCb && successCb(response.data)
    }).catch(error => {
      errorCb && errorCb(error)
    })
<<<<<<< HEAD
  },
=======
  }
>>>>>>> f0839941bbb7f68f49364d24373782a3b05c5afe
}
