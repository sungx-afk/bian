const Home = () => import(/* webpackChunkName: "home" */ './components/Home');
const Error = () => import(/* webpackChunkName: "error" */ './components/Error');

const routes = [
	{
		path: '/home', component: Home
	},
  {
    path: '/error', component: Error
  }
]

export default routes;
