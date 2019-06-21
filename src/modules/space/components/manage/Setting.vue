<template>
  <div class="setting-container">
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
    <van-cell title="黑名单" is-link @click.stop="goBlackList"></van-cell>
    <van-cell title="追悼会" is-link @click.stop="goMemorialMeeting"></van-cell>
    <van-cell title="删除纪念馆" clickable @click.stop="deleteSpace"></van-cell>
  </div>
</template>

<script>
  import {Link} from '@/config/utils'

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
        initSetting(){
          let space = this.space
          if (space.config){
            if (space.config.viewScope){
              this.viewScopeCheck = space.config.viewScope == 'member'
            }
            if (space.config.commentScope){
              this.commentScopeCheck = space.config.commentScope == 'member'
            }
          }
        },
        viewScopeChanged(e){
          this.updateSetting()
        },
        commentScopeChanged(e){
          this.updateSetting()
        },
        updateSetting(){
          //TODO
        },
        goBlackList(){
          Link(`/space/blacklist/${this.space.id}`)
        },
        goMemorialMeeting(){

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
              sid:that.spaceId,
              success:rsp=>{
                //TODO
              },
              fail:error=>{
                this.$toast('删除失败，请稍后重试')
              }
            })
          })
        },
      },
      created() {
        if (this.space){
          this.initSetting()
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
