import Vue from 'vue'
import Router from 'vue-router'

import Home from '@/modules/home/router'
import Space from '@/modules/space/router'
import Report from '@/modules/report/router'
import Mortuary from '@/modules/mortuary/router'
import store from '@/store';

Vue.use(Router)

const router = new Router({
  saveScrollPosition: true,
  transitionOnLoad: true,
  hashbang: false,
  history: true,
  mode: 'history', //'hash'则一切正常
  routes: [
    // App 打开的是根路径（capacitor://localhost/），没有这条会匹配不到路由导致白屏
    {path: '/', redirect: '/home'},
    ...Home,
    ...Space,
    ...Report,
    ...Mortuary
  ]
})

router.beforeEach((to, from, next) => {
  if(to.query.app_id){
      window.app_id = to.query.app_id;
  }
  let key = getLocalTokenKey();
  let comm = getRequestParam()
  if (to.query && to.query.plat){
    comm.plat = to.query.plat
    $axios.defaults.params = comm;//重新修改全局联网配置
    localStorage.setItem(key, JSON.stringify(comm));
  }

  if(to.path != '/login' && to.path != '/home'){

    let user = store.getters['userStore/user']
    if (!comm.token && to.query.token) {
      if (to.query.token){
        comm.token = to.query.token
        $axios.defaults.params = comm;//重新修改全局联网配置
        localStorage.setItem(key, JSON.stringify(comm));
      }else {
        next({path:'/login'});
        return false;
      }
    }
    if(comm.token && !user){
      store.dispatch('userStore/fetchMyInfo',{token:comm.token});
    }
  }
  next();
})

export default router;


