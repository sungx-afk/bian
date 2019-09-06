<template>
  <div class="container">
    <div class="container-content" :class="{'iphonex-height':isIPhoneX}">
      <template v-if="tabActive == 'main'">
        <!--首页-->
        <info ref="info" v-if="detail" :space="detail" v-on:action-changed="actionChanged"></info>
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
      @select="onActionSelect"
      @click-overlay="onActionClose">
    </van-action-sheet>
    <template v-if="true">
      <van-tabbar @change="onTabChange">
        <van-tabbar-item v-for="tabBar in tabBarList" :key="tabBar.id" :name="tabBar.id" style="font-size: 16px;" :style="{'color':styleTabBar(tabBar)}">{{tabBar.name}}</van-tabbar-item>
      </van-tabbar>
    </template>
    <div v-if="tabActive == 'main'" class="audio iconfont icon-yinlemusic217 anim" :class="{'playing':playState === 'play'}" @click.stop="togglePlayBgm"></div>
  </div>
</template>
<script>
  import {mapGetters,mapActions} from 'vuex';
  import {Link} from '@/config/utils'
  import constant from '@/config/constant'

  import Info from './detail/Info'
  import Message from './detail/Message'
  import Friends from './detail/Friends'
  import Private from './detail/Private'

  export default{
    data(){
      return {
        spaceId:'',
        detail:'',
        tabBarList:[{
          id:'main',
          name:'首页'
        },{
          id:'sacrifice',
          name:'祭拜'
        },{
          id:'message',
          name:'留言'
        },{
          id:'friends',
          name:'亲属空间'
        },{
          id:'secret',
          name:'私语'
        }],
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
        playState:'stop'
      }
    },
    components: {
      Info,
      Message,
      Friends,
      Private
    },
    computed:{
      ...mapGetters({
        user: 'userStore/user',
        userSetting:'userStore/userSetting'
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
    },
    methods:{
      ...mapActions({
        setUserSetting: 'userStore/setUserSetting',
      }),
      onTabChange(e){
        if (e === 'sacrifice'){
          this.goSacrifice()
          return
        }
        if (e.detail === 'friends'){ //亲属空间加判断
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
        this.$refs.info.onActionSelect(item)
      },
      onActionClose(){
        this.$refs.info.onActionClose()
      },
      getDetail(cb){
        if (!this.spaceId){
          return
        }
        $API.space.getSpaceDetail({
          sid: this.spaceId,
        }, (rsp)=>{
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
            this.detail = rsp
            cb && cb()
          }, error=>{

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
      },
      initShare(){
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
    },
    created() {
      if(this.$route.params.id){
        this.spaceId = this.$route.params.id
        console.log(this.spaceId)
        this.getDetail(()=>{

        })
        this.registerEvent()
        this.initShare()
      }
    },
    beforeDestroy() {
      this.stopBgm(true)
      eventHub.$off(constant.EVENT_AUDIO_PLAY,this.updatePlayState)
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
    .audio{
      position: absolute;
      z-index: 10;
      bottom:65px;
      right: 10px;
      font-size: 28px;
      font-weight: bold;
      width: 30px;
      height: 30px;
      color: @MAIN_THEME_COLOR;
      &.anim{
        animation: rotate 3s linear infinite;
        animation-play-state:paused;
        @keyframes rotate{from{transform: rotate(0deg);transform-origin:50% 50%;}
          to{transform: rotate(359deg);transform-origin:50% 50%;}
        }
      }
      &.playing{
        animation-play-state:running;
      }
    }
  }

</style>
