<template>
  <div class="visitor-container" v-bind:style="{ 'height': containerHeight + 'px' }">
    <template v-if="noData">
      <no-data></no-data>
    </template>
    <template v-else>
      <van-list
        v-model="loading"
        :finished="finished"
        :finished-text="finishedText"
        @load="onLoadMoreData">
        <van-cell
          v-for="item in list"
          :key="item.id">
          <div class="list-item">
            <div class="left-content">
              <img class="avatar" :src="item.avatarUrl" />
              <div class="title">{{item.name}}</div>
              <van-tag v-if="item.black" class="black-tag">黑名单用户</van-tag>
            </div>
            <div class="right-content" v-if="showMoreMenu(item)" @click.stop="goMoreMenu(item)" >
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
  import {mapGetters} from 'vuex';

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
      computed:{
        ...mapGetters({
          user: 'userStore/user',
        }),
        finishedText(){
          let result = ''

          if (this.list.length < LIMIT){
            result = ''
          }else {
            result = '没有更多数据了'
          }

          return result
        },
      },
      methods:{
        initContainerHeight(){
          this.containerHeight = document.body.clientHeight - 44
        },
        showMoreMenu(item){
          return item.id !== this.user.id
        },
        getVisitorList(start = 0){
          let that = this
          let limit = LIMIT
          $API.space.getSpaceAllVisitorList({
              sid:that.space.id,
              start,
              limit:1000,//暂时没有分页
            }, rsp=>{
            that.loading = false
            let list = rsp
            list = list.map(item=>{
              let o = item
              o.black = false
              let index = that.space.config.blackListIds.findIndex(id=>id === item.id)
              if (index > -1){
                o.black = true
              }
              return o
            })
            if (start === 0){
              this.list = list
            }else{
              this.list = this.list.concat(list)
            }
            that.noData = false
            if (that.list.length === 0){
              that.noData = true
              that.finished = true
            }else if(list.length < limit){
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
        goMoreMenu(user){
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
            message: '确认将该到访人员加入黑名单吗？'
          }).then(() => {
            let blackListIds = that.space.config.blackListIds
            blackListIds.push(user.id)

            $API.space.updateBlacklist({
                sid:this.space.id,
                list:blackListIds
              }, rsp=>{
                let index = this.list.findIndex(some=>some.id === user.id)
                if (index > -1){
                  this.list[index].black = true
                }
              }, error=>{

              })
          }).catch(() => {
            // on cancel
          })
        },
        moveOutBlackList(user){
          let that = this
          this.$dialog.confirm({
            message: '确认将该到访人员移出黑名单吗？'
          }).then(() => {
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
                let index = this.list.findIndex(some=>some.id === user.id)
                if (index > -1){
                  this.list[index].black = false
                }
              }, error=>{

              })
          }).catch(() => {
            // on cancel
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
