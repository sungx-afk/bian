<template>
	<transition name="slide-fade" @after-leave="afterLeave">
		<div class="editor" v-show="show">
      <label :for="dateTimeLocalID" ref="dateTimeLabel" class="datetime-local-label">
        <input type="datetime-local" :id="dateTimeLocalID" @change="customCalendarDateTime" :value="currentCalendarDateTime | timesToDate('yyyy-MM-ddTHH:mm')">
      </label>
			<div class="body">
				<div :id="editorId" class="editor-content"></div>
			</div>
      <div v-if="supportCalendar" class="calender-area weui-cells">
          <div class="weui-cell weui-cell_access" @click="changeCalendarDateTime">
            <div class="weui-cell__bd">
              <p>下次跟进时间</p>
            </div>
            <div class="weui-cell__ft">
              {{ calendarDateTime }}
            </div>
          </div>
      </div>
			<div class="footer">
				<div class="weui-btn weui-btn_primary" @click="submit">确定</div>
			</div>
		</div>
	</transition>
</template>

<script>
  import ActionSheet from '@/modules/widget/action-sheet'

  import {dateToTimes,timesToDate } from '@/config/utils'
  import Toast from '@/modules/widget/toast'

	export default {
		methods: {
			afterLeave(){
				this.$el &&
        this.$el.parentNode &&
        this.$el.parentNode.removeChild(this.$el);
        this.$destroy();
        this.closeEnd();
			},
      close(){
      	this.show = false;
      },
      submit(){
      	const content = document.querySelector(`#${this.editorId} .ql-editor`).innerHTML;
      	const text = content.replace(/<img.*?(?:>|\/>)/gi, '[图片]').replace(/<\/?[^>]*>/gi,'');
        let name = '',lines = this.editor.getLines();

        if(lines && lines.length > 0){
          for(let item of lines){
            if (!name){
              let temp_name = $(item.domNode).text().trim();
              if(temp_name){
                name = temp_name;
              }
            }
          }
        }
        name = name.slice(0,100)
      	if (this.supportCalendar){
          let calendarDateTime = -1
          if (this.currentCalendarDateTime > 0){
            calendarDateTime = this.currentCalendarDateTime
          }else if (this.currentDateTimeIndex > -1){
            calendarDateTime = new Date().getTime() + this.calendarDateTimeList[this.currentDateTimeIndex].value * 24 * 60 * 60 * 1000
            calendarDateTime = dateToTimes(timesToDate(calendarDateTime,'yyyy-MM-dd')+' 09:00:00');
          }
          if (calendarDateTime > 0){
            let startDate = calendarDateTime
            let endDate = calendarDateTime + 30 * 60 * 1000
            let t_date = startDate - 5 * 60 * 1000
            let cron = timesToDate(t_date,'s') + ' ' + timesToDate(t_date,'m') + ' ' + timesToDate(t_date,'H') + ' ' + timesToDate(t_date,'d') + ' ' + timesToDate(t_date,'M') + ' ' + '?' + ' ' + timesToDate(t_date,'yyyy');
            this.callback && this.callback(content, text,{startDate,endDate,cron},name);
          }else{
            this.callback && this.callback(content, text,name);
          }
        }else{
          this.callback && this.callback(content, text,name);
        }

      	this.close();
      },
      image(){
      	return new Promise((resolve, reject) => {
					const id = new Date().getTime() + 'quillFile';
					let input = document.createElement('input');
					input.id = id;
					input.type = 'file';
					input.accept = 'image/*';
					input.style.display = 'none';

					input.onchange = e => {
						if(e.target.files && e.target.files.length){
							this.upload(e.target.files[0]).then(file => {
								resolve(file)
								input.parentNode.removeChild(input);
								input = null;
							});
						}else{
							input.parentNode.removeChild(input);
							input = null;
						}
					}

					document.body.appendChild(input);

					input.click();
				})
      },
      upload(file){
				return new Promise((resolve, reject) => {
					const reader = new FileReader();
					reader.onload = event => {
						const base64Str = event.target.result;
						this.getToken().then(uptoken => {
							let url = window.url = 'https://upload-z0.qiniu.com/putb64/-1';
						  //url = 'https://upload-z1.qiniu.com/putb64/-1';
						  const xhr = new XMLHttpRequest();
							xhr.onreadystatechange = () => {
								if (xhr.readyState === 4 && xhr.status === 200) {
						  		const resp = JSON.parse(xhr.responseText);
						    	if(resp.error == 'ok'){
						    		resolve(JSON.parse(resp.file))
										//insertImg(JSON.parse(resp.file).url);
						      }
						   	} else if(xhr.readyState === 4 && typeof xhr.status !== 'undefined' && xhr.status !== 200) {

								}
							}

							xhr.open('POST', url, true);
							xhr.setRequestHeader('Content-Type', 'application/octet-stream');
							xhr.setRequestHeader('Authorization', 'UpToken ' + uptoken);
							// 需要将前缀去掉
							const startIndex = base64Str.indexOf('base64,');
							// 'base64,'.length === 7
							xhr.send(base64Str.slice(startIndex + 7));
						})
					}
					reader.readAsDataURL(file);
				})
			},
			getToken(){
				const reqType = 'general_file';
				const expand = 'jpeg';
				const name =  new Date().getTime() +'_'+ Math.ceil( Math.random() * 10000 ) + '.' + expand;
				const comm = getRequestParam();
				const params = new Array();
				params.push('token=' + comm.token, 'comp_id=' + comm.comp_id, 'req_type=' + reqType, 'name=' + name, 'expand=' + expand);
				return new Promise((resolve, reject) => {
					const xhr = new XMLHttpRequest();  // XMLHttpRequest对象用于在后台与服务器交换数据
			    	xhr.open('GET', config_server.server_api + '/files/qiniu/upload_ticket.json?' + params.join('&'), true);
			    	xhr.onreadystatechange = () => {
			      	if (xhr.readyState == 4 && xhr.status == 200) {
			      		//从服务器获得数据
			      		const uptoken = JSON.parse(xhr.responseText).ticket;
			      		resolve(uptoken)
			      	}
			    };
			    xhr.send();
			  })
			},
      changeCalendarDateTime(){
        let itemList = this.calendarDateTimeList.map(item=>item.name)
        ActionSheet({
          itemList: itemList,
          callback: index => {
            if (index < 3){
              this.currentDateTimeIndex = index
            }else{
              //自定义时间
              this.$refs.dateTimeLabel.click();
              this.currentDateTimeIndex = -1
            }
          }
        })
      },
      customCalendarDateTime(e){
        if(e.target.value){
          let date = e.target.value.replace('T',' ') + ':00';
          date = dateToTimes(date);
          if(date){
            if(date < new Date().getTime()){
              Toast({
                type: 'warn',
                content: '设置时间小于当前时间',
              });
            }else{
              this.currentCalendarDateTime = date
            }
          }
        }
      }
		},
		data(){
			return {
				content: null,
				placeholder: null,

				editor: null,
				editorId: `editor${new Date().getTime()}`,

				show: false,
        supportCalendar:false,
        currentCalendarDateTime:0,
        calendarDateTimeList:[{
				  name:'一天后',
          value:1
        },{
          name:'三天后',
          value:3
        },{
          name:'七天后',
          value:7
        },{
          name:'自定义',
          value:-1
        }],
        currentDateTimeIndex:-1,
        dateTimeLocalID: `datetimeLocal${new Date().getTime()}`,
			}
		},
    computed:{
      calendarDateTime(){
        if (this.currentDateTimeIndex > -1){
          return this.calendarDateTimeList[this.currentDateTimeIndex].name
        }else if (this.currentCalendarDateTime > 0){
          return timesToDate(this.currentCalendarDateTime,'yyyy-MM-dd HH:mm')
        }else{
          return ''
        }
      }
    },
		created(){

		},
		mounted() {
		  this.$nextTick(() => {
		  	this.show = true;

		  	const options = {
		  		modules: {
            toolbar: [
              [ 'bold', 'italic', 'underline', 'strike' ],
              [ 'image' ],
            ],
          },
    			theme: 'snow'
		  	};
		  	if(this.placeholder){
		  		options.placeholder = this.placeholder;
		  	}
		    this.editor = new Quill(`#${this.editorId}`, options);
		    if(this.content){
		    	this.editor.pasteHTML(this.content);
		    }
  			this.editor.focus();

  			const toolbar = this.editor.getModule('toolbar');

				toolbar.addHandler('image', () => {
					const range = this.editor.getSelection();
					this.image().then(file => {
						this.editor.insertEmbed(range ? range.index: 0, 'image', file.url, Quill.sources.USER)
					})
				});


		  });
		}
	}
</script>

<style rel="stylesheet/less" lang="less" scoped>
  @import "~@/config/config.less";

  .editor{
  	.modal(#fff);
  	display: flex;
  	flex-direction: column;
  	.body{
  		flex-grow: 1;
  		height: 0;
  		.editor-content{
	  		width: 100%;
	  		height: e('calc(100% - 44px)');
	  		border: none;
	  		background-color: #fff;
	  	}
	  	/deep/ .ql-editor{
	  		font-size: 16px;
	  	}
	  	& /deep/ .ql-toolbar.ql-snow {
	  		border: none;
	  		border-bottom: 1px solid @BORDER_COLOR;
	  	}
  	}
    .calender-area{

    }
  	.footer{
  		flex-shrink: 0;
  		padding: 0 12px;
    	margin: 15px 0;
  	}
    .datetime-local-label{
      display: block;
      overflow: hidden;
      width: 0;
      height: 0;
    }
  }
</style>
