<template>
  <div class="theme-container">
    <van-tabs v-model="tabActive" @change="onTabChange" color="#825621">
      <van-tab title="预置" name="preset">
        <template v-if="tabActive === 'preset'">
          <div class="preset-theme-container">
            <div class="theme-group" v-for="(group,index) in themes" :key="index">
              <div v-for="theme in group" :key="theme.uuid" class="theme-wrapper" @click="goSelectTheme(theme)">
                <img class="image" :src="theme.url" />
                <div class="name">
                  {{theme.name}}
                </div>
                <div class="selected-wrapper" v-if="selected === theme.uuid">
                  <div class="selected">
                    <i class="iconfont icon-duigou1"></i>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </template>
      </van-tab>
      <van-tab title="自定义" name="custom">
        <template v-if="tabActive === 'custom'">
          <div class="custom-theme-container">
            <div class="select-custom-photo">
              <van-uploader
                :max-count="1"
                :after-read="afterRead">
                <van-button icon="photo" type="default" class="btn" size="small">选择图片</van-button>
              </van-uploader>
            </div>
            <div class="config-wrapper">
              <van-checkbox-group v-model="config" @change="configChanged">
                <van-checkbox name="avatar" shape="square" checked-color="#825621">显示遗像</van-checkbox>
                <!-- <van-checkbox name="info" shape="square" checked-color="#825621">显示姓名和日期</van-checkbox>
                <van-checkbox name="epitaph" shape="square" checked-color="#825621">显示墓志铭</van-checkbox> -->
              </van-checkbox-group>
            </div>
            <div class="preview-wrapper">
              <div class="title">预览效果图</div>
              <div class="preview-content" :style="{'background-image':`url(${backgroundImage})`}">
                <div class="avatar" :class="{show:configShow('avatar')}"></div>
                <!-- <div class="info" :class="{show:configShow('info')}">
                  <div>xxx</div>
                  <div>1900 - 1999</div>
                </div>
                <div class="epitaph" :class="{show:configShow('epitaph')}">
                  这里是墓志铭
                </div> -->
              </div>
            </div>
            <div class="footer">
              <van-button type="default" class="btn large" :loading="loading" loading-text="提交中" @click="goHandleCustomTheme">确定</van-button>
            </div>
          </div>
        </template>
      </van-tab>
    </van-tabs>
  </div>
</template>

<script>
  import {mapGetters} from 'vuex';
  import constant from '@/config/constant'
  import {gUuid} from '@/config/utils'
  export default {
    name: "Style",
    data(){
      return{
        tabActive:'preset',
        selected:'',
        selectImage:null,
        backgroundImage:'',
        loading:false,
        config:['avatar','info','epitaph']
      }
    },
    computed:{
      ...mapGetters({
        user: 'userStore/user',
        space:'spaceStore/spaceDetail'
      }),
      themes(){
        let list = this.getThemes()
        let groupSize = 3
        //向上取整：最后不足一行的也要成组，避免依赖循环条件的隐式取整
        let groupCount = Math.ceil(list.length / groupSize)
        let groups = []
        for (let i = 0; i < groupCount; i++){
          groups.push(list.slice(i * groupSize, (i + 1) * groupSize))
        }
        return groups
      }
    },
    methods:{
      onTabChange(tab){
        if (tab === 'custom'){
          //尝试初始化
          if (this.spaceId && !this.backgroundImage){
            let customTheme = this.space.customThemeId
            if (customTheme){
              this.backgroundImage = customTheme.url
              this.config = customTheme.config
            }
          }
        }
      },
      goSelectTheme(theme){
        this.$dialog.confirm({
          message: '确认应用该预置样式吗？'
        }).then(() => {
          this.selected = theme.uuid
          eventHub.$emit(constant.EVENT_SELECT_THEME,theme)
          this.$router.back()
        }).catch(()=>{
          
        })
      },
      configShow(option){
        let index = this.config.findIndex(item=> item == option)
        return index > -1
      },
      afterRead(file){
        this.selectImage = file
        this.backgroundImage = file.content
      },
      configChanged(){

      },
      goHandleCustomTheme(){
        if (this.backgroundImage && !this.selectImage){
          let theme = {
            uuid:'custom',
            name:'自定义',
            url:this.backgroundImage,
            config:this.config
          }
          eventHub.$emit(constant.EVENT_SELECT_THEME,theme)
          this.$router.back()
        }else{
          this.uploadCustomTheme()
        }
      },
      uploadCustomTheme(){
        if (this.loading){
          return
        }
        if (!this.selectImage && !this.backgroundImage){
          this.$toast("请选择图片")
          return
        }
        this.loading = true
        let file = {}
        file.content = this.selectImage.content
        file.name = this.selectImage.file.name
        file.size = this.selectImage.file.size

        this.uploadToQiniu(file,rsp=>{
          if (0 === rsp.result){
            let theme = {
              uuid:'custom',
              name:'自定义',
              url:rsp.url,
              config:this.config
            }
            eventHub.$emit(constant.EVENT_SELECT_THEME,theme)
            this.$router.back()
          }else{
            this.$toast("上传出错，请稍后重试")
          }
        })
      },
      uploadToQiniu(file,cb){
        $API.space.filesQiniuUploadTicket({
          reqType: 'general_file',
          name: file.name,
          expand: file.name.replace(/.+\./, ''),
          size: file.size,
        }, resp => {
          $API.space.filesQiniuUpload({
            data:file.content,
            token:resp.uptoken,
            key:resp.key
          },rsp=>{
            cb && cb({result:0,url:rsp.url})
          },error=>{
            cb && cb({result:1,msg:error.msg})
          })
        },error=>{
          cb && cb({result:1,msg:error.msg})
        })
      },
    },
    created() {
      let query = this.$route.query
      if(query){
        if (query.theme_id){
          this.selected = query.theme_id
        }
        if (query.space_id){
          this.spaceId = query.space_id
        }
      }
    }
  }
</script>

<style rel="stylesheet/less" lang="less" scoped>
  @import "~@/config/config.less";
  .theme-container{
    height: 100%;
    background: @BG_WHITE;
    overflow-y: auto;
    .preset-theme-container{
      overflow-y: auto;
      .theme-group{
        display: flex;
        align-items: center;
        //每行固定3列：不满一行时靠左排（整行仍然水平居中）
        justify-content: flex-start;
        width: 100%;
        max-width: 348px; //3 × 116px
        margin: 0 auto;
        .theme-wrapper{
          display: flex;
          flex-direction: column;
          align-items: center;
          //100px 图片 + 左右各 8px 内边距，固定列宽保证每行列对齐
          width: 116px;
          box-sizing: border-box;
          flex: none;
          padding: 12px 8px;
          position: relative;
          .image{
            width: 100px;
            height: 120px;
          }
          .name{
            font-size: 15px;
            color: @FONT_THIRD_COLOR;
            margin-top: 4px;
          }
          .selected-wrapper{
            position: absolute;
            right: 16px;
            bottom: 40px;

            .selected{
              border-radius: 50%;
              background: rgba(130,86,33,1);
              height: 22px;
              width: 22px;
              display: flex;
              align-items: center;
              justify-content: center;
              .iconfont{
                font-size: 13px;
                color: @FONT_WHITE_COLOR;
              }
            }
          }
        }
      }
    }
    .custom-theme-container{
      padding: 12px 20px;
      display: flex;
      flex-direction: column;
      overflow-y: auto;
      .van-button{
        &.btn{
          width: 100px;
          margin-right: 12px;
          color: white;
          background-color: @MAIN_THEME_COLOR;
          &.large{
            width: 90%;
          }
        }
      }
      .select-custom-photo{
        display: flex;
        align-items: center;
      }
      .config-wrapper{
        margin-top: 20px;
        font-size: 14px;
        color: @FONT_SECOND_COLOR;
        .van-checkbox{
          height: 28px;
          line-height: 28px;
        }
      }
      .preview-wrapper{
        margin-top: 40px;
        align-self: center;
        width: 100%;
        display: flex;
        flex-direction: column;
        align-items: center;
        .title{
          font-size: 15px;
          color: @FONT_THIRD_COLOR;
          align-self: flex-start;
          margin-bottom: 12px;
        }
        .preview-content{
          width: 200px;
          height: 300px;
          background-color: @BG_GRAY2;
          background-size: cover;
          background-repeat: no-repeat;
          display: flex;
          flex-direction: column;
          align-items: center;
          .show{
            opacity: 1 !important;
          }
          .avatar{
            width: 60px;
            height: 80px;
            border: 1px solid @MAIN_THEME_COLOR;
            margin-top: 20%;
            opacity: 0;
          }
          .info{
            display: flex;
            flex-direction: column;
            align-items: center;
            font-size: 12px;
            margin-top: 4px;
            opacity: 0;
            color: @FONT_WHITE_COLOR;
            text-shadow: #000 1px 0 0, #000 0 1px 0, #000 -0.5px 0 0, #000 0 -1px 0;
          }
          .epitaph{
            font-size: 12px;
            margin-top: 8px;
            opacity: 0;
            color: @FONT_WHITE_COLOR;
            text-shadow: #000 1px 0 0, #000 0 1px 0, #000 -0.5px 0 0, #000 0 -1px 0;
          }
        }
      }
      .footer{
        margin-top: 20px;
        display: flex;
        justify-content: center;
      }

    }
  }

</style>
