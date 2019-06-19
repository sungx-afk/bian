(function () {
    iydfunctions = {
        select: function (b) {
            return document.querySelector(b);
        },
        selectAll: function (b) {
            return document.querySelectorAll(b);
        },
        id: function (b) {
            return document.getElementById(b);
        },
        attr: {
            get: function (c, d) {
                return c.getAttribute(d);
            },
            set: function (f, e, d) {
                return f.setAttribute(e, d);
            },
            remove: function (c, d) {
                return c.removeAttribute(d);
            }
        },
        each: function (i, h) {
            var f = 0,
                j = i.length,
                g;
            if (j) {
                for (; f < j; f++) {
                    h.call(i[f], f, i[f]);
                }
            } else {
                for (g in i) {
                    h.call(i[g], g, i[g]);
                }
            }
        },
        ajax: function (o, p) {
            if (typeof o === "object") {
                p = o;
                o = undefined;
            }
            p = p || {};
            var m = new XMLHttpRequest(),
                k = [],
                n = p.type || "POST",
                o = o || p.url,
                l = p.time || 10000,
                j;
            m.open(n, o, true);
            m.setRequestHeader("Content-Type", "application/x-www-form-urlencoded; charset=UTF-8");
            if (p.header) {
                $each(p.header, function (b, a) {
                    m.setRequestHeader(b, a);
                });
            }
            if (p.data) {
                tadu.each(p.data, function (b, a) {
                    k.push(encodeURIComponent(b) + "=" + encodeURIComponent(a));
                });
            }
            m.send(k.join("&").replace(/%20/g, "+"));
            var i = setTimeout(function () {
                m.onreadystatechange = function () {
                };
                m.abort();
                p.error.call();
            }, l);
            m.onreadystatechange = function () {
                if (m.readyState == 4) {
                    clearTimeout(i);
                    if (((m.status >= 200 && m.status <= 300) || m.status === 304) && p.success) {
                        data = m.responseText;
                        p.success(data);
                    } else {
                        if (p.error) {
                            p.error.call();
                        }
                    }
                }
            };
        },
        str2dom: function (l, m) {
            var n = typeof m;
            if (n === "string") {
                var k = l && l.ownerDocument || document,
                    h = k.createDocumentFragment(),
                    j = document.createElement("div"),
                    i = [];
                j.innerHTML = m;
                while (j.childNodes[0] != null) {
                    h.appendChild(j.childNodes[0]);
                }
                m = h;
                j = null;
            }
            if (n === "number") {
                m += "";
            }
            return m;
        },
        lazy: {
            Img: null,
            getY: function (obj) { //获取元素Y轴位置
                var curtop = 0;
                if (obj && obj.offsetParent) {
                    while (obj.offsetParent) {
                        curtop += obj.offsetTop;
                        obj = obj.offsetParent;
                    }
                    ;
                } else if (obj && obj.y) curtop += obj.y;
                return curtop;
            },
            scrollY: function () { //拖动条移动y轴距离
                var de = document.documentElement;
                return self.pageYOffset || (de && de.scrollTop) || document.body.scrollTop || 0;
            },
            windowHeight: function () { //屏幕高
                var de = document.documentElement;
                return self.innerHeight || (de && de.clientHeight) || document.body.clientHeight;
            },

            currentHeight: function () {
                return this.scrollY() + this.windowHeight();
            },
            load: function () {
                if (this.Img == null) {
                    this.init();
                }
                var currentHeight = this.currentHeight()+300;
                console.log('lazy.load:加载' + currentHeight + '  ' + this.Img.length);

                for (var _index = 0; _index < this.Img.length; _index++) {

                    if ($(this.Img[_index]).attr("this") == undefined) { //this 标识图片是否已经加载
                        $(this.Img[_index]).attr("this", "n");
                    }
                    if ($(this.Img[_index]).attr("this") == "y") {
                        console.log('lazy.load:加载了吗？' + currentHeight + '  ' + this.Img.length);
                        continue;
                    }
                    $(this.Img[_index]).bind("error", function () { //为图片绑定onError
                        if (this.id == "subject") {
                            $(this).attr("src", '');
                        }
                        else {
                            $(this).removeAttr("src");
                            $(this).css("visibility", 'hidden');
                        }
                    });
                    var imgTop = this.getY(this.Img[_index]);
                    if (imgTop < currentHeight) {
                        if(this.Img[_index].getAttribute("data-src") !="")
                            this.Img[_index].src = this.Img[_index].getAttribute("data-src");
                        $(this.Img[_index]).attr("this", "y");
                        $(this.Img[_index]).removeClass("lazy");
                    }
                }
                ;
                this.Img = null;
            },
            init: function () {
                console.log("lazy.init");
                var allImg = document.querySelectorAll("img.lazy");
                this.Img = allImg;
                console.log("allImg:" + allImg.length);
            },
            test: function () {
                this.init();
                //alert(this.currentHeight());
            },
            loadcheck: function () {
                console.log('lazy.loadcheck');
                setTimeout(this.load(), 100);
            }
        },
        base64: {
            base64encodechars: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/",
            base64decodechars: new Array(-1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, 62, -1, -1, -1, 63,
                52, 53, 54, 55, 56, 57, 58, 59, 60, 61, -1, -1, -1, -1, -1, -1, -1, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14,
                15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, -1, -1, -1, -1, -1, -1, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40,
                41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, -1, -1, -1, -1, -1),
            encode: function (str) {
                var out, i, len;
                var c1, c2, c3;
                len = str.length;
                i = 0;
                out = "";
                while (i < len) {
                    c1 = str.charCodeAt(i++) & 0xff;
                    if (i == len) {
                        out += this.base64encodechars.charAt(c1 >> 2);
                        out += this.base64encodechars.charAt((c1 & 0x3) << 4);
                        out += "==";
                        break;
                    }
                    c2 = str.charCodeAt(i++);
                    if (i == len) {
                        out += this.base64encodechars.charAt(c1 >> 2);
                        out += this.base64encodechars.charAt(((c1 & 0x3) << 4) | ((c2 & 0xf0) >> 4));
                        out += this.base64encodechars.charAt((c2 & 0xf) << 2);
                        out += "=";
                        break;
                    }
                    c3 = str.charCodeAt(i++);
                    out += this.base64encodechars.charAt(c1 >> 2);
                    out += this.base64encodechars.charAt(((c1 & 0x3) << 4) | ((c2 & 0xf0) >> 4));
                    out += this.base64encodechars.charAt(((c2 & 0xf) << 2) | ((c3 & 0xc0) >> 6));
                    out += this.base64encodechars.charAt(c3 & 0x3f);
                }
                console.log(out);
                return out;
            },

            decode: function (str) {
                var c1, c2, c3, c4;
                var i, len, out;
                len = str.length;
                i = 0;
                out = "";
                while (i < len) {

                    do {
                        c1 = this.base64decodechars[str.charCodeAt(i++) & 0xff];
                    } while (i < len && c1 == -1);
                    if (c1 == -1) break;

                    do {
                        c2 = this.base64decodechars[str.charCodeAt(i++) & 0xff];
                    } while (i < len && c2 == -1);
                    if (c2 == -1) break;
                    out += String.fromCharCode((c1 << 2) | ((c2 & 0x30) >> 4));

                    do {
                        c3 = str.charCodeAt(i++) & 0xff;
                        if (c3 == 61) return out;
                        c3 = this.base64decodechars[c3];
                    } while (i < len && c3 == -1);
                    if (c3 == -1) break;
                    out += String.fromCharCode(((c2 & 0xf) << 4) | ((c3 & 0x3c) >> 2));

                    do {
                        c4 = str.charCodeAt(i++) & 0xff;
                        if (c4 == 61) return out;
                        c4 = this.base64decodechars[c4];
                    } while (i < len && c4 == -1);
                    if (c4 == -1) break;
                    out += String.fromCharCode(((c3 & 0x03) << 6) | c4);
                }
                console.log(out);
                return out;
            },

            utf16to8: function (str) {
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
            },

            utf8to16: function (str) {
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
            }

        },
        uuid: {
            CHARS: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'.split(''),
            def: function (len, radix) {
                var chars = this.CHARS,
                    uuid = [],
                    i;
                radix = radix || chars.length;
                if (len) {
                    for (i = 0; i < len; i++) uuid[i] = chars[0 | Math.random() * radix];
                } else {
                    var r;
                    uuid[8] = uuid[13] = uuid[18] = uuid[23] = '-';
                    uuid[14] = '4';
                    for (i = 0; i < 36; i++) {
                        if (!uuid[i]) {
                            r = 0 | Math.random() * 16;
                            uuid[i] = chars[(i == 19) ? (r & 0x3) | 0x8 : r];
                        }
                    }
                }
                return uuid.join('');
            },
            fast: function () {
                var chars = this.CHARS,
                    uuid = new Array(36),
                    rnd = 0,
                    r;
                for (var i = 0; i < 36; i++) {
                    if (i == 8 || i == 13 || i == 18 || i == 23) {
                        uuid[i] = '-';
                    } else if (i == 14) {
                        uuid[i] = '4';
                    } else {
                        if (rnd <= 0x02) rnd = 0x2000000 + (Math.random() * 0x1000000) | 0;
                        r = rnd & 0xf;
                        rnd = rnd >> 4;
                        uuid[i] = chars[(i == 19) ? (r & 0x3) | 0x8 : r];
                    }
                }
                return uuid.join('');
            },
            compact: function () {
                return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
                    var r = Math.random() * 16 | 0,
                        v = c == 'x' ? r : (r & 0x3 | 0x8);
                    return v.toString(16);
                });
            }
        },
        bridge: {
            os: 'unknown',
            support: new Array(),
            insupport: false,
            callevents: new Array(),
            lastcallid: 0,
            locked: false,
            timeHander: null,
            prepare: function (osStr) {
                this.support.push('ios');
                this.support.push('android');
                this.support.push('windowsphone');
                this.support.push('windows8');
                this.support.push('pc');
                this.insupport = false;
                for (var i = 0; i <= this.support.length; i++) {
                    if (osStr == this.support[i]) {
                        this.insupport = true;
                        this.os = osStr;
                        break;
                    }
                }
                ;
                if (!this.insupport) {
                    this.ensureos();
                }
            },
            ensureos: function () {
                var ua = navigator.userAgent;
                if (ua.indexOf('iPad') != -1 || ua.indexOf('iPhone') != -1 || ua.indexOf('iPod') != -1) {
                    this.os = 'ios';
                } else if (ua.indexOf('Android') != -1) {
                    this.os = 'android';
                } else if (ua.indexOf('Windows Phone') != -1) {
                    this.os = 'windowsphone';
                } else if (ua.indexOf('windows8 metro') != -1) {
                    this.os = 'windows8';
                } else {
                    this.os = 'pc';
                }
                ;
                console.log("ensureos_os=" + this.os);
            },
            call: function (obj) {
                if (this.os == null || this.os == '' || this.os == 'unknown') {
                    this.prepare('');
                }
                if (typeof(obj.apiName) != 'string') {
                    console.log('apiName ' + obj.apiName + ' is not a string!');
                    return;
                }
                if (typeof(obj.cb) != 'function') {
                    console.log('callback is not a function!');
                    return;
                }
                obj.cb.uuid = ifs.uuid.
                    def();
                console.log('cb.uuid=' + obj.cb.uuid);
                var callevent = {
                    uuid: obj.cb.uuid,
                    meta: {
                        eid: this.lastcallid,
                        callback: obj.cb,
                        fakeret: obj.fakeret
                    },
                    body: {
                        'apiName': obj.apiName,
                        'handlerId': obj.cb.uuid,
                        'params': obj.params
                    }
                };

                //push to call events
                this.callevents.push(callevent);

                //output to json, cand notify to client
                var jsonstr = JSON.stringify(callevent.body);
                if (!jsonstr) {
                    console.log('cannot convert to json');
                    return;
                }
                ;
                console.log('call:01' + this.os + "\t" + jsonstr);
                if (this.os == 'ios') {
                    var url = 'fishboneMobile://client/' + jsonstr;
                    console.log('ios location:' + url);
                    document.location = url;
                } else if (this.os == 'android') {
                    console.log('android str:' + jsonstr);
                    window.iydbridge.getjscall(jsonstr);
                } else if (this.os == 'windowsphone') {
                    window.external.notify(jsonstr)
                } else if (this.os == 'windows8') {
                    window.external.notify(jsonstr)
                }
                ;
                {
                    this.locked = false;
                    var prompt = 'fake call ' + jsonstr + '  please after 1s...';
                    console.log(prompt);
                    var code = 'ifs.bridge.callreturn(\'' + obj.cb.uuid + '\',\'' + callevent.meta.fakeret + '\');';
                    this.timeHander = setTimeout(code, 2000);
                }
                ;
            },
            callreturn: function (handlerId, retstr) {
                console.log('callreturn:' + handlerId + '\t' + retstr)
                if (this.callevents.length == 0 || this.locked) {
                    return;
                }
                ;
                var callevent = null;
                for (var i = 0; i < this.callevents.length; i++) {
                    if (handlerId == this.callevents[i].uuid) {
                        callevent = this.callevents[i];
                        break;
                    }
                }
                ;
                if (callevent) {
                    callevent.meta.callback(retstr);
                } else {
                    //alert('请拍照反馈:callevent is null, handlerId:=' + handlerId + '\t' + retstr);
                }
                ;
            },
            wait: function () {
                clearTimeout(this.timeHander);
                this.locked = true;
            },
            accepted: function () {
                clearTimeout(this.timeHander);
                this.locked = true;
            },
            ready: function () {
                this.locked = false;
            }
        }
    };
    window.ifs = window.iydf = iydfunctions;
})();

;

function link(_href) {
    var event = {
        apiName: 'link_to',
        params: {
            href: _href,
            target: "blank"
        },
        cb: function (str) {
            //if (str == "fail"||ifs.bridge.os="pc") {
            //	window.location.href = _href;
            //}
        },
        fakeret: "fail"
    };
    ifs.bridge.call(event);
};
var cfg = {
    server: 'http://s.iyd.cn',
//	server: 'http://localhost:8080',
    bill_server: 'http://bilapp.iyd.cn/billing/services',
    commparams: ''
};

var button_lock_seconds = 1 * 1000;
var button_locked_seconds = 0;
var button_text = "";
var button_lock_locked = false;

function buttonclick(obj, info) {
    if (typeof(obj) == 'string') {
        obj = $('#' + obj);
    }
    if (button_lock_locked) {
        alert('请不要重复点击');
        return false;
    }
    ;
    button_locked_seconds = 0;
    var infoObj = null;
    if (info) {
        infoObj = $(info, obj);
    } else {
        infoObj = obj;
    }
    button_text = $(infoObj).text();
    button_lock_locked = true;
    $(obj).addClass('disabled');
    var erroHander = setInterval(function () {
        if (button_locked_seconds < button_lock_seconds) {
            button_locked_seconds += 1000;
            $(infoObj).text(button_text + "(" + (button_lock_seconds - button_locked_seconds) / 1000 + ")")
        } else {
            $(infoObj).text(button_text);
            button_lock_locked = false;
            $(obj).removeClass('disabled');
            clearInterval(erroHander);
        }
    }, 1000);
    return true;
}


var moveed = false;
function bindTouch(select) {
    moveed = false;
    $(select).live("touchstart", function () {
        $(this).addClass('active');
    });
    $(select).live("touchmove", function () {
        moveed = true;
    });
    $(select).live("touchend", function () {
        $(this).removeClass('active');
    });
}
function bindTouch2(select,classname) {
    moveed = false;
    $(select).bind("touchstart", function (e) {
        moveed = false;
       // $(this).addClass(classname);
    });
    $(select).bind("touchmove", function (e) {
        moveed = true;
    });
    $(select).bind("touchend", function (e) {
        e.stopPropagation();
         if(!moveed)
         {
             $(this).addClass(classname);
             setTimeout(function(){
                 $(select).removeClass(classname);
             },100);
         }
    });

}
function bindTouchtest(select,classname) {
    moveed = false;
    $(select).unbind("touchstart");
    $(select).unbind("touchmove");
    $(select).unbind("touchend");
    $(select).bind("touchstart", function (e) {
        e.stopPropagation();
        moveed = false;
           var obj = $(this);
               setTimeout(function(){
                if(moveed == false)
                {
                    $(select).removeClass(classname);
                    obj.addClass(classname);}
            },200);
    });
    $(select).bind("touchmove", function (e) {
        moveed = true;
        $(select).removeClass(classname);
    });
    $(select).bind("touchend", function (e) {
        e.stopPropagation();
        $(select).removeClass(classname);
        if(!moveed)
        {
            moveed = true;
            $(this).addClass(classname);
            setTimeout(function(){
                $(select).removeClass(classname);
            },200);
        }
    });
}
function loadResource(source){
    source = ifs.base64.utf8to16(ifs.base64.decode(source));
    try {
        source = JSON.parse(source) ;
        for(var i =0;i<source.length;i++){
            var type = source[i].type;
            var url = source[i].url;
            var id=  source[i].id;
            var tag = document.getElementById(id);
            var head = document.getElementsByTagName('head').item(0);
            if(type == "text/css"&&url!=null&&url.indexOf("theme.css")>=0){
                var node = document.createElement('link');
                node.href =url;// "http://s.iyd.cn/mobile/static/css/theme/themefenhong.css";//
                node.rel = 'stylesheet';
                node.type = 'text/css';
                node.onload = function(){
                    if (tag)head.removeChild(tag);
                    node.id = id;
                };
                head.appendChild(node);
            }else if(type == "text/javascript" &&url!=null){
                if (tag)head.removeChild(tag);
                var node = document.createElement('script');
                node.src = url;
                node.type = 'text/javascript';
                node.id = id;
                head.appendChild(node);
            }
        }
    } catch (err) {
        console.log('json 解析失败' + err + '  ' +source);
    }
}

function load_theme_css(){
    var event ={
        apiName: 'native_call', //命令的命名
        handlerId: "0123abc",//当前调用的id，需要返回值的时候，用于区分返回值的用途。具体调用的过程中会被重置
        params: {
            appFunc: "load_theme_css"//方法名，章节是否存在
        },
        cb: function(str) {//回调处理函数
            loadResource(str);
        },
        fakeret: "fail"//如果客户端没有处理，系统将在1秒后自动返回这段字符做为回调函数的str参数
    };
    ifs.bridge.call(event);
}
function loadTheme(){
    window.onload = function(){
        load_theme_css();
    }
}
function showWebWait(msg){
     if($("#loadding_bg").length<=0)
        $("body").append('<div id="loadding_bg"></div><div id="overlayloading"><div class="overlayloading_c"><div class="div-img loading-img"></div><span>'+msg+'</span></div><div class="overlayloading_b"></div></div>');
    else
    {
        $("#overlayloading span").text(msg);
        $("#overlayloading").show();
        $("#loadding_bg").show();
        $("#overlayloading .div-img").show();
    }
}
function cancelWebWait(){
    $("#overlayloading").hide();
    $("#loadding_bg").hide();
}
function showWebTip(status){
    if(status == 0)
    {
        $("#overlayloading span").text("网络不可用，请稍候重试");
        $("#overlayloading").show();
        $("#overlayloading .div-img").hide();
    }
    else
    {
        $("#overlayloading span").text("联网错误，请稍候重试");
        $("#overlayloading").show();
        $("#overlayloading .div-img").hide();
    }
    setTimeout(cancelWebWait,1000);
}
function checkOS(ostr){
   ifs.bridge.prepare(ostr);
}
checkOS('${os}');

$(".imgloading").bind("error", function () {
    $(this).css("visibility", "hidden");
});



var base64encodechars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
var base64decodechars = new Array(-1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, 62, -1, -1, -1, 63,
52, 53, 54, 55, 56, 57, 58, 59, 60, 61, -1, -1, -1, -1, -1, -1, -1, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14,
15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, -1, -1, -1, -1, -1, -1, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40,
41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, -1, -1, -1, -1, -1);

function base64encode(str) {
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

function base64decode(str) {
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

function utf16to8(str) {
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

function utf8to16(str) {
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
