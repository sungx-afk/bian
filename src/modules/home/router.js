const HomePage= () => import(/* webpackChunkName: "home-page" */ './components/HomePage');


const routes = [
	{
		path: '/home', component: HomePage
	}
]

export default routes;
