<template>
  <div class="files">
    <div v-for="(item,index) in files" :key="item.uuid" :item="item" class="files-item"  @click="download(item)">
      <div :class="['icon_'+item.expand,'icon']"></div>
      <div class="files-item-r">
        <div class="fileInfo">
          <div class="file-name">{{item.name | filterFilesName(item.expand)}}</div>
          <div class="file-size">{{item.size | filterFilesSize}}</div>
        </div>
        <div class="operate">
          <div>下载</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
    import {callClient} from '@/config/utils'
    export default{
      props:['files'],
      methods:{
        download(item){
          // window.open(item.url);
          var plat = getPlat();
          if(plat == 'android' || plat == 'iphone'){
            var apiName = 'view_task_files';
                  var params = {
                      "url": item.url,
                      "name":item.name,
                      "size":item.size
                  }
                  callClient(apiName,params)
          }else{
            window.open(item.url)
          }




        }
      }
    }
</script>
<style rel="stylesheet/less" lang="less" scoped>
  @import "~@/config/config.less";
  .files {
    flex-wrap: wrap;
    display: flex;
    justify-content: flex-start;
    .files-item {

      margin-bottom: 10px;
      display: flex;
      margin-right: 10px;
      justify-content: flex-start;
      .icon, .file-name, .file-size {
        margin-right: 10px;
      }
      .files-item-r {
        display: flex;
        flex-direction: column;
        .fileInfo, .operate {
          display: flex;
          justify-content: flex-start;
          font-size: 10px;
          color: #a4a4a4;
        }
        .file-name {
          font-size: 12px;
          color: #585858;
        }
        .operate {
          cursor: pointer;
          &:hover {
            color:#54a1ff;
          }
        }

      }
    }
    .files-item .icon {
      float:left;
      width: 26px;
      height: 32px;
      overflow: hidden;
      background: url(~@/modules/widget/common/images/new_files_icons.png) -30px -36px no-repeat;
    }
    .files-item .icon_zip{ background-position: -142px -36px;}
    .files-item .icon_xls,.files-item .icon_xlsx{ background-position: -254px -36px;}
    .files-item .icon_doc,.files-item .icon_docx{ background-position: -366px -36px;}
    .files-item .icon_ppt,.files-item .icon_pptx{ background-position: -534px -36px;}
    .files-item .icon_vsd{ background-position: -646px -36px;}
    .files-item .icon_pdf{ background-position: -702px -36px;}
    .files-item .icon_txt{ background-position: -758px -36px;}
    .files-item .icon_apk{ background-position: -814px -36px;}
    .files-item .icon_exe{ background-position: -870px -36px;}
    .files-item .icon_ipa{ background-position: -926px -36px;}
    .files-item .icon_avi,.files-item .icon_mov,.files-item .icon_3gp{ background-position: -982px -36px;}
    .files-item .icon_mp3,.files-item .icon_wav,.files-item .icon_mp4,.files-item .icon_wma{ background-position: -30px -99px;}
    .files-item .icon_rar{ background-position: -142px -99px;}
    .files-item .icon_psd{ background-position: -198px -99px;}
    .files-item .icon_key{ background-position: -254px -99px;}
    .files-item .icon_dmg{ background-position: -310px -99px;}
    .files-item .icon_ai{ background-position: -366px -99px;}
    .files-item .icon_cad{ background-position: -86px -36px;}
    .files-item .icon_mmap{ background-position: -198px -36px;}
    .files-item .icon_jpg,.files-item .icon_jpeg{ background-position: -478px -36px;}
    .files-item .icon_png,.files-item .icon_PNG{ background-position: -590px -36px;}
    .files-item .icon_gif,.files-item .icon_GIF{ background-position: -1038px -36px;}
  }

</style>
