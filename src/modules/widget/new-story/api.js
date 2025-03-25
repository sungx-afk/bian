import qs from 'qs'
import axios from 'axios'
import base64 from 'js-base64'

export function postStory({sid, data}, successCb, errorCb) {
  $axios.post(`/subject/${sid}/comments`, JSON.stringify(data)).then(response => {
    successCb && successCb(response.data)
  }).catch(error => {
    errorCb && errorCb(error)
  })
}

export function filesQiniuUploadTicket({reqType, name, expand, size}, successCb, errorCb) {
  const params = {
    req_type: reqType,
    name: name,
    expand: expand,
    size: size
  }

  $axios.get(`/files/qiniu/token?`+ qs.stringify(params, {indices: false})).then((response) => {
    successCb && successCb(response.data)
  }).catch((error) => {
    errorCb && errorCb(error)
  })
}

export function filesQiniuUpload({data, token, key}, successCb, errorCb) {

  let base64Key = base64.Base64.encode(key)
  base64Key = base64Key.replace(/\+/g, '-') // Convert '+' to '-'
    .replace(/\//g, '_') // Convert '/' to '_'

  let url = `https://upload.qiniup.com/putb64/-1/key/${base64Key}`
  data = data.replace(/^data:.*;base64,/, "");//截掉base64前面头

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
}
