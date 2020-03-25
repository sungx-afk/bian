<template>
  <div class="friends-container" v-if="friends">
    <div class="header">
      <span class="count-info">亲属成员{{friends.length}}个</span>
      <div class='invite' @click.stop="goInviteFriends">
        马上去邀请 >
      </div>
    </div>
    <template v-if="noData">
      <no-data></no-data>
    </template>
    <template v-else>
      <div class="list">
        <van-list>
          <van-cell
            v-for="friend in friends"
            :key="friend.id">
            <div class="list-item">
              <div class="left-content">
                <img class="avatar" :src="friend.avatarUrl" />
                <div class="title">{{friend.name}}</div>
              </div>
              <template v-if="canOperate">
                <div class="right-content" @click.stop="showMoreMenu(friend)">
                  <i class="more iconfont icon-gengduo"></i>
                </div>
              </template>
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
  import {mapGetters} from 'vuex';
  import NoData from '@/modules/widget/space/NoData'
  import {Link} from '@/config/utils'

  import constant from '@/config/constant'

    export default {
      name: "FriendsManage",
      components:{
        NoData
      },
      data(){
        return{
          spaceId:'',
          space:'',
          friends:[],
          noData:false,
          menuList:[],
          isShowMoreMenu:false
        }
      },
      computed:{
        ...mapGetters({
          user: 'userStore/user',
        }),
        isSpaceCreator(){
          let result = false
          let currentUserId = this.user.id
          if (this.space && currentUserId === this.space.creatorId){
            result = true
          }
          return result
        },
        canOperate(){
          return this.isSpaceCreator
        }
      },
      methods:{
        getSpaceDetail(){
          $API.space.getSpaceDetail({
            sid:this.spaceId
          }, rsp=>{
            this.space = rsp
            this.friends = rsp.config.friends
            this.noData = false
            if(this.friends.length === 0){
              this.noData = true
            }
          })
        },
        showMoreMenu(friend) {
          this.menuList = [{
            id:'delete_friend',
            name: '移出亲属空间',
            data:friend
          },{
            id:'blacklist',
            name: '加入黑名单',
            data:friend
          }]
          this.isShowMoreMenu = true;
        },
        moreMenuPressed(menu){
          this.isShowMoreMenu = false
          if (menu.id === 'delete_friend') {
            this.deleteFriend(menu.data)
          }else if(menu.id === 'blacklist'){
            this.moveToBlacklist(menu.data)
          }
        },
        deleteFriend(friend){
          let that = this
          this.$dialog.confirm({
            message: '确定将此人移出亲属空间？'
          }).then(() => {
            $API.space.deleteFriend({
                sid:that.spaceId,
                userId:friend.id
              }, rsp=>{
                let index = that.space.config.friends.findIndex(some=>some.id === friend.id)
                if (index > -1){
                  that.space.config.friends.splice(index,1)
                  eventHub.$emit(constant.EVENT_DELETE_FRIENDS_SUCCESS,friend.id)
                  if (that.space.config.friends.length === 0){
                    this.noData = true
                  }
                }
            },error=>{
              this.$toast('删除失败，请稍后重试')
            })
          }).catch(() => {
            // on cancel
          })
        },
        moveToBlacklist(item){
          let that = this
          this.$dialog.confirm({
            message: '确定将此人加入到黑名单？'
          }).then(() => {
            let p1 = new Promise((resolve, reject) => {
              $API.space.deleteFriend({
                sid:that.spaceId,
                userId:item.id
                }, rsp=>{
                  resolve && resolve(rsp)
                },error=>{
                  reject && reject(error)
                })
            })
            let p2 = new Promise((resolve, reject) => {
              let blackListIds = that.space.config.blackListIds
              blackListIds.push(friend.id)
              $API.space.updateBlacklist({
                  sid:that.spaceId,
                  list:blackListIds
                }, rsp=>{
                  resolve && resolve(rsp)
                }, error=>{
                  reject && reject(error)
                })
            })
            let promises = [p1,p2]
            Promise.all(promises)
              .then(() => {
                let index = that.space.config.friends.findIndex(some=>some.id === item.id)
                if (index > -1){
                  that.space.config.friends.splice(index,1)
                  eventHub.$emit(constant.EVENT_DELETE_FRIENDS_SUCCESS,friend.id)
                }
              })
              .catch((error) => {

              });
          }).catch(() => {
            // on cancel
          })
        },
        goInviteFriends(){
          let extra = {}

          extra.origin_from = 'add_friends'
          extra.invite_user_id = this.user.id
          extra.space_id = this.spaceId

          extra = JSON.stringify(extra)

          localStorage.setItem(constant.KEY_EXTRA_DATA,extra)

          Link(`/share`)
        }
      },
      created() {
        if(this.$route.params.id){
          this.spaceId = this.$route.params.id
          this.getSpaceDetail()
        }
      }
    }
</script>

<style rel="stylesheet/less" lang="less" scoped>
  @import "~@/config/config.less";
  .friends-container{
    height: 100%;
    width: 100%;
    box-sizing: border-box;
    background-color: white;
    overflow-x: hidden;
    overflow-y: scroll;
    .header {
      height: 50px;
      width: 100%;
      padding-left: 15px;
      background-color: #f6f6f6;
      display:flex;
      align-items: center;

      .count-info {
        line-height: 35px;
        font-size: 13px;
        color: @FONT_THIRD_COLOR;
        text-align: left;
      }
      .invite{
        font-size: 15px;
        color: @MAIN_THEME_COLOR;
        margin-left: auto;
        margin-right: 30px;
        padding: 0;
        line-height: 1;
        background-color: transparent;
        border: none;
      }
      .invite::after {
        display: none;
      }
    }

    .list{
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
        }
      }
    }
  }

</style>
