const Login = () => import(/* webpackChunkName: "login" */ './components/Login');


const routes = [
	{
		path: '/login', component: Login
	},
	{
		path: '/register', component: Login
	}
]

export default routes;
