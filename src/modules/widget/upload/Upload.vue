<template>
	<div class="weui-uploader__bd">
	  <ul class="weui-uploader__files">
	      <li class="weui-uploader__file"
	      :class="{ 'weui-uploader__file_status': item.error || !item.uuid }"
	      v-for="(item, index) in file"
	      :key="index"
	      @click="operate(index)">
	      	<img class="img-icon" :src="item.url" v-if="isImage(item.expand)">
	      	<div :class="`icon ${item.expand}`"v-if="!isImage(item.expand)"></div>
	      	<div class="weui-uploader__file-content" v-if="item.error">
	          <i class="weui-icon-warn"></i>
	        </div>
	        <div class="weui-uploader__file-content" v-if="!item.uuid">{{ item.progress }}%</div>
	      </li>
	  </ul>
	  <div class="weui-uploader__input-box uploa-files-box">
	  	<div :id="uploadId" class="uploa-files-box-btn"></div>
	  </div>
	</div>
</template>

<script>
	import Toast from '@/modules/widget/toast'
	import ActionSheet from '@/modules/widget/action-sheet'
	import PreviewImg from '@/modules/widget/preview-img'
  import config_server from '@/config/config'
  import * as api from './api.js';


	export default {
		props: {
			list: {
				type: Array,
				default: Array
			},
			reqType: {
				type: String,
				default: 'general_file'
			},
			folderId: {
				type: String,
				default: null
			},
			projectId: {
				type: String,
				default: null
			},
			resId: {
				type: String,
				default: null
			},
			update: {
				type: Function,
				default: null
			}
		},
		methods: {
			save(){
				const file = this.file.filter(item => !item.error && !!item.uuid).map(item => {
          return {
            name: item.name,
            size: item.size,
            uuid: item.uuid,
            url: item.url,
            expand: item.expand
          }
        });
      	this.update && this.update(file);
      },
			updatePercent(id, percent){
        const index = this.file.findIndex(item => {
          return (id == item.id)
        })
        if(index >= 0){
          this.file[index].progress = percent;
        }
    	},
    	updateUuidUrl(id, uuid, url){
        const index = this.file.findIndex(item => {
          return (id == item.id)
        })
        if(index >= 0){
          this.file[index].uuid = uuid
          this.file[index].url = url
        }
      },
      updateUuidExpand(id, uuid, expand){
        const index = this.file.findIndex(item => {
          return (id == item.id)
        })
        if(index >= 0){
          this.file[index].uuid = uuid
          this.file[index].expand = expand
        }
      },
      updatedUrl(id, url){
        const index = this.file.findIndex(item => {
          return (id == item.id)
        })
        if(index >= 0){
          this.file[index].url = url
        }
      },
      deleteItem(index){
        this.file.splice(index, 1);
        this.save();
      },
      operate(index){
				ActionSheet({
	      	itemList: ['打开', '删除'],
	      	callback: i => {
	      		if(i == 0){
	      			const expand = this.file[index].expand.toLowerCase();
	      			if(expand == 'jpg' || expand == 'jpeg' || expand == 'gif' || expand == 'bmp' || expand == 'png' || expand == 'jpe' || expand == 'cur'|| expand == 'svg' || expand == 'svgz' || expand == 'tif' || expand == 'tiff' || expand == 'ico'){
	      				PreviewImg({
	      					url: this.file[index].url
	      				})
	      			}else{
	      				window.open(this.file[index].url);
	      			}
	      		} else if (i == 1){
	      			this.deleteItem(index)
	      		}
	      	}
	      })
			},
			previewImage(files){
				//plupload中为我们提供了mOxie对象
				files.forEach(item => {
					if (item && /image\//.test(item.type)){ //确保文件是图片
	      		if (item.type == 'image/gif') { //gif使用FileReader进行预览,因为mOxie.Image只支持jpg和png
	      			let fr = new mOxie.FileReader();
	            fr.onload = () => {
	                this.updatedUrl(item.id, fr.result);
	                fr.destroy();
	                fr = null;
	            }
	            fr.readAsDataURL(item.getSource());
	      		}else{
		      		let preloader = new mOxie.Image();
		          preloader.onload = () => {
		              preloader.downsize(77, 77);//先压缩一下要预览的图片,宽300，高300
		              const imgsrc = preloader.type == 'image/jpeg' ? preloader.getAsDataURL('image/jpeg', 80) : preloader.getAsDataURL(); //得到图片src,实质为一个base64编码的数据 jpeg图片质量较高 源码中默认压缩到90 这里压缩到80
		              this.updatedUrl(item.id, imgsrc);
		              this.updatedUrl();
		              preloader.destroy();
		              preloader = null;
		          };
		          preloader.load(item.getSource());
		      	}
	      	}
				})
			},
			isImage(expand){
				return expand == 'jpg' || expand == 'gif' || expand == 'png' || expand == 'jpeg';
			},
			uploader(){
      	Qiniu.uploader({
          disable_statistics_report: false,
          runtimes: 'html5,flash,html4',
          browse_button: this.uploadId,
          uptoken_func: file =>{    // 在需要获取 uptoken 时，该方法会被调用
            return file.uptoken;
          },
          get_new_uptoken: true,
          domain: 'http://qiniu-file01.yugusoft.com',     // bucket 域名，下载资源时用到，如：'http://xxx.bkt.clouddn.com/' **必需**
          max_file_size: '1000mb',             // 最大文件体积限制
          flash_swf_url: '/static/plupload/js/Moxie.swf',  //引入 flash,相对路径
          max_retries: 3,                     // 上传失败最大重试次数
          chunk_size: '4mb',                  // 分块上传时，每块的体积
          auto_start: false,                   // 选择文件后自动上传，若关闭需要自己绑定事件触发上传,
          init: {
            FilesAdded: (up, files) => {
            	const promiseArray = new Array();

              files.forEach(item => {
              	if(!!item.type){
              		this.file.push({
	                  id: item.id,
	                  name: item.name,
	                  size: item.size,
	                  progress: 0,
	                  uuid: null,
	                  url: null,
	                  error: false,
	                  expand: item.name.replace(/.+\./, '')
	                });
	                promiseArray.push(new Promise((resolve, reject) => {
                    api.filesQiniuUploadTicket({
                      reqType: this.reqType,
                      name: item.name,
                      expand: item.name.replace(/.+\./, ''),
                      size: item.size,
                      resId: this.resId,
                      folderId: this.folderId,
                      projectId: this.projectId,
                    }, resp => {
                        item.uptoken = resp.ticket;
                        resolve(resp.ticket)
                        //up.start();
                    }, resp => {
                      resolve();
                      up.removeFile(item);
                    })
                  }))
              	}

              	Promise.all(promiseArray).then(respArray => {
	                //console.log(respArray)
	                if(respArray.some(item => !!item)){
	                  up.start();
	                }
	              })

              });
              this.previewImage(files);
            },
            BeforeUpload: (up, file) => {
                   // 每个文件上传前,处理相关的事情
            },
            UploadProgress: (up, file) => {
              this.updatePercent(file.id, file.percent);
                // 每个文件上传时,处理相关的事情
            },
            FileUploaded: (up, file, info) => {
              const response = JSON.parse(info.response);
              console.log(response)
              if(response.error == 'ok'){
                const f = JSON.parse(response.file);
                this.updateUuidUrl(file.id, f.uuid, f.url);
                this.updateUuidExpand(file.id, f.uuid, f.expand);
              }
            },
            Error: (up, err, errTip) => {
                console.log(err, errTip)
            },
            UploadComplete: () => {
            	console.log(this.file.some(item => !item.uuid))
            	if(this.file.some(item => !item.uuid)){
            		setTimeout(() => {
            			this.save();
            		}, 2000)
            	}else{
            		this.save();
            	}
            },
            Key: (up, file) => {
            }
          }
      	});
      }
		},
		watch:{
			list: {
				handler(val, oldVal) {
					this.$nextTick(() => {
						this.file = JSON.parse(JSON.stringify(val));
					})
				},
      	deep: true
			}
		},
		data(){
			return {
				file: [],

				uploadId: null,
			}
		},
		created(){
			this.uploadId = new Date().getTime() + '';
			this.file = JSON.parse(JSON.stringify(this.list));
		},
		mounted() {
		  this.$nextTick(() => {
		    this.uploader();
		  });
		}
	}
</script>

<style rel="stylesheet/less" lang="less" scoped>
	@import "~@/config/config.less";
	.img-icon{
		width: 100%;
		height: 100%;
	}
	.icon{
		width: 100%;
		height: 100%;
		background-repeat: no-repeat;
		background-position: center;
		border: 1px solid @BORDER_COLOR;
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
		&.wmv,&.rmvb,&.mpeg4,&.mpeg2,&.flv,&.avi,&.mpga,&.qt,&.rm,&.wmz,&.wmd,&.wvx,&.wmx,&.wm,&.swf,&.mpg,&.mp4,&.mkv,&.mpeg,&.mov,&.asf{ //&.3gp
			background-image: url(./images/07.png);
		}
	}
	.uploa-files-box{
		border: 1px solid @BORDER_COLOR;
		.uploa-files-box-btn{
			width: 100%;
			height: 100%;
		}
	}
</style>
