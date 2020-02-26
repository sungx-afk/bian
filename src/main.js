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

import {Link} from '@/config/utils'
import constant from '@/config/constant'

import {mapGetters} from 'vuex';

Vue.mixin({
  data(){
    return{
      presetBgm:[
        {
          key:'preset_1',
          name:'葬礼进行曲',
          author:'崔雅宁',
          url:"http://app01.yugusoft.com/ftask/api/file/down/PiAviztsce3R1thS8FTcVP.mp3"
        },
        {
          key:'preset_2',
          name:'大悲咒',
          author:'梵音',
          url:"http://app01.yugusoft.com/ftask/api/file/down/AjE3v2qHBTWBNPje6ZikFk.mp3"
        }
      ],
      currentBgmKey:'preset_1',
      selfUpload:[],
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
    initBgm(space){
      if (!space){
        return
      }
      if (space.music){
        this.initBgmKey(space.music.key)
        this.selfUpload = space.music.selfUpload
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
          audio.src = this.selfUpload[0].url
        }else{
          let index = this.presetBgm.findIndex(item=>{
            return item.key === this.currentBgmKey
          })
          if (index === -1){
            index = 0
          }
          audio.src = this.presetBgm[index].url
        }

        if (seek === 0){//重新加载音频
          audio.currentTime = 0
        }else{
          audio.currentTime = this.currentAudioTime
        }
        audio.play();
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

