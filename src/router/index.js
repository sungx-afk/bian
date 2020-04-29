import Vue from 'vue'
import Router from 'vue-router'

import Home from '@/modules/home/router'
import Space from '@/modules/space/router'
import Report from '@/modules/report/router'

import store from '@/store';

Vue.use(Router)

const router = new Router({
  saveScrollPosition: true,
  transitionOnLoad: true,
  hashbang: false,
  history: true,
  mode: 'history', //'hash'则一切正常
  routes: [
    ...Home,
    ...Space,
    ...Report
  ]
})

router.beforeEach((to, from, next) => {

  let comm = getRequestParam()

  if (to.query && to.query.plat){
    comm.plat = to.query.plat
    $axios.defaults.params = comm;//重新修改全局联网配置
    localStorage.setItem("bian-requestParam", JSON.stringify(comm));
  }

  if(to.path != '/login' && to.path != '/home'){

    let user = store.getters['userStore/user']
    if (!comm.token && to.query.token) {
      if (to.query.token){
        comm.token = to.query.token
        $axios.defaults.params = comm;//重新修改全局联网配置
        localStorage.setItem("bian-requestParam", JSON.stringify(comm));
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


