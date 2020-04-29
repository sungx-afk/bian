const Report = () => import(/* webpackChunkName: "report" */ './components/Report')
const List = () => import(/* webpackChunkName: "report-list" */ './components/List')
const Detail = () => import(/* webpackChunkName: "report-detail" */ './components/Detail')

const routes = [
	{
		path: '/report_handle', component: Report,
    children:[{
      path: 'list',
      component: List
    },{
      path: 'detail',
      component: Detail
    }]
	},
]

export default routes;
