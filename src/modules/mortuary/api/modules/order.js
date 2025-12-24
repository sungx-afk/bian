import qs from 'qs'
import axios from 'axios'
import base64 from 'js-base64'

export default {
  getOrderList(params, successCb, errorCb) {
    $axios.get(`/physical-order/list?` + qs.stringify(params, {indices: false})).then(function (response) {
      successCb && successCb(response.data)
    }).catch(function (error) {
      errorCb && errorCb(error)
    });
  },
  getMyOrderList(params, successCb, errorCb) {
    $axios.get(`/physical-order/my?` + qs.stringify(params, {indices: false})).then(function (response) {
      successCb && successCb(response.data)
    }).catch(function (error) {
      errorCb && errorCb(error)
    });
  },
  getOrderDetail({id}, successCb, errorCb) {
    $axios.get(`/physical-order/${id}`).then(function (response) {
      successCb && successCb(response.data)
    }).catch(function (error) {
      errorCb && errorCb(error)
    });
  },
  createOrder(params, successCb, errorCb) {
    $axios.post(`/physical-order`, JSON.stringify(params)).then(response => {
      successCb && successCb(response.data)
    }).catch(error => {
      errorCb && errorCb(error)
    })
  },
  modifyOrder(params, successCb, errorCb) {
    let sid = params.id;
    delete params.id;
    $axios.patch(`/physical-order/${sid}`, JSON.stringify(params)).then(response => {
      successCb && successCb(response.data)
    }).catch(error => {
      errorCb && errorCb(error)
    })
  },
  deleteOrder({sid}, successCb, errorCb) {
    $axios.delete(`/physical-order/${sid}`).then(response => {
      successCb && successCb(response.data)
    }).catch(error => {
      errorCb && errorCb(error)
    })
  },
  getPayOrderInfo({orderId}, successCb, errorCb) {
    let params = {};
    $axios.post(`/physical-order/${orderId}/prepay`, JSON.stringify(params)).then(response => {
      successCb && successCb(response.data)
    }).catch(error => {
      errorCb && errorCb(error)
    })
  },
  finishOrder(params, successCb, errorCb) {
    let orderId = params.orderId;
    delete params.orderId;
    $axios.post(`/physical-order/${orderId}/deliver`, JSON.stringify(params)).then(response => {
      successCb && successCb(response.data)
    }).catch(error => {
      errorCb && errorCb(error)
    })
  },
  cancelOrder({sid}, successCb, errorCb) {
    let params = {}
    $axios.post(`/physical-order/${sid}/cancel`, JSON.stringify(params)).then(response => {
      successCb && successCb(response.data)
    }).catch(error => {
      errorCb && errorCb(error)
    })
  },




}
