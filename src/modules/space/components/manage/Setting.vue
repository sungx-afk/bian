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
    <van-cell title="删除纪念馆" @click.stop="deleteSpace"></van-cell>
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
        deleteSpace(){

        }
      },
      created() {
        if (this.space){
          this.initSetting()
        }
      }
    }
</script>

<style scoped>

</style>
