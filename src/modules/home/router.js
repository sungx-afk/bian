const Home = () => import(/* webpackChunkName: "home" */ './components/Home');


const routes = [
	{
		path: '/home', component: Home
	}
]

export default routes;
