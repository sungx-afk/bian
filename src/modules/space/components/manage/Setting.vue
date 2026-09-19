<template>
  <div class="setting-container">
    <van-cell-group v-if="space && isSpaceCreator">
      <van-cell title="自定义墓志铭" :is-link="true" @click.stop="enterEpitaph"></van-cell>
      <van-cell title="自定义挽联" :is-link="true" @click.stop="enterCouplets"></van-cell>
      <van-cell title="自定义主题" :is-link="true" @click.stop="goSwitchTheme"></van-cell>
      <van-cell title="自定义相框" :is-link="true" @click.stop="goSwitchFrame"></van-cell>
    </van-cell-group>
    <div class="menu-divider" v-if="space && isSpaceCreator"></div>
    <van-cell-group>
      <template v-if="space && space.type === 0">
        <van-switch-cell
          title="仅亲属成员访问"
          active-color="#825621"
          v-model="viewScopeCheck"
          @change="viewScopeChanged">
        </van-switch-cell>
      </template>

      <van-switch-cell
        title="关闭访客留言/评论"
        active-color="#825621"
        v-model="commentScopeCheck"
        @change="commentScopeChanged">
      </van-switch-cell>
      <van-cell title="背景音乐" is-link @click.stop="goBgmSetting"></van-cell>
      <van-cell title="黑名单" is-link @click.stop="goBlackList"></van-cell>
      <van-cell title="云追悼会（讣告）" is-link @click.stop="goMemorialMeeting"></van-cell>
      <van-cell title="移交纪念馆" is-link @click.stop="goTransferSpace"></van-cell>
      <van-cell title="删除纪念馆" clickable @click.stop="deleteSpace"></van-cell>
    </van-cell-group>
    <van-dialog 
      v-model="showDeleteDialog" 
      closeOnClickOverlay
      show-cancel-button
      className='custom-delete-dialog'
      confirmButtonText='取消'
      cancelButtonText='删除'
      :beforeClose="beforeCloseHandler"
      @confirm="cancelDelete">
      <div class="delete-box">
        <div class="tip">删除纪念馆会导致纪念馆所有数据丢失，请谨慎操作。请输入下面的四位数字后进行删除。</div>
        <div class="random">{{ randomStr }}</div>
        <div class="confirm-input">
          <van-password-input
            :value="confirmValue"
            :length="4"
            :mask="false"
            :error-info="errorInfo"
            :focused="showKeyboard"
            @focus="showKeyboard = true"
          />
        </div>
      </div>
    </van-dialog>
    <van-number-keyboard class="custom-number-keyboard"
      v-model="confirmValue"
      :show="showKeyboard"
      @blur="showKeyboard = false"/>
    <van-popup
      v-model="showThemes"
      closeable
      position="bottom"
      @click.stop=""
      :style="{ height: '100%' }">
      <div class="info">
        <van-icon name="info"/>
        请选择一个背景
      </div>
      <div class="theme-wrapper">
        <div class="theme" v-for="(img, index) in backgrounds" :key="img.id">
          <van-image
            width="50vw"
            height="65vw"
            :key="img.id"
            @click="themeId = img.id"
            :class="{'right':index % 2 === 1, 'active':themeId == img.id}"
            :src="img.url"/>
        </div>
      </div>
      <div class="button-area">
        <van-button type="danger" block @click="changeThemeId">应用</van-button>
      </div>
    </van-popup>
    <van-popup
      v-model="showFrames"
      closeable
      position="bottom"
      @click.stop=""
      :style="{ height: '100%' }">
      <div class="info">
        <van-icon name="info"/>
        请选择一个相框
      </div>
      <div class="frame-wrapper">
        <div class="frame" v-for="frame in frames" :key="frame.id" @click="frameId = frame.id">
          <div class="frame-preview" :class="{'active':frameId === frame.id}"
               :style="{'background-image':`url(${frame.image})`}">
          </div>
          <div class="frame-title" :class="{'active':frameId === frame.id}">{{frame.title}}</div>
        </div>
      </div>
      <div class="button-area">
        <van-button type="danger" block @click="changeFrameId">应用</van-button>
      </div>
    </van-popup>
  </div>
</template>

<script>
  import {Link} from '@/config/utils'

  import constant from '@/config/constant'

  import {mapGetters} from 'vuex';

  import {getFrames, DEFAULT_FRAME_ID} from '@/config/frame'

  import Vue from 'vue';
  import { Dialog,PasswordInput, NumberKeyboard  } from 'vant';

  // 全局注册
  Vue.use(Dialog);
  Vue.use(PasswordInput);
  Vue.use(NumberKeyboard);

    export default {
      name: "Setting",
      props:{
        space:{
          type:Object,
          default:null,
        }
      },
      data(){
        return{
          viewScopeCheck:false,
          commentScopeCheck:false,
          showDeleteDialog:false,
          confirmValue:'',
          showKeyboard:false,
          errorInfo:'',
          randomStr:'',
          showThemes:false,
          showFrames:false,
          themeId:1,
          frameId:DEFAULT_FRAME_ID,
          frames:getFrames(),
        }
      },
      computed: {
        ...mapGetters({
          user: 'userStore/user',
        }),
        isSpaceCreator(){
          let result = false
          if (this.space && this.user && this.user.id === this.space.creatorId){
            result = true
          }
          return result
        },
        backgrounds() {
          let arr = new Array(23);
          for (let i = 1; i <= arr.length; i++) {
            let item = {
              id: i,
              url: `https://static-app01.yugusoft.com/bian/bg_${i}.jpeg?v=2`
            }
            arr[i - 1] = item;
          }
          return arr;
        },
      },
      methods:{
        enterEpitaph(){
          if (!this.isSpaceCreator){
            return
          }
          Link(`/space/epitaph/${this.space.id}`)
        },
        enterCouplets(){
          if (!this.isSpaceCreator){
            return
          }
          Link(`/space/couplets/${this.space.id}`)
        },
        goSwitchTheme(){
          this.showThemes = true
        },
        goSwitchFrame(){
          if (!this.isSpaceCreator){
            return
          }
          this.showFrames = true
        },
        changeThemeId(e){
          let that = this;
          let spaceId = this.space.id;
          $API.space.updateSpace({
            sid: spaceId,
            param:{
              backgroundId:that.themeId,
            }
          }, rsp => {
            that.showThemes = false;
            //与原 store/Info 一致的模式：emit 通知缓存中的 sacrifice 实例刷新
            //（vue-navigation 返回时复用缓存组件，created 不会重新执行），
            //再 go(-1) 返回原 sacrifice 历史记录，不新增记录，再按返回即退出
            eventHub.$emit(constant.EVENT_CHANGE_BACKGROUND_SUCCESS,{
              backgroundId:that.themeId
            })
            that.$router.go(-1);
          }, error => {
            that.$toast("设置失败，请稍后重试")
          })
        },
        changeFrameId(){
          let that = this;
          $API.space.updateSpace({
            sid: this.space.id,
            param:{
              frameId:that.frameId,
            }
          }, rsp => {
            that.showFrames = false;
            //与 changeThemeId 一致：emit 通知缓存中的 sacrifice 实例即时换框，再返回，不新增历史记录
            eventHub.$emit(constant.EVENT_CHANGE_FRAME_SUCCESS,{
              frameId:that.frameId
            })
            that.$router.go(-1);
          }, error => {
            that.$toast("设置失败，请稍后重试")
          })
        },
        getSpaceConfig(){
          $API.space.getSpaceDetail({
            sid:this.space.id
          },rsp=>{
            this.initSetting(rsp.config)
          })
        },
        initSetting(config){
          if (config){
            if (config.viewScope){
              this.viewScopeCheck = config.viewScope == 'member'
            }
            if (config.commentScope){
              this.commentScopeCheck = config.commentScope == 'member'
            }
          }
        },
        viewScopeChanged(e){
          let scope = 'all'
          if (e){
            scope = 'member'
          }

          this.updateSetting('viewScope',scope)
        },
        commentScopeChanged(e){
          let scope = 'all'
          if (e){
            scope = 'member'
          }
          this.updateSetting('commentScope',scope)
        },
        updateSetting(key,value){
          let param = {
            sid:this.space.id
          }
          param[key] = value
          $API.space.updateSpaceConfig(param,rsp=>{

          },error=>{

          })
        },
        goBlackList(){
          Link(`/space/blacklist/${this.space.id}`)
        },
        goMemorialMeeting(){
          Link(`/space/meeting/${this.space.id}`)
        },
        goBgmSetting(){
          Link(`/space/bgm/${this.space.id}`)
        },
        goTransferSpace(){
          Link(`/space/transfer/${this.space.id}`)
        },
        deleteSpace(e){
          let random = Math.floor(Math.random() * 9000) + 1000
          this.randomStr = random.toString()
          this.showDeleteDialog = true
          this.showKeyboard = true
        },
        resetDeleteInfo(){
          this.confirmValue = ''
          this.showKeyboard = false,
          this.randomStr = ''
          this.errorInfo = ''
        },
        cancelDelete(){
          this.resetDeleteInfo()
        },
        beforeCloseHandler(action, done){
          if (action == 'confirm' || action == 'overlay'){
            this.resetDeleteInfo()
            done()
          }else{
            //判断是否匹配上了
            if (this.confirmValue != this.randomStr){
              this.errorInfo = '输入数字未匹配'
              done(false) 
              return
            }
            $API.space.deleteSpace({
              sid:this.space.id
            }, rsp=>{
              this.resetDeleteInfo()
              done()
              eventHub.$emit(constant.EVENT_DELETE_SPACE_SUCCESS,this.space.id)
              //直接返回到列表上去
              Link(`/list`,{},true)
              }, error=>{
                this.$toast('删除失败，请稍后重试')
            })
          }
        },
      },
      created() {
        if (this.space){
          this.getSpaceConfig()
          //初始化当前主题/相框选中项（服务端未返回 frameId 时回退默认相框）
          this.frameId = (this.space.frameId === undefined || this.space.frameId === null)
            ? DEFAULT_FRAME_ID
            : this.space.frameId
          this.themeId = this.space.backgroundId || 1
        }
      }
    }
</script>

<style rel="stylesheet/less" lang="less" scoped>
  @import "~@/config/config.less";
  .setting-container{
    .menu-divider{
      height: 12px;
      background: #eee;
    }

    .theme-wrapper {
      position: relative;
      width: 100%;
      height: 100%;
      overflow-y: auto;
      background: white;
      padding: 10px 0px;
      display: flex;
      flex-wrap: wrap;
      .theme{
        position: relative;
      }
      .van-image {
        box-sizing: border-box;
        padding: 5px 5px 0px 10px;
        transition: all 0.35s;
        &::before {
          content: '';
          position: absolute;
          top: 5px;
          right: 5px;
          bottom: 0px;
          left: 10px;
        }
        &.right {
          padding: 5px 10px 0px 5px;
          &::before {
            top: 5px;
            right: 10px;
            bottom: 0px;
            left: 5px;
          }
        }
        &.active {
          text-align: center;
          &::before {
            content: "\F02B";
            background: rgba(0, 0, 0, 0.4);
            color: #ff6034;
            font-size: 30px;
            font-family: vant-icon;
            padding-top: 50%;
            text-align: center;
          }
        }
      }
    }

    .frame-wrapper {
      position: relative;
      width: 100%;
      height: 100%;
      overflow-y: auto;
      background: white;
      padding: 10px 0px;
      display: flex;
      flex-wrap: wrap;
      .frame {
        width: 50%;
        box-sizing: border-box;
        padding: 8px 12px;
        text-align: center;
        .frame-preview {
          position: relative;
          width: 100%;
          /* 与相框图片 160x200 的比例保持一致 */
          padding-top: 125%;
          background-position: center;
          background-size: 100% 100%;
          background-repeat: no-repeat;
          transition: all 0.35s;
          &.active::after {
            content: "\F02B";
            position: absolute;
            top: 0;
            right: 0;
            bottom: 0;
            left: 0;
            background: rgba(0, 0, 0, 0.4);
            color: #ff6034;
            font-size: 30px;
            font-family: vant-icon;
            display: flex;
            align-items: center;
            justify-content: center;
          }
        }
        .frame-title {
          margin-top: 6px;
          font-size: 13px;
          color: @FONT_SECOND_COLOR;
          &.active {
            color: @MAIN_THEME_COLOR;
            font-weight: bold;
          }
        }
      }
    }

    .van-popup {
      display: flex;
      flex-direction: column;
      background: #f9f9f9;
      .info {
        text-align: left;
        padding: 15px 35px 5px 15px;
        font-size: 14px;
        color: #666666;
        vertical-align: top;
        line-height: 1.5em;
        .van-icon {
          color: #666;
          margin-right: 5px;
          font-size: 14px;
        }
      }
      i {
        font-size: 14px;
      }
    }

    .button-area {
      display: -webkit-box;
      display: -webkit-flex;
      display: flex;
      -webkit-flex-shrink: 0;
      flex-shrink: 0;
      padding: 12px 16px;

      .van-button {
        height: 40px;
        font-weight: 500;
        font-size: 14px;
        line-height: 34px;
        border: none;
        border-radius: 0;
        &::before {
          position: absolute;
          top: 50%;
          left: 50%;
          width: 100%;
          height: 100%;
          background-color: #000;
          border: inherit;
          border-color: #000;
          border-radius: inherit;
          -webkit-transform: translate(-50%, -50%);
          transform: translate(-50%, -50%);
          opacity: 0;
        }
        &:active::before {
          opacity: 0.1;
        }
      }

      .van-button--danger {
        background: -webkit-linear-gradient(left, #ff6034, #ee0a24);
        background: linear-gradient(to right, #ff6034, #ee0a24);
      }
      .van-button:first-of-type {
        border-top-left-radius: 20px;
        border-bottom-left-radius: 20px;
      }
      .van-button:last-of-type {
        border-top-right-radius: 20px;
        border-bottom-right-radius: 20px;
      }
    }
  }

</style>

<style rel="stylesheet/less" lang="less">
  .custom-delete-dialog .van-dialog__footer .van-dialog__cancel{
    color: #ee0a24 !important;
  }
  .custom-delete-dialog .van-dialog__footer .van-dialog__confirm{
    color: #666666 !important;
  }
  .custom-delete-dialog{
    .delete-box{
      padding: 20px;
      .tip{
        font-size: 14px;
        color: #333333;
      }
      .random{
        margin-top: 12px;
        font-size: 20px;
        text-align: center;
      }
      .confirm-input{
        margin-top: 12px;
        .van-password-input__security{
          &::after{
            border-color: #aaaaaa;
          }
        }
        .van-password-input__item{
          &::after{
            border-color: #aaaaaa;
          }
        }
      }
    }
  }
  .custom-number-keyboard{
    z-index: 999999 !important;
  }
  
</style>
