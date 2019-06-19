<template>
	<li class="item"
		@click="operate">
		<div class="item-content">
			<div :class="'icon ' + item.expand"></div>
			<div class="content">
				<div class="name">{{ fileName }}</div>
				<div class="size">{{ fileSize }}</div>
			</div>
      <div class="operate-area" v-if="fileProgress == 100">
        <i class="done iconfont icon-duigou1"></i>
        <i class="more iconfont icon-gengduo-copy" v-if="!this.hideBtn" @click.stop="deleteFile"></i>
      </div>
		</div>
    <div class="weui-progress">
      <div class="weui-progress__bar" :class="{'success':(fileProgress == 100)}">
        <div class="weui-progress__inner-bar js_progress" :style="{ 'width': fileProgress + '%' }"></div>
      </div>
    </div>
	</li>
</template>

<script>
	import ActionSheet from '@/modules/widget/action-sheet'
	import PreviewImg from '@/modules/widget/preview-img'
	import Dialog from '@/modules/widget/dialog'
  	import {callClient} from '@/config/utils'


	export default {
		props: {
			item: {
				type: Object,
				default: null
			},
			index: {
				type: Number,
				default: 0
			},
			delete: {
				type: Function,
				default: null
			},
			hideBtn:{
				type:Boolean,
				default: false
			}
		},
		methods: {
			operate(){
				// let itemList = ['打开'];
				// if(!this.hideBtn){
				// 	itemList.push('删除')
				// }
        //
				// ActionSheet({
	      // 	itemList: itemList,
	      // 	callback: index => {
	      // 		if(index == 0){
	      // 			// const expand = this.item.expand.toLowerCase();
	      // 			// if(expand == 'jpg' || expand == 'jpeg' || expand == 'gif' || expand == 'bmp' || expand == 'png' || expand == 'jpe' || expand == 'cur'|| expand == 'svg' || expand == 'svgz' || expand == 'tif' || expand == 'tiff' || expand == 'ico'){
	      // 			// 	PreviewImg({
	      // 			// 		url: this.item.url
	      // 			// 	})
	      // 			// }else{
	      // 			// 	window.open(this.item.url);
	      // 			// }
	      // 			var plat = getPlat();
	      // 			if(plat == 'android' || plat == 'iphone'){
	      // 				var apiName = 'view_task_files';
	      //               var params = {
	      //                   "url": this.item.url,
	      //                   "name":this.item.name,
	      //                   "size":this.item.size
	      //               }
	      //               callClient(apiName,params)
	      // 			}else{
	      // 				window.open(this.item.url)
	      // 			}
        //
        //
        //
        //
        //
        //
	      // 		} else if (index == 1){
	      // 			Dialog({
	      // 				content: '确认删除该文件？',
	      // 				callback: () => {
	      // 					this.delete(this.index)
	      // 				}
	      // 			})
	      // 		}
	      // 	}
	      // })
        var plat = getPlat();
        if(plat == 'android' || plat == 'iphone'){
          var apiName = 'view_task_files';
          var params = {
            "url": this.item.url,
            "name":this.item.name,
            "size":this.item.size
          }
          callClient(apiName,params)
        }else{
          window.open(this.item.url)
        }
			},
      deleteFile(){
        let itemList = ['删除'];
        ActionSheet({
          itemList: itemList,
          callback: index => {
            if (index === 0){
              Dialog({
                content: '确认删除该文件？',
                callback: () => {
                  this.delete(this.index)
                }
              })
            }
          }
        })
      },
		},
		computed: {
      fileProgress(){
        var progress = this.item.progress || 0;
        return this.item.uuid ?  100 : progress;
      },
			fileSize(){
				const size = this.item.size;
		    if(size < 1024){
		      return size + 'B'
		    }else if(size > 1024 && size <1048576){
		      return (size/1024).toFixed(2) + 'K'
		    }else{
		      return (size/1048576).toFixed(2) + 'M'
		    }
			},
			fileName(){
				const expand = this.item.expand;
				const name = this.item.name;
    		const totalLen = expand.length + 11;
    		const lastLen = expand.length + 3;
    		if(name.length > totalLen){
        		return name.substr(0,8) + '...' + name.substr(name.length-lastLen, lastLen);
    		}else{
        		return name;
    		}
			},
		},
		// data(){
		// 	return {
		// 		touchTime: null,
		// 	}
		// }
	}
</script>

<style rel="stylesheet/less" lang="less" scoped>
  @import "~@/config/config.less";

	.item{
		padding-top: 14px;
		margin-left: 14px;
		border-top: 1px solid @BORDER_COLOR;
		&:first-child{
			border-top: none;
		}
		.item-content{
			display: flex;
      align-items: center;
			padding-bottom: 14px;
			.icon{
				flex-shrink: 0;
				width: 36px;
				height: 36px;
				background-repeat: no-repeat;
				background-position: center;
				&.doc,&.docx{
					background-image: url(./images/03.png);
				}
				&.xls,&.xlsx{
					background-image: url(./images/04.png);
				}
				&.ppt,&.pptx{
					background-image: url(./images/08.png);
				}
				&.vsd{
					background-image: url(./images/01.png);
				}
				&.pdf{
					background-image: url(./images/02.png);
				}
				&.apk{
					background-image: url(./images/11.png);
				}
				&.dws,&.dwt,&.dxf,&.dwg{
					background-image: url(./images/20.png);
				}
				&.mmap{
					background-image: url(./images/20.png);
				}
				&.xmind{
					background-image: url(./images/21.png);
				}
				&.mm{
					background-image: url(./images/21.png);
				}
				&.exe,&.msi,&.dmg{
					background-image: url(./images/10.png);
				}
				&.ipa{
					background-image: url(./images/09.png);
				}
				&.zip,&.rar{
					background-image: url(./images/17.png);
				}
				&.psd{
					background-image: url(./images/13.png);
				}
				&.key{}
				&.ai{
					background-image: url(./images/14.png);
				}
				&.txt{
					background-image: url(./images/05.png);
				}
				&.torrent{
					background-image: url(./images/12.png);
				}
				&.dir{
					background-image: url(./images/18.png);
				}
				&.jpg,&.jpeg,&.gif,&.bmp,&.png,&.jpe,&.cur,&.svg,&.svgz,&.tif,&.tiff,&.ico{
					background-image: url(./images/16.png);
				}
				&.wma,&.wav,&.mp3,&.aac,&.ra,&.ram,&.mp2,&.ogg,&.aif,&.mpega,&.amr,&.mid,&.midi,&.m4a{
					background-image: url(./images/06.png);
				}
				&.wmv,&.rmvb,&.mpeg4,&.mpeg2,&.flv,&.avi,&.mpga,&.qt,&.rm,&.wmz,&.wmd,&.wvx,&.wmx,&.wm,&.swf,&.mpg,&.mp4,&.mkv,&.mpeg,&.mov,&.asf{//,&.3gp
					background-image: url(./images/07.png);
				}
			}
			.content{
				flex-grow: 1;
	      min-width: 0;
	      margin-left: 10px;
	      .name{
	      	font-size: 14px;
	        color: @FONT_COLOR_SECOND;
	        overflow: hidden;
	        white-space: nowrap;
	        text-overflow: ellipsis;
	        line-height: 20px;
	      }
	      .size{
	      	font-size: 11px;
	      	color: @FONT_COLOR_FOUR;
	      	line-height: 16px;
	      }
			}
      .operate-area{
        margin-right: 20px;
        .iconfont{
          font-size: 18px;
        }
        .done{
          color: #09BB07;
        }
        .more{
          color: @FONT_COLOR_THIRD;
          margin-left: 10px;
        }
      }
		}
    .weui-progress{
      .weui-progress__bar{
        &.success{
          display: none;
        }
      }
    }
	}
</style>
