<template>
  <div class="blacklist-container">
    <template v-if="noData">
      <no-data></no-data>
    </template>
    <template v-else>
      <div class="blacklist-list">
        <van-list
          v-model="loading"
          :finished="finished"
          :finished-text="finishedText">
          <van-cell
            v-for="item in blacklist"
            :key="item.id">
            <div class="list-item">
              <div class="left-content">
                <img class="avatar" :src="item.avatarUrl" />
                <div class="title">{{item.name}}</div>
              </div>
              <div class="right-content" @click.stop="showMoreMenu(item)">
                <i class="more iconfont icon-gengduo"></i>
              </div>
            </div>
          </van-cell>
        </van-list>
      </div>

    </template>
    <van-popup v-model="isShowMoreMenu" close-on-popstate>
      <div v-for="menu in menuList" :key="menu.id" @click="moreMenuPressed(menu)" class="menu">{{menu.name}}</div>
    </van-popup>
  </div>
</template>

<script>
  import NoData from '@/modules/widget/space/NoData'
    export default {
      name: "Blacklist",
      components:{
        NoData
      },
      data(){
        return{
          spaceId:'',
          loading:false,
          finished:false,
          blacklist:[],
          menuList:[],
          isShowMoreMenu:false,
          noData:false
        }
      },
      computed:{
        finishedText(){
          let result = ''

          if (this.blacklist.length < 20){
            result = ''
          }else {
            result = '没有更多数据了'
          }

          return result
        },
      },
      methods:{
        getSpaceDetail(){
          $API.space.getSpaceDetail({sid:this.spaceId},rsp=>{
            this.loading = false
            this.finished = true
            if (rsp && rsp.config && rsp.config.blackList){
              this.blacklist = rsp.config.blackList
            }
            this.noData = false
            if (this.blacklist.length === 0){
              this.noData = true
            }
          },error=>{
            this.loading = false
            this.finished = true
            this.$toast("获取列表失败，请稍后重试")
          })
        },
        showMoreMenu(item){
          this.menuList = [ {
            id:'moveout',
            name: '移出黑名单',
            data:item
          }]
          this.isShowMoreMenu = true
        },
        moreMenuPressed(menu){
          this.isShowMoreMenu = false
          if (menu.id === 'moveout') {
            this.moveOutBlackList(menu.data)
          }
        },
        moveOutBlackList(item){
          let index = this.blacklist.findIndex(some=>some.id === item.id)
          if (index > -1){
            this.blacklist.splice(index,1)
          }
          let list = this.blacklist.map(item=>{
            return item.id
          })
          $API.space.updateBlacklist({
            sid: this.spaceId,
            list: list
          }, rsp=>{
            this.noData = false
            if (this.blacklist.length === 0){
              this.noData = true
            }
          }, error=>{

          })
        },
        registerEvent(){

        }
      },
      created() {
        if(this.$route.params.id){
          this.spaceId = this.$route.params.id
          this.getSpaceDetail()
          this.registerEvent()
        }
      }
    }
</script>

<style rel="stylesheet/less" lang="less" scoped>
  @import "~@/config/config.less";
  .blacklist-container{
    height: 100%;
    background: @BG_WHITE;
    .blacklist-list{
      height: 100%;
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
        }
        .right-content{
          margin-left: auto;
          .more{
          }
        }
      }
    }
  }

</style>
