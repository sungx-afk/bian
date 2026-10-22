const Home = () => import(/* webpackChunkName: "home" */ './components/Home');
const List = () => import(/* webpackChunkName: "list" */ './components/List');
const PublicList = () => import(/* webpackChunkName: "list" */ './components/PublicList');
const Error = () => import(/* webpackChunkName: "error" */ './components/Error');
const Notice = () => import(/* webpackChunkName: "notice" */ './components/Notice');
const MeetingIntro = () => import(/* webpackChunkName: "meeting_intro" */ './components/MeetingIntro');
const UserCenter = () => import(/* webpackChunkName: "user-center" */ './components/UserCenter');
const Privacy = () => import(/* webpackChunkName: "doc" */ '@/modules/widget/Privacy');
const Terms = () => import(/* webpackChunkName: "doc" */ '@/modules/widget/Terms');
const WebDoc = () => import(/* webpackChunkName: "webdoc" */ '@/modules/widget/WebDoc');

const routes = [
	{
		path: '/home', component: Home
	},
  {
    path: '/list', component: List
  },
  {
    path: '/public_list', component: PublicList
  },
  {
    path: '/error', component: Error
  },
  {
    path: '/notice', component: Notice
  },
  {
    path: '/meeting_intro', component: MeetingIntro
  },
  {
    path: '/user_center', component: UserCenter
  },
  // App 内静态页（保留兼容深链，入口已改为下面的 /webdoc 官网容器）
  {
    path: '/privacy', component: Privacy
  },
  {
    path: '/terms', component: Terms
  },
  // 隐私政策 / 用户协议：在 App 内打开官网文档页，页面自带返回按钮
  {
    path: '/webdoc', component: WebDoc
  },
]

export default routes;
