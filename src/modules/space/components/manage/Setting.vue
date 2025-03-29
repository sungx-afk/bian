<template>
  <div class="setting-container">
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
  </div>
</template>

<script>
  import {Link} from '@/config/utils'

  import constant from '@/config/constant'

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
          randomStr:''
        }
      },
      methods:{
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
        }
      }
    }
</script>

<style rel="stylesheet/less" lang="less" scoped>
  @import "~@/config/config.less";
  .setting-container{

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
