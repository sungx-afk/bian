
import qs from 'qs'
import config_server from '@/config/config'

export function wechatShare(shareData) {
  return new Promise(async function(resolve, reject) {
    try {
      let isWechat = navigator.userAgent.indexOf('MicroMessenger') > -1
      if(!isWechat) {
        return resolve('您目前所处的并不是微信内置浏览器')
      }
      //设置默认的分享标题、描述、网页、图片，以及分享成功后的回调
      let link = `${config_server.domain}/home`
      if (shareData.extra){
        link = link + '?'+qs.stringify(shareData.extra,{indices:false});
      }
      let defaultData = {
        title: '彼岸纪念',
        desc: '逝者已矣，生者如斯',
        link: link,
        imgUrl: 'https://ba.yugusoft.com/api/v1/files/download/bian_user/19/07/03/1562158589633/logo.jpg',
        success: function (res) {}
      }
      //shareData是你重置的分享标题等等
      let data = { ...defaultData, ...shareData }
      //等待后台返回签名
      let url = window.location.href
      console.log("auth signature url:",url)
      let ret = await getJsAuthSignature(url)
      //后台返回成功后，配置微信的API
      let config = Object.assign({
        debug: false,
        jsApiList: ['updateAppMessageShareData', 'updateTimelineShareData']
      }, {
        appId: ret.appid, //公众号的唯一标识
        timestamp: ret.timestamp, //接口返回签名的时间戳
        nonceStr: ret.noncestr, //接口返回签名的随机串
        signature: ret.signature //接口返回签名
      })
      wx.config(config)
      let configError = false
      //处理验证成功后的信息
      wx.ready(function () {
        if (configError){
          console.log("configError return")
          return
        }
        wx.updateTimelineShareData({ //分享到朋友圈
          title: data.title,
          link:data.link,
          imgUrl: data.imgUrl,
          success: data.success,
          cancel: function () {}
        })
        wx.updateAppMessageShareData({ //分享给朋友
          title: data.title,
          desc: data.desc,
          link: data.link,
          imgUrl: data.imgUrl,
          success: data.success,
          cancel: function () {

          }
        })
      })
      wx.error(function(res){
        configError = true
      });
    } catch (error) {
      reject(error) //处理验证失败后的结果
    }
  })
}
export function wechatPay(payData){
  return new Promise(async function(resolve, reject) {
    try{
      let isWechat = navigator.userAgent.indexOf('MicroMessenger') > -1
      if(!isWechat) {
        return resolve('您目前所处的并不是微信内置浏览器')
      }
      let url = window.location.href
      console.log("auth signature url:",url)
      let ret = await getJsAuthSignature(url)
      let config = Object.assign({
        debug: true,
        jsApiList: ['chooseWXPay']
      }, {
        appId: ret.appid, //公众号的唯一标识
        timestamp: ret.timestamp, //接口返回签名的时间戳
        nonceStr: ret.noncestr, //接口返回签名的随机串
        signature: ret.signature //接口返回签名
      })
      wx.config(config)
      let configError = false
      //处理验证成功后的信息
      wx.ready(function () {
        if (configError){
          console.log("configError return")
          return
        }
        //payData
        let payment = payData.payment
        wx.chooseWXPay({
          timestamp: payment.timeStamp, // 支付签名时间戳，注意微信jssdk中的所有使用timestamp字段均为小写。但最新版的支付后台生成签名使用的timeStamp字段名需大写其中的S字符
          nonceStr: payment.nonceStr, // 支付签名随机串，不长于 32 位
          package: payment.package, // 统一支付接口返回的prepay_id参数值，提交格式如：prepay_id=\*\*\*）
          signType: payment.signType, // 签名方式，默认为'SHA1'，使用新版支付需传入'MD5'
          paySign: payment.sign, // 支付签名
          success: function (res) {
            resolve(0)
          },cancel:function () {
            resolve(1)
          }
        });
      })
      wx.error(function(res){
        configError = true
        reject(res)
      });
    }catch (error) {
      reject(error) //处理验证失败后的结果
    }
  })
}
//异步接口获取签名
function getJsAuthSignature(url) {
  return new Promise((resolve, reject) => {
    $API.user.getJsAuthSignature({url},rsp=>{
      resolve(rsp)
    },error=>{
      reject(error)
    })
  })
}
