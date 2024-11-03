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

global.entryUrl = window.location.href.split('#')[0];

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
        if (isIphone()){
          wx.config({
            // 配置信息, 即使不正确也能使用 wx.ready
            debug: false,
            appId: '',
            timestamp: new Date().getTime(),
            nonceStr: '',
            signature: '',
            jsApiList: []
          });
          wx.ready(function() {
            audio.play();
          });
        }else {
          audio.play();
        }

        setTimeout(()=>{
          eventHub.$emit(constant.EVENT_AUDIO_PLAY,'play')
        },500)
      }
    },
    stopBgm(quit){
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
        {
          uuid: '5oLlWLeWV3KFtgIg',
          color: '#FFFFFF',
          dateColor:'#FFFFFF',
          epitaphColor: '#FFFFFF',
          name: '无限思念-1',
          url: 'https://static-app01.yugusoft.com/bian/theme_sinian2.png'
        },
        {
          uuid: 'i5qRVuEa3gIpKKDL',
          color: '#FFFFFF',
          dateColor:'#FFFFFF',
          epitaphColor: '#FFFFFF',
          name: '无限思念-2',
          url: 'https://static-app01.yugusoft.com/bian/theme_sinian1.png'
        },
        {
          uuid: 'Lz1m3qc7PZ7burhn',
          color: '#FFFFFF',
          dateColor:'#FFFFFF',
          epitaphColor: '#FFFFFF',
          name: '山水',
          url: 'https://static-app01.yugusoft.com/bian/theme_shanshui.png'
        },
        {
          uuid: 'zkaodFO8EOEZrCo3',
          color: '#FFFFFF',
          dateColor:'#FFFFFF',
          epitaphColor: '#FFFFFF',
          name: '星空-1',
          url: 'https://static-app01.yugusoft.com/bian/theme_xingkong1.png'
        },
        {
          uuid: 'ifrc01k81NRFY5Pd',
          color: '#FFFFFF',
          dateColor:'#FFFFFF',
          epitaphColor: '#FFFFFF',
          name: '星空-2',
          url: 'https://static-app01.yugusoft.com/bian/theme_xingkong2.png'
        }, {
          uuid: 'rvkTYJmBDC3tVTWE',
          color: '#FFFFFF',
          dateColor:'#FFFFFF',
          epitaphColor: '#FFFFFF',
          name: '星空-3',
          url: 'https://static-app01.yugusoft.com/bian/theme_xingkong3.png'
        },
        {
          uuid: 'JW1OjfrQPu4Xd9de',
          color: '#FFFFFF',
          dateColor:'#FFFFFF',
          epitaphColor: '#FFFFFF',
          name: '祥云',
          url: 'https://static-app01.yugusoft.com/bian/theme_xiangyun.png'
        }, {
          uuid: 't37lsByGDFkTfLj6',
          color: '#FFFFFF',
          dateColor:'#FFFFFF',
          epitaphColor: '#FFFFFF',
          name: '红色-1',
          url: 'https://static-app01.yugusoft.com/bian/theme_dangjian1.png'
        }, {
          uuid: 'MozabJlp2wvKAjAu',
          color: '#FFFFFF',
          dateColor:'#FFFFFF',
          epitaphColor: '#FFFFFF',
          name: '红色-2',
          url: 'https://static-app01.yugusoft.com/bian/theme_dangjian2.png'
        }]

      return themes
    },
    getPresetTheme(themeId){
      let themes = this.getThemes()
      if (!themeId){
        return themes[0]
      }
      let index = themes.findIndex(item=>item.uuid === themeId)
      if (index < 0){
        index = 0
      }
      return themes[index]
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

