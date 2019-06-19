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


import store from './store/index';

import './api'
import './config/config'


Vue.config.productionTip = false

import {Link} from '@/config/utils'

Vue.mixin({
  methods: {
    playBgm(){
      var audio = document.getElementById('bgMusic');
      if(audio !== null){
        audio.play();
      }
    },
    viewIndexPage(replace){
      let linkReplace = replace || false;
      Link(url,{},linkReplace)
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

