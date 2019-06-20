/*路由跳转*/
export const Link = (url, query,replace) => {
  const router = {
    path: url,
    query:{}
  }
  if(query){
    router.query = query;
  }

  /*获取平台，初始化时，添加参数*/
  let app_plat = localStorage.getItem("app_plat");
  console.log(app_plat)
  if(app_plat && (app_plat.toLowerCase() == 'android' || app_plat.toLowerCase() == 'iphone')){
    var param = getRequestParam();
    if(param){
      router.query.token = param.token;
      router.query.comp_id = param.comp_id;
      router.query.plat = app_plat;
      router.query.build = param.build;
    }
  }
  if(replace){
    $router.replace(router);
  }else{
    $router.push(router);
  }
}


/**
*初始化弹出组件通用方法
*1.动态设置页面title
*2.通过key值，动态设置url地址(若已存在该key值，先置空replace,再设置一次)，保证手机端返回效果
*3.新增监听hashchange，若监听到新增的key值没有了，则调用回调方法，销毁组件
*4.返回一个方法，在组件销毁之后调用，去掉hashchange监听，此时若还存在key值，则说明是点击组件内部的确定或者取消发起的，此时执行w indow.history.back();
*5.把title设置回原来的title
*/
export const removeWidget = ({key,title,cb}) => {
  let OldTitle = document.title;
  setPageTitle(title);
  if(window.location.hash.indexOf('#'+key) < 0){
        window.location.hash = window.location.hash + '#'+key;
    }else{
        let re = new RegExp('#'+key,"gim");
        let url = window.location.href.replace(re, '');
        window.location.replace(url);
        url = url + '#'+key;
        window.location.href = url;
    }

    const remove = (e) => {
      if(e.newURL.indexOf('#'+key) < e.oldURL.indexOf('#'+key)){
          cb();
        }
    }
    setTimeout(() => {
      window.addEventListener('hashchange', remove);
    })
    return () => {
      window.removeEventListener('hashchange', remove);
      if(window.location.hash.indexOf('#'+key) >= 0){
        window.history.back();
      }
      setPageTitle(OldTitle);
    };
}

/**
*动态设置页面title
*利用iframe的onload事件刷新页面，否则title可设置成功，但页面不刷新
*/
export const setPageTitle = (title) => {

  setTimeout(function(){
      //利用iframe的onload事件刷新页面
      document.title = title;
      var iframe = document.createElement('iframe');
      iframe.style.visibility = 'hidden';
      iframe.style.width = '1px';
      iframe.style.height = '1px';
      iframe.onload = function () {
          setTimeout(function () {
              document.body.removeChild(iframe);
          }, 0);
      };
      document.body.appendChild(iframe);
  },0);
}

export const cronToTimes = (cron) => {
  var times = 0;
  if (cron) {
    var box = cron.split(' ');
    var date = box[6] + '-' + addZero(box[4]) + '-' + addZero(box[3]) + ' ' + addZero(box[2]) + ':' + addZero(box[1]) + ':' + addZero(box[0]);
    times = dateToTimes(date);
  }
  if (times) {
    return times;
  }
}
export const timesToCron = (t_date) => {
  var cron = "";
  if (t_date) {
    cron = timesToDate(t_date, 's') + ' ' + timesToDate(t_date, 'm') + ' ' + timesToDate(t_date, 'H') + ' ' + timesToDate(t_date, 'd') + ' ' + timesToDate(t_date, 'M') + ' ' + '?' + ' ' + timesToDate(t_date, 'yyyy');
  }
  return cron;
}

export const addDate = (curDateTimeStamp,n,timeUnit) => {
  let curDate = new Date(curDateTimeStamp)
  if (n > 0){
    if (timeUnit === 'd') {
      curDate.setDate(curDate.getDate() + n);
    } else if (timeUnit === 'w'){
      curDate = new Date(curDateTimeStamp + n * 7 * 24 * 60 * 60 * 1000)
    } else if (timeUnit === 'M') {
      curDate.setMonth(curDate.getMonth() + n);
    } else if (timeUnit === 'y') {
      curDate.setFullYear(curDate.getFullYear() + n);
    }
  }

  return curDate.getTime()
}

 /*时间戳转换为日期格式*/
export const timesToDate = (tm,pattern) => {//pattern示例：yyyy年MM月dd日 hh:mm:ss  yyyy-MM-dd hh:mm:ss
  if(tm=="" || tm == null || tm == undefined){
    return '';
  }
  const date = new Date(parseInt(tm));
  if(pattern){
    return datePattern(date, pattern);
  }else{
    return datePattern(date, 'yyyy-MM-dd HH:mm:ss');
  }
}

/*日期转换时间戳*/
export const dateToTimes = (date) => {
  date = date.substring(0,19);
  date = date.replace(/-/g,'/');
  var timestamp = new Date(date).getTime();
  return timestamp;
}

/*日期字符串转换日期js对象*/
export const dateStrToDateObj = (dateStr) => {
  dateStr = dateStr.substring(0,19);
  dateStr = dateStr.replace(/-/g,'/');
  return new Date(dateStr);
}

/*获取星期几的字符串*/
export const dayStrOfDate = (date) => {
  let str = '星期';
  let day = date.getDay();
  switch(day){
    case 0: str += '日'; break;
    case 1: str += '一'; break;
    case 2: str += '二'; break;
    case 3: str += '三'; break;
    case 4: str += '四'; break;
    case 5: str += '五'; break;
    case 6: str += '六'; break;
  }
  return str;
}

export const datePattern = (date, fmt) => {
    const o = {
      'M+' : date.getMonth()+1, //月份
      'd+' : date.getDate(), //日
      'h+' : date.getHours()%12 == 0 ? 12 : date.getHours()%12, //小时
      'H+' : date.getHours(), //小时
      'm+' : date.getMinutes(), //分
      's+' : date.getSeconds(), //秒
      'q+' : Math.floor((date.getMonth()+3)/3), //季度
      'S' : date.getMilliseconds() //毫秒
    };
    const week = {
      '0' : '/u65e5',
      '1' : '/u4e00',
      '2' : '/u4e8c',
      '3' : '/u4e09',
      '4' : '/u56db',
      '5' : '/u4e94',
      '6' : '/u516d'
    };
    if(/(y+)/.test(fmt)){
        fmt=fmt.replace(RegExp.$1, (date.getFullYear()+'').substr(4 - RegExp.$1.length));
    }
    if(/(E+)/.test(fmt)){
        fmt=fmt.replace(RegExp.$1, ((RegExp.$1.length>1) ? (RegExp.$1.length>2 ? '/u661f/u671f' : '/u5468') : '')+week[date.getDay()+'']);
    }
    for(let k in o){
        if(new RegExp('('+ k +')').test(fmt)){
            fmt = fmt.replace(RegExp.$1, (RegExp.$1.length==1) ? (o[k]) : (('00'+ o[k]).substr((''+ o[k]).length)));
        }
    }
    return fmt;
}
export class lock {
  constructor(){
    this.lock = false;
  }
  more(list,total,action){
    this.list = list;
    this.action = action;
    this.total = total;
    if(this.lock == false && list.length > 0){  //开启
      if(this.list.length < this.total){//未加载完
        this.lock = true;
        setTimeout(() => {//5秒自动解锁
          if(this.total > this.list.length)//未加载完
          {
            this.lock = false;
          }
        },5000);
        return new Promise((resolve,reject)=>{
          this.action().then((data)=>{
            this.lock = false;
            resolve(data);
          }).catch((error)=>{
            this.lock = false;
            reject(error);
          })
        });
      }//未加载完
      else if(this.total == this.list.length)//加载完
      {
        this.lock = true;
      }
    }
  }
  scroll(e,list,total,action){
    this.event = e;
    if(event.target.scrollHeight <= event.target.scrollTop + event.target.offsetHeight+50){
      return this.more(list,total,action);
    }
  }
  locked(action){
    if(this.lock == false)
    {
      setTimeout(() => {//5秒自动解锁
        this.lock = false;
      },5000);
      this.lock = true;
       return new Promise((resolve,reject)=>{
        action().then((data)=>{
          this.lock = false;
          resolve(data);
        }).catch((error)=>{
          this.lock = false;
          reject(error);
        })
      });
    }
  }
}


export const addZero = (v) => {if (v < 10) return '0' + v;return v.toString();}



export const filterLink = (str) => {
  var isCode = str.indexOf('<pre');
  if(isCode < 0){
    var str2 = str.replace(/>([\s\S]*?)</g,function(word){
      return word.replace(/(http:\/\/[\w\-_]+|ftp:\/\/[\w\-_]+|https:\/\/[\w\-_]+|www)(\.[\w\-_]+)+([\w\-\.,@?^=%&amp;:/~\+#]*[\w\-\@?^=%&amp;/~\+#])?/gi,function(m){
        return '<a class="open_link" href="'+m+'" target="_blank">'+m+'</a>';
      });
    });
    var box = str.split(/<|>/g);
    str2 = str2.replace(box[0],box[0].replace(/(http:\/\/[\w\-_]+|ftp:\/\/[\w\-_]+|https:\/\/[\w\-_]+|www)(\.[\w\-_]+)+([\w\-\.,@?^=%&amp;:/~\+#]*[\w\-\@?^=%&amp;/~\+#])?/gi,function(m){
      return '<a class="open_link" href="'+m+'" target="_blank">'+m+'</a>';
    }));
    if(box[0] != box[box.length-1]){
      str2 = str2.replace(box[box.length-1],box[box.length-1].replace(/(http:\/\/[\w\-_]+|ftp:\/\/[\w\-_]+|https:\/\/[\w\-_]+|www)(\.[\w\-_]+)+([\w\-\.,@?^=%&amp;:/~\+#]*[\w\-\@?^=%&amp;/~\+#])?/gi,function(m){
        return '<a class="open_link" href="'+m+'" target="_blank">'+m+'</a>';
      }));
    }
    return str2;
  }else{
    return str;
  }
}



/*base64 start*/
var base64encodechars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
var base64decodechars = new Array(-1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, 62, -1, -1, -1, 63,
52, 53, 54, 55, 56, 57, 58, 59, 60, 61, -1, -1, -1, -1, -1, -1, -1, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14,
15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, -1, -1, -1, -1, -1, -1, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40,
41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, -1, -1, -1, -1, -1);

export const base64encode=(str) =>{
    var out, i, len;
    var c1, c2, c3;
    len = str.length;
    i = 0;
    out = "";
    while (i < len) {
        c1 = str.charCodeAt(i++) & 0xff;
        if (i == len) {
            out += base64encodechars.charAt(c1 >> 2);
            out += base64encodechars.charAt((c1 & 0x3) << 4);
            out += "==";
            break;
        }
        c2 = str.charCodeAt(i++);
        if (i == len) {
            out += base64encodechars.charAt(c1 >> 2);
            out += base64encodechars.charAt(((c1 & 0x3) << 4) | ((c2 & 0xf0) >> 4));
            out += base64encodechars.charAt((c2 & 0xf) << 2);
            out += "=";
            break;
        }
        c3 = str.charCodeAt(i++);
        out += base64encodechars.charAt(c1 >> 2);
        out += base64encodechars.charAt(((c1 & 0x3) << 4) | ((c2 & 0xf0) >> 4));
        out += base64encodechars.charAt(((c2 & 0xf) << 2) | ((c3 & 0xc0) >> 6));
        out += base64encodechars.charAt(c3 & 0x3f);
    }
    //console.log(out);
    return out;
};

export const base64decode=(str) =>{
    var c1, c2, c3, c4;
    var i, len, out;
    len = str.length;
    i = 0;
    out = "";
    while (i < len) {

        do {
            c1 = base64decodechars[str.charCodeAt(i++) & 0xff];
        } while (i < len && c1 == -1);
        if (c1 == -1) break;

        do {
            c2 = base64decodechars[str.charCodeAt(i++) & 0xff];
        } while (i < len && c2 == -1);
        if (c2 == -1) break;
        out += String.fromCharCode((c1 << 2) | ((c2 & 0x30) >> 4));

        do {
            c3 = str.charCodeAt(i++) & 0xff;
            if (c3 == 61) return out;
            c3 = base64decodechars[c3];
        } while (i < len && c3 == -1);
        if (c3 == -1) break;
        out += String.fromCharCode(((c2 & 0xf) << 4) | ((c3 & 0x3c) >> 2));

        do {
            c4 = str.charCodeAt(i++) & 0xff;
            if (c4 == 61) return out;
            c4 = base64decodechars[c4];
        } while (i < len && c4 == -1);
        if (c4 == -1) break;
        out += String.fromCharCode(((c3 & 0x03) << 6) | c4);
    }
    //console.log(out);
    return out;
};

export const utf16to8=(str)=> {
    var out, i, len, c;
    out = "";
    len = str.length;
    for (i = 0; i < len; i++) {
        c = str.charCodeAt(i);
        if ((c >= 0x0001) && (c <= 0x007f)) {
            out += str.charAt(i);
        } else if (c > 0x07ff) {
            out += String.fromCharCode(0xe0 | ((c >> 12) & 0x0f));
            out += String.fromCharCode(0x80 | ((c >> 6) & 0x3f));
            out += String.fromCharCode(0x80 | ((c >> 0) & 0x3f));
        } else {
            out += String.fromCharCode(0xc0 | ((c >> 6) & 0x1f));
            out += String.fromCharCode(0x80 | ((c >> 0) & 0x3f));
        }
    }
    return out;
};

export const utf8to16=(str)=>{
    var out, i, len, c;
    var char2, char3;
    out = "";
    len = str.length;
    i = 0;
    while (i < len) {
        c = str.charCodeAt(i++);
        switch (c >> 4) {
            case 0:
            case 1:
            case 2:
            case 3:
            case 4:
            case 5:
            case 6:
            case 7:
                // 0xxxxxxx
                out += str.charAt(i - 1);
                break;
            case 12:
            case 13:
                // 110x xxxx   10xx xxxx
                char2 = str.charCodeAt(i++);
                out += String.fromCharCode(((c & 0x1f) << 6) | (char2 & 0x3f));
                break;
            case 14:
                // 1110 xxxx  10xx xxxx  10xx xxxx
                char2 = str.charCodeAt(i++);
                char3 = str.charCodeAt(i++);
                out += String.fromCharCode(((c & 0x0f) << 12) | ((char2 & 0x3f) << 6) | ((char3 & 0x3f) << 0));
                break;
        }
    }
    return out;
};
/*base64 end*/

export const filterCrmType=(type)=> {
  let key = "";
  switch(type){
    case 'CHANCE_SOURCE': key = '商机来源'; break;
    case 'CHANCE_TYPE': key = '商机类型'; break;
    case 'CHANCE_LOSS_REASON': key = '输单原因'; break;
    case 'CONTRACT_STATUS': key = '合同状态'; break;
    case 'CONTRACT_TYPE': key = '合同类型'; break;
    case 'CUSTOMER_LEVEL': key = '客户分级'; break;
    case 'CUSTOMER_LOSS_REASON': key = '客户流失原因'; break;
    case 'CUSTOMER_SOURCE': key = '客户来源'; break;
    case 'CUSTOMER_STATUS': key = '客户分类'; break;
    case 'OPEN_SEA': key = '公海'; break;
    case 'PAY_TYPE': key = '付款方式'; break;
    case 'PRODUCT_STATUS': key = '产品状态'; break;
    case 'PRODUCT_TYPE': key = '产品分类'; break;
    case 'PRODUCT_UNIT': key = '产品单位'; break;
    case 'SALE_STATE': key = '销售阶段'; break;
  }
  return key;
};

export const validateMobile = (mobile) => {
  var result = false
  if (mobile != '') {
    if(/^[1][3,4,5,7,8][0-9]{9}$/.test(mobile)){
      result = true
    }else{
      result = false
    }
  } else {
    result = false
  }
  return result
};

export const validateEmail = (email) => {
  var result = false
  if (email != '') {
    if(/^([0-9A-Za-z\-_\.]+)@([0-9a-zA-Z_\-\.]+\.[a-z]{2,3}(\.[a-z]{2})?)$/.test(email)){
      result = true
    }else{
      result = false
    }
  } else {
    result = false
  }
  return result
};

// 过滤掉 HTML 标签
export const removeHTMLTag = (str,defaultStr) => {
  if(!str || str.length == 0){
     if (!defaultStr) {
      return '';
     }else{
      return defaultStr;
     }
  }
  const stringNew = str.replace(/<\/?[^>]*>/g, '');
  return stringNew;
};





var _change = {
   ary0:["零", "一", "二", "三", "四", "五", "六", "七", "八", "九"],
   ary1:["", "十", "百", "千"],
   ary2:["", "万", "亿", "兆"],
   init:function (name) {
       this.name = name;
   },
   strrev:function () {
       var ary = []
       for (var i = this.name.length; i >= 0; i--) {
           ary.push(this.name[i])
       }
       return ary.join("");
   }, //倒转字符串。
   pri_ary:function () {
       var $this = this
       var ary = this.strrev();
       var zero = ""
       var newary = ""
       var i4 = -1
       for (var i = 0; i < ary.length; i++) {
           if (i % 4 == 0) { //首先判断万级单位，每隔四个字符就让万级单位数组索引号递增
               i4++;
               newary = this.ary2[i4] + newary; //将万级单位存入该字符的读法中去，它肯定是放在当前字符读法的末尾，所以首先将它叠加入$r中，
               zero = ""; //在万级单位位置的“0”肯定是不用的读的，所以设置零的读法为空

           }
           //关于0的处理与判断。
           if (ary[i] == '0') { //如果读出的字符是“0”，执行如下判断这个“0”是否读作“零”
               switch (i % 4) {
                   case 0:
                       break;
                   //如果位置索引能被4整除，表示它所处位置是万级单位位置，这个位置的0的读法在前面就已经设置好了，所以这里直接跳过
                   case 1:
                   case 2:
                   case 3:
                       if (ary[i - 1] != '0') {
                           zero = "零"
                       }
                       ; //如果不被4整除，那么都执行这段判断代码：如果它的下一位数字（针对当前字符串来说是上一个字符，因为之前执行了反转）也是0，那么跳过，否则读作“零”
                       break;

               }

               newary = zero + newary;
               zero = '';
           }
           else { //如果不是“0”
               newary = this.ary0[parseInt(ary[i])] + this.ary1[i % 4] + newary; //就将该当字符转换成数值型,并作为数组ary0的索引号,以得到与之对应的中文读法，其后再跟上它的的一级单位（空、十、百还是千）最后再加上前面已存入的读法内容。
           }

       }
       if (newary.indexOf("零") == 0) {
           newary = newary.substr(1)
       }//处理前面的0

       if(newary.substr(0,2) == '一十'){
            newary = newary.replace('一十','十');
       }
       return newary;
   }
};
//创建class类
export function changeNumToChinese() {
   this.init.apply(this, arguments);
}
changeNumToChinese.prototype = _change;
