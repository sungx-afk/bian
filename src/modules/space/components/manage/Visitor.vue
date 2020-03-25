<template>
  <div class="visitor-container" v-bind:style="{ 'height': containerHeight + 'px' }">
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
          <div class="list-item">
            <div class="left-content">
              <img class="avatar" :src="item.user && item.user.avatarUrl" />
              <div class="title">{{item.user && item.user.name}}</div>
              <van-tag v-if="item.user && item.user.black" class="black-tag">黑名单用户</van-tag>
            </div>
            <div class="right-content" @click.stop="showMoreMenu(item.user)" >
              <i class="more iconfont icon-gengduo"></i>
            </div>
          </div>
        </van-cell>
      </van-list>
    </template>
    <van-popup v-model="isShowMoreMenu" close-on-popstate>
      <div v-for="menu in menuList" :key="menu.id" @click="moreMenuPressed(menu)" class="menu">{{menu.name}}</div>
    </van-popup>
  </div>
</template>

<script>
  const LIMIT = 20

  import NoData from '@/modules/widget/space/NoData'
    export default {
      name: "Visitor",
      props:{
        space:{
          type:Object,
          default:null,
        }
      },
      components:{
        NoData
      },
      data(){
        return{
          list:[],
          loading:false,
          finished:false,
          noData:false,
          menuList:[],
          isShowMoreMenu:false,
          containerHeight:0
        }
      },
      methods:{
        initContainerHeight(){
          this.containerHeight = document.body.clientHeight - 44
        },
        getVisitorList(start){
          let that = this
          let limit = LIMIT

          if (start === undefined){
            start = 0
          }
          $API.space.getSpaceVisitorList({
              sid:that.space.id,
              start,
              limit
            }, rsp=>{
            that.loading = false
            rsp = rsp.map(item=>{
              let o = item
              let index = that.space.config.blackListIds.findIndex(id=>id === item.userId)
              if (index > -1){
                o.user.black = true
              }
              return o
            })
            if (start === 0){
              this.list = rsp
            }else{
              this.list = this.list.concat(rsp)
            }
            that.noData = false
            if (that.list.length === 0){
              that.noData = true
              that.finished = true
            }else if(rsp.length < limit){
              that.finished = true
            }
          },error=>{
            that.loading = false
            that.finished = true
            that.$toast("获取列表失败，请稍后重试")
          })
        },
        onLoadMoreData(){
          if (this.space && !this.finished){
            let start = this.list.length
            this.getVisitorList(start)
          }
        },
        showMoreMenu(user){
          if (user.black){
            this.menuList = [ {
              id:'moveout',
              name: '移出黑名单',
              data:user
            }]
          }else{
            this.menuList = [ {
              id:'blacklist',
              name: '加入黑名单',
              data:user
            }]
          }
          this.isShowMoreMenu = true
        },
        moreMenuPressed(menu){
          this.isShowMoreMenu = false
          if (menu.id === 'moveout') {
            this.moveOutBlackList(menu.data)
          }else if (menu.id === 'blacklist'){
            this.moveToBlackList(menu.data)
          }
        },
        moveToBlackList(user){
          let that = this
          this.$dialog.confirm({
            message: '确定将此游客加入到黑名单？'
          }).then(() => {
            let blackListIds = that.space.config.blackListIds
            blackListIds.push(user.id)

            $API.space.updateBlacklist({
                sid:this.space.id,
                list:blackListIds
              }, rsp=>{
                let index = this.list.findIndex(some=>some.userId === user.id)
                if (index > -1){
                  this.list[index].user.black = true
                }
              }, error=>{

              })
          }).catch(() => {
            // on cancel
          })
        },
        moveOutBlackList(user){
          let that = this
          let blackListIds = that.space.config.blackListIds
          let index = blackListIds.findIndex(id=>id === user.id)
          if (index > -1){
            blackListIds.splice(index,1)
          }
          $API.space.updateBlacklist({
              sid:this.space.id,
              list:blackListIds
            }, rsp=>{
              //找到对应的user，把black置为false
              let index = this.list.findIndex(some=>some.userId === user.id)
              if (index > -1){
                this.list[index].user.black = false
              }
            }, error=>{

            })
        }
      },
      created() {
        this.initContainerHeight()
      }
    }
</script>

<style rel="stylesheet/less" lang="less" scoped>
  @import "~@/config/config.less";
  .visitor-container{
    overflow-y: scroll;
    .list-item{
      display: flex;
      align-items: center;
      .left-content{
        display: flex;
        align-items: center;
        .avatar{
          width: 30px;
          height: 30px;
          border-radius: 15px;
        }
        .title{
          margin-left: 10px;
        }
        .black-tag{
          margin-left: 10px;
        }
      }
      .right-content{
        margin-left: auto;
        .more{
        }
      }
    }
  }
</style>
