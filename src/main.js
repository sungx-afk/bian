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

Vue.mixin({
  data(){
    return{
      bgm:[
        "http://app01.yugusoft.com/ftask/api/file/down/PP1pYJnLgFVTtgTWu6dNrL.mp3"
      ],
      currentAudioTime:0
    }
  },
  methods: {
    viewIndexPage(replace){
      let linkReplace = replace || false;
      Link(url,{},linkReplace)
    },
    playBgm(seek){
      let audio = document.getElementById('bgMusic');
      if (audio){
        audio.src = this.bgm[0]
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

