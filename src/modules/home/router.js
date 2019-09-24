const Home = () => import(/* webpackChunkName: "home" */ './components/Home');
const Error = () => import(/* webpackChunkName: "error" */ './components/Error');
const Notice = () => import(/* webpackChunkName: "notice" */ './components/Notice');

const routes = [
	{
		path: '/home', component: Home
	},
  {
    path: '/error', component: Error
  },
  {
    path: '/notice', component: Notice
  },
]

export default routes;
