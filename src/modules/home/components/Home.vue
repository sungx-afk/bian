<template>
  <div class="main-container">
    <div class="container-top">
      <img src="~@/modules/images/index_header.jpg" class="header-image" />
    </div>
    <div class="container-bottom">
      <template v-if="list.length > 0 || visitedList.length > 0">
        <div class="list" v-if="list.length > 0">
          <item v-for="item in list" :key="item.id" :item="item"
                v-on:item-press="goSpaceDetail"
                v-on:menu-press="showMoreMenu">
          </item>
        </div>
        <div class="list" v-if="visitedList.length > 0">
          <div class="visited-header">
            <div class="title">浏览过的纪念馆</div>
            <i class="more iconfont icon-gengduo" @click="moreSpaceVisitedMenu"></i>
          </div>
          <item v-for="item in visitedList" :key="item.id" :item="item" :moreMenu="true"
                v-on:item-press="goSpaceDetail"
                v-on:menu-press="showMoreMenu">
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
      <div v-for="menu in menuList" :key="menu.id" @click="moreMenuPressed(menu)" class="menu">{{menu.name}}</div>
    </van-popup>
  </div>
</template>
<script>
  import {mapGetters} from 'vuex';
  import {Link} from '@/config/utils'
  import constant from '@/config/constant'
  import Item from '@/modules/widget/space/Item'

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
        isShowMoreMenu:false,
        menuList:[],
        loginState:LoginState.UNDO
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
      getSpaceList(){
        $API.home.getSpaceList((rsp)=>{
          this.list = rsp
        },(error)=>{
          console.log("error:",error)
        })
      },
      getSpacesVisited(){
        let that = this
        $API.home.getSpacesVisited((rsp)=>{
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
        Link('space/create')
      },
      goSpaceDetail(item){
        Link(`space/detail/${item.id}`)
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
        let url = 'https://ba.yugusoft.com/login.html'
        url = encodeURIComponent(url)
        let appid = 'wxdb43de2e1083005a'
        url = `https://open.weixin.qq.com/connect/oauth2/authorize?appid=${appid}&redirect_uri=${url}&response_type=code&scope=snsapi_userinfo&state=wechat_state#wechat_redirect`

        window.location.href = url
      },
      loginWithCode(){
        this.$store.dispatch('userStore/loginWithCode', {code})
      },
      userChanged(){
        this.loginState = LoginState.DONE //完成登录
        this.getSpaceList()
        this.getSpacesVisited()
      },
      tokenExpire(){
        //token过期了，重新尝试授权登录
        this.authWechat()
      }
    },
    created() {
      this.registerEvent()
    },
    activated(){
      let query = this.$route.query
      let code = ''
      if(query && query.code && query.state === 'wechat_state'){
        code = query.code
      }
      if (code){
        this.loginWithCode(code)
      }else{
        this.tryLogin()
      }
    },
    beforeDestroy() {
      eventHub.$off(constant.EVENT_CREATE_SPACE_SUCCESS,this.getSpaceList)
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
      height: 220px;
      .header-image {
        width: 100%;
        height: 100%;
      }
    }
    .container-bottom {
      flex-grow: 1;
      margin-bottom: 100px;
      .list {
        .visited-header{
          display:flex;
          height:30px;
          align-items:center;
          background:#eeeeee;
          padding:0 25px;
          .title{
            font-size: 12px;
            color: #666666;
          }
          .more{
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
