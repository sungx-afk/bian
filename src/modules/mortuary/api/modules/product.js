import qs from 'qs'
import axios from 'axios'
import base64 from 'js-base64'

export default {
  getProductList(params, successCb, errorCb) {
    $axios.get(`/physical-product/list?` + qs.stringify(params, {indices: false})).then(function (response) {
      successCb && successCb(response.data)
    }).catch(function (error) {
      errorCb && errorCb(error)
    });
  },
  getProductDetail({id}, successCb, errorCb) {
    $axios.get(`/physical-product/${id}`).then(function (response) {
      successCb && successCb(response.data)
    }).catch(function (error) {
      errorCb && errorCb(error)
    });
  },
  createProduct(params, successCb, errorCb) {
    $axios.post(`/physical-product`, JSON.stringify(params)).then(response => {
      successCb && successCb(response.data)
    }).catch(error => {
      errorCb && errorCb(error)
    })
  },
  modifyProduct(params, successCb, errorCb) {
    let sid = params.id;
    delete params.id;
    $axios.patch(`/physical-product/${sid}`, JSON.stringify(params)).then(response => {
      successCb && successCb(response.data)
    }).catch(error => {
      errorCb && errorCb(error)
    })
  },
  deleteProduct({sid}, successCb, errorCb) {
    $axios.delete(`/physical-product/${sid}`).then(response => {
      successCb && successCb(response.data)
    }).catch(error => {
      errorCb && errorCb(error)
    })
  },
}
