import config_server from '@/config/config'
const api = config_server.server_api;

/**
 * 获取评论列表
 * @param start
 * @param limit
 * @param subjectId
 * @param successCb
 * @param erroCb
 */
export function getCommentList({ subjectId, start, limit ,type}, successCb, erroCb){
  var params = {
    subject_id: subjectId,
    start,
    limit
  }
  if(type){
    params.type = type;
  }
  $axios.get(api+'/comment/list.json', {
    params: params
  }).then(response => {
    successCb(response.data)
  }).catch(error => {
    erroCb && erroCb(error)
  });
}
