<template>
	<div class="custom_detail" v-bind:class="classObject(content)" @click.prevent="isDbClickImg" v-html="filterLinkShowId(content)"></div>
</template>
<script>

  	import {callClient,filterLink} from '@/config/utils'
	import Toast from '@/modules/widget/toast'
	import PreviewImg from '@/modules/widget/preview-img'
	export default{
		props:["content"],
		methods:{
			filterLinkShowId(content){
				content = content || "";
	        	return filterLink(content);
	      	},
		    isDbClickImg(e){
		      var plat = getPlat();
	          if(e.target.tagName == 'A'){
		            var src = e.target.getAttribute('href');
		            if(src && src.indexOf('javascript') < 0){
		                if(plat == 'android' || plat == 'iphone'){
		                    var apiName = 'click_hyperlinks';
		                    var params = {
		                        "href": src
		                    }
		                    callClient(apiName,params);
		                }else{
		                    if(src.indexOf('http') < 0){
		                        src = 'http://'+src;
		                    }
		                    window.open(src);
		                }
		            }
		        }else if(e.target.tagName == 'IMG'){
	              var src=e.target.getAttribute('src');
	              if(/^\http/.test(src)){
	                  //dblclick 双击查看原图
	                  if(plat=='android'||plat=='iphone'){
	                    var apiName = 'view_task_image';
	                    var params = {
	                        "url": src
	                    }
	                    callClient(apiName,params)
	                  }else{
	                     // window.open(src)
	                     PreviewImg({
		                    	url:src
		                    })
	                  }
	              }
	          }
	          return false;
		    },
      classObject(content){
        let flag = false
        // if (content && content.length > 0){
        //   flag = true
        // }
        return {
          'minHeight': flag
        }
      }
		}
	}
</script>


<style rel="stylesheet/less" lang="less" scoped>
  @import "~@/config/config.less";
  .custom_detail{
    font-size: 15px;
    &.minHeight{
      min-height: 60px;
    }
  }
  /deep/ img{
    max-width: 100%;
  }
  /deep/ a{
  	color: #06c;
  	text-decoration: underline;
  }


  /deep/ .get_showid_info{
    color: #06c;
    text-decoration: underline;
    cursor: pointer;
  }
</style>














