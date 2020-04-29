const Report = () => import(/* webpackChunkName: "report" */ './components/Report')

const routes = [
	{
		path: '/report_handle', component: Report
	}
]

export default routes;
