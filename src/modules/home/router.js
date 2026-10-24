const Home = () => import(/* webpackChunkName: "home" */ './components/Home');
const List = () => import(/* webpackChunkName: "list" */ './components/List');
const PublicList = () => import(/* webpackChunkName: "list" */ './components/PublicList');
const Error = () => import(/* webpackChunkName: "error" */ './components/Error');
const Notice = () => import(/* webpackChunkName: "notice" */ './components/Notice');
const MeetingIntro = () => import(/* webpackChunkName: "meeting_intro" */ './components/MeetingIntro');
const UserCenter = () => import(/* webpackChunkName: "user-center" */ './components/UserCenter');
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
  // 隐私政策 / 用户协议：统一在 App 内打开官网文档页（/webdoc），页面自带返回按钮
  {
    path: '/webdoc', component: WebDoc
  },
]

export default routes;
