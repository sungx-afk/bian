export function wechatShare(shareData) {
  return new Promise(async function(resolve, reject) {
    try {
      let isWechat = navigator.userAgent.indexOf('MicroMessenger') > -1
      if(!isWechat) {
        return resolve('您目前所处的并不是微信内置浏览器')
      }
      //设置默认的分享标题、描述、网页、图片，以及分享成功后的回调
      let defaultData = {
        title: '彼岸纪念',
        desc: '逝者已矣，生者如斯',
        link: 'https://ba.yugusoft.com/home',
        imgUrl: '../modules/images/index_header.jpg',
        success: function (res) {}
      }
      //shareData是你重置的分享标题等等
      let data = { ...defaultData, ...shareData }
      //等待后台返回签名
      let url = window.location.href
      let ret = await getJsAuthSignature(url)
      //后台返回成功后，配置微信的API
      let config = Object.assign({
        debug: true,
        jsApiList: ['updateAppMessageShareData', 'updateTimelineShareData']
      }, {
        appId: ret.appid, //公众号的唯一标识
        timestamp: ret.timestamp, //接口返回签名的时间戳
        nonceStr: ret.noncestr, //接口返回签名的随机串
        signature: ret.signature //接口返回签名
      })
      wx.config(config)
      var configError = false
      //处理验证成功后的信息
      wx.ready(function () {
        if (configError){
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
