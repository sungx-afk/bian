<template>
  <div class="issue-detail-container">
    <template v-if="issue && space">
      <item :item.sync="issue" :type.sync="issue.type" :canOperate="canOperate" :canComment="canComment"
            v-on:click-menu="clickOperateMenu"
            v-on:click-image="clickIssueImage">
      </item>
    </template>
    <van-popup v-model="isShowMoreMenu">
      <div v-for="menu in menuList" :key="menu.id" @click="moreMenuPressed(menu)" class="menu">{{menu.name}}</div>
    </van-popup>
  </div>
</template>

<script>
  import {mapGetters} from 'vuex';
  import Item from './IssueItem'
    export default {
      name: "IssueDetail",
      components:{
        Item
      },
      data(){
        return{
          spaceId:'',
          issueId:'',
          issue:null,
          space:null,
          menuList:[],
          isShowMoreMenu:false
        }
      },
      computed:{
        ...mapGetters({
          user: 'userStore/user',
        }),
        canOperate(){
          let result = false
          let currentUserId = this.user.id
          if (this.space && this.space.creatorId === currentUserId){
            result = true
          }else if(this.issue && this.issue.creatorId === currentUserId){
            result = true
          }
          return result
        },
        canComment(){
          let result = true
          let currentUserId = this.user.id
          if (this.space && currentUserId !== this.space.creatorId && this.space.config.commentScope == 'member' ){
            let index = this.space.config.friendIds.findIndex(item=>item === currentUserId)
            if (index === -1){ //如果没有找到，说明不在好友列表
              result = false
            }
          }
          return result
        }
      },
      methods:{
        getSpaceDetail(){
          $API.space.getSpaceDetail({
            sid:this.spaceId
          }, rsp=>{
            this.space = rsp
          })
        },
        getIssueDetail(){
          let that = this
          let sid = this.spaceId
          let cid = this.issueId
          $API.space.getIssueDetail({
            sid,
            cid
          }, rsp => {
            that.issue = rsp
          }, error => {

          })
        },
        clickOperateMenu(){
          let name = '删除' + this.messageTypeText()
          this.menuList = [
            {
              id:'delete',
              name:name,
            }]
          this.isShowMoreMenu = true
        },
        clickIssueImage(){

        },
        moreMenuPressed(menu){
          this.isShowMoreMenu = false
          if (menu.id === 'delete') {
            this.deleteIssue()
          }
        },
        deleteIssue(){
          let that = this
          this.$dialog.confirm({
            message: `确认删除该${this.messageTypeText()}?`
          }).then(() => {
            $API.space.deleteIssue({
              sid: that.spaceId,
              cid: that.issueId
            }, rsp=>{
              //TODO
              this.$router.go(-1)
            }, error=>{

            })
          }).catch(() => {

          })
        },
        messageTypeText() {
          let result = '动态'
          if (this.issue.type == 'PUBLIC'){
            result = '留言'
          }else if(this.issue.type == 'PRIVATE'){
            result = '私语'
          }
          return result
        }
      },
      created() {
        if(this.$route.params.id){
          this.issueId = this.$route.params.id
          let query = this.$route.query
          if(query){
            if (query.space_id){
              this.spaceId = query.space_id
            }
          }
          this.getIssueDetail()
          this.getSpaceDetail()
        }
      }
    }
</script>

<style rel="stylesheet/less" lang="less" scoped>
  @import "~@/config/config.less";
  .issue-detail-container{
    padding: 0px 15px;
  }
</style>
