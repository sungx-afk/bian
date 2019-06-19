/**
 * Created by yukl on 2016/4/12.
 */

function trueOrFalse(obj, bl) {
    obj.valueOf = obj.toSource = obj.toString = function() {return Boolean(bl);};
}

function adler32(data, len) {
    var modeAdler = 65521;
    var a = 1 >>> 0;
    var b = 0 >>> 0;

    for (var i=0; i<len; i++) {
        a = (a + data[i]) % modeAdler;
        b = (b + a) % modeAdler;
    }

    return (((b << 16) | a) >>> 0);
}

function parsePretreatment(buffer, bufferLen, success) {
    var view = new DataView(buffer, 0, bufferLen);
    var len = view.getInt32(0);

    if (len != view.byteLength - 4) {
        trueOrFalse(success, false);
        return -1;
    }

    var expectedCheckSum = view.getInt32(len);
    expectedCheckSum = expectedCheckSum >>> 0;

    var checkSum = adler32(new Uint8Array(buffer, 4, len - 4), len - 4);

    if (expectedCheckSum == checkSum) {
        trueOrFalse(success, true);
        return view.getInt32(4);
    }

    trueOrFalse(false);
    return -1;
}

function msgMap() {
    this.id = "";
    this.msgType = -1;
    this.timerId = -1;
}

function VitSDK() {
    // for websocket
    var _wsAddress = null;
    var _ws = null;

    // for login
    var _userId = null;
    var _userName = null;
    var _token = null;
    var _status = null; // default online

    // proto
    this._protoMsg = null;

    // map for <id, reqInfo>
    var _mapReq = null;

    // called when received notify message
    var _ntfyCallback = null;
    var _statusCallback = null;

    var _seq = null;

    // heartbeat interval timer id
    var _intervalTimerId = 0;

    // retry connect timer id
    var _retryTimerId = 0;

    // heartbeat timeout times
    var _heartBeatTimeoutTime = 0;

    // last retry time
    var _lastRetryTime = 0;

    this._eStatus = {
        unConnected:1,      // 未连接
        waitForConnect:2,   // 等待连接
        connecting:3,       // 连接中
        connected:4,        // 连接成功并返回 accesstoken
        tokenExpired:5,     // token 失效
        otherPlaceLogin:6   // 异地登录
    };
}

VitSDK.prototype.clear = function () {
    this._heartBeatTimeoutTime = 0;

    this._heartBeatTimeoutTime = 0;

    if (this._ws) {
        this._ws.onclose = null;
        this._ws.onopen = null;
        this._ws.onerror = null;
        this._ws.onmessage = null;
        this._ws.close();
        this._ws = null;
    }

    if (this._mapReq) {
        this._mapReq.forEach(function (val, key) {
            clearTimeout(val.timerId);
        }, this);

        this._mapReq.clear();
    }

    if (this._intervalTimerId != 0) {
        clearInterval(this._intervalTimerId);
        this._intervalTimerId = 0;
    }
}

VitSDK.prototype.bUnConnected = function (stat) {
    return stat == this._eStatus.unConnected;
}

VitSDK.prototype.bWaitForConnect = function (stat) {
    return stat == this._eStatus.waitForConnect;
}

VitSDK.prototype.bConnecting = function (stat) {
    return stat == this._eStatus.connecting;
}

VitSDK.prototype.bConnected = function (stat) {
    return stat == this._eStatus.connected;
}

VitSDK.prototype.bTokenExpired = function (stat) {
    return stat == this._eStatus.tokenExpired;
}

VitSDK.prototype.bOtherPlaceLogin = function (stat) {
    return stat == this._eStatus.otherPlaceLogin;
}

VitSDK.prototype.init = function (strHost, userId, userName, token,  ntfyCallback, statusCallback) {
    this._userId = userId;
    this._userName = userName;
    this._token = token;
    this._wsAddress = "ws://" + strHost;
    this._mapReq = new HashMap();
    var protoBuf = dcodeIO.ProtoBuf;

    this._protoMsg = protoBuf.loadProtoFile("https://static-app01.yugusoft.com/static/im/protobuf/vitmsg.proto").build();

    if (!this._protoMsg) {
        //console.log("init protoMsg failed");
        return;
    }

    if (ntfyCallback) {
        this._ntfyCallback = ntfyCallback;
    }

    if (statusCallback) {
        this._statusCallback = statusCallback;
    }

    this._status = this._protoMsg.chips_c.OnlineStat.ONLINE;

    this.connect();
};

VitSDK.prototype.setNtfyCallback = function (callback) {
    this._ntfyCallback = callback;
}

VitSDK.prototype.setStatusCallback = function (callback) {
    this._statusCallback = callback;
}

VitSDK.prototype.getAddress = function () {
    return this._wsAddress;
};

VitSDK.prototype.getSequence = function () {
    if (!this._seq) {
        this._seq = 0;
    }
    return ++this._seq;
}

VitSDK.prototype.connect = function () {
    this.clear();
    this._ws = new WebSocket(this._wsAddress);

    // this._ws.binaryType = 'arraybuffer';

    if (this._statusCallback) {
        this._statusCallback(this._eStatus.connecting);
    }
    var tmpThis = this;
    this._ws.onopen = function (evt) {
        tmpThis.onOpen(evt);
    };

    this._ws.onclose = function (evt) {
        tmpThis.onClose(evt);
    };
    
    this._ws.onmessage = function (evt) {
        tmpThis.onMessage(evt)
    };
    
    this._ws.onerror = function (evt) {
        tmpThis.onError(evt)
    };
};

VitSDK.prototype.retryStrategy = function () {
    if (this._lastRetryTime == 0) {
        this._lastRetryTime = 500;
    } else if(this._lastRetryTime < 30*1000) {
        this._lastRetryTime = this._lastRetryTime * 2;
    } else {
        this._lastRetryTime = 30*1000;
    }

    var tmpThis = this;
    setTimeout(function () {
        tmpThis.connect();
    }, this._lastRetryTime);
}

VitSDK.prototype.onOpen = function (evt) {
    this.sendHello();
};

VitSDK.prototype.onError = function (evt) {
    //console.log("onError code = [" + evt.code + "]" + " reason = [" + evt.reason + "]");
    this.retryStrategy();
};

VitSDK.prototype.onClose = function (evt) {
    //console.log("onClose code = [" + evt.code + "]" + " reason = [" + evt.reason + "]");
    this.retryStrategy();
};

VitSDK.prototype.parseMessage = function (type, msgBuffer) {
    var resp = null;
    switch (type)
    {
        case this._protoMsg.chips_c.RequestType.EHelloResp:
            resp = this._protoMsg.chips_c.HelloResp.decode(msgBuffer);
            break;

        case this._protoMsg.chips_c.RequestType.ELoginResp:
            resp = this._protoMsg.chips_c.LoginResp.decode(msgBuffer);
            break;

        case this._protoMsg.chips_c.RequestType.EOnlineResp:
            resp = this._protoMsg.chips_c.OnlineResp.decode(msgBuffer);
            break;

        case this._protoMsg.chips_c.RequestType.EHeartBeatResp:
            resp = this._protoMsg.chips_c.HeartBeatResp.decode(msgBuffer);
            break;

        case this._protoMsg.chips_c.RequestType.EChangeUserStatusResp:
            resp = this._protoMsg.chips_c.ChangeUserStatusResp.decode(msgBuffer);
            break;

        case this._protoMsg.chips_c.RequestType.ELogoutResp:
            resp = this._protoMsg.chips_c.LogoutResp.decode(msgBuffer);
            break;

        case this._protoMsg.chips_c.RequestType.EChatPriResp:
            resp = this._protoMsg.chips_c.ChatPriResp.decode(msgBuffer);
            break;

        case this._protoMsg.chips_c.RequestType.EChatGrpResp:
            resp = this._protoMsg.chips_c.ChatGrpResp.decode(msgBuffer);
            break;

        case this._protoMsg.chips_c.RequestType.EGroupNewResp:
            resp = this._protoMsg.chips_c.GroupNewResp.decode(msgBuffer);
            break;

        case this._protoMsg.chips_c.RequestType.EGroupUpdateResp:
            resp = this._protoMsg.chips_c.GroupUpdateResp.decode(msgBuffer);
            break;

        case this._protoMsg.chips_c.RequestType.EGroupDeleteResp:
            resp = this._protoMsg.chips_c.GroupDeleteResp.decode(msgBuffer);
            break;

        case this._protoMsg.chips_c.RequestType.EGroupDetailGetResp:
            resp = this._protoMsg.chips_c.GroupDetailGetResp.decode(msgBuffer);
            break;

        case this._protoMsg.chips_c.RequestType.EGroupMemberGetResp:
            resp = this._protoMsg.chips_c.GroupMemberGetResp.decode(msgBuffer);
            break;

        case this._protoMsg.chips_c.RequestType.EGroupMemberAddResp:
            resp = this._protoMsg.chips_c.GroupMemberAddResp.decode(msgBuffer);
            break;

        case this._protoMsg.chips_c.RequestType.EGroupMemberDeleteResp:
            resp = this._protoMsg.chips_c.GroupMemberDeleteResp.decode(msgBuffer);
            break;

        case this._protoMsg.chips_c.RequestType.EGroupListGetResp:
            resp = this._protoMsg.chips_c.GroupListGetResp.decode(msgBuffer);
            break;

        case this._protoMsg.chips_c.RequestType.EGroupDetailMemberGetResp:
            resp = this._protoMsg.chips_c.GroupDetailMemberGetResp.decode(msgBuffer);
            break;

        case this._protoMsg.chips_c.RequestType.EGroupExitResp:
            resp = this._protoMsg.chips_c.GroupExitResp.decode(msgBuffer);
            break;

        case this._protoMsg.chips_c.RequestType.EGroupHandOverResp:
            resp = this._protoMsg.chips_c.GroupHandOverResp.decode(msgBuffer);
            break;

        case this._protoMsg.chips_c.RequestType.EIMMessageReadedResp:
            resp = this._protoMsg.chips_c.IMMessageReadedResp.decode(msgBuffer);
            break;

        case this._protoMsg.chips_c.RequestType.ESessionSettingResp:
            resp = this._protoMsg.chips_c.SessionSettingResp.decode(msgBuffer);
            break;

        case this._protoMsg.chips_c.RequestType.ELoginWithTokenResp:
            resp = this._protoMsg.chips_c.LoginWithTokenResp.decode(msgBuffer);
            break;

        // 下边的都是 notify
        case this._protoMsg.chips_c.RequestType.EChatNotify:
            resp = this._protoMsg.chips_c.ChatNotify.decode(msgBuffer);
            break;

        case this._protoMsg.chips_c.RequestType.EOtherPlaceLogin:
            resp = this._protoMsg.chips_c.OtherPlaceLogin.decode(msgBuffer);
            break;

        case this._protoMsg.chips_c.RequestType.EGroupPushNotify:
            resp = this._protoMsg.chips_c.GroupPushNotify.decode(msgBuffer);
            break;

        case this._protoMsg.chips_c.RequestType.EGroupRelPushNotify:
            resp = this._protoMsg.chips_c.GroupRelPushNotify.decode(msgBuffer);
            break;

        case this._protoMsg.chips_c.RequestType.EIMMessageReadedNotify:
            resp = this._protoMsg.chips_c.IMMessageReadedNotify.decode(msgBuffer);
            break;

        case this._protoMsg.chips_c.RequestType.ERecverReadPushNotify:
            resp = this._protoMsg.chips_c.RecverReadPushNotify.decode(msgBuffer);
            break;

        case this._protoMsg.chips_c.RequestType.ESessionSettingNotify:
            resp = this._protoMsg.chips_c.SessionSettingNotify.decode(msgBuffer);
            break;

        case this._protoMsg.chips_c.RequestType.EUniversalPushNotify:
            resp = this._protoMsg.chips_c.UniversalPushNotify.decode(msgBuffer);
            break;

        default:
            break;
    }

    return resp;
}

VitSDK.prototype.onMessage = function (evt) {
    var bRet = new Boolean(false);
    var msgBuf = dcodeIO.ProtoBuf.ByteBuffer.fromBase64(evt.data);


    var type = parsePretreatment(msgBuf.buffer, msgBuf.limit,bRet);

    if (bRet == false) {
        //console.log("onMessage parsePretreatment failed! type = [" + type.toString(16) +  "]");
        return;
    }

    var view = new DataView(msgBuf.buffer, 0, msgBuf.limit);
    var len = view.getInt32(0);
    var msgBuffer = new Uint8Array(msgBuf.buffer, 2 * 4, len - 2 * 4);
    // //console.log("onMessage type:" + type.toString(16));

    var resp = this.parseMessage(type, msgBuffer);

    if (!resp) {
        //console.log("onMessage parseMessage failed! type = [" + type.toString(16) + "]");
        return;
    }

    //console.log("onMessage type = [" + type.toString(16) + "]");

    if (type < 0x02000001) {
        var reqInfo = this._mapReq.get(resp.get_id());
        if(reqInfo){
            clearTimeout(reqInfo.timerId);

            this._mapReq.remove(resp.get_id());

            resp.set_id(reqInfo.id);
            if (reqInfo.fun) {
                reqInfo.fun(type, resp);
            }
        }

    }

    switch (type) {
        case this._protoMsg.chips_c.RequestType.EHelloResp:
            this.onHelloResp(resp);
            break;
        case this._protoMsg.chips_c.RequestType.ELoginWithTokenResp:
            this.onLoginWithTokenResp(resp);
            break;
        case this._protoMsg.chips_c.RequestType.EOnlineResp:
            this.onOnlineResp(resp);
            break;
        case this._protoMsg.chips_c.RequestType.EHeartBeatResp:
            this.onHeartBeatResp(resp);
            break;
        case this._protoMsg.chips_c.RequestType.EOtherPlaceLogin:
            this.onOtherPlaceLogin(resp);
            break;
        default:
            if (type >= 0x02000001) {
                this._ntfyCallback(type, resp);
            }
            break;
    }
};

VitSDK.prototype.onHelloResp = function (resp) {
    if (resp.get_errorno() == 0) {
        this.sendLoginWithToken();
    } else {
        this.retryStrategy();
    }
}

VitSDK.prototype.onLoginWithTokenResp = function (resp) {
    if (resp.get_errorno() == 0) {
        this.sendOnline();
    } else {
        if (this._statusCallback) {
            this._statusCallback(this._eStatus.tokenExpired);
            this.clear();
        }
    }
}

VitSDK.prototype.onOnlineResp = function (resp) {
    if (resp.get_errorno() == 0) {
        this._lastRetryTime = 0;
        if (this._statusCallback) {
            this._statusCallback(this._eStatus.connected, resp.get_access_token());

            this.sendHeartBeat();

            var tmpThis = this;
            this._intervalTimerId = setInterval(function () {
                tmpThis.sendHeartBeat();
            }, 20000);
        }
    } else {
        if (this._statusCallback) {
            this._statusCallback(this._eStatus.unConnected);
            this.retryStrategy();
        }
    }
}

VitSDK.prototype.onHeartBeatResp = function (resp) {
    if (resp.get_errorno() == 0) {
        this._heartBeatTimeoutTime = 0;
    }
}

VitSDK.prototype.onOtherPlaceLogin = function (resp) {
    if (this._statusCallback) {
        this._statusCallback(this._eStatus.otherPlaceLogin, resp.get_user_uuid(), resp.get_device_type());

        this.clear();
    }
}

VitSDK.prototype.sendHello = function () {

    var helloReq = new this._protoMsg.chips_c.HelloReq();
    helloReq.set_param1(1);
    helloReq.set_param2(2);
    helloReq.set_id(this.getSequence());
    var param2 = helloReq.get_param2();
    this.sendMsg(helloReq, this._protoMsg.chips_c.RequestType.EHelloReq);

}

VitSDK.prototype.sendLoginWithToken = function () {
    var req = new this._protoMsg.chips_c.LoginWithTokenReq();
    req.set_id(this.getSequence());
    req.set_token(this._token);
    req.set_user_uuid(this._userId);
    this.sendMsg(req, this._protoMsg.chips_c.RequestType.ELoginWithTokenReq);
}

VitSDK.prototype.sendOnline = function () {
    var req = new this._protoMsg.chips_c.OnlineReq();
    req.set_id(this.getSequence());
    req.set_comp_uuid(""); // todo:
    req.set_identifier(""); //todo:
    req.set_user_uuid(this._userId);
    req.set_status(this._status);
    req.set_device_type(this._protoMsg.chips_c.DeviceType.DEV_PC);
    req.set_user_name(this._userName);
    req.set_token(this._token);
    req.set_app_version("1"); // 写死
    this.sendMsg(req, this._protoMsg.chips_c.RequestType.EOnlineReq);
}

VitSDK.prototype.sendHeartBeat = function () {
    var req = new this._protoMsg.chips_c.HeartBeatReq();
    req.set_id(this.getSequence());
    //console.log("EHeartBeatReq ", req);
    this.sendMsg(req, this._protoMsg.chips_c.RequestType.EHeartBeatReq);
}

VitSDK.prototype.sendMsg = function (msg, type, timeout, callback) {
    if(!this._ws)
        return false;

    var id = msg.get_id();
    msg.set_id(this.getSequence());
    var msgBuf = new Uint8Array(msg.toArrayBuffer());
    var len = msgBuf.byteLength + 2 * 4;
    var buf = new ArrayBuffer(len + 4);
    var bufView = new DataView(buf);
    bufView.setInt32(0, len);
    bufView.setUint32(4, type >>> 0);
    var uint8MsgView = new Uint8Array(buf, 8, msgBuf.byteLength);
    uint8MsgView.set(msgBuf, 0);

    var checkMsgView = new Uint8Array(buf, 4, msgBuf.byteLength+4);
    var checkNum = adler32(checkMsgView, checkMsgView.byteLength);
    bufView.setUint32(8+msgBuf.byteLength, checkNum);
    var uintBuf = new Uint8Array(buf, 0);
    var byteBuf =  dcodeIO.ProtoBuf.ByteBuffer.fromUint8Array(uintBuf);

    var tmpThis = this;
    var timerId = setTimeout(function () {
        tmpThis.handleTimeout(timerId, msg.get_id(), type);
    }, timeout?timeout:10000);
    this._mapReq.set(msg.get_id(), {id:id, type:type, timerId:timerId, fun:callback});
    this._ws.send(byteBuf.toBase64());
    if (type == this._protoMsg.chips_c.RequestType.ELogoutReq) {
        this._ws.close(0, "LogoutReq Received!");
    }
};

VitSDK.prototype.handleTimeout = function (timerId, seqId, type) {
    //console.log("handleTimeout", timerId, seqId, type);
    var reqInfo = this._mapReq.get(seqId);
    if (!reqInfo) {
        return;
    }

    this._mapReq.remove(seqId);

    if (type == this._protoMsg.chips_c.RequestType.EHelloReq) {
        if (this._statusCallback) {
            this._statusCallback(this._eStatus.unConnected);
        }
        this.retryStrategy();
    } else if (type == this._protoMsg.chips_c.RequestType.ELoginWithTokenReq) {
        if (this._statusCallback) {
            this._statusCallback(this._eStatus.unConnected);
        }
        this.retryStrategy();
    } else if (type == this._protoMsg.chips_c.RequestType.EHeartBeatReq) {
        if (++this._heartBeatTimeoutTime == 3) {
            if (this._statusCallback) {
                this._statusCallback(this._eStatus.unConnected);
            }

            this.retryStrategy();
        }
    } else if (type == this._protoMsg.chips_c.RequestType.EOnlineReq) {
        if (this._statusCallback) {
            this._statusCallback(this._eStatus.unConnected);
        }

        this.retryStrategy();
    }
    
    if (reqInfo.fun) {
        var timeout = new this._protoMsg.chips_c.TimeoutMsg();
        timeout.set_id(reqInfo.id);
        timeout.set_type(type);
        reqInfo.fun(this._protoMsg.chips_c.RequestType.ETimeout, timeout);
    }
};



// demo

// var sdk = new VitSDK();
//
// var xmlHttp = new XMLHttpRequest();
// xmlHttp.open("post", "http://test-app01.yugusoft.com/ftask/proxy/user/login.json", false);
// xmlHttp.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
// xmlHttp.onreadystatechange = function () {
//     if (xmlHttp.readyState == 4) {
//         if (xmlHttp.status == 200) {
//             rsp = JSON.parse(xmlHttp.responseText);
//             //console.log(rsp["token"]);
//             sdk.init("test-im.yugusoft.com:17001", rsp["user"]["uuid"], rsp["user"]["nick_name"], rsp["token"], ntfyCallback, statusCallback);
//         }
//     } else {
//
//     }
// }
//
// xmlHttp.send("identify=28940&password=654321&build=6201&plat=Window");
//
// function ntfyCallback(type, ntfy) {
//     //console.log("ntfyCallback type=" + type);
// }
//
// function statusCallback(type, msg) {
//     //console.log("statusCallback type=" + type);
// }



