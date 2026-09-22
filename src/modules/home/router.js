const Home = () => import(/* webpackChunkName: "home" */ './components/Home');
const List = () => import(/* webpackChunkName: "list" */ './components/List');
const PublicList = () => import(/* webpackChunkName: "list" */ './components/PublicList');
const Error = () => import(/* webpackChunkName: "error" */ './components/Error');
const Notice = () => import(/* webpackChunkName: "notice" */ './components/Notice');
const MeetingIntro = () => import(/* webpackChunkName: "meeting_intro" */ './components/MeetingIntro');
const UserCenter = () => import(/* webpackChunkName: "user-center" */ './components/UserCenter');
const Privacy = () => import(/* webpackChunkName: "doc" */ '@/modules/widget/Privacy');
const Terms = () => import(/* webpackChunkName: "doc" */ '@/modules/widget/Terms');

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
  // 上架必填：隐私政策与自动续期订阅条款（App Store Connect 审核信息里要填这两个链接）
  {
    path: '/privacy', component: Privacy
  },
  {
    path: '/terms', component: Terms
  },
]

export default routes;
