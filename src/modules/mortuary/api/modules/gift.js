import qs from 'qs'
import axios from 'axios'
import base64 from 'js-base64'

export default {
  getGiftList(params, successCb, errorCb) {
    $axios.get(`/products?` + qs.stringify(params, {indices: false})).then(function (response) {
      successCb && successCb(response.data)
    }).catch(function (error) {
      errorCb && errorCb(error)
    });
  },
  modifyGift(params, successCb, errorCb) {
    let sid = params.id;
    delete params.id;
    $axios.patch(`/products/${sid}`, JSON.stringify(params)).then(response => {
      successCb && successCb(response.data)
    }).catch(error => {
      errorCb && errorCb(error)
    })
  },
}
