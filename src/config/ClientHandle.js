/*客户端对接 start*/
export function callClient(apiName,params){
  iydf.bridge.prepare("");
  var event = {
    apiName: apiName,
    params: params,
    cb: function(str) {
    },
    fakeret: "fail"
  };
  iydf.bridge.call(event);
}

// 便签附件上传成功
window.uploadSuccess = function(param){
  eventHub.$emit('noteAttachUploadSuccess',param)
}

// 客户端调用刷新便签列表方法
window.refreshNoteList = function(){
  eventHub.$emit('needRefreshNoteList')
}


window.androidGoBack = function(){
  eventHub.$emit('androidGoBack')
}

// 文档下载完成
window.documentDownloadSuccess = function(param){
  eventHub.$emit('documentDownloadSuccess',param)
}
/*客户端对接 end*/