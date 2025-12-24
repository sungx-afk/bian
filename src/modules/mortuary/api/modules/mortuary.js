import qs from 'qs'
import axios from 'axios'
import base64 from 'js-base64'

export default {
  getMortuaryList(params, successCb, errorCb) {
    $axios.get(`/merchant/list?` + qs.stringify(params, {indices: false})).then(function (response) {
      successCb && successCb(response.data)
    }).catch(function (error) {
      errorCb && errorCb(error)
    });
  },
  getMortuaryDetail({id}, successCb, errorCb) {
    $axios.get(`/merchant/${id}`).then(function (response) {
      successCb && successCb(response.data)
    }).catch(function (error) {
      errorCb && errorCb(error)
    });
  },
  createMortuary(params, successCb, errorCb) {
    $axios.post(`/merchant`, JSON.stringify(params)).then(response => {
      successCb && successCb(response.data)
    }).catch(error => {
      errorCb && errorCb(error)
    })
  },
  modifyMortuary(params, successCb, errorCb) {
    let sid = params.id;
    delete params.id;
    $axios.patch(`/merchant/${sid}`, JSON.stringify(params)).then(response => {
      successCb && successCb(response.data)
    }).catch(error => {
      errorCb && errorCb(error)
    })
  },
  deleteMortuary({sid}, successCb, errorCb) {
    $axios.delete(`/merchant/${sid}`).then(response => {
      successCb && successCb(response.data)
    }).catch(error => {
      errorCb && errorCb(error)
    })
  },
  setManager({id,ids}, successCb, errorCb) {
    $axios.patch(`/merchant/${id}/manager`, ids).then(response => {
      successCb && successCb(response.data)
    }).catch(error => {
      errorCb && errorCb(error)
    })
  },



}
