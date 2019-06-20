const Space = () => import(/* webpackChunkName: "space" */ './components/Space');
const SpaceCreate = () => import(/* webpackChunkName: "space_create" */ './components/SpaceCreate')
const SpaceDetail = () => import(/* webpackChunkName: "space_detail" */ './components/SpaceDetail')

const routes = [
	{
		path: '/space', component: Space,
    children: [
      {
        path: 'create',
        component: SpaceCreate
      },{
        path: 'detail/:id',
        component: SpaceDetail
      }]
	}
]

export default routes;
