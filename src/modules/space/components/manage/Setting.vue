<template>
  <div class="setting-container">
    <van-cell-group>
      <van-switch-cell
        title="仅亲属成员访问"
        active-color="#825621"
        v-model="viewScopeCheck"
        @change="viewScopeChanged">
      </van-switch-cell>
      <van-switch-cell
        title="关闭访客留言"
        active-color="#825621"
        v-model="commentScopeCheck"
        @change="commentScopeChanged">
      </van-switch-cell>
      <van-cell title="背景音乐" is-link @click.stop="goBgmSetting"></van-cell>
      <van-cell title="黑名单" is-link @click.stop="goBlackList"></van-cell>
      <van-cell title="追悼会" is-link @click.stop="goMemorialMeeting"></van-cell>
      <van-cell title="删除纪念馆" clickable @click.stop="deleteSpace"></van-cell>
    </van-cell-group>
  </div>
</template>

<script>
  import {Link} from '@/config/utils'

  import constant from '@/config/constant'

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
          commentScopeCheck:false
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
          let key = ''
          if (this.space.bgMusic){
            if (this.space.bgMusic !== 'preset_1' && this.space.bgMusic !== 'preset_2'){
              key = 'custom'
            }else{
              key = this.space.bgMusic
            }
          }
          Link(`/space/bgm?space_id=${this.space.id}&key=${key}`)
        },
        deleteSpace(e){
          let that = this
          this.$dialog.confirm({
            className:'my-delete-dialog',
            confirmButtonText:'取消',
            cancelButtonText:'删除',
            message: `确认删除该纪念馆?`
          }).then(() => {
            // cancel //删除操作特殊处理到左侧按钮
          }).catch(() => {
            $API.space.deleteSpace({
                sid:that.space.id
              }, rsp=>{
                eventHub.$emit(constant.EVENT_DELETE_SPACE_SUCCESS,that.space.id)
              this.$router.go(-2)
              }, error=>{
                this.$toast('删除失败，请稍后重试')
            })
          })
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

<style>
  .my-delete-dialog .van-dialog__footer .van-dialog__cancel{
    color: red !important;
  }
  .my-delete-dialog .van-dialog__footer .van-dialog__confirm{
    color: #666666 !important;
  }
</style>
