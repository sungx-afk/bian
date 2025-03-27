const Home = () => import(/* webpackChunkName: "home" */ './components/Home');
const List = () => import(/* webpackChunkName: "list" */ './components/List');
const PublicList = () => import(/* webpackChunkName: "list" */ './components/PublicList');
const Error = () => import(/* webpackChunkName: "error" */ './components/Error');
const Notice = () => import(/* webpackChunkName: "notice" */ './components/Notice');
const MeetingIntro = () => import(/* webpackChunkName: "meeting_intro" */ './components/MeetingIntro');
const UserCenter = () => import(/* webpackChunkName: "user-center" */ './components/UserCenter');

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
]

export default routes;
