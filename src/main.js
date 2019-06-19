// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import Vue from 'vue'
import App from './App'
import router from './router'
import {filter} from './filter'


import MintUI from 'mint-ui'
import 'mint-ui/lib/style.css'


import './config/element.css'

import Navigation from 'vue-navigation'

Vue.use(Navigation, {router})

import VueScroller from 'vue-scroller'
Vue.use(VueScroller)


import vfinger from 'v-finger-mk42'
Vue.use(vfinger)


import VmRate from 'vue-multiple-rate'
import 'vue-multiple-rate/lib/rate.css'
Vue.component(VmRate.name, VmRate)


Vue.use(MintUI)


import store from './store/index';

import './api'
import './config/config'
import './config/ClientHandle'


Vue.config.productionTip = false

import {callClient,Link} from '@/config/utils'
import { Toast } from 'mint-ui';

Vue.mixin({
  methods: {
    taskChangedSyncData(task,oldTask){
      this.$store.dispatch('taskStore/taskChangedSyncData',task)
      this.$store.dispatch('homeStore/taskChangedSyncData',task)
    },
  	openWebview(url){
  		var apiName = 'open_mobile_webview';
      var params = {
          "url": url
      }
      callClient(apiName,params);
  	},
    playBgm(){
      var audio = document.getElementById('bgMusic');
      if(audio !== null){
        audio.play();
      }
    },
    openSlideDetail({uuid,type,param,v}){
  	  let url = '';
  	  switch(type){
        case 'task':
          url =  '/tasks/'+uuid;
          break;
        case 'project':
          url =  '/projects/'+uuid+'/index';
          break;
        case 'finance':
          if(v === 2){
            url =  '/finance/detail?id='+uuid+'&type='+param.type;
          }else{
            let user = getMyInfo();
            url =  `/ftask/html/fishboneMobile/apply/detailNew.html?user_id=${user.uuid}&finance_id=${uuid}&is_my_apply=1&type_id=${type}`;
          }
          break;
        case 'hr':
          if(v === 2) {
            url =  '/hr/detail?uuid='+uuid+'&scope='+param.type;
          }else{
            let user = getMyInfo();
            url =  `/ftask/html/fishboneMobile/hr/detailNew.html?user_id=${user.uuid}&leave_id=${uuid}&is_my_apply=1`;
          }
          break;
        case 'report':
          url =  '/report/detail?id='+uuid
          break;
        case 'post':
          url =  '/post/detail?id='+uuid
          break;
        case 'customer':
          url =  '/crm/customer/'+uuid
          break;
        case 'chance':
          url =  '/crm/chance/'+uuid
          break;
        case 'project_apply':
          url = '/projects/approve?uuid='+uuid
          break;
        case 'contract':
          url =  '/crm/contract/'+uuid
          break;
      }
      if(url){
        if(url.indexOf('ftask') >= 0){
          window.location.href = url;
        }else{
          Link(url);
        }
      }else{
        Toast({
          message: '暂不支持打开该类型的详情，请前往客户端操作',
        });
      }
    },
    viewIndexPage(replace){
      let from_info = store.getters['userStore/from_info'];
  	  let url = '/dynamic';

      if (isThirdPlatformVersion()){
        url = '/todo2';
      }
      if(isPersonalVersion()){
        url = '/projects/assign_me'
      }
      console.log("from_info",from_info)
  	  if(from_info && from_info.from == 'push' && from_info.notifyType == 'im'){
  	    url = '/im';
      }
      let linkReplace = replace || false;
      Link(url,{},linkReplace)
    }
  }
})















global.$router = router;
global.eventHub = new Vue();
filter(Vue);

/* eslint-disable no-new */
new Vue({
  el: '#app',
  router,
  store,
  render: h => h(App)
  // template: '<App/>',
  // components: { App }
})

