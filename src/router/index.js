import Vue from 'vue'
import Router from 'vue-router'

import Home from '@/modules/home/router'
import Space from '@/modules/space/router'
import Report from '@/modules/report/router'
import Mortuary from '@/modules/mortuary/router'
import User from '@/modules/user/router'
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
    ...Mortuary,
    ...User
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

  // 登录/注册页本身不需要拦截
  const whiteList = ['/login', '/register']
  if (whiteList.indexOf(to.path) !== -1) {
    next();
    return;
  }

  // URL 上直接带 token：写入本地后拉取用户信息（后端回调 / 调试常用）
  if (to.query.token) {
    comm.token = to.query.token
    $axios.defaults.params = comm;
    localStorage.setItem(key, JSON.stringify(comm));
    store.dispatch('userStore/fetchMyInfo', {token: to.query.token})
      .then(() => next())
      .catch(() => next({path: '/login', query: {redirect: to.fullPath}}));
    return;
  }

  // URL 上直接带 uid：用 ?uid= 调试登录
  if (to.query.uid) {
    store.dispatch('userStore/loginWithUid', {uid: to.query.uid})
      .then(() => next())
      .catch(() => next({path: '/login', query: {redirect: to.fullPath}}));
    return;
  }

  // 已持有 token 但还没拿到用户信息：补拉一次
  let user = store.getters['userStore/user']
  if (comm.token && !user) {
    store.dispatch('userStore/fetchMyInfo', {token: comm.token})
      .then(() => next())
      .catch(() => next({path: '/login'}));
    return;
  }

  // 没有任何登录信息：跳到登录/注册页，并记录来源以便登录后跳回
  if (!comm.token && !user) {
    next({path: '/login', query: {redirect: to.fullPath}});
    return;
  }

  next();
})

export default router;


