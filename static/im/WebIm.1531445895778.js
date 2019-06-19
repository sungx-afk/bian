/**
 * Created by yuanwb on 2016/4/12.
 */
//给开源库对象Long添加拷贝方法
dcodeIO.Long.prototype.copy = function (old) {
    if (!dcodeIO.Long.isLong(old))
        old = dcodeIO.Long.fromValue(old);
    this.low = old.low;
    this.high = old.high;
    this.unsigned = old.unsigned;
}
var webImDebug=false;
if (!Function.prototype.bind) {

    Function.prototype.bind = function(obj) {
        var slice = [].slice, args = slice.call(arguments, 1), self = this, nop = function() {
        }, bound = function() {
            return self.apply(this instanceof nop ? this : (obj || {}),
                args.concat(slice.call(arguments)));
        };

        nop.prototype = self.prototype;

        bound.prototype = new nop();

        return bound;
    };
}
var webIm = new WebIm();

//webIm处理对象
function WebIm() {

    //薯条底层通信对象，负责长连接，自动重连，消息发送，超时等
    this.vitSdk = new VitSDK();

    //联系人管理对象，负责处理联系人的相关对象和操作
    this.contactMgr = new ContactManager();

    //聊天对象管理对象，负责管理与聊天有关的其他相关对象
    //人，群组，部门，应用组，应用
    this.chatObjMgr = new ChatObjectManager();
    // this.pinyin = new Pinyin();
    // // var test = this.pinyin.getFullChars("行");
    // console.log("ccccccccccccc" , this.pinyin.getFullChars("行不行"), this.pinyin.getCamelChars("行不行"));
    /*
    初始化参数
     {
     userUuid  用户id
     userName  用户名字
     token     登录token
     comp:[{uuid,name,ico}] 多公司信息
     insertContact 联系人位置更新（初始化，有新消息）
     updateChatObj 暂时不用了
     recvNewMessage 接收新消息，如果是当前联系人则更新
     chatUnreadedNumber 更新聊天未读数量
     contactUnreadedNumber 更新联系人未读数量
     updateRecverUnReadNum 更新消息未读数量
     updateContact 更新联系人
     */
    this.options = null;

    this.ico = {
        group: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADwAAAA8CAYAAAA6/NlyAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAyhpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuNS1jMDIxIDc5LjE1NTc3MiwgMjAxNC8wMS8xMy0xOTo0NDowMCAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RSZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENDIDIwMTQgKE1hY2ludG9zaCkiIHhtcE1NOkluc3RhbmNlSUQ9InhtcC5paWQ6RUJGRDUwODcwNjBDMTFFNkE5NzVGMTE1NjMwRkNGRkIiIHhtcE1NOkRvY3VtZW50SUQ9InhtcC5kaWQ6RUJGRDUwODgwNjBDMTFFNkE5NzVGMTE1NjMwRkNGRkIiPiA8eG1wTU06RGVyaXZlZEZyb20gc3RSZWY6aW5zdGFuY2VJRD0ieG1wLmlpZDpFQkZENTA4NTA2MEMxMUU2QTk3NUYxMTU2MzBGQ0ZGQiIgc3RSZWY6ZG9jdW1lbnRJRD0ieG1wLmRpZDpFQkZENTA4NjA2MEMxMUU2QTk3NUYxMTU2MzBGQ0ZGQiIvPiA8L3JkZjpEZXNjcmlwdGlvbj4gPC9yZGY6UkRGPiA8L3g6eG1wbWV0YT4gPD94cGFja2V0IGVuZD0iciI/PrTpsgUAAAXjSURBVHja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',
        dept: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADwAAAA8CAYAAAA6/NlyAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAyhpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuNS1jMDIxIDc5LjE1NTc3MiwgMjAxNC8wMS8xMy0xOTo0NDowMCAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RSZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENDIDIwMTQgKE1hY2ludG9zaCkiIHhtcE1NOkluc3RhbmNlSUQ9InhtcC5paWQ6RUJGRDUwODMwNjBDMTFFNkE5NzVGMTE1NjMwRkNGRkIiIHhtcE1NOkRvY3VtZW50SUQ9InhtcC5kaWQ6RUJGRDUwODQwNjBDMTFFNkE5NzVGMTE1NjMwRkNGRkIiPiA8eG1wTU06RGVyaXZlZEZyb20gc3RSZWY6aW5zdGFuY2VJRD0ieG1wLmlpZDpFQkZENTA4MTA2MEMxMUU2QTk3NUYxMTU2MzBGQ0ZGQiIgc3RSZWY6ZG9jdW1lbnRJRD0ieG1wLmRpZDpFQkZENTA4MjA2MEMxMUU2QTk3NUYxMTU2MzBGQ0ZGQiIvPiA8L3JkZjpEZXNjcmlwdGlvbj4gPC9yZGY6UkRGPiA8L3g6eG1wbWV0YT4gPD94cGFja2V0IGVuZD0iciI/PlvdVAAAAAbcSURBVHja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',
        notify: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACYAAAAmCAYAAACoPemuAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAyhpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuNS1jMDIxIDc5LjE1NTc3MiwgMjAxNC8wMS8xMy0xOTo0NDowMCAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wTU09Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9tbS8iIHhtbG5zOnN0UmVmPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvc1R5cGUvUmVzb3VyY2VSZWYjIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtcE1NOkRvY3VtZW50SUQ9InhtcC5kaWQ6RTA0NTc0N0ZGRTM1MTFFNUEwOThCQjc3MTg4RDk1MzkiIHhtcE1NOkluc3RhbmNlSUQ9InhtcC5paWQ6RTA0NTc0N0VGRTM1MTFFNUEwOThCQjc3MTg4RDk1MzkiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENDIDIwMTQgKE1hY2ludG9zaCkiPiA8eG1wTU06RGVyaXZlZEZyb20gc3RSZWY6aW5zdGFuY2VJRD0ieG1wLmlpZDo2NzQzMjg3NjcxNUMxMUU1QTk4QkQ2NzFFODM3Q0E1MSIgc3RSZWY6ZG9jdW1lbnRJRD0ieG1wLmRpZDo2NzQzMjg3NzcxNUMxMUU1QTk4QkQ2NzFFODM3Q0E1MSIvPiA8L3JkZjpEZXNjcmlwdGlvbj4gPC9yZGY6UkRGPiA8L3g6eG1wbWV0YT4gPD94cGFja2V0IGVuZD0iciI/Ps5jgDcAAAVPSURBVHjaxJh9SF1lHMe/5+Xe69u06VIzW01drEJnjrTGbLRY/REFga1W0daKEVGzaPsjKFqrP4ItRvXHIktoVKwRGEREEFs2pzRTNsdigZub6UydOvP1eu85p+9zznN9gbznnuvVPfBF773nPr/P/T2/l+d5lOCPy+Fx6FQZ9QBVShVSOVQaZVCj1ADVTp2mjlOtVNiLEcUDWDb1HPUUtc7jj2mhvqW+pPoSBRagXqWqqXwsbHRRH1GfUMFoD6ouE5VQx6j9CYCCnGO/nHNtvGBVMj7WI/FjvYSr8gq2Q8ZEJhZvZEobO2IF20J9FsMyJ2Ko0tYWN7BiqobSsHRDkzaL5wMT2fc5lY6lH+nSduD/wF6hyuOa1jJZPkdYXidEBYoXrlwyzAG7kdod13TmpCCDtuYdqPnPyNcRYDYCc8rLbLslyzTYdirXo5tsLylJN0OvqIN2+1tQcx91YMRnwouBbChpq/ncqPOe+8iVLDaYn3o2OgONGZOON4TEktGYmvsYfJUnoPizYPb9zFVUZpaSz6mZ98G34QS0VS/zO+OxwgkWvy4bcXHU+PFlQEleSZuq85rG1ZXbod36PIzOwzDadnEp34WSfueMNwVbz/cI+5ZDL2YX0lJgtLPo68vcwARLqS53CfNHLJdLK6ym4b1A6Bpt0qiqw5q4gvAfW2FeqSNBiIYDEkh8ngzlhntgDZ2C2f4xwuEx6HfXwLzWDGuggc8mR+3fgimyhYkeS4wVc7AJRus2Gk2yv2pN9hJ6mB5IdTJSBLnic5adXtHXfQPr6jGET++E2fkFzJyHod+xD6GTm+UPiJq9ZSLGCmKKdXrLGrsAa7yDfzsIws2BljrXgFhqlXCTXQg3V0HNeQRa0Rs2h3HhIJRlJVAyGDmGa6YWqHKfFcMGSRj1z0iJ0hzUAL31G8Ln34Z620tAch6s4TP08t9QMtm/LVewbFXuPBc+BKiiz9rnpsDqP87f44eSUmBnpTXZwyTKlyUl6khT5XZ4oVRcasbb1FUnOWaH8aws9bp/H4tU2/jbcCqMyzV2topltInC41BWbGJ1mWJcXrTLhZJ0E8zen6KHgTNGhcd6Yyv0sr1MKzQ3/kJDDPo+538mhrLifuhr9sG89CkwwSXMWEuwW2ANnuQzfjdrPcJj/DmocAXzZUFJLXQ8IoyLmJnokomgO14SlZ/Q4jlfeR298wOL6of2R1rh67BG2uwkgOYKdlGXJ5itUeMn2M/2ci/Ujc2injudjB3A6Poaxl/vOZ8X7rKXyji/l0k3iFDL0/ROE+PuX6irXoSa9wRCjZtl4LuCtQiw+qgVj8XS6KyF2f+L4ym719Ar6aXQ7voAStYGhE9V0UtFXK5iZxpjhOXiV9u7alE1W9JBGH++6bzn3pIES70AOytVMm/9YsZZwdY56NYQ28tgA/Syw/BXNsIUAR7snbObUvMeZ7V/H8bZ12B0HCJUTJXJ5lHl+e4r1xqlJTntKCI2dtEJQk0PwRyot3cSDrksDXzGHGhEqKESxqVDTuuKbRMpWIKRA68oF23e92SQG0EF2uo9LAuXYXYfkSVDZrKQ6o91tn/kebMvUqr7qQNSHs85fttLdhKI7GS9mvaa3Q08nWsORK4QZl8RBGQiVOD6jN+pjZGrg9mHEfHGC9TwdYAalraD850rz1E7E9M/Yx6GtHnO7SR+VD5oLgGUKW0djfXuopZ6khpcRKhBaaPW623Pd/I80LgIUGLOTdJGXPdjorY9SO2huhMA1C3nEnOeSeRV5zZ51VnmEUjcwR5J9FWn2+VwkYSONMJRaXxBl8P/CTAAu83RA14G6/AAAAAASUVORK5CYII=',
    }

    var test = {
        file:'http://test-file01.yugusoft.com',
        app01:'http://test-app01.yugusoft.com',
        app02:'http://test-imapi.yugusoft.com',
        im:'test-im.yugusoft.com:17001'
    };
    var formal = {
        file:'http://file01.yugusoft.com',
        app01:'http://app01.yugusoft.com',
        app02:'http://imapi.yugusoft.com',
        im:'im.yugusoft.com:17001'
    };



    if(window.location.protocol == 'https:'){
        test = {
            file:'https://test-file01.yugusoft.com',
            app01:'https://test-app01.yugusoft.com',
            app02:'https://test-imapi.yugusoft.com',
            im:'test-im.yugusoft.com:17002'
        };
        formal = {
            file:'https://file01.yugusoft.com',
            app01:'https://app01.yugusoft.com',
            app02:'https://imapi.yugusoft.com',
            im:'im.yugusoft.com:17002'
        };
    }







    if(window.location.href.indexOf('test') >= 0 || window.location.href.indexOf('localhost') >= 0){
        this.msgUrl = test.app02+"/fmsg/";
        this.userUrl = test.app01+"/ftask/proxy/";
        this.ftaskUrl = test.app01+"/ftask/";
        this.vitUrl = test.im;
        this.friendUrl = test.app02+"/friend/";
    }else{
        this.msgUrl = formal.app02+"/fmsg/";
        this.userUrl = formal.app01+"/ftask/proxy/";
        this.ftaskUrl = formal.app01+"/ftask/";
        this.vitUrl = formal.im;
        this.friendUrl = formal.app02+"/friend/";
    }
    this.universalNotify = null;

    this.initSync = {reqNum:0, contactData: null};
    this.friendContact = "BnYppfS5CHfk4oW6Pz2SW1";
    this.customerServiceContact = "17QGLXAb2i9r2b3MkBPBoq";

    this.closeNetWork = () => {
        this.vitSdk.clear();
    }

    //universalNotify 通知
}

//联系人管理类
function ContactManager() {
    /*
        联系人map key = contactId+session_type
     */
    this.contactMap = new HashMap();

    /*
        未读联系人记录 key = {id:contact.contactId, sstp:contact.sessionType }
        同步联系人的时候需要有未读的联系人。以便同步未读变化
     */
    this.unReadMap = new HashMap();

    /*
        联系人设置暂时只有免打扰 key=contactId+session_type value=
     */
    this.contactSetting = new HashMap();
    // this.contactSettingVersion = dcodeIO.Long.fromNumber(0);
    // this.isInitSetting = false;
    //消息未读数量
    this.unReadNumber = 0;
    //联系人最大版本号
    this.maxVersion = dcodeIO.Long.fromNumber(0);
    // this.userUuid = "QxSKnEd7AGjr7j68SGVfbQ";
    //当前焦点联系人
    this.curContact = null;

    /*
        function
        syncContactSetting  同步联系人设置
        syncContact         同步联系人以及未读
        updateContactList　　更新联系人（处理syncContact　返回的数据）
        updateContactUnreaded　更新联系人未读状态
        readedReq　设置已读到服务器
        createContact　创建联系人
        getContact　　　获取联系人
        selected　　　　选中联系人
        readedNotify　　已读通知
        setReadNum　　　设置已读

     */
}

// 联系人类
function Contact() {
    this.sessionType = 0;
    this.contactId = "";

    this.senderId = "";
    this.createTime = 0;
    this.messageMaxVer = dcodeIO.Long.fromNumber(0);
    this.updateTime = 0
    this.chatObj = null;
    this.sessionSetting = "";

    this.curMsgVerMax = dcodeIO.Long.fromNumber(0);
    this.curMsgVerMin = dcodeIO.Long.fromNumber(0);

    this.unReadedNumber = 0;
    this.readedVersion = dcodeIO.Long.fromNumber(0);

    this.contactVersion = dcodeIO.Long.fromNumber(0);

    this.messageSummary = "";

    this.messageList = new Array();
}

// 消息类
function ChatMessage() {
    this.messageId = "";
    this.messageOldId = "";
    this.senderId = "";
    this.messageType = "";
    this.messageContent = "";
    this.messageReaded = false;
    this.createTime = 0;
    this.version = dcodeIO.Long.fromNumber(0);
    this.unReadedNumber = 0;
    this.isChat = false;
    this.chatObj = null;
}


//同步联系人设置
ContactManager.prototype.syncContactSetting = function (callback) {
    var mythis = this;
    $.ajax({
        url:webIm.msgUrl + "ssetting/get",
        async:true,
        type:"POST",
        data:{
            uuid:webIm.options.userUuid,
            version: 0,
            devtp:1
        },
        success:function(result) {
            if(result.success) {
                mythis.contactSetting.clear();
                for(var i=0; i<result.result.length; i++){
                    // var contact = mythis.getContact(result.result[i].contact_id, result.result[i].session_type);
                    // if(contactn && contact.sessionSetting != result.result[i].pc)
                    //     contact.sessionSetting = result.result[i].pc;
                    // var key =  result.result[i].contact_id + result.result[i].session_type.toString();
                    // mythis.contactSetting.set(key, result.result[i].pc);
                    mythis.updateContactSetting(result.result[i].contact_id, result.result[i].session_type, result.result[i].pc);
                }
            }
            if(callback)
                callback();
        },
        error:function(xhr, ajaxOptions,thrownError) {
            if(callback)
                callback();
            // alert("reqUser error");
        }
    });
}

ContactManager.prototype.updateContactSetting = function (contactId, type, setting) {
    // var key = contactId + type;
    // this.contactSetting.set(key, setting);
    var contact = this.getContact(contactId, type);
    if(contact && contact.sessionSetting != setting) {
        contact.sessionSetting = setting;
        webIm.options.updateContact(contact);
    }
    var key =  contactId + type;
    this.contactSetting.set(key, setting);
}

ContactManager.prototype.setReadNum = function (uuid, type) {
    var contact = this.getContact(uuid, type);
    if(contact == null)
        return;
    if(contact.unReadedNumber> 0){
        this.unReadMap.remove(JSON.stringify({id:contact.contactId, sstp:contact.sessionType }))
        this.unReadNumber  = this.unReadNumber - contact.unReadedNumber;
        contact.unReadedNumber = 0;
        contact.readedReq();
        contact.readedVersion.copy(contact.curMsgVerMax);
        webIm.options.chatUnreadedNumber(this.unReadNumber);
    }
}

ContactManager.prototype.readedNotify = function(notify) {
    this.updateContactUnreaded(notify["contact_id"], notify["session_type"], 0);
}
//这个要好好想想
ContactManager.prototype.selected = function (type, uuid,funCb){
    var contact = this.getContact(uuid, type);
    if(contact == null)
    {
        funCb([]);
        return;
    }

    if(type == 40001 && uuid == webIm.friendContact){
        webIm.friendMsgGet(funCb);
        this.curContact = contact;
        return;
    }

    if(this.curContact == contact) {
        funCb([]);
        return;
    }
    this.curContact = contact;

    if(contact.messageMaxVer.compare(dcodeIO.Long.fromValue(0))!=0 && contact.curMsgVerMax.compare(contact.messageMaxVer)< 0)
    {
        contact.getNextMessage(true, funCb);
        return;
    }
    funCb( contact.messageList);
    
}


ContactManager.prototype.getContact = function (contactId, sessionType) {
    var key =  contactId + sessionType.toString()
    var contact = null;
    if (this.contactMap.has(key)) {
        contact = this.contactMap.get(key);
    }
    // this.contactList.unshift(contact);
    // this.contactMap.set(key, contact);
    return contact;
}



ContactManager.prototype.createContact = function (contactId, sessionType) {
    var key =  contactId + sessionType.toString()
    var contact = null;
    if (this.contactMap.has(key)) {
        contact = this.contactMap.get(key);
    }
    else
    {
        contact = new Contact();
        if(this.contactSetting.has(key))
            contact.sessionSetting = this.contactSetting.get(key);
        contact.contactId = contactId;
        contact.sessionType = sessionType;
        this.contactMap.set(key, contact);
    }
    return contact;
}

ContactManager.prototype.updateContactUnreaded = function (contact_id, session_type, un_readed_number) {
    var contact = this.getContact(contact_id, session_type)
    if(contact)
    {

        if( un_readed_number <= 0)
            this.unReadMap.remove(JSON.stringify({id:contact.contactId, sstp:contact.sessionType }))
        this.unReadNumber  = this.unReadNumber - contact.unReadedNumber +  un_readed_number;

        contact.unReadedNumber = un_readed_number;
        webIm.options.chatUnreadedNumber(this.unReadNumber);
        webIm.options.contactUnreadedNumber(contact);
        //更新ui
    }
}
ContactManager.prototype.syncContact = function (callback) {
    var mythis = this;
    var data = {"uuid":webIm.options.userUuid,
        "version":this.maxVersion.toString(),
        // "sstp":webIm.vitSdk._protoMsg.chips_c.IMSessionType.IM_SESSION_NONE,
        "devtp":1
    }
    var unReadDataArray = new Array();
    this.unReadMap.forEach(function(value, key) {
        try{
            unReadDataArray.push(JSON.parse(key));
        }
        catch(e)
        {
            console.log("error ", e);
        }
    });
    if(unReadDataArray.length > 0)
        data["data"] = JSON.stringify({"users": unReadDataArray});
    $.ajax({
        url:webIm.msgUrl+"comm/contact_v2",
        async:true,
        type:"POST",
        data:data,
        success:function(result) {
            if (result.success == true) {
                console.log("syncContact success");
                if(result.result)
                    callback(result.result);
            } else {
                console.log("syncContact fail");
                //alert("syncContact fail");
            }
        },
        error:function(xhr, ajaxOptions,thrownError) {
            console.log("syncContact error");
            //alert("syncContact error");
        }
    });
}


ContactManager.prototype.updateContactList =  function(result) {
    var mythis = this;
    var contactList = new Array();
    var chatReq = new ChatObjectReq(
        function () {
            if(contactList.length > 0){
                // contactList = contactList.filter(function(item, index, array){
                //     return (item.chatObj.name);
                // });
                contactList = contactList.sort(function (a, b) {
                     return a.updateTime - b.updateTime;
                });
                webIm.options.insertContact(contactList);
            }
            contactList = null;
        }
    );
    var contactId = "";
    var msgsMap = new HashMap();
    for(var j = 0; j<result.last_msgs.length; j++){
        switch(result.last_msgs[j].session_type)
        {
            case webIm.vitSdk._protoMsg.chips_c.IMSessionType.IM_SESSION_PRIVATE_NORMAL:
                contactId = result.last_msgs[j].chat_object_id;
                break;
            case webIm.vitSdk._protoMsg.chips_c.IMSessionType.IM_SESSION_GROUP_NORMAL:
            case webIm.vitSdk._protoMsg.chips_c.IMSessionType.IM_SESSION_GROUP_DEPT:
                contactId = result.last_msgs[j].group_id;
                break;
            case webIm.vitSdk._protoMsg.chips_c.IMSessionType.IM_SESSION_APP_NORMAL:
            case webIm.vitSdk._protoMsg.chips_c.IMSessionType.IM_SESSION_OA_NORMAL:
                contactId = result.last_msgs[j].contact_id;
                break;
            default:
                break;
        }
        if(contactId)
            msgsMap.set(contactId+ result.last_msgs[j].session_type, result.last_msgs[j].version);
    }
    $.each(result.contacts, function (i, val) {
        var contact = mythis.createContact(val.contact_id, val.session_type);
        var un_readed_number = parseInt(val.un_readed_number);
        if(contact.unReadedNumber >  0 && un_readed_number <= 0)
            mythis.unReadMap.remove(JSON.stringify({id:contact.contactId, sstp:contact.sessionType }));
        if(un_readed_number > 0 && contact.unReadedNumber<=0)
            mythis.unReadMap.set(JSON.stringify({id:contact.contactId, sstp:contact.sessionType }), true);

        if(contact.unReadedNumber >  0)
            mythis.unReadNumber = mythis.unReadNumber - contact.unReadedNumber;
        if(un_readed_number > 0)
        {
            mythis.unReadNumber = mythis.unReadNumber + un_readed_number;
        }
        if(mythis.unReadNumber < 0)
            mythis.unReadNumber = 0;
        contact.unReadedNumber = un_readed_number;
        contact.sessionType = val.session_type;
        contact.contactId = val.contact_id;

        contact.senderId = val.sender_id;

        contact.createTime = parseInt(val.create_time);
        contact.updateTime = parseInt(val.update_time);
        contact.contactVersion = dcodeIO.Long.fromValue(val["version"]);

        if (contact.contactVersion.greaterThan(mythis.maxVersion)) {
            mythis.maxVersion.copy(contact.contactVersion);
        }

        contact.chatObj = webIm.chatObjMgr.getSessionChatObject(contact.sessionType, val.contact_id, chatReq);
        var messageVersion = msgsMap.get(val.contact_id+val.session_type);
        if(messageVersion)
            contact.messageMaxVer.copy(dcodeIO.Long.fromValue(messageVersion));
        else
            contact.messageMaxVer.copy(dcodeIO.Long.fromValue(0));
        if(contact.messageMaxVer.compare(dcodeIO.Long.fromValue(0)) !=0 && contact.curMsgVerMax.compare(contact.messageMaxVer)< 0)
        {
            if(contact == mythis.curContact && !(contact.contactId == webIm.friendContact && contact.sessionType == 40001)){
                contact.getNextMessage();
            }
        }

        contactList.push(contact);
    });
    for(var i = 0; i<result.readed.length; i++){
        mythis.updateContactUnreaded(result.readed[i].contact_id, result.readed[i].session_type, result.readed[i].un_readed_number);
    }
    webIm.options.chatUnreadedNumber(mythis.unReadNumber);
    msgsMap = null;
    webIm.chatObjMgr.reqChatObj(chatReq);
    chatReq = null;
}

Contact.prototype.readedReq = function () {
    var req = new webIm.vitSdk._protoMsg.chips_c.IMMessageReadedReq();
    req.set_id(1);
    req.set_contact_id(this.contactId);
    req.set_version(this.messageMaxVer.toString());
    req.set_session_type(this.sessionType);
    var mythis = this;
    // var reqIds = ids.concat();
    webIm.vitSdk.sendMsg(req,
        webIm.vitSdk._protoMsg.chips_c.RequestType.EIMMessageReadedReq,
        10000,
        function (type, resp) {
            console.log(type,resp);
        });
}
//获取当前联系人消息
Contact.prototype.getPrevMessage = function (funCb) {

    var mythis = this;
    var leftver = dcodeIO.Long.fromValue(0);
    var limit = 30;
    var rightver = dcodeIO.Long.fromValue(0);
    var mode = true;
    if(mythis.curMsgVerMax.toNumber() == 0)
    {
        // leftver = 0;
        rightver.copy(mythis.messageMaxVer);
        rightver = rightver.add(1);
    }
    else
    {
        // leftver = 0;
        rightver.copy(mythis.curMsgVerMin);

    }
    
    if(leftver.compare(rightver) > 0 ||  rightver.toNumber() == 0) {
        funCb([]);
        return;
    }

    var data = {
        "uuid" : webIm.options.userUuid,
        "left_version" : leftver.toString(),
        "right_version" : rightver.toString(),
        "sstp": mythis.sessionType,
        "limit" : limit,
        "devtp" : 0
    };
    var arg = "";
    switch(mythis.sessionType)
    {
        case webIm.vitSdk._protoMsg.chips_c.IMSessionType.IM_SESSION_PRIVATE_NORMAL:
            data["chat_obj_uuid"] = mythis.contactId;
            arg = "private/get_lower_ver_msg";
            break;
        case webIm.vitSdk._protoMsg.chips_c.IMSessionType.IM_SESSION_GROUP_NORMAL:
        case webIm.vitSdk._protoMsg.chips_c.IMSessionType.IM_SESSION_GROUP_DEPT:
            data["group_id"] = mythis.contactId;
            arg = "group/get_lower_ver_msg";
            break;
        case webIm.vitSdk._protoMsg.chips_c.IMSessionType.IM_SESSION_OA_NORMAL:
        case webIm.vitSdk._protoMsg.chips_c.IMSessionType.IM_SESSION_APP_NORMAL:
            data["contact_id"] = mythis.contactId;
            arg = "comm/get_lower_ver_msg";
            break;
    }
    // data[chat_obj_uuid] = mythis.contactId;
    $.ajax({
        url : webIm.msgUrl + arg,
        async : true,
        type : "POST",
        data : data,
        success : function (result) {
            if (result.success == true) {
                console.log("getPrevMessage success");
                // result.result = result.result.sort(function (a, b) {
                //     return b.version - a.version;
                // });
                var msgs = new Array();
                var hasConv = new Array();
                // var chatObj = null;
                var chatReq = new ChatObjectReq(
                    function () {
                        for(var j = 0; j< hasConv.length; j++)
                        {
                            hasConv[j].convChatMessage(mythis.contactId);
                        }

                        funCb(msgs);
                        
                        hasConv = null;
                        msgs = null;
                    }
                );
                var verMin = dcodeIO.Long.fromValue(0);
                var verMax = dcodeIO.Long.fromValue(0);
                verMin.copy(mythis.curMsgVerMin);
                verMax.copy(mythis.curMsgVerMax);
                $.each(result.result, function (i, val) {
                    var version = dcodeIO.Long.fromValue(val.version);
                    if(version.compare(mythis.curMsgVerMin) >= 0 && version.compare(mythis.curMsgVerMax) <= 0)
                    {
                        return;
                    }
                    var msg = new ChatMessage();
                    msg.createChatMessage(val, chatReq);
                    if(msg.messageType == 10000)
                    {
                        hasConv.push(msg);
                    }
                    if(verMin.toNumber() == 0)
                    {
                        verMin.copy(msg.version);
                        verMax.copy(msg.version);
                    }
                    else if (msg.version.compare(verMax) > 0) {
                        verMax.copy(msg.version);
                    }else if (msg.version.compare(verMin) < 0) {
                        verMin.copy(msg.version);
                    }
                    if(mode)
                        mythis.messageList.push(msg);
                    msgs.push(msg);

                });
                mythis.curMsgVerMin.copy(verMin);
                mythis.curMsgVerMax.copy(verMax);
                // for(var j = 0; j);
                if(!mode)
                {
                    mythis.messageList = msgs.concat(mythis.messageList);
                }


                webIm.chatObjMgr.reqChatObj(chatReq);
                chatReq = null;
            } else {
                funCb([]);
                console.log("getPrevMessage fail");
                // alert("syncBetweenPri fail");
            }
        },
        error : function (xhr, ajaxOptions, thrownError) {
            funCb([]);
            console.log("getPrevMessage error");
            // alert("syncBetweenPri error");
        }
    });
}
Contact.prototype.getNextMessage = function (isSelect, funCb) {
    var mythis = this;
    var leftver = dcodeIO.Long.fromValue(0);
    var rightver = dcodeIO.Long.fromValue(0);
    if(mythis.curMsgVerMax.toNumber() == 0)
    {
        // leftver = 0;
        rightver.copy( mythis.messageMaxVer);
        limit = 30;
    }
    else if( mythis.messageMaxVer.compare(mythis.curMsgVerMax) != 0)
    {
        leftver.copy( mythis.curMsgVerMax);
        rightver.copy( mythis.messageMaxVer);
        limit = rightver - leftver;
    }
    else
    {
        return;
    }
    rightver = rightver.add(1);
    if(leftver > rightver ||  rightver == 0)
        return;
    var arg = "";
    var data = {
        "uuid" : webIm.options.userUuid,
        "left_version" : leftver.toString(),
        "right_version" : rightver.toString(),
        "sstp": mythis.sessionType,
        "limit" : 30,
        "devtp" : 0
    };
    switch(mythis.sessionType)
    {
        case webIm.vitSdk._protoMsg.chips_c.IMSessionType.IM_SESSION_PRIVATE_NORMAL:
            data["chat_obj_uuid"] = mythis.contactId;
            arg = "private/get_lower_ver_msg";
            break;
        case webIm.vitSdk._protoMsg.chips_c.IMSessionType.IM_SESSION_GROUP_NORMAL:
        case webIm.vitSdk._protoMsg.chips_c.IMSessionType.IM_SESSION_GROUP_DEPT:
            data["group_id"] = mythis.contactId;
            arg = "group/get_lower_ver_msg";
            break;
        case webIm.vitSdk._protoMsg.chips_c.IMSessionType.IM_SESSION_OA_NORMAL:
        case webIm.vitSdk._protoMsg.chips_c.IMSessionType.IM_SESSION_APP_NORMAL:
            data["contact_id"] = mythis.contactId;
            arg = "comm/get_lower_ver_msg";
            break;
    }

    $.ajax({
        url : webIm.msgUrl + arg,
        async : true,
        type : "POST",
        data : data,
        success : function (result) {
            if (result.success == true) {
                console.log("getNextMessage success");
                // result.result = result.result.sort(function (a, b) {
                //     return b.version - a.version;
                // });
                var msgs = new Array();
                var hasConv = new Array();
                var chatReq = new ChatObjectReq(
                    function () {
                        // webIm.options.insertContact(contactList);
                        // contactList = null;
                        for(var j = 0; j< hasConv.length; j++)
                        {
                            hasConv[j].convChatMessage(mythis.contactId);
                        }
                        // if(webIm.options.recvNewMessage)
                            
                        if(isSelect){
                            funCb(mythis.messageList);
                        }
                        else {
                            webIm.options.recvNewMessage(mythis, msgs);
                        }
                        msgs = null;
                        hasConv = null;
                    }
                );
                var verMin = dcodeIO.Long.fromValue(0);
                var verMax = dcodeIO.Long.fromValue(0);
                verMin.copy(mythis.curMsgVerMin);
                verMax.copy(mythis.curMsgVerMax);
                $.each(result.result, function (i, val) {
                    var version = dcodeIO.Long.fromValue(val.version);
                    if(version.compare(mythis.curMsgVerMin) >= 0 && version.compare(mythis.curMsgVerMax) <= 0)
                    {
                        return;
                    }

                    var msg = new ChatMessage();
                    msg.createChatMessage(val, chatReq);
                    // webIm.chatObjMgr.getChatObject("user");
                    if(msg.messageType == 10000)
                    {
                        hasConv.push(msg);
                    }

                    if (msg.version.compare(verMax) > 0) {
                        verMax.copy(msg.version);
                    }

                    if (msg.version.compare(verMin) < 0 || verMin.toNumber() == 0) {
                        verMin.copy(msg.version);
                    }
                    msgs.push(msg);
                    // contact.messageList.unshift(msg)
                });
                mythis.curMsgVerMax.copy(verMax);
                mythis.curMsgVerMin.copy(verMin);
                mythis.messageList = msgs.concat(mythis.messageList);
                webIm.chatObjMgr.reqChatObj(chatReq);
                chatReq = null;


            } else {
                console.log("getNextMessage fail");
                // alert("syncBetweenPri fail");
            }
        },
        error : function (xhr, ajaxOptions, thrownError) {
            console.log("getNextMessage error");
            // alert("syncBetweenPri error");
        }
    });
    console.log(webIm.msgUrl + arg, data);
}

Contact.prototype.recverReadNotify = function (notify) {
    if(this.curMsgVerMax > 0)
    {
        var mythis = this;
        $.ajax({
            url:webIm.msgUrl+"read/get_num",
            async:true,
            type:"POST",
            data:{
                chat_obj_uuid: this.contactId,
                sstp:this.sessionType,
                uuid:webIm.options.userUuid
            },
            success:function(result) {
                if(result.success) {
                    if(result.result)
                    {
                        var readed = new Array();
                        // var msgList = new Array();
                        for(var i=0; i<result.result.length; i++){
                            if(parseInt(result.result[i].from) < mythis.curMsgVerMin ||  parseInt(result.result[i].to) > mythis.curMsgVerMax){}
                            else
                                readed.push(result.result[i]);
                        }
                        for(var i = 0; i < mythis.messageList.length; i++)
                        {
                            for(var j=0; j<readed.length; j++){
                                if(dcodeIO.Long.fromValue(readed[j]["from"]).greaterThanOrEqual(mythis.messageList[i].version)
                                    &&  dcodeIO.Long.fromValue(readed[j]["to"]).lessThanOrEqual(mythis.messageList[i].version)
                                    && mythis.messageList[i].unReadedNumber != readed[j].num){
                                    mythis.messageList[i].unReadedNumber = readed[j].num;
                                    if(mythis == webIm.contactMgr.curContact)
                                        webIm.options.updateRecverUnReadNum(mythis.messageList[i]);
                                    //update
                                    break;
                                }
                            }
                            // if(contact.messageList[i].unReadedNumber != 0;)
                            // {
                            //
                            // }
                        }
                    }
                }
            },
            error:function(xhr, ajaxOptions,thrownError) {
                // alert("reqUser error");
            }
        });
    }

};
ChatMessage.prototype.convChatMessage = function (contact_id) {
    var content = null;
    try{
        content = JSON.parse(this.messageContent);
    }
    catch (e)
    {
        console.log("error ", e);
    }
    // console.log("aaaaaa",users, content["group"]);
    this.messageContent = "";
    var operator = "";
    var users = "";
    if(content["operator"])
    {
        if(content["operator"] == webIm.options.userUuid){
            operator = "您"
        }
        else{
            var user = webIm.chatObjMgr.getUserObject(content["operator"]);
            operator = user.name;
        }

    }
    if(content["users"])
    {
        for(var i = 0; i < content["users"].length; i++)
        {
            if(content["users"][i] == webIm.options.userUuid){
                users = users + "您"
            }
            else
            {
                var user = webIm.chatObjMgr.getUserObject(content["users"][i]);
                users = users + user.name;
            }

            if(i < content["users"].length-1)
                users = users +  "、";
        }
    }

    if(content["group"] == "dept_user_rel") {

        if(content["operation"] == "UPDATE") {
            if(content["dst_ids"][0]){
                var dept = webIm.chatObjMgr.getDeptObject(content["dst_ids"][0]);
                this.messageContent = users + "转移到" + (dept.name?dept.name:"别的部门");
            }
        }else if(content["operation"] == "ADD")
        {
            var dept = webIm.chatObjMgr.getDeptObject(contact_id);
            this.messageContent = users + "加入了" + (dept.name?dept.name:"部门");
        }
    }
    else if(content["group"] == "group_user_rel")
    {
        if(content["operation"]== "ADD"){
            this.messageContent = operator + "邀请" + users + "加入了群聊"
        }
        else if(content["operation"]== "DEL"){
            this.messageContent = users + "被" + operator + "移出了群聊"
        }
        else if(content["operation"]== "EXIT"){
            this.messageContent = operator + "退出了群组"
        }
    }
    else if(content["group"] == "group")
    {
        if(content["operation"]== "DEL"){
            this.messageContent = operator + "解散了群组"
        }
    }
    // console.log(this.messageContent);
}

ChatMessage.prototype.convChatMessage_v2 = function (contact_id) {
    var content = null;
    try{
        content = JSON.parse(this.messageContent);
    }
    catch (e)
    {
        console.log("error ", e);
    }
    // console.log("aaaaaa",users, content["group"]);
    this.messageContent = "";
    var operator = "";
    var users = "";
    if(content["operator"])
    {
        if(content["operator"]["id"] == webIm.options.userUuid){
            operator = "您"
        }
        else{
            operator = content["operator"]["name"]
        }

    }
    if(content["users"])
    {
        for(var i = 0; i < content["users"].length; i++)
        {
            if(content["users"][i]["id"] == webIm.options.userUuid){
                users = users + "您"
            }
            else
            {
                users = users + content["users"][i]["name"];
            }

            if(i < content["users"].length-1)
                users = users +  "、";
        }
    }

    if(content["group"] == "dept_user_rel") {

        // if(content["operation"] == "UPDATE") {
        //     if(content["dst_ids"][0]){
        //         var dept = webIm.chatObjMgr.getDeptObject(content["dst_ids"][0]);
        //         this.messageContent = users + "转移到" + (dept.name?dept.name:"别的部门");
        //     }
        // }else if(content["operation"] == "ADD")
        // {
        //     var dept = webIm.chatObjMgr.getDeptObject(contact_id);
        //     this.messageContent = users + "加入了" + (dept.name?dept.name:"部门");
        // }
    }
    else if(content["group"] == "group_user_rel")
    {
        if(content["operation"]== "ADD"){
            this.messageContent = operator + "邀请" + users + "加入了群聊"
        }
        else if(content["operation"]== "DEL"){
            this.messageContent = users + "被" + operator + "移出了群聊"
        }
        else if(content["operation"]== "EXIT"){
            this.messageContent = operator + "退出了群组"
        }
    }
    else if(content["group"] == "group")
    {
        if(content["operation"]== "DEL"){
            this.messageContent = operator + "解散了群组"
        }
    }
    else if(content["group"] == "friend_rel")
    {
        this.messageContent = "你已添加" + users + "为合作伙伴，现在可以聊天了";
    }
    // console.log(this.messageContent);
}


ChatMessage.prototype.createChatMessage = function (val, chatReq) {
    // msg.ownerId = val.message_owner_id;
    this.messageId = val.message_id;
    this.messageOldId = val.message_old_uuid;
    this.senderId = (val.chat_object_type == 1 ? val.chat_object_id : val.message_owner_id);
    this.messageType = val.message_type;
    this.messageReaded = (val.message_readed == 1 ? true : false);
    this.createTime = val.create_time;
    this.version.copy(val.version);
    this.unReadedNumber = parseInt(val.recver_unread_num);
    if(webIm.vitSdk._protoMsg.chips_c.IMSessionType.IM_SESSION_PRIVATE_NORMAL == val.session_type)
        this.senderId = (val.chat_object_type == 1 ? val.chat_object_id : val.message_owner_id);
    else {
        this.senderId = val.sender_id;
    }
    this.messageContent = val.message_content;


    if(this.messageType == 10000) {
        var content = null;
        try{
            content = JSON.parse(this.messageContent);
        }
        catch (e){
            console.log("error ", e);
        }

        if (val.session_type == webIm.vitSdk._protoMsg.chips_c.IMSessionType.IM_SESSION_GROUP_DEPT) {
            webIm.chatObjMgr.getDeptObject(val.contact_id, chatReq);
            if(content["operation"] == "UPDATE")
            {
                for(var i = 0; i < content["dst_ids"].length; i++)
                {
                    webIm.chatObjMgr.getDeptObject(content["dst_ids"][i], chatReq);
                }
            }
            webIm.chatObjMgr.getDeptObject(val.contact_id, chatReq);
        }
        if (typeof (content["operator"]) != "undefined") {
            webIm.chatObjMgr.getUserObject(content["operator"], chatReq);
        }
        if (typeof (content["users"]) != "undefined") {
            for (var j = 0; j < content["users"].length; j++) {
                webIm.chatObjMgr.getUserObject(content["users"][j], chatReq);
            }
        }
    }
    else if(this.messageType == 10001){
        this.convChatMessage_v2();
    }
    else if(this.messageType == 1){
        var indexOfx = this.messageContent.indexOf("*");

        if (indexOfx != -1) {
            this.messageContent = this.messageContent.substring(indexOfx + 1);
        }
    }
    else if(this.messageType == 2  || this.messageType == 5)
    {
        var indexOfx = this.messageContent.indexOf("{\"data\"");
        if(indexOfx != 0){
            indexOfx = this.messageContent.indexOf("*");

            if (indexOfx != -1) {
                this.messageContent = this.messageContent.substring(indexOfx + 1);
            }
        }
    }
    else if(this.messageType != 100001 && this.messageType != 8 && this.messageType != 3 && this.messageType != 4 && this.messageType != 100002){
        this.messageContent = "请更新版本查看消息";
    }
    switch(val.session_type)
    {
        case webIm.vitSdk._protoMsg.chips_c.IMSessionType.IM_SESSION_PRIVATE_NORMAL:
            this.chatObj = webIm.chatObjMgr.getUserObject( this.senderId, chatReq);
            break;
        case webIm.vitSdk._protoMsg.chips_c.IMSessionType.IM_SESSION_GROUP_NORMAL:
        case webIm.vitSdk._protoMsg.chips_c.IMSessionType.IM_SESSION_GROUP_DEPT:
            this.chatObj = webIm.chatObjMgr.getUserObject( this.senderId, chatReq);
            break;
        case webIm.vitSdk._protoMsg.chips_c.IMSessionType.IM_SESSION_OA_NORMAL:
            this.chatObj = webIm.chatObjMgr.getAppObject( this.senderId, chatReq);
            break;
    }
}

function GroupList() {
    this.groupHash = new HashMap();
    this.version = dcodeIO.Long.fromNumber(0);
    this.status = 0;
    // this.getlistCb = null;
}

function FriendRel() {
    this.friendHash = new HashMap();
    this.version = 0;
    this.status = 0;
    // this.getlistCb = null;
}

function ChatObjectManager() {
    this.chatUser = new HashMap();
    this.chatGroup = new HashMap();
    this.chatDept = new HashMap();
    this.chatContactNotify = new HashMap();
    this.chatApp = new HashMap();
    this.reqList = new Array();
    this.curReq = null;
    // this.groupVersion = dcodeIO.Long.fromNumber(0);

    //好友关系列表
    this.friendRel = new FriendRel();
    //群组列表
    this.group = new GroupList();
    // //直属部门列表
    this.deptMap = new HashMap();
    // //组织关系列表
    this.compMemberMap = new HashMap();
}

//获取直属部门
ChatObjectManager.prototype.getMyDept = function (callback) {
    var mythis = this;
    this.status = 1;
    $.ajax({
        url:webIm.userUrl + "dept/list_by_user.json",
        async:true,
        type:"GET",
        data:{
            user_id: webIm.options.userUuid,
            token: webIm.options.token,
            comp_id: webIm.options.comp[0].uuid
        },
        success:function(result) {
            // mythis.status = 2;
            // if(result.)
            // for(var i = 0; i < result.)
            // cb(result);
            if(result.result != 0 ){
                if(callback)
                    callback();
                return;
            }
            mythis.deptMap.clear();
            mythis.deptMap.set(webIm.options.comp[0].uuid, mythis.chatDept.get(webIm.options.comp[0].uuid));
            if(result.list.length <= 0){
                if(callback)
                    callback();
                return;
            }
            var chatObj = mythis.getDeptObject(result.list[0].uuid);
            chatObj.name = result.list[0].name;
            mythis.deptMap.set(result.list[0].uuid, chatObj);
            mythis.getParentDept(result.list[0].parent_uuid, callback);
            
        },
        error:function(xhr, ajaxOptions,thrownError) {
            //
            if(callback)
                callback();
        }
    });
}

ChatObjectManager.prototype.getParentDept = function (deptId, callback) {
    var mythis = this;
    this.status = 1;
    $.ajax({
        url:webIm.userUrl + "dept/depts_by_uuids.json",
        async:true,
        type:"POST",
        data:{
            uuid: deptId,
        },
        success:function(result) {
            // mythis.status = 2;
            // if(result.)
            // for(var i = 0; i < result.)
            // cb(result);
            if(result.result != 0 || result.list == null || result.list.length <= 0 ){
                if(callback)
                    callback();
                return;
            }
            var chatObj = mythis.getDeptObject(result.list[0].uuid);
            chatObj.name = result.list[0].name;
            mythis.deptMap.set(result.list[0].uuid, chatObj);
            if(result.list[0].parent_uuid != webIm.options.comp[0].uuid){
                mythis.getParentDept(result.list.parent_uuid, callback);
            }
            else{
                if(callback)
                    callback();
            }
        },
        error:function(xhr, ajaxOptions,thrownError) {
            //
            if(callback)
                callback();
        }
    });
}

//同步好友关系
FriendRel.prototype.syncFriendRel = function(callback){
    var mythis = this;
    this.status = 1;
    $.ajax({
        url:webIm.friendUrl + "rel/sync",
        async:true,
        type:"POST",
        data:{
            uuid: webIm.options.userUuid,
            version: mythis.version,
            limit: 1000,
            devtp: 1
        },
        success:function(result) {
            // mythis.status = 2;
            // if(result.)
            // for(var i = 0; i < result.)
            // cb(result);
            if(!result.success){
                if(callback)
                    callback();
                return;
            }
            var chatReq = new ChatObjectReq(
                function () {
                    if(webIm.options.updateFriend)
                        webIm.options.updateFriend();
                    if(callback)
                        callback();
                }
            );
            var data = result.result;
            for(var i = data.length -1; i >= 0; i--){
                var version = parseInt(data[i].version);
                if(version > mythis.version)
                    mythis.version = version;
                data[i].chatObj = webIm.chatObjMgr.getUserObject( data[i].friend_id, chatReq);
                if(data[i].is_delete == 0)
                    mythis.friendHash.set(data[i].friend_id,data[i]);
                else
                {
                    mythis.friendHash.remove(data[i].friend_id);
                    if(webIm.contactMgr.curContact &&
                        webIm.contactMgr.curContact.sessionType == webIm.vitSdk._protoMsg.chips_c.IMSessionType.IM_SESSION_PRIVATE_NORMAL &&
                        webIm.contactMgr.curContact.contactId == data[i].friend_id)
                    {
                        webIm.options.updateContact(webIm.contactMgr.curContact);
                    }
                }
            }
            webIm.chatObjMgr.reqChatObj(chatReq);
            chatReq = null;
            data = null;
        },
        error:function(xhr, ajaxOptions,thrownError) {
        //
            if(callback)
                callback();
        }
    });
}
GroupList.prototype.syncGroup = function (callback) {
    var mythis = this;
    this.status = 1;
    var req = new webIm.vitSdk._protoMsg.chips_c.GroupListGetReq();
    req.set_id(1);
    req.set_user_uuid(webIm.options.userUuid);
    req.set_version(this.version);
    webIm.vitSdk.sendMsg(req,
        webIm.vitSdk._protoMsg.chips_c.RequestType.EGroupListGetReq,
        10000,
        function (type, resp) {
            if(type == webIm.vitSdk._protoMsg.chips_c.RequestType.ETimeout){
                //
                if(callback)
                    callback(-1);
            }
            else if(resp["errorno"] != 0){
                // callback(-1)
                if(callback)
                    callback(-1);
            }
            else
            {
                if(mythis.version.compare(resp.get_version()) == 0){
                    if(mythis.getlistCb)
                        mythis.getlistCb(mythis.list);
                    if(callback)
                        callback(0);
                    return;
                }

                mythis.version.copy(resp.get_version());
                mythis.groupHash.clear();
                for(var i = 0; i< resp["details"].length; i++)
                {
                    var group = webIm.chatObjMgr.createGroup(resp["details"][i].get_uuid(),
                        resp["details"][i].get_name(),"", true, resp["details"][i].get_version());
                    mythis.groupHash.set(group["uuid"],group);
                    var contact = webIm.contactMgr.getContact(group["uuid"], webIm.vitSdk._protoMsg.chips_c.IMSessionType.IM_SESSION_GROUP_NORMAL);
                    if(contact != null && webIm.options.updateContact)
                        webIm.options.updateContact(contact);
                }
                if(webIm.options.updateGroup)
                    webIm.options.updateGroup();
                if(mythis.getlistCb)
                    mythis.getlistCb(mythis.list);
                if(callback)
                    callback(0);
            }
        }
    );
}

ChatObjectManager.prototype.reqChatObj = function(req)
{
    if(this.curReq == null)
    {
        this.curReq = req;
        req.reqChatObj();
    }
    else
    {
        this.reqList.push(req);
    }
}

ChatObjectManager.prototype.handleChatObjList = function()
{
    if(this.reqList != 0)
    {
        this.curReq = this.reqList.shift();
        this.curReq.reqChatObj();
    }
    else
    {
        this.curReq = null;
    }
}

ChatObjectManager .prototype.getSessionChatObject = function (type, uuid, req) {
    if(type == webIm.vitSdk._protoMsg.chips_c.IMSessionType.IM_SESSION_PRIVATE_NORMAL) {
        return webIm.chatObjMgr.getUserObject(uuid, req);
    }
    else if(type == webIm.vitSdk._protoMsg.chips_c.IMSessionType.IM_SESSION_GROUP_DEPT){
        //公司的直接去获取
        return webIm.chatObjMgr.getDeptObject( uuid, req);
    }
    else if(type == webIm.vitSdk._protoMsg.chips_c.IMSessionType.IM_SESSION_GROUP_NORMAL){
        //公司的直接去获取
        return webIm.chatObjMgr.getGroupObject(uuid, req);
    }
    else if(type == webIm.vitSdk._protoMsg.chips_c.IMSessionType.IM_SESSION_OA_NORMAL){
        //公司的直接去获取
        return webIm.chatObjMgr.getContactNotifyObject(uuid, req);
    }
    else if(type == webIm.vitSdk._protoMsg.chips_c.IMSessionType.IM_SESSION_APP_NORMAL)
    {
        return webIm.chatObjMgr.getAppObject(uuid, req);
    }
    return null;
}


ChatObjectManager .prototype.getUserObject = function (uuid, req) {
    // var key = type + uuid;
    var chatObj = null;
    // if()
    if (this.chatUser.has(uuid)) {
        chatObj = this.chatUser.get(uuid);
    } else {
        chatObj = new ChatObject("user", uuid);
        this.chatUser.set(uuid, chatObj);

        if(typeof req != "undefined")
            req.addReq("user", uuid);
    }
    return chatObj;
}

ChatObjectManager.prototype.getGroupObject = function (uuid, req) {
    var chatObj = null;
    // if()
    if (this.chatGroup.has(uuid)) {
        chatObj = this.chatGroup.get(uuid);
    } else {
        chatObj = new ChatObject("group", uuid);
        this.chatGroup.set(uuid, chatObj);
        chatObj.ico = webIm.ico.group;//"/ftask/web/app/modules/im/images/group-ico.png";
        if(typeof req != "undefined")
            req.addReq("group", uuid);
    }
    return chatObj;
}

ChatObjectManager.prototype.getDeptObject = function (uuid, req) {
    var chatObj = null;
    // if()
    if (this.chatDept.has(uuid)) {
        chatObj = this.chatDept.get(uuid);
    } else {
        chatObj = new ChatObject("dept", uuid);
        this.chatDept.set(uuid, chatObj);
        chatObj.ico = webIm.ico.dept;//"/ftask/web/app/modules/im/images/dept-ico.png";
        if(typeof req != "undefined")
            req.addReq("dept", uuid);
    }
    return chatObj;
}

ChatObjectManager.prototype.getContactNotifyObject = function (uuid, req) {
    var chatObj = null;
    // if()
    if (this.chatContactNotify.has(uuid)) {
        chatObj = this.chatContactNotify.get(uuid);
    } else {
        chatObj = new ChatObject("contact_app_notify", uuid);
        this.chatContactNotify.set(uuid, chatObj);
        chatObj.ico = webIm.ico.notify;//"/ftask/web/app/modules/im/images/contact-app-notify-ico.png";
        chatObj.name = '应用通知';
        if(typeof req != "undefined")
            req.addReq("contact_app_notify", uuid);
    }
    return chatObj;
}
ChatObjectManager .prototype.getAppObject = function (uuid, req) {
    var chatObj = null;
    // if()
    if (this.chatApp.has(uuid)) {
        chatObj = this.chatApp.get(uuid);
    } else {
        chatObj = new ChatObject("app", uuid);
        this.chatApp.set(uuid, chatObj);
        // chatObj.ico = "/ftask/web/app/modules/im/images/contact-app-notify-ico.png";
        if(typeof req != "undefined")
            req.addReq("app", uuid);
    }
    return chatObj;
}


function ChatObjectReq(callback){
    this.reqUuid = {user:new Object(),
        dept:new Object(),
        group:new Object(),
        contact_app_notify:new Object(),
        app:new Object(),
    };

    this.reqInfo = {reqnum :0, callback:callback};
    // this.reqList = new Object();
}

// ChatObjectReq.prototype.beginReq = function () {
//     var id = setTimeout(function () {
//         this.endReq(id);
//     }, 20000)
//    
// }
//
// ChatObjectReq.prototype.endReq = function (id) {
//    
// }

ChatObjectReq.prototype.addReq = function (type, uuid) {
    this.reqUuid[type][uuid] = true;
}

ChatObjectReq.prototype.handleCallBack = function () {
    this.reqInfo["reqnum"]--;
    console.log("reqnum", this.reqInfo["reqnum"]);
    if( this.reqInfo["reqnum"] == 0)
    {
        try{
            this.reqInfo["callback"]();
        }
        catch (e){
            console.log("error ", e);
        }
        // this.reqInfo["callback"]();
        webIm.chatObjMgr.handleChatObjList();
    }
}

ChatObjectReq.prototype.reqChatObj = function () {

    var users = new Array();
    var depts = new Array();
    var groups = new Array();
    var apps = new Array();

    for(var user in this.reqUuid["user"])
    {
        users.push(user);
    }
    for(var dept in this.reqUuid["dept"])
    {
        depts.push(dept);
    }
    for(var group in this.reqUuid["group"])
    {
        groups.push(group);
    }

    for(var app in this.reqUuid["app"])
    {
        apps.push(app);
    }

    if(users.length != 0)
    {

        if(users.length > 50){
            var start = 0;
            var end = 0;
            for(; end< users.length;)
            {
                start = end;
                if(end + 50 < users.length)
                    end = end + 50
                else
                    end = users.length
                this.reqUser(users.slice(start, end));
            }

        }
        else
            this.reqUser(users);
    }
    if(depts.length != 0)
    {
        this.reqDept(depts);
    }
    if(groups.length != 0)
    {
        this.reqGroup(groups);
    }
    if(apps.length != 0)
    {
        this.reqApp(apps);
    }
    if( this.reqInfo["reqnum"] == 0)
    {
        try{
            this.reqInfo["callback"]();
        }
        catch (e){
            console.log("error ", e);
        }
        webIm.chatObjMgr.handleChatObjList();
    }
}

ChatObjectReq.prototype.reqGroup = function (ids) {
    // this.reqInfo["reqnum"]++;
    // console.log("reqGroup ++", this.reqInfo["reqnum"]);
    var mythis = this;
    for(var uuid in mythis.reqUuid["group"]) {
        var chatObj;
        if (webIm.chatObjMgr.chatGroup.has(uuid)) {
            chatObj = webIm.chatObjMgr.chatGroup.get(uuid);
            if(!chatObj.name){
                console.log("reqGroupHistory ",uuid);
                mythis.reqGroupHistory(uuid)
            }
            else
                console.log("reqGroupHistory111111111111111111111 ",uuid);
        }
        else {
            console.log("reqGroupHistory ",uuid);
            mythis.reqGroupHistory(uuid)
        }
    }
}


ChatObjectReq.prototype.reqGroupHistory = function (id) {
    var req = new webIm.vitSdk._protoMsg.chips_c.GroupDetailGetReq();
    req.set_id(1);
    req.set_group_uuid(id);
    var mythis = this;
    this.reqInfo["reqnum"]++;
    console.log("reqGroupHistory ++", this.reqInfo["reqnum"]);
    webIm.vitSdk.sendMsg(req,
        webIm.vitSdk._protoMsg.chips_c.RequestType.EGroupDetailGetReq,
        10000,
        function (type, resp) {
            var isUpdate = false;
            if(type == webIm.vitSdk._protoMsg.chips_c.RequestType.ETimeout )
            {
                webIm.chatObjMgr.createGroup(id,
                    "未知群组",
                    "", dcodeIO.Long.fromNumber(0));
            }
            else if(resp["errorno"] != 0)
            {
                webIm.chatObjMgr.createGroup(id,
                    "未知群组",
                    "", dcodeIO.Long.fromNumber(0));
            }
            else {
                if (resp["stat"] == webIm.vitSdk._protoMsg.chips_c.GroupStat.GS_NO_EXISTS) {
                    webIm.chatObjMgr.createGroup(id,
                        "未知群组",
                        "", dcodeIO.Long.fromNumber(0));
                }
                else if (resp["stat"] == webIm.vitSdk._protoMsg.chips_c.GroupStat.GS_HISTORY) {
                    webIm.chatObjMgr.createGroup(id,
                        resp["history"]["group_name"],
                        "", dcodeIO.Long.fromNumber(0));
                }
                else if (resp["stat"] == webIm.vitSdk._protoMsg.chips_c.GroupStat.GS_EXISTS) {
                    var group = webIm.chatObjMgr.createGroup(id,
                        resp["detail"]["name"],
                        "", resp["detail"]["version"]);
                    webIm.chatObjMgr.group.groupHash.set(group["uuid"],group);
                    isUpdate = true;

                }
            }
            if(isUpdate)
            {
                var contact = webIm.contactMgr.getContact(group["uuid"], webIm.vitSdk._protoMsg.chips_c.IMSessionType.IM_SESSION_GROUP_NORMAL);
                if(contact != null && webIm.options.updateContact)
                    webIm.options.updateContact(contact);

                if(webIm.options.updateGroup)
                    webIm.options.updateGroup();
            }
            mythis.handleCallBack();
            console.log("reqGroupHistory --", mythis.reqInfo["reqnum"]);
        }
    );
}
ChatObjectManager.prototype.createGroup = function (uuid, name, ico , version) {
    var chatObj = null;
    // var key = "group" + uuid;
    if (webIm.chatObjMgr.chatGroup.has(uuid)) {
        chatObj = webIm.chatObjMgr.chatGroup.get(uuid);
    }
    else{
        chatObj = new ChatObject("group",  uuid);
        webIm.chatObjMgr.chatGroup.set(uuid, chatObj);
        chatObj.ico = webIm.ico.group;//"/ftask/web/app/modules/im/images/group-ico.png";
    }
    // chatObj.uuid = result.list[i].uuid;
    // chatObj.is_chat = is_chat;
    chatObj.name = name;
    chatObj.version = version;
    if(name)
    {
        var pinyin = new Pinyin();
        chatObj.pinyin = pinyin.getFullChars(name);
        chatObj.jianpin = pinyin.getCamelChars(name)
    }
    else
    {
       chatObj.pinyin="";
       chatObj.jianpin=""; 
    }

    if(ico)
        chatObj.ico = ico;

    return chatObj;
    // webIm.options.updateChatObj(chatObj, "contact", webIm.vitSdk._protoMsg.chips_c.IMSessionType.IM_SESSION_GROUP_NORMAL);
}


ChatObjectReq.prototype.reqUser = function (ids) {
    var reqIds = "uuid=" + ids.join("&uuid=");
    var mythis = this;
    this.reqInfo["reqnum"]++;
    console.log("reqUser ++", this.reqInfo["reqnum"]);
    $.ajax({
        url:webIm.userUrl + "user/users_by_uuids.json",
        async:true,
        type:"POST",
        data:reqIds,
        success:function(result) {
            if(result.result != 0) {

            }
            else {
                for (var i = 0; i < result.list.length; i++) {
                    var chatObj = null;
                    // var key = "user" + result.list[i].uuid;
                    if (webIm.chatObjMgr.chatUser.has(result.list[i].uuid)) {
                        chatObj = webIm.chatObjMgr.chatUser.get(result.list[i].uuid);
                    }
                    else {
                        chatObj = new ChatObject("user", result.list[i].uuid);
                        webIm.chatObjMgr.chatUser.set(result.list[i].uuid, chatObj);
                    }
                    // chatObj.uuid = result.list[i].uuid;
                    chatObj.name = result.list[i].nick_name;
                    chatObj.ico = result.list[i].ico;
                    chatObj.data = result.list[i].signature;
                    if(chatObj.name)
                    {
                        var pinyin = new Pinyin();
                        chatObj.pinyin = pinyin.getFullChars(chatObj.name);
                        chatObj.jianpin = pinyin.getCamelChars(chatObj.name)
                    }
                    else
                    {
                        chatObj.pinyin="";
                        chatObj.jianpin="";
                    }
                    if(result.list[i].comp_id && webIm.options.comp[0].uuid == result.list[i].comp_id && result.list[i].status == 0)
                    {
                        webIm.chatObjMgr.compMemberMap.set(chatObj.uuid,chatObj);
                    }
                    // chatObj.is_chat = true;
                    // webIm.options.updateChatObj(chatObj, "all", webIm.vitSdk._protoMsg.chips_c.IMSessionType.IM_SESSION_PRIVATE_NORMAL);
                }
            }
            mythis.handleCallBack();
            console.log("reqUser --", mythis.reqInfo["reqnum"]);
        },
        error:function(xhr, ajaxOptions,thrownError) {
            console.log("reqUser error");
            console.log("reqUser --", mythis.reqInfo["reqnum"]);
            mythis.handleCallBack();
            // alert("reqUser error");
        }
    });
}

ChatObjectReq.prototype.reqDept = function (ids) {
    var userUrl = webIm.userUrl + "dept/depts_by_uuids.json?uuid=" + ids.join("&uuid=");
    var mythis = this;
    this.reqInfo["reqnum"]++;
    console.log("reqDept++", this.reqInfo["reqnum"]);
    $.ajax({
        url:userUrl,
        async:true,
        type:"POST",
        success:function(result) {
            if(result.result != 0) {

            }
            else
            {
                for(var i = 0; i< result.list.length; i++)
                {
                    var chatObj = null;
                    // var key = "dept" + result.list[i].uuid;
                    if (webIm.chatObjMgr.chatDept.has(result.list[i].uuid)) {
                        chatObj = webIm.chatObjMgr.chatDept.get(result.list[i].uuid);
                    }
                    else{
                        chatObj = new ChatObject("dept", result.list[i].uuid);
                        webIm.chatObjMgr.chatDept.set(result.list[i].uuid, chatObj);
                    }
                    // chatObj.uuid = result.list[i].uuid;
                    chatObj.name = result.list[i].name;
                    // chatObj.is_chat = true;
                    // chatObj.ico = "/ftask/web/app/modules/im/images/dept-ico.png";
                    // webIm.options.updateChatObj(chatObj, "contact", webIm.vitSdk._protoMsg.chips_c.IMSessionType.IM_SESSION_GROUP_DEPT);
                }
            }
            mythis.handleCallBack();
            console.log("reqDept --", mythis.reqInfo["reqnum"]);
        },
        error:function(xhr, ajaxOptions,thrownError) {
            console.log("reqDept error");
            console.log("reqDept --", mythis.reqInfo["reqnum"]);
            mythis.handleCallBack();
            // alert("reqDept error");
        }
    });
}
ChatObjectReq.prototype.reqApp = function () {
    var userUrl = webIm.ftaskUrl + "api/app/in_use_list.json?token=" + webIm.options.token;

    var mythis = this;
    this.reqInfo["reqnum"]++;
    console.log("reqApp++", this.reqInfo["reqnum"]);
    $.ajax({
        url:userUrl,
        async:true,
        type:"GET",
        success:function(result) {
            if(result.result != 0) {

            }
            else
            {
                for(var i = 0; i< result.list.length; i++)
                {
                    var chatObj = null;
                    // var key = "dept" + result.list[i].uuid;
                    if (webIm.chatObjMgr.chatApp.has(result.list[i].uuid)) {
                        chatObj = webIm.chatObjMgr.chatApp.get(result.list[i].uuid);
                    }
                    else{
                        chatObj = new ChatObject("app", result.list[i].uuid);
                        webIm.chatObjMgr.chatApp.set(result.list[i].uuid, chatObj);
                    }
                    // chatObj.uuid = result.list[i].uuid;
                    chatObj.name = result.list[i].name;
                    if(chatObj.name)
                    {
                        var pinyin = new Pinyin();
                        chatObj.pinyin = pinyin.getFullChars(chatObj.name);
                        chatObj.jianpin = pinyin.getCamelChars(chatObj.name);
                    }
                    else
                    {
                        chatObj.pinyin = "";
                        chatObj.jianpin = "";
                    }
                    // chatObj.is_chat = false;
                    chatObj.ico = result.list[i].ico;
                    // webIm.options.updateChatObj(chatObj, "contact", webIm.vitSdk._protoMsg.chips_c.IMSessionType.IM_SESSION_GROUP_DEPT);
                }
            }
            mythis.handleCallBack();
            console.log("reqApp --", mythis.reqInfo["reqnum"]);
        },
        error:function(xhr, ajaxOptions,thrownError) {
            console.log("reqApp error");
            console.log("reqApp --", mythis.reqInfo["reqnum"]);
            mythis.handleCallBack();
            // alert("reqDept error");
        }
    });
}
function ChatObject(type, uuid){
    this.type = type;
    this.name = "";
    this.uuid = uuid;
    this.ico = "";
    this.data = "";
    // this.isValid = false;
    // this.is_chat = false;
}
WebIm.prototype.setUniversalNotify = function (callback) {
    this.universalNotify = callback;
}
WebIm.prototype.init = function (options) {
    this.options = options;
    for(var i = 0; i < options.comp.length; i++) {
        // var key = "dept" + options.comp[i].uuid;
        chatObj = new ChatObject("dept", options.comp[i].uuid);
        chatObj.name = options.comp[i].name;
        if(options.comp[i].ico)
            chatObj.ico = options.comp[i].ico;
        else
            chatObj.ico = webIm.ico.dept;//"/ftask/web/app/modules/im/images/dept-ico.png";
        chatObj.is_comp = true;
        // chatObj.isValid = true;
        // webIm.chatObjMgr.deptMap.set(chatObj.uuid, chatObj);

        if(chatObj.name)
        {
            var pinyin = new Pinyin();
            chatObj.pinyin = pinyin.getFullChars(chatObj.name);
            chatObj.jianpin = pinyin.getCamelChars(chatObj.name)
        }
        webIm.chatObjMgr.chatDept.set(options.comp[i].uuid, chatObj);
        chatObj = new ChatObject("contact_app_notify", options.comp[i].uuid);
        chatObj.name = '应用通知'; //options.comp[i].name;
        chatObj.ico = webIm.ico.notify;//"/ftask/web/app/modules/im/images/contact-app-notify-ico.png";
        // chatObj.isValid = true;
        // key = "contact_app_notify" + options.comp[i].uuid;
        if(chatObj.name)
        {
            var pinyin = new Pinyin();
            chatObj.pinyin = pinyin.getFullChars(chatObj.name);
            chatObj.jianpin = pinyin.getCamelChars(chatObj.name)
        }
        webIm.chatObjMgr.chatContactNotify.set(options.comp[i].uuid, chatObj);
    }
    this.vitSdk.init(this.vitUrl, this.options.userUuid, this.options.userName, this.options.token, this.notifyHandle, this.vitStatusChange);


    // this.protoMsg = this.vitSdk._protoMsg;
    // this.contactList.syncContact();
};

WebIm.prototype.sendChatMessage = function (sessionType, contactId, msg, callback) {
    var contact = this.contactMgr.getContact(contactId, sessionType);
    if(contact == null)
        return;
    if(contact.sessionType == 0)
    {
        contact.sessionType = sessionType;
        contact.contactId = contactId;

        contact.chatObj = webIm.chatObjMgr.getSessionChatObject(sessionType, contactId);
    }

    contact.senderId = webIm.options.userUuid;
    contact.messageSummary = msg.messageContent;
    contact.createTime = 0;

    var message = new ChatMessage();
    message.messageOldId = msg.uuid;
    message.senderId = webIm.options.userUuid;
    message.messageType = msg.messageType;
    message.messageContent = msg.messageContent;
    message.messageReaded = true;
    message.unReadedNumber = -2;
    message.createTime = 0;
    message.version.copy(contact.curMsgVerMax);
    message.chatObj = webIm.chatObjMgr.getUserObject(webIm.options.userUuid);
    message.id = webIm.vitSdk.getSequence();
    message.stat= 2;
    contact.messageList.unshift(message);

    var req = null;
    var sendType  = 0;
    switch(contact.sessionType)
    {
        case webIm.vitSdk._protoMsg.chips_c.IMSessionType.IM_SESSION_PRIVATE_NORMAL:
            req = new webIm.vitSdk._protoMsg.chips_c.ChatPriReq();
            sendType = webIm.vitSdk._protoMsg.chips_c.RequestType.EChatPriReq;
            break;
        case webIm.vitSdk._protoMsg.chips_c.IMSessionType.IM_SESSION_GROUP_NORMAL:
        case webIm.vitSdk._protoMsg.chips_c.IMSessionType.IM_SESSION_GROUP_DEPT:
            req = new webIm.vitSdk._protoMsg.chips_c.ChatGrpReq();
            sendType = webIm.vitSdk._protoMsg.chips_c.RequestType.EChatGrpReq;
            break;
        default:
            return;
    }
        
    req.set_id(message.id);// = message.id;
    req.set_session_type(sessionType);// = sessionType;
    req.set_device_type(1);// = 1;
    req.set_user_uuid(message.senderId);// = message.senderId ;
    req.set_chat_obj_uuid(contact.contactId);// = contact.contactId;

    req.set_msg_type(msg.messageType);// = msg.messageType;
    if(msg.messageType == 1)
        req.set_msg_content("{\"tm\":0}*" + msg.messageContent);// = msg.messageContent;
    else
        req.set_msg_content(msg.messageContent);// = msg.messageContent;
    req.set_msg_uuid(msg.uuid);// = msg.uuid;
    req.set_user_name(webIm.options.userName);// = webIm.options.userName;
    if(contact.chatObj.is_comp)
        req.set_is_comp(true);
    webIm.vitSdk.sendMsg(req,
        sendType,
        30000,
        function (type, resp) {
            console.log("vitStatusChange", type, resp, req, sendType);
            if(type == webIm.vitSdk._protoMsg.chips_c.RequestType.ETimeout) {
                callback(message.messageOldId, -1, resp["unread_number"],resp["msg_uuid"], message);
                message.stat= 1;
                return;
            }

            if(resp["errorno"] != 0){
                callback(message.messageOldId, -2, resp["unread_number"],resp["msg_uuid"], message);
                message.stat= 1;
                return;
            }
            message.stat= 0;
            message.messageId = resp["msg_uuid"];
            message.createTime = resp["msg_time"];
            message.unReadedNumber = resp["unread_number"];
            message.version = resp["msg_version"];
            if(contact.createTime <　resp["msg_time"]) {
                contact.createTime = resp["msg_time"];
            }

            if (message.version.compare(contact.curMsgVerMax)>0) {
                contact.curMsgVerMax.copy(message.version);
            }

            if (message.version.compare(contact.curMsgVerMin)<0 || contact.curMsgVerMin.toNumber() <=0) {
                contact.curMsgVerMin.copy(message.version);
            }
            if(contact.messageMaxVer.compare(message.version) < 0)
                contact.messageMaxVer.copy(message.version);
            callback(message.messageOldId, 0, resp["unread_number"], resp["msg_uuid"], message);
        }
    );
    // req.set
}

WebIm.prototype.contactSelected = function (type, uuid, funCb) {
    //获取消息
    this.contactMgr.selected(type, uuid, funCb);
}

WebIm.prototype.getPrevMessage = function (type, uuid, funCb) {
    var contact = this.contactMgr.getContact(uuid, type);
    if(contact) {
        contact.getPrevMessage(funCb);
    }
    else
        funCb([]);
}

WebIm.prototype.notifyHandle = function (type, notify) {
    switch(type)
    {
        case webIm.vitSdk._protoMsg.chips_c.RequestType.EChatNotify:
            webIm.contactMgr.syncContact(function(result){
                webIm.contactMgr.updateContactList(result);
            });
            break;
        case webIm.vitSdk._protoMsg.chips_c.RequestType.EIMMessageReadedNotify:
            webIm.contactMgr.readedNotify(notify);
            break;
        case webIm.vitSdk._protoMsg.chips_c.RequestType.ERecverReadPushNotify:
            var contact = webIm.contactMgr.getContact(notify["contact_id"], notify["session_type"]);
            if(contact)
            {
                contact.recverReadNotify(notify);
            }
            break;
        case webIm.vitSdk._protoMsg.chips_c.RequestType.EGroupPushNotify:
        case webIm.vitSdk._protoMsg.chips_c.RequestType.EGroupRelPushNotify:
            webIm.chatObjMgr.group.syncGroup();
            break;
        case webIm.vitSdk._protoMsg.chips_c.RequestType.EUniversalPushNotify:
        {
            var content = null;
            try {
                content = JSON.parse(notify["msg_body"])
                if (content["res_type"] == "friend_rel") {
                    webIm.chatObjMgr.friendRel.syncFriendRel();
                }
                else {
                    if (webIm.universalNotify) {
                        webIm.universalNotify(content);
                    }
                }
            }
            catch (e){
                console.log("error ", e);}
        }
            break;
    }

}

WebIm.prototype.createContact = function (type, uuid, name, ico, data,funCb) {
    var contact = this.contactMgr.getContact(uuid, type);
    if( contact )
        return contact;

    if(contact == null){
        if(type == webIm.vitSdk._protoMsg.chips_c.IMSessionType.IM_SESSION_OA_NORMAL ||
            type == webIm.vitSdk._protoMsg.chips_c.IMSessionType.IM_SESSION_APP_NORMAL ||
            type == webIm.vitSdk._protoMsg.chips_c.IMSessionType.IM_SESSION_GROUP_NORMAL||
            type == webIm.vitSdk._protoMsg.chips_c.IMSessionType.IM_SESSION_GROUP_DEPT){
            if(!webIm.isChat(type,uuid))
                return null;
        }

        contact = this.contactMgr.createContact(uuid, type)
        contact.chatObj = webIm.chatObjMgr.getSessionChatObject(type, uuid);
        if(type == webIm.vitSdk._protoMsg.chips_c.IMSessionType.IM_SESSION_PRIVATE_NORMAL){
            if(!webIm.chatObjMgr.friendRel.friendHash.has(uuid))
                webIm.chatObjMgr.compMemberMap.set(uuid, contact.chatObj)
        }
        if(!contact.chatObj.name){
            contact.chatObj.name = name;
            if(ico)
                contact.chatObj.ico = ico;
            if(data)
                contact.chatObj.data = data;
        }
    }
    return contact;
    // this.contactMgr.selected(type, uuid, funCb);
}

WebIm.prototype.vitStatusChange = function (status, access_token) {
    console.log("vitStatusChange", status);
    if(webIm.vitSdk.bConnected(status))
    {
        webIm.initSyncContact();
    }
    else if(webIm.vitSdk.bOtherPlaceLogin(status))
    {
        if(webIm.options.outherPlaceLogin)
            webIm.options.outherPlaceLogin();
    }
}

WebIm.prototype.initSyncContact = function () {
    webIm.initSync.reqNum++;
    webIm.contactMgr.syncContact(function (result) {
        webIm.initSync.reqNum--;
        console.log("syncContact reqNum--" , webIm.initSync.reqNum);
        if(webIm.initSync.reqNum<=0)
            webIm.contactMgr.updateContactList(result);
        else
            webIm.initSync.contactData = result;
    })

    webIm.initSync.reqNum++;
    webIm.chatObjMgr.group.syncGroup(function () {
        webIm.initSync.reqNum--;
        console.log("syncContact reqNum--" , webIm.initSync.reqNum);
        if(webIm.initSync.reqNum<=0)
            webIm.contactMgr.updateContactList(webIm.initSync.contactData);
    })

    webIm.initSync.reqNum++;
    webIm.contactMgr.syncContactSetting(function () {
        webIm.initSync.reqNum--;
        console.log("syncContactSetting reqNum--" , webIm.initSync.reqNum);
        if(webIm.initSync.reqNum<=0)
            webIm.contactMgr.updateContactList(webIm.initSync.contactData);
    })

    webIm.initSync.reqNum++;
    webIm.chatObjMgr.friendRel.syncFriendRel(function () {
        webIm.initSync.reqNum--;
        console.log("friendRel reqNum--" , webIm.initSync.reqNum);
        if(webIm.initSync.reqNum<=0)
            webIm.contactMgr.updateContactList(webIm.initSync.contactData);
    })

    webIm.initSync.reqNum++;
    webIm.chatObjMgr.getMyDept(function () {
        webIm.initSync.reqNum--;
        console.log("getMyDept reqNum--" , webIm.initSync.reqNum);
        if(webIm.initSync.reqNum<=0)
            webIm.contactMgr.updateContactList(webIm.initSync.contactData);
    })
}

WebIm.prototype.setReadNum = function (uuid, type) {
    this.contactMgr.setReadNum(uuid,type);
}


WebIm.prototype.getRecverUnreaded = function (type, messageId, callback) {
    var mythis = this;
    $.ajax({
        url:webIm.msgUrl+"read/get_user",
        async:true,
        type:"POST",
        data:{
            uuid: webIm.options.userUuid,
            sstp:type,
            data:JSON.stringify({message_ids:[messageId]})
        },
        success:function(result) {
            if(result.success) {
                if(result.result)
                {
                    if(result.result.length>0){
                        var read = new Array();
                        var unread = new Array();
                        var chatReq = new ChatObjectReq(
                            function () {
                                // webIm.options.insertContact(contactList);
                                // contactList = null;
                                callback(read, unread);
                            }
                        );
                        for(var i = 0; i< result.result[0].read.length; i++)
                        {
                            var chatObj = webIm.chatObjMgr.getUserObject(result.result[0].read[i], chatReq);
                            read.push(chatObj);
                        }
                        for(var i = 0; i< result.result[0].unread.length; i++)
                        {
                            var chatObj = webIm.chatObjMgr.getUserObject(result.result[0].unread[i], chatReq);
                            unread.push(chatObj);
                        }
                        webIm.chatObjMgr.reqChatObj(chatReq);
                        chatReq = null;
                    }
                }
            }
        },
        error:function(xhr, ajaxOptions,thrownError) {
            // alert("reqUser error");
        }
    });
}

WebIm.prototype.getGroupList = function () {
    var groupList = new Array();
    webIm.chatObjMgr.group.groupHash.forEach(function(value, key) {
            // if(value.is_chat)
        groupList.push(value)
    });
    return groupList;
}


WebIm.prototype.getContactInfo = function (contact_id, session_type, callback) {
    var contact = this.contactMgr.getContact(contact_id, session_type);
    if(!contact)
    {
        callback();
        return;
    }
    // var setting = ""
    // var key = contact_id+session_type;
    // if(this.contactMgr.contactSetting.has(key)){
    //     setting = this.contactMgr.contactSetting.get(key);
    // }

    if(session_type == "20001")
    {
        this.getGroupMemberGetReq(contact_id,
        function (errorno, groupManager, list) {
            // if()
            if(errorno != 0)
                callback(contact, contact.sessionSetting);
            else
                callback(contact, contact.sessionSetting, groupManager, list);
        })
    }
    else
    {
        callback(contact, contact.sessionSetting);
    }
}

WebIm.prototype.getGroupMemberGetReq = function (group_id, callback) {
    var req = new webIm.vitSdk._protoMsg.chips_c.GroupMemberGetReq();
    req.set_id(1);
    req.set_group_uuid(group_id);
    var mythis = this;
    // var reqIds = ids.concat();
    webIm.vitSdk.sendMsg(req,
        webIm.vitSdk._protoMsg.chips_c.RequestType.EGroupMemberGetReq,
        10000,
        function (type, resp) {
            if(type == webIm.vitSdk._protoMsg.chips_c.RequestType.ETimeout){
                callback(-1);
            }
            else if(resp["errorno"] != 0)
            {
                callback(resp["errorno"]);
            }
            else
            {
                var list = new Array();
                var groupManager = [];
                var chatReq = new ChatObjectReq(
                    function () {
                        // webIm.options.insertContact(contactList);
                        // contactList = null;
                        callback(resp["errorno"], groupManager, list );
                        list = null;
                    }
                );
                for(var i = 0; i < resp["rel"].length; i++){
                    var obj = webIm.chatObjMgr.getUserObject(resp["rel"][i]["user_uuid"], chatReq);
                    if(resp["rel"][i]["role"] == webIm.vitSdk._protoMsg.chips_c.GroupMemRole.GROUP_ROLE_CREATOR
                        ||resp["rel"][i]["role"] == webIm.vitSdk._protoMsg.chips_c.GroupMemRole.GROUP_ROLE_MANAGER)
                    {
                        //groupManager = obj;
                        groupManager.push(obj)
                    }
                    list.push(obj);
                }
                webIm.chatObjMgr.reqChatObj(chatReq);
                chatReq = null;
            }
        }
    );
}

WebIm.prototype.groupNewReq = function (name, members, callback) {
    var req = new webIm.vitSdk._protoMsg.chips_c.GroupNewReq();
    req.set_id(1);
    req.set_name(name);
    req.set_ico("");
    req.set_summary("");
    req.set_type(webIm.vitSdk._protoMsg.chips_c.GroupType.GROUP_NORMAL);
    req.set_members(members);

    var mythis = this;
    // var reqIds = ids.concat();
    webIm.vitSdk.sendMsg(req,
        webIm.vitSdk._protoMsg.chips_c.RequestType.EGroupNewReq,
        10000,
        function (type, resp) {
            if(type == webIm.vitSdk._protoMsg.chips_c.RequestType.ETimeout){
                callback(-1);
            }
            else if(resp["errorno"] != 0)
            {
                callback(resp["errorno"], resp["msg"]);
            }
            else
            {
                var chatObj = webIm.chatObjMgr.getGroupObject(resp["detail"]["uuid"]);
                chatObj.name = resp["detail"]["name"];
                webIm.chatObjMgr.group.groupHash.set(chatObj.uuid, chatObj);
                // chatObj.is_chat = true;
                callback(resp["errorno"], resp["msg"], resp["detail"]["uuid"]);
                //创建聊天对象

            }
        }
    );
}
WebIm.prototype.sessionSettingReq = function (contact_id, session_type, setting, callback) {
    var req = new webIm.vitSdk._protoMsg.chips_c.SessionSettingReq();
    req.set_id(1);
    req.set_contact_id(contact_id);
    req.set_session_type(session_type);
    req.set_common("");
    req.set_pc(setting);
    var mythis = this;
    // var reqIds = ids.concat();
    webIm.vitSdk.sendMsg(req,
        webIm.vitSdk._protoMsg.chips_c.RequestType.ESessionSettingReq,
        10000,
        function (type, resp) {
            if(type == webIm.vitSdk._protoMsg.chips_c.RequestType.ETimeout){
                if(callback)
                    callback(-1);
            }
            else
            {
                webIm.contactMgr.updateContactSetting(contact_id, session_type, setting);
                if(callback)
                    callback(resp["errorno"], resp["msg"]);
            }
        }
    );
}

WebIm.prototype.groupMemberAddReq = function (group_uuid, members, callback) {
    var req = new webIm.vitSdk._protoMsg.chips_c.GroupMemberAddReq();
    req.set_id(1);
    req.set_group_uuid(group_uuid);
    req.set_members(members);
    var mythis = this;
    // var reqIds = ids.concat();
    webIm.vitSdk.sendMsg(req,
        webIm.vitSdk._protoMsg.chips_c.RequestType.EGroupMemberAddReq,
        10000,
        function (type, resp) {
            if(type == webIm.vitSdk._protoMsg.chips_c.RequestType.ETimeout){
                if(callback)
                    callback(-1);
            }
            else
            {
                if(callback)
                    callback(resp["errorno"], resp["msg"]);
            }
        }
    );
}


WebIm.prototype.groupMemberDeleteReq = function (group_uuid, members, callback) {
    var req = new webIm.vitSdk._protoMsg.chips_c.GroupMemberDeleteReq();
    req.set_id(1);
    req.set_group_uuid(group_uuid);
    req.set_members(members);
    var mythis = this;
    // var reqIds = ids.concat();
    webIm.vitSdk.sendMsg(req,
        webIm.vitSdk._protoMsg.chips_c.RequestType.EGroupMemberDeleteReq,
        10000,
        function (type, resp) {
            if(type == webIm.vitSdk._protoMsg.chips_c.RequestType.ETimeout){
                if(callback)
                    callback(-1);
            }
            else
            {
                if(callback)
                    callback(resp["errorno"], resp["msg"]);
            }
        }
    );
}


WebIm.prototype.groupExitReq = function (group_uuid , callback) {
    var req = new webIm.vitSdk._protoMsg.chips_c.GroupExitReq();
    req.set_id(1);
    req.set_group_uuid(group_uuid);
    var mythis = this;
    // var reqIds = ids.concat();
    webIm.vitSdk.sendMsg(req,
        webIm.vitSdk._protoMsg.chips_c.RequestType.EGroupExitReq,
        10000,
        function (type, resp) {
            if(type == webIm.vitSdk._protoMsg.chips_c.RequestType.ETimeout){
                if(callback)
                    callback(-1);
            }
            else if(resp["errorno"] == 0)
            {
                var chatObj = webIm.chatObjMgr.getGroupObject(group_uuid);
                // chatObj.is_chat = false;
                webIm.chatObjMgr.group.groupHash.remove(group_uuid);
                var contact = webIm.contactMgr.getContact(group_uuid, 20001);
                if(contact != null && webIm.options.updateContact)
                    webIm.options.updateContact(contact);
                if(callback)
                    callback(resp["errorno"], resp["msg"]);
            }
            else
            {
                if(callback)
                    callback(-1);
            }
        }
    );
}


WebIm.prototype.groupDeleteReq = function (group_uuid , callback) {
    var req = new webIm.vitSdk._protoMsg.chips_c.GroupDeleteReq();
    req.set_id(1);
    req.set_group_uuid(group_uuid);
    var mythis = this;
    // var reqIds = ids.concat();
    webIm.vitSdk.sendMsg(req,
        webIm.vitSdk._protoMsg.chips_c.RequestType.EGroupDeleteReq,
        10000,
        function (type, resp) {
            if(type == webIm.vitSdk._protoMsg.chips_c.RequestType.ETimeout){
                if(callback)
                    callback(-1);
            }
            else if(resp["errorno"] == 0)
            {
                var chatObj = webIm.chatObjMgr.getGroupObject(group_uuid);
                // chatObj.is_chat = false;
                webIm.chatObjMgr.group.groupHash.remove(group_uuid);
                var contact = webIm.contactMgr.getContact(group_uuid, 20001);
                if(contact != null && webIm.options.updateContact)
                    webIm.options.updateContact(contact);
                if(callback)
                    callback(resp["errorno"], resp["msg"]);
            }
            else
            {
                if(callback)
                    callback(-1);
            }
        }
    );
}


WebIm.prototype.groupUpdateReq = function (group_uuid , name, ico, summary, callback) {
    var req = new webIm.vitSdk._protoMsg.chips_c.GroupUpdateReq();
    req.set_id(1);
    req.set_group_uuid(group_uuid);
    req.set_name(name);
    req.set_ico(ico);
    req.set_summary(summary);
    req.set_type(webIm.vitSdk._protoMsg.chips_c.GroupType.GROUP_NORMAL);
    var mythis = this;
    // var reqIds = ids.concat();
    webIm.vitSdk.sendMsg(req,
        webIm.vitSdk._protoMsg.chips_c.RequestType.EGroupUpdateReq,
        10000,
        function (type, resp) {
            if(type == webIm.vitSdk._protoMsg.chips_c.RequestType.ETimeout){
                if(callback)
                    callback(-1);
            }
            else if(resp["errorno"] == 0)
            {
                var chatObj = webIm.chatObjMgr.getGroupObject(group_uuid);
                // chatObj.is_chat = false;
                chatObj.name = resp["detail"]["name"];
                var contact = webIm.contactMgr.getContact(group_uuid, 20001);
                if(contact != null && webIm.options.updateContact)
                    webIm.options.updateContact(contact);
                if(callback)
                    callback(resp["errorno"], resp["msg"]);
            }
            else
            {
                if(callback)
                    callback(-1);
            }
        }
    );
}
WebIm.prototype.findContact = function (str) {
    // console.log("xxxxxxxxxxxxxxxxxx ", str);
    var result = new Array();
    webIm.chatObjMgr.chatGroup.forEach(function(value, key) {
        if(value.name.indexOf(str)!=-1)
            result.push(value);
        else if(value.pinyin.indexOf(str)!=-1)
            result.push(value);
        else if(value.jianpin.indexOf(str)!=-1)
            result.push(value);
    });

    webIm.chatObjMgr.friendRel.friendHash.forEach(function(value, key) {
        if(value.chatObj.name && value.chatObj.name.indexOf(str)!=-1)
            result.push(value.chatObj);
        else if(value.chatObj.pinyin && value.chatObj.pinyin.indexOf(str)!=-1)
            result.push(value.chatObj);
        else if(value.chatObj.jianpin && value.chatObj.jianpin.indexOf(str)!=-1)
            result.push(value.chatObj);
    });

    return result;
}


//同步好友关系
WebIm.prototype.getFriendRel = function(){
    var friendList = new Array();

    webIm.chatObjMgr.friendRel.friendHash.forEach(function(value, key) {
        // if(value.is_chat)
        friendList.push(value)
    });
    friendList = friendList.sort(function (a, b) {
        return a.chatObj.pinyin > b.chatObj.pinyin;
    });

    return friendList;
}

//发送好友请求
WebIm.prototype.friendMsgNew = function(uuid, dstid, msg, name, dstname, cb){
    var mythis = this;
    $.ajax({
        url:webIm.friendUrl + "msg/new",
        async:true,
        type:"POST",
        data:{
            uuid: uuid,
            dstid: dstid,
            msg: msg,
            name: name,
            dstname: dstname,
            devtp: 1
        },
        success:function(result) {
            if(result.success && result.result.status == 1){
                webIm.chatObjMgr.friendRel.syncFriendRel(); //刷新同步好友 
            }
            cb(result);
        },
        error:function(xhr, ajaxOptions,thrownError) {
            cb({success: false});
        }
    });
}

//发送好友请求
WebIm.prototype.friendMsgGet = function(callBack){
    var mythis = this;
    $.ajax({
        url:webIm.friendUrl + "msg/get",
        async:true,
        type:"POST",
        data:{
            uuid: webIm.options.userUuid,
            devtp: 1
        },
        success:function(result) {
            if(result.success && result.result)
            {   
                if(result.result.length > 0){
                    result.result = result.result.sort(function (a, b) {
                        return b.update_time - a.update_time;
                    });
                }
                var chatReq = new ChatObjectReq(
                    function () {
                        callBack(result);
                    }
                );
                for(var i = 0; i <　result.result.length; i++){
                    result.result[i].chatObj = webIm.chatObjMgr.getUserObject(result.result[i].friend_id, chatReq);
                }
                webIm.chatObjMgr.reqChatObj(chatReq);
                chatReq = null;
            }
            else
                callBack(result);
        },
        error:function(xhr, ajaxOptions,thrownError) {
            callBack({success: false});
        }
    });
}

//接受好友请求
WebIm.prototype.friendMsgAccept = function(uuid, dstid, name, dstname, cb){
    var mythis = this;
    $.ajax({
        url:webIm.friendUrl + "msg/accept",
        async:true,
        type:"POST",
        data:{
            uuid: uuid,
            dstid: dstid,
            name: name,
            dstname: dstname,
            devtp: 1
        },
        success:function(result) {
            if(result.success){
                webIm.chatObjMgr.friendRel.syncFriendRel(); //刷新同步好友
            }
            cb(result);
        },
        error:function(xhr, ajaxOptions,thrownError) {
            cb({success: false});
        }
    });
}

//删除好友验证消息
WebIm.prototype.friendMsgDelete = function(uuid, dstid, cb){
    var mythis = this;
    $.ajax({
        url:webIm.friendUrl + "msg/delete",
        async:true,
        type:"POST",
        data:{
            uuid: uuid,
            dstid: dstid,
            devtp: 1
        },
        success:function(result) {
            cb(result);
        },
        error:function(xhr, ajaxOptions,thrownError) {
            cb({success: false});
        }
    });
}

//解除好友关系
WebIm.prototype.frienDelDelete = function(uuid, dstid, cb){
    var mythis = this;
    $.ajax({
        url:webIm.friendUrl + "rel/delete",
        async:true,
        type:"POST",
        data:{
            uuid: uuid,
            dstid: dstid,
            devtp: 1
        },
        success:function(result) {
            if(result.success){
                webIm.chatObjMgr.friendRel.friendHash.remove(dstid);
                if(webIm.contactMgr.curContact &&
                    webIm.contactMgr.curContact.sessionType == webIm.vitSdk._protoMsg.chips_c.IMSessionType.IM_SESSION_PRIVATE_NORMAL &&
                    webIm.contactMgr.curContact.contactId == dstid)
                {
                    webIm.options.updateContact(webIm.contactMgr.curContact);
                }
                webIm.chatObjMgr.friendRel.syncFriendRel(); //刷新同步好友
            }
            cb(result);
        },
        error:function(xhr, ajaxOptions,thrownError) {
            cb({success: false});
        }
    });
}

WebIm.prototype.isChat = function (type, uuid) {
    if(type == webIm.vitSdk._protoMsg.chips_c.IMSessionType.IM_SESSION_OA_NORMAL ||
        type == webIm.vitSdk._protoMsg.chips_c.IMSessionType.IM_SESSION_APP_NORMAL)
        return false;
    if(type == webIm.vitSdk._protoMsg.chips_c.IMSessionType.IM_SESSION_PRIVATE_NORMAL) //当对话单位为 “人”时 暂时不做判断
    {
        // if(webIm.chatObjMgr.compMemberMap.has(uuid))
        //     return true;
        // if(webIm.chatObjMgr.friendRel.friendHash.has(uuid))
        //     return true;
        // if(uuid == webIm.customerServiceContact)
        //     return true;
        // return false;
        return true;
    }

    if(type == webIm.vitSdk._protoMsg.chips_c.IMSessionType.IM_SESSION_GROUP_NORMAL)
    {
        if(webIm.chatObjMgr.group.groupHash.has(uuid))
            return true;
        return false;
    }

    if(type == webIm.vitSdk._protoMsg.chips_c.IMSessionType.IM_SESSION_GROUP_DEPT)
    {
        if(webIm.chatObjMgr.deptMap.has(uuid))
            return true;
        return false;
    }
}
