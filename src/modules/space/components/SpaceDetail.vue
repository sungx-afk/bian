<template>
  <div class="container">
    <div class="notice-container" v-if="showNotice">
      <van-cell is-link @click.stop="goNotice">
        您还未关注公众号，关注后可以及时收到通知
      </van-cell>
    </div>
    <div class="container-content" :class="{'iphonex-height':isIPhoneX}">
      <template v-if="tabActive == 'main'">
        <!--首页-->
        <info-theme ref="info" v-if="detail" :space="detail" :playState="playState" v-on:action-changed="actionChanged" v-on:bgm-click="bgmAction"></info-theme>
      </template>
      <template v-if="tabActive == 'message'">
        <!--留言-->
        <message v-if="detail" :space="detail" type="PUBLIC"></message>
      </template>
      <template v-if="tabActive == 'friends'">
        <!--亲属空间-->
        <friends v-if="detail" :space="detail" type="SPACE"></friends>
      </template>
      <template v-if="tabActive == 'secret'">
        <!--私语-->
        <private v-if="detail" :space="detail" type="PRIVATE"></private>
      </template>
    </div>
    <van-action-sheet
      v-model="showAction"
      :actions="actions"
      close-on-popstate
      :round="false"
      @select="onActionSelect"
      @click-overlay="onActionClose">
    </van-action-sheet>
    <template v-if="showTab">
      <van-tabbar @change="onTabChange">
        <van-tabbar-item v-for="tabBar in tabBarList" :key="tabBar.id" :name="tabBar.id" style="font-size: 16px;" :style="{'color':styleTabBar(tabBar)}">{{tabBar.name}}</van-tabbar-item>
      </van-tabbar>
    </template>
  </div>
</template>
<script>
  import {mapGetters,mapActions} from 'vuex';
  import {Link,isIphone} from '@/config/utils'
  import constant from '@/config/constant'

  import Info from './detail/Info'
  import Message from './detail/Message'
  import Friends from './detail/Friends'
  import Private from './detail/Private'
  import InfoTheme from './detail/InfoTheme'

  export default{
    data(){
      return {
        spaceId:'',
        tabBarList:[],
        messageType:'PUBLIC', //PUBLIC, PRIVATE, SPACE;
        tabActive:'main',
        menuList:[],
        currentImageIndex:0,
        isShowMoreMenu:false,
        showMemorialMeeting:false,
        noIssueData:false,
        noMoreData:false,
        loadingMore:false,
        postComment: false,
        showAction:false,
        actions:[],
        playState:'stop',
        showBgmAction:false,
        showNotice:false
      }
    },
    components: {
      Info,
      Message,
      Friends,
      Private,
      InfoTheme
    },
    computed:{
      ...mapGetters({
        user: 'userStore/user',
        showTab:'spaceStore/detailShowTab',
        detail:'spaceStore/spaceDetail'
      }),
      isIPhoneX(){
        return false
      },
      canComment(){
        let result = true
        let currentUserId = this.user.id
        if (this.detail && currentUserId !== this.detail.creatorId && this.detail.config.commentScope == 'member' ){
          let index = this.detail.config.friendIds.findIndex(item=>item === currentUserId)
          if (index === -1){ //如果没有找到，说明不在好友列表
            result = false
          }
        }
        return result
      },
      isSpaceCreator(){
        let result = false
        let currentUserId = this.user.id
        if (this.detail && currentUserId === this.detail.creatorId){
          result = true
        }
        return result
      },
      isSpaceMember(){
        let result = false
        if (!this.isSpaceCreator && this.detail){
          let currentUserId = this.user.id
          let index = this.detail.config.friendIds.findIndex(item=>item === currentUserId)
          if (index > -1){
            result = true
          }
        }
        return result
      },
      showFriendsTab(){
        let result = false
        if (this.detail && this.detail.type == 0){
          result = true
        }
        return result
      }
    },
    methods:{
      ...mapActions({
        setUserSetting: 'userStore/setUserSetting',
        setDetailShowTab: 'spaceStore/setDetailShowTab',
        getSpaceDetail:'spaceStore/getSpaceDetail',
        clearSpaceDetail:'spaceStore/clearSpaceDetail'
      }),
      initNotice(){
        if (this.user && !this.user.serviceOpenId){
          this.showNotice = true
        }
      },
      goNotice(){
        this.showNotice = false
        Link(`/notice`)
      },
      onTabChange(e){
        if (e === 'sacrifice'){
          this.saveSpaceTab('sacrifice')
          this.goSacrifice()
          return
        }
        if (e === 'friends'){ //亲属空间加判断
          if (!this.isSpaceMember && !this.isSpaceCreator){
            this.$toast("您当前还不是该馆亲属成员")
            return
          }
        }
        this.tabActive = e
        let messageType = 'PUBLIC'
        if (this.tabActive == 'message'){//留言
          messageType = 'SPACE'
        }else if(this.tabActive == 'secret'){ //私语
          messageType = 'PRIVATE'
        }
        this.messageType = messageType

        this.saveSpaceTab(this.tabActive)
      },
      styleTabBar(tab){
        let color = '#7d7e80'
        if (this.tabActive === tab.id){
          color = '#825621'
        }
        return color
      },
      actionChanged(data){
        if (data.showAction === false){
          this.showAction = false
          this.actions = []
        }else {
          this.showAction = true
          this.actions = data.actions
        }
      },
      onActionSelect(item){
        if (this.showBgmAction){
          this.showBgmAction = false
          this.showAction = false
          this.actions = []
          let menu = item.id
          if (menu === 'stop_bgm' || menu === 'play_bgm'){
            this.togglePlayBgm()
          }else if (menu === 'setting_bgm'){
            Link(`/space/bgm/${this.spaceId}`)
          }
        }else{
          this.$refs.info.onActionSelect(item)
        }
      },
      onActionClose(){
        if (this.showBgmAction){
          this.showBgmAction = false
          this.showAction = false
          this.actions = []
        }else{
          this.$refs.info.onActionClose()
        }
      },
      initTab(){
        this.tabBarList = [{
          id:'main',
          name:'首页'
        },{
          id:'sacrifice',
          name:'祭拜'
        },{
          id:'message',
          name:'留言'
        },{
          id:'secret',
          name:'私语'
        }]

        //只有type=0的才显示亲属空间
        if (this.showFriendsTab){
          this.tabBarList.splice(3,0,{
            id:'friends',
            name:'亲属空间'
          })
        }
        let key = constant.KEY_LAST_SPACE_INFO + '_' + this.spaceId
        let value = localStorage.getItem(key)
        if (value) {
          if (value === 'sacrifice'){
            this.goSacrifice()
          }else{
            this.tabActive = value
          }
        }
      },
      saveSpaceTab(value){
        //记录停在了哪个tab上
        let key = constant.KEY_LAST_SPACE_INFO + '_' + this.spaceId
        localStorage.setItem(key,value)
      },
      getDetail(cb){
        if (!this.spaceId){
          return
        }
        this.getSpaceDetail({sid:this.spaceId}).then((rsp)=>{
          let flag = this.checkCanIn(rsp)
          if(flag === -1){
            this.$toast({
              message:'纪念馆已禁止访客进入，请联系馆主进行操作',
              onClose:()=>{
                this.$router.go(-1)
              }
            })
            return
          }else if(flag === -2){
            this.$toast({
              message:'您无法浏览该馆',
              onClose:()=>{
                this.$router.go(-1)
              }
            })
            return
          }
          cb && cb()
        })
      },
      checkCanIn(space){
        let result = 0
        //如果是开启了仅亲属进入，同时当前用户又不在亲属空间返回-1
        //如果没有开启仅亲属进入，判断当前用户是否在黑名单用户，如果是返回-2
        let currentUserId = this.user.id
        if (currentUserId === space.creatorId){ //创建者永远能进入
          result = 0
        }else if (space.config.viewScope == 'member'){
          let index = space.config.friendIds.findIndex(id=>id === currentUserId)
          if (index === -1){ //如果没有找到，说明不在好友列表
            result = -1
          }else{
            let index = space.config.blackListIds.findIndex(id=>id === currentUserId)
            if (index > -1){ //找到了，则说明在黑名单里
              result = -2
            }
          }
        }else{
          let index = space.config.blackListIds.findIndex(id=>id === currentUserId)
          if (index > -1){ //找到了，则说明在黑名单里
            result = -2
          }
        }
        return result
      },
      goSacrifice(){
        Link(`/space/sacrifice/${this.spaceId}`)
      },
      registerEvent(){
        eventHub.$on(constant.EVENT_AUDIO_PLAY,this.updatePlayState)
        eventHub.$on(constant.EVENT_TRANSFER_SPACE_SUCCESS,this.updateSpaceDetail)
        eventHub.$on(constant.EVENT_CREATE_SPACE_SUCCESS,this.updateSpaceDetail)
      },
      initShare(){
        if (!isIphone()){
          let extra = {}
          extra.origin_from = 'space_detail'
          extra.invite_user_id = this.user.id
          extra.space_id = this.spaceId

          this.wechatShare({
            title: '彼岸纪念',
            extra:extra,
            success: () => { //你重置分享成功后的回调

            }
          })
        }
      },
      bgmAction(){
        if (this.isSpaceCreator){
          if (this.playState === 'play'){
            this.actions.push({
              name: '停止音乐',
              id:'stop_bgm',
            })
          }else{
            this.actions.push({
              name: '播放音乐',
              id:'play_bgm',
            })
          }
          this.actions.push({
            name: '设置音乐',
            id:'setting_bgm',
          })
          this.showBgmAction = true
          this.showAction = true
        }else{
          this.togglePlayBgm()
        }
      },
      togglePlayBgm(){
        if (this.playState === 'play'){
          this.stopBgm()
          this.setUserSetting({key:'bgm_play_state',value:'stop'})
        }else if (this.playState === 'stop'){
          this.playBgm()
          this.setUserSetting({key:'bgm_play_state',value:'play'})
        }
      },
      updatePlayState(state){
        this.playState = state
      },
      updateSpaceDetail(){
        this.getDetail()
      }
    },
    created() {
      if(this.$route.params.id){
        this.spaceId = this.$route.params.id
        this.getDetail(()=>{
          this.initTab()
          this.initBgm(this.detail)
        })
        this.registerEvent()
        this.initShare()
        this.initNotice()
      }
    },
    beforeDestroy() {
      this.stopBgm(true)
      this.setDetailShowTab(true)
      this.clearSpaceDetail()
      eventHub.$off(constant.EVENT_AUDIO_PLAY,this.updatePlayState)
      eventHub.$off(constant.EVENT_TRANSFER_SPACE_SUCCESS,this.updateSpaceDetail)
      eventHub.$off(constant.EVENT_CREATE_SPACE_SUCCESS,this.updateSpaceDetail)
    }
  }
</script>

<style rel="stylesheet/less" lang="less" scoped>
  @import "~@/config/config.less";

  .container {
    height: 100%;
    width: 100%;
    box-sizing: border-box;
    background-color: #f6f6f6;
    overflow-x: hidden;
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
    .container-content{
      height: ~'calc(100% - 50px)';
      &.iphonex-height{
        height: ~'calc(100% - 80px)';
      }
      .message-container{
        height: 100%;
        .members-area{
          display:flex;
          flex-direction:column;
          .members-title{
            display: flex;
            font-size: 13px;
            color: @FONT_THIRD_COLOR;
            padding:5px 10px;
          }
          .members-body{
            padding: 0 5px;
            display:flex;
            align-items:center;
            .member-avatar{
              width:20px;
              height:20px;
              border-radius:10px;
              margin:0 5px;
            }
          }
        }
      }
      .issue-container{
        height: 100%;
        .loading{
          display: flex;
          align-items:center;
          justify-content: center;
          background: @BG_WHITE;
          font-size:12px;
          color:#a9a9a9;
          .text{
            margin-left: 5px;
          }
        }
      }
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
      .private-tip{
        font-size:14px;
        padding:10px;
        background:white;
        color: @MAIN_THEME_COLOR;
      }
    }
  }

</style>
