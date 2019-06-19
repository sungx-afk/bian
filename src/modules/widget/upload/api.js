import config_server from '@/config/config'
const api = config_server.server_api;
const proxy = config_server.server_user;
/**
 *获获取 uptoken
 *@param
 *@param
 *@param
 *
 */
export const filesQiniuUploadTicket = ({ reqType, name, expand, size, resId, folderId, projectId }, successCb, erroCb) => {
  const params = {
    req_type: reqType,
    name: name,
    expand: expand,
    size: size
  }
  if(!!resId){
    params.res_id = resId;
  }
  if(!!folderId){
    params.folder_id = folderId;
  }
  if(!!projectId){
    params.project_id = projectId;

  }

  $axios.get(`${api}/files/qiniu/upload_ticket.json`, { params }).then((response) => {
    successCb(response.data)
  }).catch((error) => {
    erroCb && erroCb(error)
  });
}

export const mkFileRequest = ({url,data,headers},successCb, erroCb) =>{

  let config = {
    method: 'POST',
    url: url,
    headers:headers,
    data:data
  }
  $axios(config).then((response) => {
    successCb(response.data)
  }).catch((error) => {
    erroCb && erroCb(error)
  });
}
