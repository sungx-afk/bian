<template>
  <div class="sacrifice" :class="checkResult === 0 ? theme : 'no-theme'">
    <template v-if="checkResult === 0">
    <div class="sacrifice-back-btn" v-if="isAutoEntered" @click="backToList" aria-label="返回列表">
      <img src="~@/modules/images/back.svg" alt="返回" />
    </div>
    <template v-if="space && space.combineImage == 1">
      <div class="yi-xiang-box combine">
        <div class="xiang_kuang" @click="goSurvey">
          <div class="yi_xiang" :style="{'background-image':`url(${combineAvatarUrl})`}"></div>
        </div>
      </div>
    </template>
    <template v-else>
      <div class="yi-xiang-box single" v-if="space && space.spaceUsers.length <= 1">
        <div class="xiang_kuang" @click="goSurvey">
          <div class="yi_xiang" :style="{'background-image':`url(${space && space.spaceUsers[0].avatarUrl})`}"></div>
        </div>
      </div>

      <div class="yi-xiang-box double" v-if="space && space.spaceUsers.length == 2">
        <div class="xiang_kuang" @click="goSurvey">
          <div class="yi_xiang" :style="{'background-image':`url(${space && space.spaceUsers[0].avatarUrl})`}"></div>
        </div>
        <div class="xiang_kuang" @click="goSurvey">
          <div class="yi_xiang" :style="{'background-image':`url(${space && space.spaceUsers[1].avatarUrl})`}"></div>
        </div>
      </div>
    </template>

    <div class="epitaph-wrapper"
         v-if="space && space.showEpitaph && space.epitaph">
      {{space.epitaph}}
    </div>

    <div id="dui_lian_box" v-if="space && space.showCouplet">
      <div class="inner" style="padding: 30px 15px 0px;" v-if="space && space.id>0">
        <div class="dui_lian" style="float: left;">{{space &&space.couplets && space.couplets.left}}</div>
        <div class="dui_lian" style="float: right;">{{space &&space.couplets && space.couplets.right}}</div>
      </div>
    </div>

    <div id="main-box">
      <div class="inner">
        <div id="item_hua_bg">
          <div class="inner" style="padding-top:25vw; padding-left: 5vw;padding-right: 5vw;">
            <div id="hua_box">
              <div class="hua"
                   v-for="(item, index) in huaQuan"
                   :key="index"
                   v-if="index<6"
              ></div>
            </div>
          </div>
        </div>

        <div id="item_zuo_zi_box">
          <div id="item_zuo_zi_box_inner">
            <div id="item_zuo_zi">
              <div class="inner">
                <template v-for="(item, index) in item01" v-if="index <8">
                  <div
                    :key="index"
                    :class="`${item.id}`"
                    class="item"
                    v-if="item.id!=='item-zhang-min-ding'"
                  ></div>
                  <change-ming-deng v-else></change-ming-deng>
                </template>
              </div>
            </div>
          </div>
        </div>

        <div id="item_zuo_zi_box_2" style="top:62vw;">
          <div id="item_zuo_zi_box_inner_2">
            <div id="item_zuo_zi_2">
              <div class="inner">
                <template v-for="(item, index) in item02" v-if="index<3">
                  <div
                    :key="index"
                    :class="`${item.id}`"
                    class="item"
                    v-if="item.id!=='item-zhang-min-ding'"
                  ></div>
                  <change-ming-deng v-else></change-ming-deng>
                </template>
                <div class="item item-la-zu">
                  <canvas id="zu-huo-1" style="width: 10vw; height: 10vw;" :style="{'visibility': showLaZuCanvas?'visible':'hidden'}"></canvas>
                </div>
                <div class="item item-xiang-lu">
                  <div class="item-xiang-lu-box" :style="{'visibility': showXiangCanvas?'visible':'hidden'}">
                    <div class="item-xiang">
                      <canvas id="a" width="30" height="30"></canvas>
                      <canvas id="b" width="30" height="30"></canvas>
                      <canvas id="c" width="30" height="30"></canvas>
                    </div>
                  </div>
                </div>
                <div class="item item-la-zu">
                  <canvas id="zu-huo-2" style="width: 10vw; height: 10vw;" :style="{'visibility': showLaZuCanvas?'visible':'hidden'}"></canvas>
                </div>
                <template v-for="(item, index) in item02" v-if="index>=6 && index <=8">
                  <div
                    :key="index"
                    :class="`${item.id}`"
                    class="item"
                    v-if="item.id!=='item-zhang-min-ding'"
                  ></div>
                  <change-ming-deng v-else></change-ming-deng>
                </template>
              </div>
            </div>
          </div>
        </div>


        <div class="big-fire-box">
          <div class="inner">]
            <canvas id="big-fire" style="width: 100px;height: 100px;visibility: hidden;" :style="{'visibility': showZhiQianCanvas?'visible':'hidden'}"></canvas>
          </div>
        </div>

        <div class="messages" v-if="space && space.logs">
          <div v-for="(item, index) in space.logs"
               class="message"
               v-if="index < 4"
               :style="{animationDelay: `${(space.logs.length - index)*300}ms`}">{{item}}
          </div>
        </div>

        <!--<canvas id="yan-canvas"></canvas>-->

        <canvas id="smoke-box"></canvas>

        <div class="buttons">
          <div class="button" @click="jibai()">上香</div>
          <div class="button" @click="dianlazu()">点烛</div>
          <div class="button" @click="shaozhi()">纸钱</div>
          <div class="button" @click="goMoreOperate()">更多</div>
          <div class="side-buttons">
            <div class="button" @click="goSurvey" v-if="false">
              <img src="~@/modules/images/survey.svg" alt="概况" />
            </div>
            <div class="button" @click="goSacrifice" v-if="false">
              <img src="~@/modules/images/jibai.svg" alt="祭拜" />
            </div>
            <div class="button" @click="goMessage">
              <img src="~@/modules/images/message.svg" alt="留言" />
            </div>
            <div class="button music-button" :class="{'playing':playState === 'play'}" @click="goBgmAction">
              <img src="~@/modules/images/music.svg" alt="音乐" />
            </div>
            <div class="button" @click="goSetting">
              <img src="~@/modules/images/setting.svg" alt="设置" />
            </div>
            <div class="button" @click="goMoreOperate" v-if="false">
              <img src="~@/modules/images/more.svg" alt="更多" />
            </div>
          </div>
        </div>

        <div class="share-button" @click="goShare">
          <img class="share-icon" src="~@/modules/images/share.svg" alt="转发" />
        </div>
      </div>


      <div id="jibai"
           style="width: 100%;text-align: center; position: absolute;left: 0;right: 0;bottom: 0vw;height: 360px;z-index: 11; visibility: hidden;">
        <img src="./images/baifo.gif" style="width: 250px;height: 366px;"/>
      </div>

      <div id="item-xuan-hua" class="item-xuan-hua"></div>
    </div>
    <message v-if="showMessage" v-on:confirm="messageConfirm" v-on:cancel="messageCancel" :product="currentProduct"></message>

    <van-action-sheet
      v-model="showSacrificeAction"
      :actions="sacrificeActions"
      cancel-text="取消"
      close-on-popstate
      close-on-click-action
      @select="onSacrificeSelect">
    </van-action-sheet>

    <van-action-sheet
      v-model="showBgmAction"
      :actions="bgmActions"
      cancel-text="取消"
      close-on-popstate
      close-on-click-action
      @select="onBgmSelect">
    </van-action-sheet>

    <van-action-sheet
      v-model="showShareAction"
      :actions="shareActions"
      cancel-text="取消"
      close-on-popstate
      close-on-click-action
      @select="onShareSelect">
    </van-action-sheet>

    <van-action-sheet
      v-model="showSettingAction"
      :actions="settingActions"

      close-on-popstate
      close-on-click-action
      @select="onMoreSelect">
    </van-action-sheet>
    </template>
    <template v-else>
      <div class="tip-wrapper" @click="goBack" v-if="tipContent">
        <i class="iconfont icon-warn"></i>
        <div class="content">{{tipContent}}</div>
      </div>
    </template>
  </div>
</template>
<script>

  import {mapGetters,mapActions} from 'vuex'

  import {Link,setLastSpaceId,getLastSpaceId,clearLastSpaceId} from '@/config/utils';
  import constant from '@/config/constant';

  import Message from '../Message';
  import ChangeMingDeng from './ChangeMingDeng.vue';

  const noItems = [
    'item-xuan-hua',
    'item-kao-ya',
    'item_shuiguo',
    'item_mantou',
    'item-yue-bing',
    'item-mao-tai',
    'item-wu-liang-ye',
    "item_pk_jiuxi_hongsaorou",
    "item_pk_jiuxi_ji",
    "item_pk_jiuxi_maotai",
    "item_pk_jiuxi_mifan",
    "item_pk_jiuxi_mantou",
    "item_pk_jiuxi_ya",
    "item_pk_jiuxi_yu",
    "item-zhang-min-ding",
  ];

  const seqIndex = [10, 14, 9, 15, 8, 16, 3, 4, 2, 5, 1, 6, 0, 7];

  export default {
    data() {
      return {
        item_01: new Array(8).fill({}),
        item_02: new Array(9).fill({}),
        spaceId: 0,
        space: null,
        checkResult: 0,
        tipContent: '',
        showMessage:false,
        currentProduct:null,
        action:null,
        showLaZuCanvas: false,
        showXiangCanvas: false,
        showZhiQianCanvas: false,
        playState: 'stop',
        bgmInited: false,
        showSacrificeAction: false,
        sacrificeActions: [
          {name: '上香', id: 'shang_xiang'},
          {name: '点烛', id: 'dian_la_zu'},
          {name: '纸钱', id: 'zhi_qian'},
          {name: '送花', id: 'song_hua'}
        ],
        showBgmAction: false,
        bgmActions: [],
        showShareAction: false,
        shareActions: [],
        showSettingAction:false,
        settingActions:[],
        //是否从 /list 自动跳进来的：仅此场景显示"返回列表"按钮（详情页、分享链接直跳不显示）
        isAutoEntered:false,
        //离开祭拜页时是否因跳转暂停了音乐（回来时续播；用户手动停的不续播）
        bgmPausedOnLeave:false
      }
    },
    components: {
      ChangeMingDeng,
      Message
    },
    computed: {
      ...mapGetters({
        user: 'userStore/user'
      }),
      huaQuan() {
        return this.space && this.space.products.filter((item) => item == 'item-hua-quan');
      },
      item01() {
        return this.item_01;
      },
      item02() {
        this.item_02[3] = {id: 'item-xiang'};
        this.item_02[4] = {id: 'item-xiang'};
        this.item_02[5] = {id: 'item-xiang'};
        return this.item_02;
      },
      changMingDeng(){
        return this.space && this.space.products.includes('item-zhang-min-ding');
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
      },
      theme(){
        return 'theme_'+(this.space&&this.space.backgroundId||1);
      },
      isSpaceCreator(){
        let result = false
        if (this.space && this.user && this.user.id === this.space.creatorId){
          result = true
        }
        return result
      },
      isSpaceFriend(){
        let result = false
        if (this.space && this.space.config && this.space.config.friendIds && this.space.config.friendIds.length > 0 && this.user){
          let index = this.space.config.friendIds.findIndex(item=>item === this.user.id)
          if (index > -1){
            result = true
          }
        }
        return result
      },
      canShareFriend(){
        let result = false
        //如果是亲属馆，同时是创建人或者亲属成员
        if (this.space && this.space.type === 0 && (this.isSpaceCreator || this.isSpaceFriend)){
          result = true
        }
        return result
      },
      showExitSpace(){
        //是创建者，不能退出纪念馆
        if (this.isSpaceCreator){
          return false
        }
        let result = false
        //亲属馆才有退出一说
        if (this.space && this.space.type === 0){
          let index = this.space.config.friendIds.findIndex(item => item === this.user.id)
          if (index > -1) {
            result = true
          }
        }
        return result
      },
      combineAvatarUrl(){
        let url = ''

        for (let i = 0; i < this.space.spaceUsers.length; i++) {
          let user = this.space.spaceUsers[i]
          if (user && user.avatarUrl){
            url = user.avatarUrl
            break
          }
        }

        return url
      },
      supportPay(){
        return config_server.supportPay
      },
      isVipSpace(){
        return this.space && this.space.vip == 1
      },
    },
    methods: {
      ...mapActions({
        setUserSetting: 'userStore/setUserSetting'
      }),
      //购买，通用
      buy(productId, callback) {
        let that = this;
        $API.space.buy({spaceId: that.spaceId, productId: productId}, (resp) => {
          if (resp && !resp.error) {
            // if(resp.content){
            //   that.space.logs.unshift(resp.content);
            // }
            if (callback && typeof callback == 'function') {
              callback();
            }
          } else {
            if (resp.errorCode == -9999) {
              this.$toast(resp.error);
              setTimeout(() => {
                Link(`/store/info?space_id=${this.spaceId}`);
              }, 2000)
            } else {
              this.$toast(error.message || error.error);
            }
          }
        }, (error) => {
          this.$toast(error.message || error.error);
        });
      },

      //祭拜
      jibai() {
        let that = this;
        this.buy('package-shang-xiang-ji-bai', () => {
          var dom = document.getElementById("jibai");
          let xiangDom = document.querySelector('.item-xiang-lu-box');
          // let yanDom = document.querySelector('#yan-canvas');
          dom.style.visibility = 'visible';
          setTimeout(function () {
            dom.style.visibility = 'hidden';
            xiangDom.style.visibility = 'visible';
            // yanDom.style.visibility = 'visible';
            that.getSpaceDetail();
          }, 3000)
        });
      },
      //点烛
      dianlazu() {
        if (this.canComment){
          this.showMessage = true
          this.currentProduct = {
            name:'点烛',
            duration:'1天',
            point:this.space.type == 2?0:3
          }
          this.action = this.doDianlazu
        }else {
          this.doDianlazu()
        }
      },

      doDianlazu(){
        let that = this;
        this.buy('item-la-zu', () => {
          if (this.space.type !== 2 && this.supportPay && !this.isVipSpace) {
            this.$notify({
              type: 'info',
              message: '-3 云币',
              color: '#825621',
              background: '#ffffff'
            });
          }
          this.showLaZuHuo();
          that.getSpaceDetail();
        });
      },

      showLaZuHuo() {
        // var dom1 = document.getElementById("zu-huo-1");
        // var dom2 = document.getElementById("zu-huo-2");
        // dom1.style.visibility = 'visible'
        // dom2.style.visibility = 'visible'

        this.showLaZuCanvas = true;
      },

      //送花
      flower() {
        if (this.canComment){
          this.showMessage = true
          this.currentProduct = {
            name:'送花',
            duration:'1天',
            point:this.space.type == 2?0:9
          }
          this.action = this.doFlower
        }else {
          this.doFlower()
        }
      },
      doFlower(){
        let that = this;
        this.buy('item-xuan-hua', () => {
          if (this.space.type !== 2 && this.supportPay && !this.isVipSpace){
            this.$notify({
              type:'info',
              message: '-9 云币',
              color: '#825621',
              background: '#ffffff'
            });
          }

          var dom = document.getElementById("item-xuan-hua");
          dom.style.animationName = 'flowerIn';
          setTimeout(function () {
            dom.style.animationName = '';
            that.getSpaceDetail();
          }, 5000)
        });
      },

      //纸钱
      shaozhi() {
        if (this.canComment){
          this.showMessage = true
          this.currentProduct = {
            name:'纸钱',
            duration:'1天',
            point:this.space.type == 2?0:8
          }
          this.action = this.doShaozhi
        }else {
          this.doShaozhi()
        }

      },
      doShaozhi(){
        let that = this;
        this.buy('item-zhi-qian', () => {
          if (this.space.type !== 2 && this.supportPay && !this.isVipSpace) {
            this.$notify({
              type: 'info',
              message: '-8 云币',
              color: '#825621',
              background: '#ffffff'
            });
          }
          // var dom = document.getElementById("big-fire");
          // dom.style.visibility = 'visible';
          that.showZhiQianCanvas = true;
          that.getSpaceDetail();
        });
      },

      //祭拜方式选择
      onSacrificeSelect(item) {
        switch (item.id) {
          case 'shang_xiang':
            this.jibai()
            break
          case 'dian_la_zu':
            this.dianlazu()
            break
          case 'zhi_qian':
            this.shaozhi()
            break
          case 'song_hua':
            this.flower()
            break
        }
      },
      //留言板
      goMessage() {
        Link(`/space/message_container/${this.spaceId}`)
      },
      //首页（返回纪念馆首页）
      goSurvey() {
        Link(`/space/detail/${this.spaceId}`)
      },
      goSacrifice(){
        this.showSacrificeAction = true
      },
      goSetting(){
        Link(`/space/manage/${this.space.id}?active=setting`)
      },
      goSettingOperate() {
        let user = this.user
        this.settingActions = []
        if (this.isSpaceCreator) {
          this.settingActions.push({ name: '发起云追悼会（讣告）', id: 'meeting', data: user })
          // this.settingActions.push({ name: '纪念馆样式', id: 'style', data: user })
          // this.settingActions.push({ name: '修改纪念馆', id: 'modify_space', data: user })
          this.settingActions.push({ name: '设置', id: 'setting', data: user })
        }
        if (this.showExitSpace) {
          this.settingActions.push({ name: '退出纪念馆', id: 'exit' })
        }
        if (!this.isSpaceCreator) {
          this.settingActions.push({ name: '举报', id: 'report', data: user })
        }
        this.showSettingAction = true
        this.$emit('action-changed', {actions: this.settingActions, showSettingAction: this.showSettingAction})
      },
      onMoreSelect(item) {
        this.showSettingAction = false
        this.$emit('action-changed', {showSettingAction: this.showSettingAction})

        let menu = item.id
        let user = item.data

        switch (menu) {
          case 'meeting':
            Link(`/space/meeting/${this.space.id}`)
            break
          case 'setting':
            Link(`/space/manage/${this.space.id}?active=setting`)
            break
          case 'modify_space':
            Link(`/space/create?space_id=${this.space.id}`)
            break
          case 'style':
            Link(`/space/theme?theme_id=${this.space.themeId}&space_id=${this.space.id}`)
            break
          case 'report':
            Link(`/report?type=space&subject_id=${this.space.id}`)
            break
          case 'exit':
            this.exitSpace()
            break
        }
      },
      exitSpace() {
        this.$dialog.confirm({
          message: `确认退出该纪念馆吗?`
        }).then(() => {
          $API.space.exitSpace({sid: this.space.id, userId: this.user.id}, rsp => {
            eventHub.$emit(constant.EVENT_EXIT_SPACE_SUCCESS, this.space.id)
            this.$router.go(-1)
          })
        }).catch(() => {})
      },
      //更多（商城）
      goMoreOperate() {
        Link(`/store/info?space_id=${this.spaceId}`)
      },
      //转发（与纪念馆详情页转发逻辑一致）
      goShare() {
        this.shareActions = []
        if (this.canShareFriend) {
          this.shareActions.push({
            name: '发送给亲属',
            id: 'add_friends'
          })
        }
        this.shareActions.push({
          name: '发送给朋友',
          id: 'space_detail'
        })
        if (this.shareActions.length > 1) {
          this.showShareAction = true
        } else {
          this.shareSpace('space_detail')
        }
      },
      onShareSelect(item) {
        if (item.id === 'add_friends' || item.id === 'space_detail') {
          this.shareSpace(item.id)
        }
      },
      shareSpace(from) {
        let extra = {}
        extra.origin_from = from
        extra.invite_user_id = this.user.id
        extra.space_id = this.space.id
        extra.space_name = this.space.name
        extra = JSON.stringify(extra)
        localStorage.setItem(constant.KEY_EXTRA_DATA, extra)
        Link(`/share`)
      },
      //音乐（与纪念馆详情页音乐按钮逻辑一致）
      goBgmAction() {
        if (this.isSpaceCreator) {
          this.bgmActions = []
          this.bgmActions.push({
            name: this.playState === 'play' ? '停止音乐' : '播放音乐',
            id: this.playState === 'play' ? 'stop_bgm' : 'play_bgm'
          })
          this.bgmActions.push({
            name: '设置音乐',
            id: 'setting_bgm'
          })
          this.showBgmAction = true
        } else {
          this.togglePlayBgm()
        }
      },
      onBgmSelect(item) {
        if (item.id === 'stop_bgm' || item.id === 'play_bgm') {
          this.togglePlayBgm()
        } else if (item.id === 'setting_bgm') {
          Link(`/space/bgm/${this.spaceId}`)
        }
      },
      togglePlayBgm() {
        if (this.playState === 'play') {
          this.stopBgm()
          this.setUserSetting({key: 'bgm_play_state', value: 'stop'})
        } else if (this.playState === 'stop') {
          this.playBgm()
          this.setUserSetting({key: 'bgm_play_state', value: 'play'})
        }
      },
      updatePlayState(state) {
        this.playState = state
      },
      checkCanIn(space) {
        let result = 0
        //如果是开启了仅亲属进入，同时当前用户又不在亲属空间返回-1
        //如果没有开启仅亲属进入，判断当前用户是否在黑名单用户，如果是返回-2
        //如果已经被举报，直接返回-3
        let currentUserId = this.user && this.user.id
        if (space.deleted === 1) {
          result = -3
          this.tipContent = '纪念馆已被屏蔽，请联系客服申诉'
        } else if (currentUserId === space.creatorId) { //创建者永远能进入
          result = 0
        } else if (space.config.viewScope == 'member') {
          let index = space.config.friendIds.findIndex(id => id === currentUserId)
          if (index === -1) { //如果没有找到，说明不在好友列表
            this.tipContent = '纪念馆已禁止访客进入，请联系馆主进行操作'
            result = -1
          } else {
            let index = space.config.blackListIds.findIndex(id => id === currentUserId)
            if (index > -1) { //找到了，则说明在黑名单里
              result = -2
              this.tipContent = '您无法浏览该馆'
            }
          }
        } else {
          let index = space.config.blackListIds.findIndex(id => id === currentUserId)
          if (index > -1) { //找到了，则说明在黑名单里
            result = -2
            this.tipContent = '您无法浏览该馆'
          }
        }
        return result
      },
      //记忆"最后访问的纪念馆"
      rememberLastSpace(spaceId) {
        if (this.user && this.user.id) {
          setLastSpaceId(this.user.id, spaceId);
        }
      },
      //当前馆进不去（无权限、已删除）时，清掉与它相同的"最后访问"记录，避免每次进入都被带过来
      clearLastSpaceOfCurrent() {
        let userId = this.user && this.user.id;
        if (userId && `${getLastSpaceId(userId)}` === `${this.spaceId}`) {
          clearLastSpaceId(userId);
        }
      },
      goBack() {
        this.$router.go(-1)
      },
      //左上角"返回列表"：清掉当前馆的"最后访问"记录，避免被 /list 自动带回来；
      //用 replace 回到 /list，按返回即退出 WebView（与自动进馆行为保持一致）
      backToList() {
        this.clearLastSpaceOfCurrent();
        this.$router.replace('/list');
      },
      getSpaceDetail() {
        let that = this;
        $API.space.getSpaceDetail({sid: that.spaceId}, (resp) => {
          if (resp.id && resp.id > 0) {
            //权限校验，与纪念馆详情页保持一致
            that.checkResult = that.checkCanIn(resp);
            that.space = resp;
            //无权限时仅展示提示，不再初始化祭拜场景
            if (that.checkResult !== 0) {
              //进不去的馆不再记忆，避免每次打开都被带进来
              that.clearLastSpaceOfCurrent();
              return;
            }
            //能正常祭拜，记为"最后访问的纪念馆"
            that.rememberLastSpace(resp.id);
            //首次进入时初始化背景音乐，与纪念馆详情页保持一致
            if (!that.bgmInited) {
              that.bgmInited = true;
              that.tryHandleBgm(that.space);
            }
            if (that.space.products.indexOf('item-la-zu') >= 0) {
              this.showLaZuHuo();
            }
            if (that.space.products.indexOf('item-xiang') >= 0) {
              // let dom = document.querySelector('.item-xiang-lu-box');
              // dom.style.visibility = 'visible';
              that.showXiangCanvas = true;
            }
            if (that.space.products.indexOf('item-zhi-qian') >= 0) {
              // console.log('点纸钱');
              // var dom = document.getElementById("big-fire");
              // dom.style.visibility = 'visible';
              // var dom = document.getElementById("smoke-box");
              // dom.style.visibility = 'visible';
              that.showZhiQianCanvas = true;
            }
            let items = that.space.products.filter((item) => noItems.indexOf(item) >= 0);
            let changeMingDeng = items.filter((item)=>item === 'item-zhang-min-ding');
            let other = items.filter((item)=>item !== 'item-zhang-min-ding');
            console.log(JSON.stringify(changeMingDeng));
            console.log(JSON.stringify(other));
            items = changeMingDeng.concat(changeMingDeng);
            items = items.concat(other);
            items.forEach((item, index) => {
              //要小于位置
              if (index < seqIndex.length) {
                let idx = seqIndex[index];
                if (idx < that.item_01.length) {
                  //放第一排
                  that.item_01[idx] = {
                    id: item
                  };
                } else {
                  //放第二排
                  that.item_02[idx - that.item_01.length] = {
                    id: item
                  };
                }
              }
            })
          } else {
            //馆不存在（可能已被删除），不再记忆，避免每次进入都停在这里
            that.clearLastSpaceOfCurrent();
          }
        }, (error) => {
          console.log(error);
        });
      },

      initBigFire() {
        'use strict';
        var _createClass = function () {
          function defineProperties(target, props) {
            for (var i = 0; i < props.length; i++) {
              var descriptor = props[i];
              descriptor.enumerable = descriptor.enumerable || false;
              descriptor.configurable = true;
              if ("value" in descriptor) descriptor.writable = true;
              Object.defineProperty(target, descriptor.key, descriptor);
            }
          }

          return function (Constructor, protoProps, staticProps) {
            if (protoProps) defineProperties(Constructor.prototype, protoProps);
            if (staticProps) defineProperties(Constructor, staticProps);
            return Constructor;
          };
        }();

        function _classCallCheck(instance, Constructor) {
          if (!(instance instanceof Constructor)) {
            throw new TypeError("Cannot call a class as a function");
          }
        }

        var $ = {};

        $.PI = Math.PI;
        $.TAU = $.PI * 2;

        $.rand = function (min, max) {
          return Math.random() * (max - min) + min;
        };

        $.hsla = function (h, s, l, a) {
          return 'hsla(' + h + ', ' + s + '%, ' + l + '%, ' + a + ')';
        };

        $.baseRange = function (base, range) {
          return base + $.rand(-range, range);
        };

        $.Pool = function () {
          function _class(base, preallocateAmount) {
            _classCallCheck(this, _class);

            this.base = base;
            this.preallocateAmount = preallocateAmount || 0;
            this.alive = [];
            this.dead = [];
            this.length = 0;
            this.deadLength = 0;
            if (this.preallocateAmount) {
              this.preallocate();
            }
          }

          _createClass(_class, [{
            key: 'preallocate',
            value: function preallocate() {
              for (var i = 0; i < this.preallocateAmount; i++) {
                this.dead.push(new this.base());
                this.deadLength++;
              }
            }
          }, {
            key: 'create',
            value: function create(opt) {
              if (this.deadLength) {
                var obj = this.dead.pop();
                obj.init(opt);
                this.alive.push(obj);
                this.deadLength--;
                this.length++;
                return obj;
              } else {
                var newItem = new this.base();
                newItem.init(opt);
                this.alive.push(newItem);
                this.length++;
                return newItem;
              }
            }
          }, {
            key: 'release',
            value: function release(obj) {
              var i = this.alive.indexOf(obj);
              if (i > -1) {
                this.dead.push(this.alive.splice(i, 1)[0]);
                this.length--;
                this.deadLength++;
              }
            }
          }, {
            key: 'empty',
            value: function empty() {
              this.alive.length = 0;
              this.dead.length = 0;
              this.length = 0;
              this.deadLength = 0;
            }
          }, {
            key: 'each',
            value: function each(action, asc) {
              var i = this.length;
              while (i--) {
                this.alive[i][action](i);
              }
            }
          }]);

          return _class;
        }();

        $.Particle = function () {
          function _class2() {
            _classCallCheck(this, _class2);
          }

          _createClass(_class2, [{
            key: 'init',
            value: function init(opt) {
              Object.assign(this, opt);
              this.life = 1;
            }
          }, {
            key: 'step',
            value: function step() {
              this.velocity += this.acceleration;
              this.angle += $.rand(-this.wander, this.wander);
              this.x += Math.cos(this.angle) * this.velocity;
              this.y += Math.sin(this.angle) * this.velocity;
              this.life -= this.decay;
              this.alpha = this.fade ? this.life * 1.5 : 1;
              if (this.life < 0) {
                this.parent.particles.release(this);
              }
            }
          }, {
            key: 'draw',
            value: function draw() {
              $.ctx.beginPath();
              $.ctx.arc(this.x, this.y, this.radius, 0, $.TAU);
              $.ctx.fillStyle = $.hsla(this.hue, this.saturation, this.lightness, this.alpha);
              $.ctx.fill();
            }
          }]);

          return _class2;
        }();

        $.ParticleEmitter = function () {
          function _class3(opt) {
            _classCallCheck(this, _class3);

            Object.assign(this, opt);
            this.particles = new $.Pool($.Particle, 100);
          }

          _createClass(_class3, [{
            key: 'step',
            value: function step() {
              if ($.tick % this.interval === 0) {
                this.particles.create({
                  parent: this,
                  x: $.baseRange(this.x.base, this.x.range),
                  y: $.baseRange(this.y.base, this.y.range),
                  radius: $.baseRange(this.radius.base, this.radius.range),
                  angle: $.baseRange(this.angle.base, this.angle.range),
                  velocity: $.baseRange(this.velocity.base, this.velocity.range),
                  acceleration: $.baseRange(this.acceleration.base, this.acceleration.range),
                  decay: $.baseRange(this.decay.base, this.decay.range),
                  hue: $.baseRange(this.hue.base, this.hue.range),
                  saturation: $.baseRange(this.saturation.base, this.saturation.range),
                  lightness: $.baseRange(this.lightness.base, this.lightness.range),
                  wander: this.wander,
                  fade: this.fade
                });
              }
              this.particles.each('step');
            }
          }, {
            key: 'draw',
            value: function draw() {
              $.ctx.globalCompositeOperation = this.blend;
              this.particles.each('draw');
            }
          }]);

          return _class3;
        }();

        $.init = function () {
          $.c = document.getElementById('big-fire');
          $.ctx = $.c.getContext('2d');
          $.w = $.c.width = 400;
          $.h = $.c.height = 400;
          $.particleEmitters = [];
          $.tick = 1;

          $.particleEmitters.push(new $.ParticleEmitter({
            x: {
              base: $.w * 0.5,
              range: 20
            },
            y: {
              base: $.h,
              range: 20
            },
            radius: {
              base: 0.75,
              range: 0.4
            },
            angle: {
              base: -$.PI * 0.5,
              range: $.PI * 0.01
            },
            velocity: {
              base: 0.5,
              range: 0.5
            },
            acceleration: {
              base: 0.01,
              range: 0.01
            },
            decay: {
              base: 0.005,
              range: 0.001
            },
            hue: {
              base: 30,
              range: 30
            },
            saturation: {
              base: 80,
              range: 20
            },
            lightness: {
              base: 80,
              range: 20
            },
            wander: 0.06,
            blend: 'lighter',
            fade: true,
            interval: 5
          }));

          $.particleEmitters.push(new $.ParticleEmitter({
            x: {
              base: $.w - 100,
              range: 25
            },
            y: {
              base: $.h,
              range: 5
            },
            radius: {
              base: 20,
              range: 10
            },
            angle: {
              base: -$.PI * 0.55,
              range: $.PI * 0.05
            },
            velocity: {
              base: 2,
              range: 0
            },
            acceleration: {
              base: 0.02,
              range: 0.01
            },
            decay: {
              base: 0.001,
              range: 0
            },
            hue: {
              base: 0,
              range: 0
            },
            saturation: {
              base: 0,
              range: 0
            },
            lightness: {
              base: 0,
              range: 0
            },
            wander: 0.05,
            blend: 'destination-out',
            fade: false,
            interval: 1
          }));

          $.particleEmitters.push(new $.ParticleEmitter({
            x: {
              base: 100,
              range: 25
            },
            y: {
              base: $.h,
              range: 5
            },
            radius: {
              base: 20,
              range: 10
            },
            angle: {
              base: -$.PI * 0.45,
              range: $.PI * 0.05
            },
            velocity: {
              base: 2,
              range: 0
            },
            acceleration: {
              base: 0.02,
              range: 0.01
            },
            decay: {
              base: 0.001,
              range: 0
            },
            hue: {
              base: 0,
              range: 0
            },
            saturation: {
              base: 0,
              range: 0
            },
            lightness: {
              base: 0,
              range: 0
            },
            wander: 0.05,
            blend: 'destination-out',
            fade: false,
            interval: 1
          }));

          $.particleEmitters.push(new $.ParticleEmitter({
            x: {
              base: $.w * 0.5,
              range: 20
            },
            y: {
              base: $.h,
              range: 20
            },
            radius: {
              base: 15,
              range: 5
            },
            angle: {
              base: -$.PI * 0.5,
              range: $.PI * 0.05
            },
            velocity: {
              base: 1.5,
              range: 0
            },
            acceleration: {
              base: 0.02,
              range: 0.01
            },
            decay: {
              base: 0.0075,
              range: 0
            },
            hue: {
              base: 60,
              range: 0
            },
            saturation: {
              base: 100,
              range: 0
            },
            lightness: {
              base: 70,
              range: 0
            },
            wander: 0.01,
            blend: 'source-over',
            fade: false,
            interval: 2
          }));

          $.particleEmitters.push(new $.ParticleEmitter({
            x: {
              base: $.w * 0.5,
              range: 20
            },
            y: {
              base: $.h - 20,
              range: 20
            },
            radius: {
              base: 2,
              range: 1
            },
            angle: {
              base: -$.PI * 0.5,
              range: $.PI * 0.001
            },
            velocity: {
              base: 0.5,
              range: 0
            },
            acceleration: {
              base: 0.02,
              range: 0.02
            },
            decay: {
              base: 0.0075,
              range: 0
            },
            hue: {
              base: 60,
              range: 0
            },
            saturation: {
              base: 90,
              range: 0
            },
            lightness: {
              base: 100,
              range: 0
            },
            wander: 0.025,
            blend: 'source-over',
            fade: false,
            interval: 3
          }));

          $.particleEmitters.push(new $.ParticleEmitter({
            x: {
              base: $.w * 0.5,
              range: 20
            },
            y: {
              base: $.h - 20,
              range: 15
            },
            radius: {
              base: 25,
              range: 5
            },
            angle: {
              base: -$.PI * 0.5,
              range: $.PI * 0.025
            },
            velocity: {
              base: 2,
              range: 0.25
            },
            acceleration: {
              base: 0.01,
              range: 0.01
            },
            decay: {
              base: 0.0075,
              range: 0
            },
            hue: {
              base: 30,
              range: 0
            },
            saturation: {
              base: 90,
              range: 0
            },
            lightness: {
              base: 50,
              range: 0
            },
            wander: 0.01,
            blend: 'source-over',
            fade: false,
            interval: 2
          }));

          $.particleEmitters.push(new $.ParticleEmitter({
            x: {
              base: $.w * 0.5,
              range: 30
            },
            y: {
              base: $.h - 20,
              range: 15
            },
            radius: {
              base: 35,
              range: 10
            },
            angle: {
              base: -$.PI * 0.5,
              range: $.PI * 0.025
            },
            velocity: {
              base: 2,
              range: 0.25
            },
            acceleration: {
              base: 0.01,
              range: 0.01
            },
            decay: {
              base: 0.0075,
              range: 0
            },
            hue: {
              base: 0,
              range: 0
            },
            saturation: {
              base: 90,
              range: 0
            },
            lightness: {
              base: 50,
              range: 0
            },
            wander: 0.01,
            blend: 'source-over',
            fade: false,
            interval: 2
          }));

          $.gradient = $.ctx.createLinearGradient(0, 0, 0, $.h * 0.75);
          $.gradient.addColorStop(0, $.hsla(0, 0, 0, 1));
          $.gradient.addColorStop(1, $.hsla(0, 0, 0, 0));

          $.loop();
        };

        $.step = function () {
          var i = $.particleEmitters.length;
          while (i--) {
            $.particleEmitters[i].step();
          }
          $.tick++;
        };

        $.draw = function () {
          $.ctx.clearRect(0, 0, $.w, $.h);
          var i = $.particleEmitters.length;
          while (i--) {
            $.particleEmitters[i].draw();
          }

          $.ctx.globalCompositeOperation = 'destination-out';
          $.ctx.fillStyle = $.gradient;
          $.ctx.fillRect(0, 0, $.w, $.h);

          $.ctx.beginPath();
          $.ctx.globalCompositeOperation = 'source-over';
          $.ctx.arc($.w * 0.5, $.h + 40, 63, 0, $.TAU);
          $.ctx.fillStyle = '#f00';
          $.ctx.fill();

          $.ctx.beginPath();
          $.ctx.globalCompositeOperation = 'source-over';
          $.ctx.arc($.w * 0.5, $.h + 40, 60, 0, $.TAU);
          $.ctx.fillStyle = '#000';
          $.ctx.fill();
        };

        $.loop = function () {
          requestAnimationFrame($.loop);
          $.step();
          $.draw();
        };

        $.init();
      },

      initXiangHuo(){
        let arr = {
          a: 'a',
          b: 'b',
          c: 'c',
        };

        var init = function (dom) {
          var c = document.getElementById(dom),
            ctx = c.getContext('2d'),
            cw = c.width = 300,
            ch = c.height = 300,
            parts = [],
            partCount = 200,
            partsFull = false,
            hueRange = 50,
            globalTick = 0,
            rand = function(min, max){
              return Math.floor( (Math.random() * (max - min + 1) ) + min);
            };

          var Part = function(){
            this.reset();
          };

          Part.prototype.reset = function(){
            this.startRadius = rand(1, 25);
            this.radius = this.startRadius;
            this.x = cw/2 + (rand(0, 6) - 3);
            this.y = 250;
            this.vx = 0;
            this.vy = 0;
            this.hue = rand(globalTick - hueRange, globalTick + hueRange);
            this.saturation = rand(50, 100);
            this.lightness = rand(20, 70);
            this.startAlpha = rand(1, 10) / 100;
            this.alpha = this.startAlpha;
            this.decayRate = .1;
            this.startLife = 7;
            this.life = this.startLife;
            this.lineWidth = rand(1, 3);
          }

          Part.prototype.update = function(){
            this.vx += (rand(0, 200) - 100) / 1500;
            this.vy -= this.life/50;
            this.x += this.vx;
            this.y += this.vy;
            this.alpha = this.startAlpha * (this.life / this.startLife);
            this.radius = this.startRadius * (this.life / this.startLife);
            this.life -= this.decayRate;
            if(
              this.x > cw + this.radius ||
              this.x < -this.radius ||
              this.y > ch + this.radius ||
              this.y < -this.radius ||
              this.life <= this.decayRate
            ){
              this.reset();
            }
          };

          Part.prototype.render = function(){
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
            ctx.fillStyle = ctx.strokeStyle = 'hsla('+(this.hue%30)+', '+this.saturation+'%, '+this.lightness+'%, '+this.alpha+')';
            ctx.lineWidth = this.lineWidth;
            ctx.fill();
            ctx.stroke();
          };

          var createParts = function(){
            if(!partsFull){
              if(parts.length > partCount){
                partsFull = true;
              } else {
                parts.push(new Part());
              }
            }
          };

          var updateParts = function(){
            var i = parts.length;
            while(i--){
              parts[i].update();
            }
          };

          var renderParts = function(){
            var i = parts.length;
            while(i--){
              parts[i].render();
            }
          };

          var clear = function(){
            ctx.globalCompositeOperation = 'destination-out';
            ctx.fillStyle = 'hsla(0, 0%, 0%, .3)';
            ctx.fillRect(0, 0, cw, ch);
            ctx.globalCompositeOperation = 'lighter';
          };

          var loop = function(){
            window.requestAnimFrame(loop, c);
            clear();
            createParts();
            updateParts();
            renderParts();
            globalTick++;
          };

          window.requestAnimFrame=function(){return window.requestAnimationFrame||window.webkitRequestAnimationFrame||window.mozRequestAnimationFrame||window.oRequestAnimationFrame||window.msRequestAnimationFrame||function(a){window.setTimeout(a,1E3/60)}}();

          loop();
          c.style.width = '30px';
          c.style.height = '30px';
          c.style.position = 'absolute';
          return c;
        };

        Object.keys(arr).forEach(function (key) {
          arr[key] = init(arr[key]);
        })
        arr.a.style.left = '-7px';
        arr.a.style.top = '-19px';

        arr.b.style.left = '9px';
        arr.b.style.top = '-19px';

        arr.c.style.left = '22px';
        arr.c.style.top = '-17px';

      },


      initYan() {

        var canvas;
        var context;
        var proton;
        var renderer;
        var emitter;
        var stats, rock;
        var rockTha;

        main();

        function main() {
          initCanvas();
          loadRockImg(loadParticleImg);
        }

        function initCanvas() {
          canvas = document.getElementById("yan-canvas");
          canvas.width = window.innerWidth;
          canvas.height = window.innerHeight;
          canvas.style.visibility = 'hidden';
          context = canvas.getContext('2d');
          context.globalCompositeOperation = "lighter";
        }

        function loadParticleImg(rock) {
          var image = new Image()
          image.onload = function (e) {
            createProton(e.target, rock);
            tick();
          }

          image.src = '/static/images/particle.png';
        }

        function loadRockImg(callback) {
          rockTha = 0;

          var image = new Image;
          image.onload = function (e) {
            rock.width = image.width;
            rock.height = image.height;
            rock.loaded = true;
            rock.y = 40;
            rock.r = 10;
            callback(rock);
          }

          image.src = '/static/images/hand.gif';

          rock = {src: image.src, img: image};
        }

        function drawRock() {
          if (!rock.loaded) return;

          var y = rock.y + Math.cos(rockTha += .05) * rock.r;
          context.drawImage(rock.img, canvas.width / 2 - rock.width / 2, 220);
        }

        function createProton(image, rock) {
          proton = new Proton;
          emitter = new Proton.Emitter();
          emitter.rate = new Proton.Rate(new Proton.Span(5, 10), new Proton.Span(.05, .2));

          emitter.addInitialize(new Proton.Body(image));
          emitter.addInitialize(new Proton.Mass(0.8));
          emitter.addInitialize(new Proton.Life(2, 13.9));
          emitter.addInitialize(new Proton.Velocity(new Proton.Span(.2, 1.5), new Proton.Span(122, 120, true), 'polar'));

          //emitter.addBehaviour(new Proton.RandomDrift(10, 10, .1));
          emitter.addBehaviour(new Proton.Alpha(0.12, 0.2));
          emitter.addBehaviour(new Proton.Scale([2.5, 2], [0, .1]));
          emitter.addBehaviour(new Proton.G(-6.6));
          emitter.addBehaviour(new Proton.Color('#858585', '#3a3a3a', Infinity, Proton.easeInSine));

          emitter.p.x = canvas.width / 2;
          emitter.p.y = 620;
          emitter.emit();
          proton.addEmitter(emitter);

          renderer = new Proton.CanvasRenderer(canvas);
          proton.addRenderer(renderer);

          emitter.preEmit(1);
        }

        function tick() {
          requestAnimationFrame(tick);
          proton.update();
          drawRock();
        }
      },


      initZhuHuo() {
        const flameFrag = document.querySelector("#flame-frag").textContent;
        const baseUrl = "/static/bian-mobile/images/";

        const manifest = [
          {name: "noise", url: "noise-texture-11.png?v=9"}
        ]


//
// FLAME FILTER
// ===========================================================================
        class FlameFilter extends PIXI.Filter {

          constructor(texture, time = 0.0) {
            super(null, flameFrag);

            this.uniforms.dimensions = new Float32Array(2);
            this.texture = texture;
            this.time = time;
          }

          get texture() {
            return this.uniforms.mapSampler;
          }

          set texture(texture) {
            texture.baseTexture.wrapMode = PIXI.WRAP_MODES.REPEAT;
            this.uniforms.mapSampler = texture;
          }

          apply(filterManager, input, output, clear) {

            this.uniforms.dimensions[0] = input.sourceFrame.width;
            this.uniforms.dimensions[1] = input.sourceFrame.height;
            this.uniforms.time = this.time;

            filterManager.applyFilter(this, input, output, clear);
          }
        }


//
// APPLICATION
// ===========================================================================

        let width = document.body.clientWidth;
        let itemWidth = width / 10;

        class Application extends PIXI.Application {

          constructor(config) {

            if (window.devicePixelRatio > 1) {
              PIXI.settings.RESOLUTION = 2;
            }

            PIXI.settings.PRECISION_FRAGMENT = "highp";

            super({
              view: config.view,
              width: itemWidth,
              height: itemWidth,
              backgroundColor: 0x000000,
              autoResize: true,
              antialias: false,
              transparent: true
            });

            this.isResized = true;
            this.loader.baseUrl = baseUrl;
          }

          load(manifest) {
            var that = this;
            that.loader
              .add(manifest)
              .load(function (l, r) {
                that.init(r)
              });
          }

          init(resources) {
            var that = this;
            this.flame = new FlameFilter(resources.noise.texture);
            this.stage.filterArea = this.screen;
            this.stage.filters = [this.flame];
            this.ticker.add(this.update, this);
            window.addEventListener("resize", function () {
                that.isResized = true
              }
            )
          }

          update(delta) {

            if (this.isResized) {
              this.renderer.resize(itemWidth, itemWidth);
              this.isResized = false;
            }

            this.flame.time += 0.1 * delta;
          }
        }

        const app1 = new Application({
          view: document.querySelector("#zu-huo-1"),
        });
        const app2 = new Application({
          view: document.querySelector("#zu-huo-2"),
        });
        const app3 = new Application({
          view: document.querySelector("#change-ming-ding-1"),
        });
        const app4 = new Application({
          view: document.querySelector("#change-ming-ding-2"),
        });
        app1.load(manifest);
        app2.load(manifest);
        app3.load(manifest);
        app4.load(manifest);
      },

      initSmoke() {
        // var canvas = document.getElementById('smoke-box');
        // var ctx = canvas.getContext('2d');
        // canvas.width = document.body.clientWidth;
        // canvas.height = document.body.clientWidth;
        // var party = SmokeMachine(ctx, [54, 16.8, 18.2]);
        // party.start(); // start animating
        // console.log(canvas.width/2);
        // party.addSmoke(canvas.width / 2, canvas.width / 2, 10); // wow we made smoke
        // party.start();

        var canvas = document.getElementById('smoke-box');
        var ctx = canvas.getContext('2d')
        canvas.width = innerWidth
        canvas.height = innerHeight

        var party = smokemachine(ctx, [160, 160, 160])
        party.start() // start animating
        party.setPreDrawCallback(function (dt) {
          party.addSmoke(innerWidth / 2, innerHeight, .35)
          canvas.width = innerWidth
          canvas.height = innerHeight / 2
          canvas.style.opacity = 0.75;
        })


        // setTimeout(function () {
        //   party.stop(); // stop animating
        //   party.addSmoke(canvas.width * 0.6, canvas.width / 2, 100);
        //   party.addSmoke(canvas.width / 2, canvas.width * 0.6, 20);
        //   for (var i = 0; i < 10; i++) {
        //     party.step(10) // pretend 10 ms pass and rerender
        //   }
        //   setTimeout(function () {
        //     party.start()
        //   }, 1000)
        //
        // }, 1000)
      },
      updateCouplets(data) {
        if (data && this.space) {
          if (this.space.couplets){
            this.space.couplets.left = data.left
            this.space.couplets.right = data.right
          }
          this.space.showCouplet = data.showCouplet
        }
      },
      updateEpitaph(data){
        if (data && this.space) {
          this.space.epitaph = data.epitaph
          this.space.showEpitaph = data.showEpitaph
        }
      },
      buySuccess(){
        this.getSpaceDetail();
      },
      messageConfirm(data){
        this.showMessage = false
        this.action && this.action()
        this.action = null
        this.postMessage(data)
      },
      messageCancel(){
        this.showMessage = false
      },
      postMessage(data){
        if (!data || !data.content){
          return
        }

        data.status = 'PASS'

        $API.space.postIssue({
          sid: this.spaceId,
          data: data
        }, rsp => {
        }, error => {

        });
      },
      registerEvent() {
        eventHub.$on(constant.EVENT_UPDATE_COUPLETS_SUCCESS, this.updateCouplets)
        eventHub.$on(constant.EVENT_UPDATE_EPITAPH_SUCCESS, this.updateEpitaph)
        eventHub.$on(constant.EVENT_BUY_PRODUCT_SUCCESS, this.buySuccess)
        eventHub.$on(constant.EVENT_CHANGE_BACKGROUND_SUCCESS, this.getSpaceDetail)
        eventHub.$on(constant.EVENT_AUDIO_PLAY, this.updatePlayState)
      }
    },
    created() {
      this.spaceId = this.$route.params.id;
      this.isAutoEntered = this.$route.query && this.$route.query.auto === '1';
      console.log(this.spaceId);
      this.getSpaceDetail();
      this.registerEvent()
    },
    mounted() {
      let that = this;
      this.initBigFire();
      this.initSmoke();
      this.initXiangHuo();
      // this.initYan();
      setTimeout(function(){
        that.initZhuHuo();
      }, 1000);
    },
    activated() {
      //返回祭拜页：续播离开前正在播的音乐（playBgm 不传 seek 会从上次暂停位置继续）
      if (this.bgmPausedOnLeave) {
        this.bgmPausedOnLeave = false
        this.playBgm()
      }
    },
    deactivated() {
      //离开祭拜页进入其他页面（留言、详情、设置等）时暂停音乐，避免页面间声音混着响
      if (this.playState === 'play') {
        this.bgmPausedOnLeave = true
        this.stopBgm()
      } else {
        this.bgmPausedOnLeave = false
      }
    },
    beforeDestroy() {
      this.stopBgm(true)
      this.clearSpaceDetail()
      eventHub.$off(constant.EVENT_UPDATE_COUPLETS_SUCCESS, this.updateCouplets)
      eventHub.$off(constant.EVENT_UPDATE_EPITAPH_SUCCESS, this.updateEpitaph)
      eventHub.$off(constant.EVENT_BUY_PRODUCT_SUCCESS, this.buySuccess)
      eventHub.$off(constant.EVENT_CHANGE_BACKGROUND_SUCCESS, this.getSpaceDetail)
      eventHub.$off(constant.EVENT_AUDIO_PLAY, this.updatePlayState)
    }
  }
</script>

<style rel="stylesheet/less" lang="less">
  @import "~@/config/config.less";

  .sacrifice .sacrifice-back-btn{
    position: fixed;
    left: 12px;
    top: 12px;
    width: 36px;
    height: 36px;
    line-height: 36px;
    text-align: center;
    border-radius: 18px;
    background: rgba(0,0,0,0.35);
    color: #fff;
    z-index: 1000;
    cursor: pointer;
    img{
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }
  .sacrifice .tip-wrapper{
    display: flex;
    flex-direction: column;
    align-items: center;
    padding-top: 50%;
    height: 100%;
    .iconfont{
      font-size: 60px;
      color: @MAIN_THEME_COLOR;
    }
    .content{
      color: @FONT_THIRD_COLOR;
    }
  }

  /*无权限进入时，不展示纪念馆主题背景图*/
  .sacrifice.no-theme{
    background-image: none !important;
    background-color: #fff;
  }

  .sacrifice.theme_1 {
    background-image: url(https://static-app01.yugusoft.com/bian/bg_1.jpeg?v=11) !important;
    background-repeat: no-repeat !important;
    background-size: 100% 100% !important;
  }
  .sacrifice.theme_1 #item_hua_bg {
    //
  }
  .sacrifice.theme_2 {
    background-image: url(https://static-app01.yugusoft.com/bian/bg_2.jpeg?v=1) !important;
    background-repeat: no-repeat !important;
    background-size: 100% 100% !important;
  }
  .sacrifice.theme_2 #item_hua_bg {
    background: transparent;
  }
  .sacrifice.theme_3 {
    background-image: url(https://static-app01.yugusoft.com/bian/bg_3.jpeg?v=1) !important;
    background-repeat: no-repeat !important;
    background-size: 100% 100% !important;
  }
  .sacrifice.theme_3 #item_hua_bg {
    background: transparent;
  }
  .sacrifice.theme_4 {
    background-image: url(https://static-app01.yugusoft.com/bian/bg_4.jpeg?v=1) !important;
    background-repeat: no-repeat !important;
    background-size: 100% 100% !important;
  }
  .sacrifice.theme_4 #item_hua_bg {
    background: transparent;
  }
  .sacrifice.theme_5 {
    background-image: url(https://static-app01.yugusoft.com/bian/bg_5.jpeg?v=1) !important;
    background-repeat: no-repeat !important;
    background-size: 100% 100% !important;
  }
  .sacrifice.theme_5 #item_hua_bg {
    background: transparent;
  }
  .sacrifice.theme_6 {
    background-image: url(https://static-app01.yugusoft.com/bian/bg_6.jpeg?v=1) !important;
    background-repeat: no-repeat !important;
    background-size: 100% 100% !important;
  }
  .sacrifice.theme_6 #item_hua_bg {
    background: transparent;
  }
  .sacrifice.theme_7 {
    background-image: url(https://static-app01.yugusoft.com/bian/bg_7.jpeg?v=1) !important;
    background-repeat: no-repeat !important;
    background-size: 100% 100% !important;
  }
  .sacrifice.theme_7 #item_hua_bg {
    background: transparent;
  }
  .sacrifice.theme_8 {
    background-image: url(https://static-app01.yugusoft.com/bian/bg_8.jpeg?v=1) !important;
    background-repeat: no-repeat !important;
    background-size: 100% 100% !important;
  }
  .sacrifice.theme_8 #item_hua_bg {
    background: transparent;
  }
  .sacrifice.theme_9 {
    background-image: url(https://static-app01.yugusoft.com/bian/bg_9.jpeg?v=1) !important;
    background-repeat: no-repeat !important;
    background-size: 100% 100% !important;
  }
  .sacrifice.theme_9 #item_hua_bg {
    background: transparent;
  }
  .sacrifice.theme_10 {
    background-image: url(https://static-app01.yugusoft.com/bian/bg_10.jpeg?v=1) !important;
    background-repeat: no-repeat !important;
    background-size: 100% 100% !important;
  }
  .sacrifice.theme_10 #item_hua_bg {
    background: transparent;
  }
  .sacrifice.theme_11 {
    background-image: url(https://static-app01.yugusoft.com/bian/bg_11.jpeg?v=1) !important;
    background-repeat: no-repeat !important;
    background-size: 100% 100% !important;
  }
  .sacrifice.theme_11 #item_hua_bg {
    background: transparent;
  }
  .sacrifice.theme_12 {
    background-image: url(https://static-app01.yugusoft.com/bian/bg_12.jpeg?v=1) !important;
    background-repeat: no-repeat !important;
    background-size: 100% 100% !important;
  }
  .sacrifice.theme_12 #item_hua_bg {
    background: transparent;
  }
  .sacrifice.theme_13 {
    background-image: url(https://static-app01.yugusoft.com/bian/bg_13.jpeg?v=1) !important;
    background-repeat: no-repeat !important;
    background-size: 100% 100% !important;
  }
  .sacrifice.theme_13 #item_hua_bg {
    background: transparent;
  }
  .sacrifice.theme_14 {
    background-image: url(https://static-app01.yugusoft.com/bian/bg_14.jpeg?v=1) !important;
    background-repeat: no-repeat !important;
    background-size: 100% 100% !important;
  }
  .sacrifice.theme_14 #item_hua_bg {
    background: transparent;
  }
  .sacrifice.theme_15 {
    background-image: url(https://static-app01.yugusoft.com/bian/bg_15.jpeg?v=1) !important;
    background-repeat: no-repeat !important;
    background-size: 100% 100% !important;
  }
  .sacrifice.theme_15 #item_hua_bg {
    background: transparent;
  }
  .sacrifice.theme_16 {
    background-image: url(https://static-app01.yugusoft.com/bian/bg_16.jpeg?v=1) !important;
    background-repeat: no-repeat !important;
    background-size: 100% 100% !important;
  }
  .sacrifice.theme_16 #item_hua_bg {
    background: transparent;
  }


  .sacrifice {
    width: 100%;
    height: 100%;
    flex: 1;
  }

  html, body {
    width: 100%;
    height: 100%;
    position: relative;
    background: black;
    box-sizing: border-box;
    overflow: hidden;
  }

  #smoke-box {
    /*background: red;*/
    z-index: 9;
    position: absolute;
    visibility: hidden;
    bottom: 0;
  }

  .yi-xiang-box {
    margin-top: 12vh;
    &.single {
      .xiang_kuang {
        background: url("./images/item_xiang_kuang_black.png");
        background-size: cover;
        width: 160px;
        height: 200px;
        padding: 0;
        margin: 0 auto;
        position: relative;
        .yi_xiang {
          position: absolute;
          left: 23px;
          right: 15px;
          top: 20px;
          bottom: 23px;
          background: url('./images/item_yi_xiang.png');
          background-size: cover !important;
        }
      }
    }
    &.double {
      display: flex;
      width: 200px;
      margin: 0 auto;
      margin-top: 12vh;
      .xiang_kuang {
        background: url("./images/item_xiang_kuang_black.png");
        background-size: cover;
        width: 100px;
        height: 130px;
        padding: 0;
        margin: 0 auto;
        position: relative;
        .yi_xiang {
          position: absolute;
          left: 15px;
          right: 6px;
          top: 13px;
          bottom: 15px;
          background: url('./images/item_yi_xiang.png');
          background-size: cover !important;
        }
      }
    }
    &.combine {
      display: flex;
      width: 200px;
      margin: 0 auto;
      margin-top: 12vh;
      .xiang_kuang {
        background: url("./images/item_xiang_kuang_black.png");
        background-size: cover;
        width: 244px;
        height: 130px;
        padding: 0;
        margin: 0 auto;
        position: relative;
        .yi_xiang {
          position: absolute;
          left: 23px;
          right: 26px;
          top: 20px;
          bottom: 14px;
          background: url('./images/item_yi_xiang.png');
          background-size: cover !important;
        }
      }
    }
  }

  .epitaph-wrapper {
    text-align: center;
    margin: 16px 60px 0;
    max-height: 60px;
    overflow: auto;
    font-size: 14px;
    color: @FONT_WHITE_COLOR;
    text-shadow: #000 1px 0 0, #000 0 1px 0, #000 -1px 0 0, #000 0 -1px 0;
  }

  .view1-box {
    width: 108px;
    height: 108px;
    position: absolute;
    bottom: 328px;
    left: 200px;
  }

  .file-01 {
    width: 60px;
    height: 60px;
    touch-action: none;
    cursor: inherit;
    position: absolute;
    left: 24px;
    top: -38px;
  }

  #dui_lian_box {
    position: absolute;
    left: 0px;
    right: 0px;
    top: 0px;
    bottom: 0px;
    color: white;
    text-align: left;
    padding: 0px;
    margin: 0px;
    display: flex;
    pointer-events: none;
  }

  .inner {
    flex: 1;
    position: relative;
    padding: 0px;
    margin: 0 auto;
    box-sizing: border-box;
  }

  .dui_lian {
    background: #f0eadd;
    color: #000;
    height: auto;
    text-align: center;
    font-size: 14px;
    padding: 15px 6px;
    letter-spacing: 8px;
    font-weight: 700;
    -webkit-box-shadow: 4px 6px 9px rgba(1,1,1,.61);
    box-shadow: 4px 6px 9px rgba(1,1,1,.61);
    font-family: 仿宋;
    width: 25px;
    box-sizing: border-box;
  }

  .big-fire-box {
    background-image: url(./images/item_huo_lu.png);
    background-size: 100% 100%;
    width: 100px;
    height: 100px;
    margin: 0 auto;
    position: absolute;
    left: 50%;
    margin-left: -50px;
    bottom: 4vw;
    display: flex;
  }

  #big-fire {
    animation: fade-in 2000ms 1000ms forwards;
    /*background: #000;*/
    /*background: radial-gradient( circle at 50% 75%, #311, #000 );*/
    border-radius: 50%;
    /*box-shadow: inset 0 0 0 10px rgba(255, 255, 255, 0.05);*/
    left: 0;
    margin: 0 auto;
    bottom: 31px;
    opacity: 0;
    position: absolute;
    right: 0;
  }

  @keyframes fade-in {
    to {
      opacity: 1;
    }
  }

  @keyframes fade-in2 {
    to {
      opacity: 0.06;
    }
  }

  #main-box {
    position: absolute;
    left: 0px;
    right: 0px;
    bottom: 0px;
    height: 100vw;
    /*background: red;*/
    display: flex;

    /*#yan-canvas{*/
    /*position: absolute;*/
    /*left: 0px;*/
    /*right: 0px;*/
    /*top: 0px;*/
    /*bottom: 30px;*/
    /*width: 100vw;*/
    /*}*/
  }

  #item_hua_bg {
    background: url("./images/item_hua_bg.png");
    background-size: 100% 100%;
    width: 100vw;
    height: 70vw;
    position: absolute;
    bottom: 15vh;
    left: 0px;
    right: 0px;
    top: 0px;
    display: flex;
  }

  #hua_box {
    display: flex;
    flex-direction: row;
    justify-content: center;
  }

  .hua {
    background: url("./images/item_hua_quan.png");
    height: 15vw;
    background-size: 100% 100%;
    width: 15vw;
  }

  #item_zuo_zi_box {
    position: absolute;
    margin: 0 auto;
    box-sizing: border-box;
    padding: 0px;
    text-align: center;
    left: 0px;
    right: 0px;
    top: 46vw;
    height: 400px;
  }

  #item_zuo_zi_box_inner {
    flex: 1;
    position: relative;
    padding: 0vw;
    margin: 0 auto;
    box-sizing: border-box;
  }

  #item_zuo_zi .inner {
    display: flex;
    flex-direction: row;
    vertical-align: top;
    justify-items: center;
    position: absolute;
    top: -9vw;
    text-align: center;
    margin: 0 auto;
    left: 0;
    right: 0;
    justify-content: center;
    align-items: center;
  }

  #item_zuo_zi_2 .inner {
    display: flex;
    flex-direction: row;
    vertical-align: top;
    justify-items: center;
    position: absolute;
    top: -10vw;
    text-align: center;
    margin: 0 auto;
    left: 0;
    right: 0;
    justify-content: center;
    align-items: center;
  }

  #item_zuo_zi_box_2 {
    position: absolute;
    margin: 0 auto;
    box-sizing: border-box;
    padding: 0px;
    text-align: center;
    left: 0px;
    right: 0px;
    top: 506px;
    height: 400px;
  }

  #item_zuo_zi_box_inner_2 {
    flex: 1;
    position: relative;
    padding: 0vw;
    margin: 0 auto;
    box-sizing: border-box;
  }

  #item_zuo_zi, #item_zuo_zi_2 {
    background: url("./images/item_zuo_zi.png");
    background-size: 100% 100%;
    width: 100%;
    height: 23vw;
    margin: 0 auto;
  }

  #item_zuo_zi .inner .item, #item_zuo_zi_2 .inner .item {
    width: 10vw;
    height: 10vw;
    margin-right: 0px;
    position: relative;
    -webkit-transition: all 0.5s;
    transition: all 0.5s;
    background-repeat: no-repeat;
    background-size: 100% auto;
    background-position: bottom;
  }

  .item.item-yue-bing {
    background-image: url("./images/item_pan_bing.png") !important;
    background-position: 0px 3px;
  }

  .item.item-kao-ya {
    background-image: url("./images/item_pan_ya.png") !important;
    background-position: 0px 3px;
  }

  .item.item-xuan-hua {
    background-image: url("./images/item_hua_01.png") !important;
  }
  .item.item_mantou {
    background-image: url("./images/item_mantou.png") !important;
  }
  .item.item_shuiguo {
    background-image: url("./images/item_shuiguo.png") !important;
  }

  .item.item-wu-liang-ye {
    background-image: url("./images/item_jiu_01.png") !important;
  }

  .item.item-05 {
    background-image: url("./images/item_jiu_02.png") !important;
  }

  .item-la-zu {
    background-image: url("./images/item_la_zhu.png") !important;
    background-size: 100% 100% !important;
  }

  .item-zhang-min-ding{
    background-image: url("./images/chang_min_deng_02.png") !important;
  }

  .item.item_pk_jiuxi_hongsaorou {
    background-image: url("./images/item_pk_jiuxi_hongsaorou.png") !important;
    background-position: 0px 3px;
  }

  .item.item_pk_jiuxi_ji {
    background-image: url("./images/item_pk_jiuxi_ji.png") !important;
    background-position: 0px 3px;
  }

  .item.item_pk_jiuxi_mantou {
    background-image: url("./images/item_pk_jiuxi_mantou.png") !important;
    background-position: 0px 3px;
  }

  .item.item_pk_jiuxi_maotai {
    background-image: url("./images/item_pk_jiuxi_maotai.png") !important;
    background-position: 0px 3px;
  }

  .item.item_pk_jiuxi_mifan {
    background-image: url("./images/item_pk_jiuxi_mifan.png") !important;
    background-position: 0px 3px;
  }

  .item.item_pk_jiuxi_ya {
    background-image: url("./images/item_pk_jiuxi_ya.png") !important;
    background-position: 0px 3px;
    background-size: 100% 65% !important;
  }

  .item.item_pk_jiuxi_yu {
    background-image: url("./images/item_pk_jiuxi_yu.png") !important;
    background-size: 100% 56% !important;
    margin-top: -2px;
  }

  .item-xiang-lu {
    background-image: url("./images/item_xiang_lu.png") !important;
    position: relative;
    .item-xiang-lu-box {
      position: absolute;
      left: 0px;
      right: 0px;
      bottom: 8vw;
      visibility: hidden;
      margin-left: 1vw;
      .item-xiang {
        position: relative;
        background-image: url("./images/item_xiang.png") !important;
        background-size: cover;
        width: 42px;
        height: 82px;
        margin: 0 auto;
      }
    }
  }

  .item-la-zu canvas, .item-zhang-min-ding canvas {
    position: absolute;
    left: 0px;
    right: 0;
    top: -31px;
    touch-action: none;
    cursor: inherit;
    width: 10vw;
    height: 10vw;
    visibility: hidden;
  }

  .item-zhang-min-ding canvas {
    transform: scale(0.5);
    top: -16px;
    visibility: visible;
    &.active{
      visibility: visible;
    }
  }
  .buttons {
    display: flex;
    flex-direction: row;
    align-items: flex-end;
    position: fixed;
    bottom: 0px;
    left: 0px;
    right: 0px;
    box-sizing: border-box;
    padding: 5px;
    z-index: 9;

    > .button {
      background: #C58233;
      padding: 6px 2px;
      margin-right: 4px;
      -webkit-box-flex: 1;
      -ms-flex: 1;
      flex: 1;
      -webkit-box-sizing: border-box;
      box-sizing: border-box;
      text-align: center;
      color: white;
      font-size: 14px;
      font-weight: bold;
    }
  }

  .side-buttons {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-left: 6px;

    .button {
      margin-bottom: 10px;

      &:last-child {
        margin-bottom: 0;
      }

      img {
        width: 36px;
        height: 36px;
        display: block;
      }
    }

    .music-button {
      animation: music-rotate 3s linear infinite;
      animation-play-state: paused;

      &.playing {
        animation-play-state: running;
      }
    }
  }

  @keyframes music-rotate {
    from { transform: rotate(0deg); }
    to { transform: rotate(359deg); }
  }

  .share-button {
    position: fixed;
    top: 12px;
    right: 12px;
    z-index: 999;

    .share-icon {
      width: 36px;
      height: 36px;
      display: block;
    }
  }

  #item-xuan-hua.item-xuan-hua {
    background-image: url("./images/item_hua_01.png") !important;
    background-size: 100% 100%;
    width: 10vw;
    height: 10vw;
    position: absolute;
    margin-left: -5vw;
    left: 50%;
    bottom: 0vw;
    transition: all 5s ease 1s;
    animation-duration: 5s;
    animation-timing-function: ease;
    animation-fill-mode: both;
    visibility: hidden;
  }

  @keyframes flowerIn {
    0% {
      transform: scale(0);
      opacity: 0;
      visibility: visible;
    }
    15% {
      transform: scale(1);
      opacity: 1;
      visibility: visible;
    }
    85% {
      transform: scale(2.5);
      opacity: 1;
      bottom: 75vw;
      visibility: visible;
    }
    100% {
      transform: scale(0);
      opacity: 0;
      bottom: 75vw;
      visibility: visible;
    }
  }

  @keyframes messageIn {
    0% {
      /*transform: translateX(-100%) translateY(50vw);*/
      /*visibility: hidden;*/
      opacity: 0;
      transform: scale(0);
    }
    /*20% {*/
    /*!*transform: translateX(0) translateY(50vw);*!*/
    /*!*visibility: visible;*!*/
    /*}*/
    100% {
      /*transform: translateX(0) translateY(0vw);*/
      /*visibility: visible;*/
      opacity: 1;
      transform: scale(1);
    }
  }

  .messages {
    padding: 15px 15px 15px 0px;
    position: absolute;
    left: 0px;
    bottom: 0px;
    height: 70vw;
    overflow: hidden;
    z-index: 6;
    .message {
      font-size: 12px;
      color: white;
      background: rgba(50, 50, 51, .38);
      border-radius: 0px 5px 5px 0px;
      padding: 3px 8px 3px 10px;
      margin-bottom: 3px;
      animation-duration: 1s;
      animation-timing-function: ease-in-out;
      animation-fill-mode: both;
      /*animation-name: messageIn;*/
      /*opacity: 0;*/
      /*transform: scale(0);*/
      &.locked {
        animation-name: null;
        opacity: 1;
        transform: scale(1);
      }
    }
  }
</style>
