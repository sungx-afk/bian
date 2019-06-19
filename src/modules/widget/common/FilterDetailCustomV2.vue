<template>
	<div class="custom_detail" @click.prevent="isClickLinkShowId" @dblclick="isDbClickImg" v-html="filterImg(filterLinkShowId(content))" ref="content"></div>
</template>
<script>

  	import {filterTaskShowId,filterLink,callClient} from '@/config/utils'
	import Toast from '@/modules/widget/toast'
	import PicturePreview from '@/modules/widget/picture-preview'

	export default{
		props:["content"],
		methods:{
			filterLinkShowId(content){
				content = content || "";
		        return filterTaskShowId(filterLink(content));
		    },
		    filterImg(content){
		      	return content.replace(/<img([\s\S]*?)src\s*=\s*(['"])([\s\S]*?)\2([^>]*)>/gi, '<img$1data-src=$2$3$2$4>');
		    },
		    loadImg(n){
		      	const imgs = this.$refs.content.querySelectorAll('img');
		      	const images = [].map.call(imgs, item => item);
		      	this.imgLazyLoad = new LazyLoad(images);
		      	// for(let i=0;i<imgs.length;i++){
		      	// 	let item = imgs[i];
		      	// 	if(item.dataset.src){
		      	// 		item.src = item.dataset.src;
		      	// 	}
		      	// }
		    },
			isClickLinkShowId(e){
		        var plat = getPlat()
		        if(e.target.tagName == 'A'){
		            var src = e.target.getAttribute('href');
		            if(src && src.indexOf('javascript') < 0){
		                if(plat == 'mac' || plat == 'windows'){
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
		        }else{
		            if(e.target.className == 'get_showid_info'){
		                var show_id = e.target.innerHTML;
		                if(plat == 'mac' || plat == 'windows'){
		                    var apiName = 'open_task';
		                    var params = {
		                        "showId": show_id
		                    }
		                    callClient(apiName,params);
		                }else{
		                    var url = '/ftask/mobile/index.html#/tasks/'+show_id+'?opt=show_id';
		                    window.open(url);
		                }
		            }else if(e.target.className == 'audio_img'){
		            	var audio = e.target.parentNode.parentNode.parentNode.getElementsByTagName('audio');
		            	if(audio && audio.length > 0){
		            		var url = audio[0].getAttribute('src');
		            		if(url){
		            			if(plat == 'mac' || plat == 'windows'){
				                    var apiName = 'audio_play';
				                    var params = {
				                        "src": url
				                    }
				                    callClient(apiName,params);
				                }else{
				                    Toast({
				                    	content:"暂不支持播放语音",
				                    	type:"warn"
				                    })
				                    return false;
				                }
		            		}
		            	}
		            }else if(e.target.tagName == 'IMG'){
		            	var src=e.target.getAttribute('src')
		            	let files = [];
						var temp = {
							name:"图片",
							url:src
						}
						files.push(temp);
						PicturePreview({
							files:files,
							callback:() => {

							}
						})



		          	}
		        }
		    },
		    isDbClickImg(e){
		          if(e.target.tagName == 'IMG'){
		              var src=e.target.getAttribute('src'),plat = localStorage.getItem('app_plat').toLowerCase();
		              if(/^\http/.test(src)){
		                  //dblclick 双击查看原图
		                  if(plat=='mac'||plat=='windows'){
		                    var apiName = 'view_source_image';
		                    var params = {
		                        "url": src
		                    }
		                    iydf.bridge.prepare("pc");
		                    var event = {
		                        apiName: apiName,
		                        params: params,
		                        cb: function(str) {
		                        },
		                        fakeret: "fail"
		                    };
		                    iydf.bridge.call(event);
		                  }else{
		                     window.open(src)
		                  } 
		                   
		              }
		          }
		    }, 
		},
		updated(){
			this.$nextTick(() => {
				this.loadImg();
			})
		},
		mounted(){
			this.$nextTick(() => {
				this.loadImg();
			})
		}
	}
</script>


<style rel="stylesheet/less" lang="less" scoped>
  @import "~@/config/config.less";
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














