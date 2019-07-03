const Login = () => import(/* webpackChunkName: "login" */ './components/Login');


const routes = [
	{
		path: '/login', component: Login
	}
]

export default routes;
