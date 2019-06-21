<template>
  <div class="issue-list-container">
    <template v-if="noData">
      <no-data></no-data>
    </template>
    <template v-else>
      <van-list
        v-model="loading"
        :finished="finished"
        finished-text="没有更多数据了"
        @load="onLoadMoreData">
        <van-cell
          v-for="item in list"
          :key="item.id">
          <item :item.sync="item" :type.sync="type" :canOperate="true" :canComment="true" v-on:click-menu="clickOperateMenu"></item>
        </van-cell>
      </van-list>
    </template>
    <template v-if="!inputFocus && canComment">
      <div class="add-issue-btn" :class="{'x-bottom':isIPhoneX}" @click.stop="goAddIssue">
        <img class="add-issue-image" src="~@/modules/images/float_add_btn.png" />
      </div>
    </template>
    <van-popup v-model="isShowMoreMenu">
      <div v-for="menu in menuList" :key="menu.id" @click="moreMenuPressed(menu)" class="menu">{{menu.name}}</div>
    </van-popup>
  </div>

</template>

<script>
  import Item from './IssueItem'
  import NoData from '@/modules/widget/space/NoData'

  const LIMIT = 20

    export default {
      name: "IssueList",
      props:{
        space:{
          type:Object,
          default:null
        },
        type:{
          type:String,
          default:''
        },
      },
      components:{
        Item,
        NoData
      },
      computed:{
        canComment(){
          return true
        },
        isIPhoneX(){
          return false
        }
      },
      data(){
        return{
          list:[],
          loading:false,
          finished:false,
          noData:false,
          isShowMoreMenu:false,
          menuList:[],
          inputFocus:false
        }
      },
      methods:{
        fetchIssueList(start){
          let that = this
          if (start === undefined){
            start = this.list.length
          }
          let limit = LIMIT
          if (start > 0){
            this.loading = true
          }
          $API.space.fetchIssueList({
            sid:that.space.id,
            start,
            limit,
            type:that.type
          }, rsp=>{
            that.loading = false
            rsp = rsp.map(item=>{
              let o = item
              o.canOperate = that.canOperateIssue(item)
              return o
            })
            if (0 === start){
              that.list = rsp
            }else{
              that.list = that.list.concat(rsp)
            }
            if (that.list.length === 0){
              that.noData = true
              that.finished = true
            }else if(rsp.length < limit){
              that.finished = true
            }
          }, error=>{
            that.loading = false
          })
        },
        onLoadMoreData(){
          if (this.finished){
            return
          }
          let start = this.list.length
          this.fetchIssueList(start)
        },
        canOperateIssue(issue){
          let result = false
          let currentUserId = 1000738
          if (currentUserId === this.space.creatorId){
            result = true
          }else if(currentUserId === issue.creatorId){
            result = true
          }

          return result
        },
        clickOperateMenu(item){
          let name = '删除' + this.messageTypeText()
          this.menuList = [
            {
              id:'delete',
              name:name,
              data:item
            }]
          this.isShowMoreMenu = true
        },
        moreMenuPressed(menu){
          this.isShowMoreMenu = false
          switch (menu.id) {
            case 'delete':
              this.deleteIssue(menu.data)
              break
          }
        },
        goAddIssue(){

        },
        deleteIssue(item){
          let that = this
          this.$dialog.confirm({
            message: `确认删除该${this.messageTypeText()}?`
          }).then(() => {
            $API.space.deleteIssue({
              sid: that.space.id,
              cid: item.id
            }, rsp=>{
              let index = that.list.findIndex(some=>some.id === item.id)
              if (index > -1){
                  that.list.splice(index,1)
                }
              }, error=>{

              })
          }).catch(() => {

          })
        },
        messageTypeText() {
          let result = '动态'
          if (this.type == 'PUBLIC'){
            result = '留言'
          }else if(this.type == 'PRIVATE'){
            result = '私语'
          }
          return result
        }
      },

      created() {

      }
    }
</script>

<style rel="stylesheet/less" lang="less" scoped>
  @import "~@/config/config.less";

  .issue-list-container{
    height: 100%;
    overflow-y: scroll;
    .add-issue-btn{
      position:fixed;
      bottom:60px;
      right:20px;
      .add-issue-image{
        width: 50px;
        height: 50px;
      }
      &.x-bottom{
        bottom:90px;
      }
    }
  }

</style>
