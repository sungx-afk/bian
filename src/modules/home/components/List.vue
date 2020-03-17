<template>
  <div class="main-container">
    <div class="notice-container" v-if="showNotice">
      <van-cell is-link @click.stop="goNotice">
        您还未关注公众号，关注后可以及时收到通知
      </van-cell>
    </div>
    <div class="container-top">
      <img src="~@/modules/images/index_header.jpg" class="header-image" />
      <div class="text-area">
        <div class="text">爱，永存</div>
      </div>
    </div>
    <div class="container-bottom">
      <template v-if="list.length > 0 || visitedList.length > 0">
        <div class="list" v-if="list.length > 0">
          <item v-for="item in list" :key="item.id" :item="item"
                v-on:item-press="goSpaceDetail">
          </item>
        </div>
        <div class="list" v-if="visitedList.length > 0">
          <div class="list-header">
            <div class="title">最近浏览的纪念馆</div>
            <i class="more iconfont icon-gengduo" @click="moreSpaceVisitedMenu"></i>
          </div>
          <item v-for="item in visitedList" :key="item.id" :item="item" :moreMenu="true"
                v-on:item-press="goSpaceDetail"
                v-on:menu-press="showMoreMenu">
          </item>
        </div>
        <div class="list" v-if="publicList.length > 0">
          <div class="list-header">
            <div class="title">公益纪念馆</div>
            <div class="all">全部</div>
          </div>
          <item v-for="item in publicList" :key="item.id" :item="item"
                v-on:item-press="goSpaceDetail">
          </item>
        </div>
      </template>
      <template v-else>
        <div class="empty">
          <div class="text">
            <p class="note">
              走了的人只是去了另外一个世界，他/她依然在看着你，感受你的爱。
            </p>
          </div>
        </div>
      </template>
    </div>
    <div class="main-btn" :class="{'x-bottom':isIPhoneX}" @click="showMainMenu">
      <img class="main-btn-image" src="~@/modules/images/main_btn.png" />
    </div>
    <van-popup v-model="isShowMoreMenu">
      <div v-for="menu in menuList" :key="menu.id" @click.stop="moreMenuPressed(menu)" class="menu">{{menu.name}}</div>
    </van-popup>
    <van-action-sheet
      v-model="showAction"
      :actions="actions"
      close-on-popstate
      :round="false"
      @select="onActionSelect"
      @click-overlay="onActionClose">
    </van-action-sheet>
  </div>
</template>
<script>
  import {mapGetters} from 'vuex';
  import {Link} from '@/config/utils'
  import constant from '@/config/constant'
  import config_server from '@/config/config'
  import Item from '@/modules/widget/space/Item'

  import base64 from 'js-base64'

  var LoginState = {
    UNDO: 0,
    DOING: 1,
    DONE: 2,
  };

  export default{
    data(){
      return {
        list:[],
        visitedList:[],
        publicList:[],
        isShowMoreMenu:false,
        menuList:[],
        loginState:LoginState.UNDO,
        query:'', //记录进入时的query
        showNotice:false,
        showAction:false,
        actions:[],
        needRefreshList:false
      }
    },
    components: {
      Item
    },
    computed:{
      ...mapGetters({
        user: 'userStore/user',
        expire:'userStore/expire'
      }),
      isIPhoneX(){
        return false
      }
    },
    watch:{
      user(){
        this.userChanged()
      },
      expire(newVal,oldVal){
        if (newVal){
          this.tokenExpire()
        }
      }
    },
    methods:{
      updateNotice(){
        if (this.user && 0 == this.user.serviceSubscribe){
          this.showNotice = true
        }
      },
      goNotice(){
        this.showNotice = false
        Link(`/notice`)
      },
      getSpaceList(){
        this.getSpacesPersonal()
        //this.getSpacesPublic()
      },
      getSpacesPersonal(){
        $API.home.getSpaceList((rsp)=>{
          this.list = rsp
        },(error)=>{
          console.log("error:",error)
        })
      },
      getSpacesPublic(){
        $API.home.getSpacesPublic({start:0,limit:6},(rsp)=>{
          this.publicList = rsp
        },(error)=>{
          console.log("error:",error)
        })
      },
      getSpacesVisited(){
        let that = this
        $API.home.getSpacesVisited({start:0,limit:3},(rsp)=>{
          that.visitedList = rsp.map(item=>{
            if (item){
              let o = item
              o.isVisited = true
              return o
            }
          })
        },error=>{

        })
      },
      createSpace(){
        this.actions = [{
          id:'kinsfolk',
          name:'为亲属创建',
        },{
          id:'friends',
          name:'为朋友/老师/同事创建',
        },
          // {
          // id:'public',
          // name:'申请公益馆',
          // }
        ]
        this.showAction = true
      },
      goSpaceDetail(item){
        if (this.user && this.user.id == 101592){
          let msg = `before item: ${item.id}`
          alert(msg)
        }
        this.tryHandleBgm(item)
        if (this.user && this.user.id == 101592){
          let msg = `item2222: ${item.id}`
          alert(msg)
        }
        Link(`/space/detail/${item.id}`)
        if (this.user && this.user.id == 101592){
          let msg = `after item: ${item.id}`
          alert(msg)
        }
      },
      linkToSpaceDetail(spaceId,scene){
        let url = `/space/detail/${spaceId}`
        if (scene){
          url = `${url}?scene=${scene}`
        }
        Link(url)
      },
      onActionSelect(item){
        this.showAction = false
        this.actions = []
        let menu = item.id
        let type = 0
        if (menu === 'friends'){
          type = 1
        }else if(menu === 'public'){
          type = 2
        }

        Link(`/space/create?type=${type}`)
      },
      onActionClose(){
        this.showAction = false
        this.actions = []
      },
      moreSpaceVisitedMenu(){
        this.menuList = [ {
          id:'clear_visited',
          name: '清空浏览记录',
        }]
        this.isShowMoreMenu = true
      },
      showMainMenu(){
        this.menuList = [ {
          id:'create',
          name: '创建纪念馆',
        },
        {
          id:'feedback',
          name: '意见与反馈',
        }]
        this.isShowMoreMenu = true
      },
      showMoreMenu(item){
        if (item.isVisited){
          this.menuList = [ {
            id:'delete_visited',
            name:'删除该访问记录',
            data:item
          }]
        }
        this.isShowMoreMenu = true
      },
      moreMenuPressed(menu){
        this.isShowMoreMenu = false
        switch (menu.id) {
          case 'create':
            this.createSpace()
            break
          case 'feedback':
            this.goFeedback()
            break
          case 'delete_visited':
            this.deleteSpaceVisited(menu.data)
            break
          case 'clear_visited':
            this.clearSpaceVisited()
            break
        }
      },
      goFeedback(){
        let url = 'https://support.qq.com/product/63016'
        window.open(url)
      },
      deleteSpaceVisited(space){
        let that = this
        $API.home.deleteSpaceVisited({
          sid: space.id
        },rsp=>{
          let index = that.visitedList.findIndex(some=>{
            return space.id === some.id
          })
          if (index > -1){
            that.visitedList.splice(index,1)
          }
        }, error=>{
            this.$toast('删除失败，请稍后重试')
        })
      },
      clearSpaceVisited(){
        let that = this
        $API.home.clearSpaceVisited(rsp=>{
            that.visitedList = []
          }, error=>{
            this.$toast('操作失败，请稍后重试')
        })
      },
      registerEvent(){
        eventHub.$on(constant.EVENT_CREATE_SPACE_SUCCESS,this.getSpaceList)
        eventHub.$on(constant.EVENT_DELETE_SPACE_SUCCESS,this.getSpaceList)
        eventHub.$on(constant.EVENT_UPDATE_BGM_SUCCESS,this.updateSpaceBgm)
      },
      tryLogin(){
        if (this.loginState !== LoginState.UNDO){
          return
        }
        this.loginState = LoginState.DOING
        //先找本地有没有保存token
        let param = localStorage.getItem("bian-requestParam");
        let token = ''
        do{
          if (param){
            param = JSON.parse(param)
            if (param.token){
              token = param.token
              break
            }
          }
        }while (0)

        //token存在，则直接获取信息
        if (token){
          this.fetchMyInfo(token)
        }else {
          this.authWechat()
        }
      },
      fetchMyInfo(token){
        this.$store.dispatch('userStore/fetchMyInfo',{token})
      },
      authWechat(){
        let url = `${config_server.domain}/login.html`
        url = encodeURIComponent(url)
        let appid = 'wxdb43de2e1083005a'
        url = `https://open.weixin.qq.com/connect/oauth2/authorize?appid=${appid}&redirect_uri=${url}&response_type=code&scope=snsapi_userinfo&state=wechat_state#wechat_redirect`

        window.location.replace(url)
      },
      loginWithCode(code){
        this.$store.dispatch('userStore/loginWithCode', {code})
      },
      loginWithToken(token){
        this.fetchMyInfo(token)
      },
      loginWithUid(uid){
        console.log("===loginWithUid====");
        this.$store.dispatch('userStore/loginWithUid', {uid})
      },
      userChanged(){
        this.loginState = LoginState.DONE //完成登录
        this.dispatchWithQuery()
        this.getSpaceList()
        this.getSpacesVisited()
        this.updateNotice()
      },
      tokenExpire(){
        //token过期了，重新尝试授权登录
        this.authWechat()
      },
      initLogin(){
        let query = this.$route.query
        let code = ''
        let uid = ''
        let token = ''

        this.query = query
        if(query){
          if (query.code && query.state === 'wechat_state'){
            code = query.code
          }
          if (query.uid){
            uid = query.uid
          }
          if (query.token){
            token = query.token
          }
        }
        if (token){
          this.loginWithToken(token)
          return
        }
        if (uid){
          this.loginWithUid(uid)
          return
        }
        if (code){
          this.loginWithCode(code)
        }else{
          this.tryLogin()
        }
      },
      dispatchWithQuery(){
        if (this.query){
          let from = this.query.origin_from
          let spaceId = this.query.space_id
          let inviteUserId = this.query.invite_user_id
          let timestamp = this.query.timestamp
          let ticket = ''
          //如果是链接分享的
          if (this.query.copylink){
            let content = this.query.copylink
            content = content.replace(/-/g, '+').replace(/_/g, '/') // Convert '-' to '+', '_' to '/'
            content = base64.Base64.decode(content)
            let params = content.split('&')
            let query = {}
            for (let i = 0; i < params.length; i++) {
              let param = params[i].split('=')
              query[param[0]] = param[1]
            }

            from = query.origin_from
            spaceId = query.space_id
            inviteUserId = query.invite_user_id
            timestamp = query.timestamp
            ticket = query.ticket
          }
          //检查时效性
          let now = new Date().getTime()
          if (timestamp && now > parseInt(timestamp) + 2 * 24 * 60 * 60 * 1000){
            return
          }

          if (from === 'space_detail'){
            if (inviteUserId != this.user.id){
              this.needRefreshList = true
            }
            this.linkToSpaceDetail(spaceId)
          }else if (from === 'meeting'){
            let scene = ''
            if (inviteUserId != this.user.id){
              this.needRefreshList = true
              scene = 'memorial_meeting'
            }
            this.linkToSpaceDetail(spaceId,scene)
          } else if(from === 'add_friends'){
            if (inviteUserId == this.user.id){ //如果链接是当前用户发起的，直接进入即可
              this.linkToSpaceDetail(spaceId)
            }else{
              this.addMemberToSpace(spaceId)
            }
          }else if(from === 'transfer_space'){
            if (inviteUserId == this.user.id){ //如果链接是当前用户发起的，直接进入即可
              this.linkToSpaceDetail(spaceId)
            }else{
              this.transferSpace(spaceId,ticket)
            }
          }
          this.query = '' //把query置空
        }
      },
      addMemberToSpace(spaceId){
        let userId = this.user.id
        $API.space.addFriend({
          sid:spaceId,
          userId:userId,
        }, rsp=>{
          this.needRefreshList = true
          this.linkToSpaceDetail(spaceId)
        })
      },
      transferSpace(spaceId,ticket){
        $API.space.transferSpaceWithTicket({
          sid:spaceId,
          ticket
        }, rsp=>{
          this.needRefreshList = true
          this.linkToSpaceDetail(spaceId)
        })
      },
      updateSpaceBgm(data){

        if (data){
          let index = this.list.findIndex(item=>item.id == data.spaceId)
          if (index > -1){
            if (!this.list[index].music){
              this.list[index].music = {}
            }
            this.list[index].music.key = data.bgmKey
            if (data.selfUpload){
              this.list[index].music.selfUpload = data.selfUpload
            }
          }
        }
      },
    },
    created() {
      this.initLogin()
      this.registerEvent()
    },
    activated(){
      if (this.loginState === LoginState.DONE && this.needRefreshList){
        this.needRefreshList = false
        this.getSpaceList()
        this.getSpacesVisited()
      }
    },
    beforeDestroy() {
      eventHub.$off(constant.EVENT_CREATE_SPACE_SUCCESS,this.getSpaceList)
      eventHub.$off(constant.EVENT_DELETE_SPACE_SUCCESS,this.getSpaceList)
      eventHub.$off(constant.EVENT_UPDATE_BGM_SUCCESS,this.updateSpaceBgm)
    }
  }
</script>

<style rel="stylesheet/less" lang="less" scoped>
  @import "~@/config/config.less";

  .main-container {
    height: 100%;
    overflow-y: auto;
    display: flex;
    flex-direction: column;

    .container-top {
      position: relative;
      height: 220px;
      flex-shrink: 0;
      .header-image {
        width: 100%;
        height: 100%;
      }
      .text-area{
        position: absolute;
        display: flex;
        justify-content: center;
        top: 90px;
        width: 100%;
        .text{
          text-align: center;
          color: white;
          font-size: 22px;
          padding: 2px 20px;
          background: rgba(0,0,0,0.5);
        }
      }
    }
    .notice-container{
      .van-cell{
        background: @MAIN_THEME_COLOR;
        .van-cell__value--alone{
          color: white;
        }
        .van-cell__right-icon{
          color: white;
        }
      }
    }
    .container-bottom {
      flex-grow: 1;
      margin-bottom: 100px;
      .list {
        .list-header{
          display:flex;
          align-items:center;
          height:30px;
          padding:0 25px;
          background:#eeeeee;
          .title{
            font-size: 12px;
            color: #666666;
          }
          .more,.all{
            margin-left: auto;
          }
        }
      }
      .empty {
        .text {
          padding: 30px;
          text-align: center;
          font-size: 17px;
          .note {
            color: @MAIN_THEME_COLOR;
          }
        }
      }
    }
    .main-btn{
      position:fixed;
      bottom:25px;
      right:20px;
      .main-btn-image{
        width: 50px;
        height: 50px;
      }
      &.x-bottom{
        bottom:55px;
      }
    }
  }

</style>
