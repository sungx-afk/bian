// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import Vue from 'vue'
import App from './App'
import router from './router'
import {filter} from './filter'

import Navigation from 'vue-navigation'

Vue.use(Navigation, {router})

import VueScroller from 'vue-scroller'
Vue.use(VueScroller)


import vfinger from 'v-finger-mk42'
Vue.use(vfinger)

import Vant from 'vant';
import 'vant/lib/index.css';

Vue.use(Vant);

import store from './store/index';

import './api'
import './config/config'

import { wechatShare,wechatPay } from './wx/wxSdk'
Vue.prototype.wechatShare  = wechatShare
Vue.prototype.wechatPay  = wechatPay

Vue.config.productionTip = false

import {Link,isIphone} from '@/config/utils'
import constant from '@/config/constant'

import {mapGetters} from 'vuex';

if (window.entryUrl === 'undefined' || window.entryUrl === '') {
  window.entryUrl = window.location.href.split('#')[0];
}

/*======================== 背景音乐（全局只有 App.vue 里一个 audio#bgMusic） ========================*/
//当前是否"期望在播放"：自动播放被拦截时用它判断要不要兜底补播
let bgmWantPlay = false
//"首次交互补播"是否已挂上
let bgmGestureRetryBound = false

//播放（audio 是全局唯一的 #bgMusic）
const playBgmAudio = (audio) => {
  if (!audio || !bgmWantPlay) {
    return
  }
  const result = audio.play()
  if (result && typeof result.catch === 'function') {
    result.catch(() => {
      armBgmGestureRetry()
    })
  }
}

//兜底：页面刚加载、用户还没有任何手势时，audio.play() 会被自动播放策略拒掉
//（iOS 微信 / 安卓 WebView(X5) / Chrome 都会拦），此时挂一次性交互监听补播。
//用 capture 阶段监听，避免被页面里 canvas 的 stopPropagation 挡掉；
//真正播起来了就解绑；用户已手动停止（bgmWantPlay=false）则不补播。
const armBgmGestureRetry = () => {
  if (bgmGestureRetryBound) {
    return
  }
  bgmGestureRetryBound = true
  const events = ['touchstart', 'click']
  const handler = () => {
    const audio = document.getElementById('bgMusic')
    if (!audio || !bgmWantPlay) {
      unbind()
      return
    }
    if (!audio.paused) {//已经在播了
      unbind()
      return
    }
    const result = audio.play()
    if (result && typeof result.then === 'function') {
      result.then(unbind).catch(() => {})
    } else {
      unbind()
    }
  }
  const unbind = () => {
    bgmGestureRetryBound = false
    events.forEach((ev) => document.removeEventListener(ev, handler, true))
  }
  events.forEach((ev) => document.addEventListener(ev, handler, true))
}

//微信内：借原生桥调用（getNetworkType）的回调来触发播放。
//微信 iOS 里"由原生桥回调触发"等同可信上下文，是解锁自动播放的常规做法；
//安卓部分内核版本同样有效，失效时由首次交互补播兜底。
const playBgmViaWeixinBridge = (audio) => { 
  const play = () => {
    playBgmAudio(audio)
  }
  if (window.WeixinJSBridge && typeof window.WeixinJSBridge.invoke === 'function') {
    try {
      window.WeixinJSBridge.invoke('getNetworkType', {}, play)
      return
    } catch (err) {
      console.log(err)
    }
  }
  if (!playBgmViaWeixinBridge.bound) {
    playBgmViaWeixinBridge.bound = true
    document.addEventListener('WeixinJSBridgeReady', play, false)
  }
}

Vue.mixin({
  data(){
    return{
      presetBgm:[
        {
          key:'preset_1',
          name:'葬礼进行曲',
          author:'崔雅宁',
          url:"https://app01.yugusoft.com/ftask/api/file/down/PiAviztsce3R1thS8FTcVP.mp3"
        },
        {
          key:'preset_2',
          name:'大悲咒',
          author:'梵音',
          url:"https://app01.yugusoft.com/ftask/api/file/down/AjE3v2qHBTWBNPje6ZikFk.mp3"
        }
      ],
      currentBgmKey:'preset_1',
      selfUpload:[],
      customIndex:0,
      currentAudioTime:0
    }
  },
  computed: {
    ...mapGetters({
      userSetting: 'userStore/userSetting'
    }),
    isIPhoneX() {
      if (typeof window !== 'undefined' && window) {
        return /iphone/gi.test(window.navigator.userAgent) && window.screen.height >= 812;
      }
      return false;
    },
  },
  methods: {
    tryHandleBgm(space){
      this.initBgm(space)
      this.tryAutoPlay()
    },
    tryAutoPlay(){
      //判断选定的是否开启自动播放音频
      let playState = 'play'
      if (this.userSetting && this.userSetting['bgm_play_state']){
        playState = this.userSetting['bgm_play_state']
      }
      let needPlay = playState === 'play'
      if (needPlay){
        this.playBgm(0)
      }
    },
    initBgm(space){
      if (!space){
        return
      }
      if (space.music){
        this.initBgmKey(space.music.key)
        this.customIndex = space.music.usedIndex
        this.selfUpload = space.music.selfUpload
      }else {
        this.initBgmKey()
      }
    },
    initBgmKey(key){
      if (key){
        this.currentBgmKey = key
      } else{
        this.currentBgmKey = 'preset_1'
      }
    },
    playBgm(seek,options){
      let audio = document.getElementById('bgMusic');
      if (audio){
        if (options){
          if (options.bgmKey){
            this.currentBgmKey = options.bgmKey
          }
        }
        if (this.currentBgmKey === 'custom'){
          let index = this.customIndex
          if (options && options.index !== undefined){
            index = options.index
          }
          audio.src = this.selfUpload[index].url
        }else{
          let index = this.presetBgm.findIndex(item=>{
            return item.key === this.currentBgmKey
          })
          if (index === -1 || index === undefined){
            index = 0
          }
          audio.src = this.presetBgm[index].url
        }

        if (seek === 0){//重新加载音频
          audio.currentTime = 0
        }else{
          audio.currentTime = this.currentAudioTime
        }
        //本次是"期望播放"状态
        bgmWantPlay = true
        if (isIphone() && typeof wx !== 'undefined' && typeof wx.config === 'function'){
          try {
            wx.config({
              // 配置信息, 即使不正确也能使用 wx.ready
              debug: false,
              appId: '',
              timestamp: new Date().getTime(),
              nonceStr: '',
              signature: '',
              jsApiList: [],
              //check:false —— 跳过签名校验，wx.ready 会立刻同步执行回调。
              //不传 check 时走真校验：wx.ready 只在"本页已经成功 config 过一次"后才同步执行回调，
              //否则回调进队列等校验响应。而"自动进馆"（/list 直接跳祭拜页）这条链路上没有任何真配置，
              //这里又是伪造的 config（appId/signature 为空）→ 校验失败/无响应 → 队列永不触发，
              //audio.play() 永远不执行，iOS 上音乐就出不来了。
              check: false
            });
            wx.ready(function() {
              playBgmAudio(audio);
            });
          } catch (err) {
            console.log(err)
          }
        }
        //直连播放：iPhone 上若上面那条没生效、以及非 iPhone 都靠这里
        if (audio.paused){
          playBgmAudio(audio)
        }
        //微信内再借桥回调触发一次（iOS 解锁自动播放；安卓部分内核有效）
        playBgmViaWeixinBridge(audio)

        setTimeout(()=>{
          //自动播放被拦且内核没抛 Promise（老 WebView）时，兜底等用户首次交互
          if (bgmWantPlay && audio.paused){
            armBgmGestureRetry()
          }
          eventHub.$emit(constant.EVENT_AUDIO_PLAY,'play')
        },500)
      }
    },
    stopBgm(quit){
      //用户/业务主动停止后，不再做"触摸补播"
      bgmWantPlay = false;
      let audio = document.getElementById('bgMusic');
      if (audio){
        audio.pause();
        if (quit){
          this.currentAudioTime = 0;
        }else{
          this.currentAudioTime = audio.currentTime
        }
        eventHub.$emit(constant.EVENT_AUDIO_PLAY,'stop')
      }
    },
    getThemes(){
      let themes = [
        //以下 16 项取自 store/Info.vue 的 backgrounds（bg_1 ~ bg_16），uuid 与上面风格一致：16 位定长串
        {
          uuid: 'b7Kq2RmZxT4pLw9A',
          color: '#FFFFFF',
          dateColor:'#FFFFFF',
          epitaphColor: '#FFFFFF',
          url: 'https://static-app01.yugusoft.com/bian/bg_1.jpeg?v=2'
        },
        {
          uuid: 'Fg3nYe5vBq8HtUcJ',
          color: '#FFFFFF',
          dateColor:'#FFFFFF',
          epitaphColor: '#FFFFFF',
          url: 'https://static-app01.yugusoft.com/bian/bg_2.jpeg?v=2'
        },
        {
          uuid: 'mP6rDz1sWk4XoNvE',
          color: '#FFFFFF',
          dateColor:'#FFFFFF',
          epitaphColor: '#FFFFFF',
          url: 'https://static-app01.yugusoft.com/bian/bg_3.jpeg?v=2'
        },
        {
          uuid: 'Qa9tLc2jRh7YbGfM',
          color: '#FFFFFF',
          dateColor:'#FFFFFF',
          epitaphColor: '#FFFFFF',
          url: 'https://static-app01.yugusoft.com/bian/bg_4.jpeg?v=2'
        },
        {
          uuid: 'uX4wVp8nZd3KqTsB',
          color: '#FFFFFF',
          dateColor:'#FFFFFF',
          epitaphColor: '#FFFFFF',
          url: 'https://static-app01.yugusoft.com/bian/bg_5.jpeg?v=2'
        },
        {
          uuid: 'Hs1gJm6cFy9RlPoW',
          color: '#FFFFFF',
          dateColor:'#FFFFFF',
          epitaphColor: '#FFFFFF',
          url: 'https://static-app01.yugusoft.com/bian/bg_6.jpeg?v=2'
        },
        {
          uuid: 'tN7bQx4dAz2VeUkC',
          color: '#FFFFFF',
          dateColor:'#FFFFFF',
          epitaphColor: '#FFFFFF',
          url: 'https://static-app01.yugusoft.com/bian/bg_7.jpeg?v=2'
        },
        {
          uuid: 'Lo5vRf8mYt1WgPnJ',
          color: '#FFFFFF',
          dateColor:'#FFFFFF',
          epitaphColor: '#FFFFFF',
          url: 'https://static-app01.yugusoft.com/bian/bg_8.jpeg?v=2'
        },
        {
          uuid: 'pZ3kTd6sBq9UxHcV',
          color: '#FFFFFF',
          dateColor:'#FFFFFF',
          epitaphColor: '#FFFFFF',
          url: 'https://static-app01.yugusoft.com/bian/bg_9.jpeg?v=2'
        },
        {
          uuid: 'wM8nYc1vFg4RtLbQ',
          color: '#FFFFFF',
          dateColor:'#FFFFFF',
          epitaphColor: '#FFFFFF',
          url: 'https://static-app01.yugusoft.com/bian/bg_10.jpeg?v=2'
        },
        {
          uuid: 'xQ2jLp7dKm5WsTfN',
          color: '#FFFFFF',
          dateColor:'#FFFFFF',
          epitaphColor: '#FFFFFF',
          url: 'https://static-app01.yugusoft.com/bian/bg_11.jpeg?v=2'
        },
        {
          uuid: 'Ce6rHv9bZt3XnUqA',
          color: '#FFFFFF',
          dateColor:'#FFFFFF',
          epitaphColor: '#FFFFFF',
          url: 'https://static-app01.yugusoft.com/bian/bg_12.jpeg?v=2'
        },
        {
          uuid: 'vY1sGm4kPd8QwBfR',
          color: '#FFFFFF',
          dateColor:'#FFFFFF',
          epitaphColor: '#FFFFFF',
          url: 'https://static-app01.yugusoft.com/bian/bg_13.jpeg?v=2'
        },
        {
          uuid: 'bK5tNc2xLh7JrVqW',
          color: '#FFFFFF',
          dateColor:'#FFFFFF',
          epitaphColor: '#FFFFFF',
          url: 'https://static-app01.yugusoft.com/bian/bg_14.jpeg?v=2'
        },
        {
          uuid: 'fD9wQz3mRn6YtGpB',
          color: '#FFFFFF',
          dateColor:'#FFFFFF',
          epitaphColor: '#FFFFFF',
          url: 'https://static-app01.yugusoft.com/bian/bg_15.jpeg?v=2'
        },
        {
          uuid: 'sR4vBm8cJx1KqLwT',
          color: '#FFFFFF',
          dateColor:'#FFFFFF',
          epitaphColor: '#FFFFFF',
          url: 'https://static-app01.yugusoft.com/bian/bg_16.jpeg?v=2'
        },
        {
          uuid: '5oLlWLeWV3KFtgIg',
          color: '#FFFFFF',
          dateColor:'#FFFFFF',
          epitaphColor: '#FFFFFF',
          // name: '无限思念-1',
          url: 'https://static-app01.yugusoft.com/bian/theme_sinian2.png'
        },
        {
          uuid: 'i5qRVuEa3gIpKKDL',
          color: '#FFFFFF',
          dateColor:'#FFFFFF',
          epitaphColor: '#FFFFFF',
          // name: '无限思念-2',
          url: 'https://static-app01.yugusoft.com/bian/theme_sinian1.png'
        },
        {
          uuid: 'Lz1m3qc7PZ7burhn',
          color: '#FFFFFF',
          dateColor:'#FFFFFF',
          epitaphColor: '#FFFFFF',
          // name: '山水',
          url: 'https://static-app01.yugusoft.com/bian/theme_shanshui.png'
        },
        {
          uuid: 'zkaodFO8EOEZrCo3',
          color: '#FFFFFF',
          dateColor:'#FFFFFF',
          epitaphColor: '#FFFFFF',
          // name: '星空-1',
          url: 'https://static-app01.yugusoft.com/bian/theme_xingkong1.png'
        },
        {
          uuid: 'ifrc01k81NRFY5Pd',
          color: '#FFFFFF',
          dateColor:'#FFFFFF',
          epitaphColor: '#FFFFFF',
          // name: '星空-2',
          url: 'https://static-app01.yugusoft.com/bian/theme_xingkong2.png'
        }, {
          uuid: 'rvkTYJmBDC3tVTWE',
          color: '#FFFFFF',
          dateColor:'#FFFFFF',
          epitaphColor: '#FFFFFF',
          // name: '星空-3',
          url: 'https://static-app01.yugusoft.com/bian/theme_xingkong3.png'
        },
        {
          uuid: 'JW1OjfrQPu4Xd9de',
          color: '#FFFFFF',
          dateColor:'#FFFFFF',
          epitaphColor: '#FFFFFF',
          // name: '祥云',
          url: 'https://static-app01.yugusoft.com/bian/theme_xiangyun.png'
        },
        ]

      return themes
    },
    getPresetTheme(themeId){
      let defaultIndex = 16 //默认还是取以前的无限思念-1
      let themes = this.getThemes()
      if (!themeId){
        return themes[defaultIndex]
      }
      let index = themes.findIndex(item=>item.uuid === themeId)
      if (index < 0){
        index = defaultIndex
      }
      return themes[index]
    }
  },
  mounted() {
    try{
      // 等待桥接就绪后调用
      document.addEventListener('WeixinJSBridgeReady', function() {
        WeixinJSBridge.call('hideToolbar'); // 隐藏底部工具栏
        // WeixinJSBridge.call('showToolbar'); // 恢复显示
      });
    }catch(err){
      console.log(err)
    }

  }
})

global.$router = router;
global.eventHub = new Vue();
filter(Vue);

new Vue({
  el: '#app',
  router,
  store,
  render: h => h(App)
})

