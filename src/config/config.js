const config_server = {
  domain:'https://ba.yugusoft.com',
  wechatAppId:'wxdb43de2e1083005a',
  supportPay:true,
  // 是否启用「云币」虚拟货币概念：
  //   true  = 老模式：余额/充值/扣费，祭品按点数扣云币
  //   false = 新模式：全站不出现云币，只有「是否为尊贵馆(VIP)」——
  //           VIP 祭品免费，非 VIP 引导开通尊贵馆（iOS 走 App Store 内购）
  // iOS 上架必须 false：App 内不得出现第三方支付购买虚拟货币（审核 3.1.1）
  supportPoint:false,
  supportFeedback:true,
  supportNotice:true
}

global.config_server = config_server;

export default config_server


