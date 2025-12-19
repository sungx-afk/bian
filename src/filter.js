import {timesToDate} from './config/utils'

export const filter = (Vue) => {

  Vue.filter('timesToDate', (times,pattern) => {//时间戳转日期
    if(!pattern){
      pattern = 'yyyy-MM-dd HH:mm';
    }
    if(times){
      return timesToDate(times,pattern);
    }else{
      return '';
    }
  })

  Vue.filter('timeAgo', (time) => {// 时间搓

    time = time / 1000
    function pluralize(time, label) {
      return time + label
    }

    const between = Date.now() / 1000 - Number(time)
    if (between < 60) {
      return '刚刚'
    }else if (between < 3600) {
      return pluralize(~~(between / 60), '分钟前')
    } else if (between < 86400) {
      return pluralize(~~(between / 3600), '小时前')
    } else if (between < (86400 * 365)){
      return pluralize(~~(between / 86400), '天前')
    } else {
      return pluralize(~~(between / (86400 * 365)), '年前')
    }
  })


    Vue.filter('filterMoney', (money,showPoint = true) => {//金额转换
      if (money) {
        let hasPoint = true
        money = parseFloat(money).toFixed(2)
        // if (money.toString().indexOf('.') > 0) {

        //   hasPoint = true
        // }
        money = money.toString();
        let str = money
        let point = ''
        if (hasPoint) {
          let box = money.split('.');
          str = box[0];
          point = box[1];
        }
        let result = str.replace(/\B(?=(?:\d{3})+$)/g, ',');
        if (showPoint && point) {
          result = result + '.' + point;
        }
        return result;
      } else {
        return '0.00';
      }
    })

}




















