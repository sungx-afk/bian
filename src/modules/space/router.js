const Space = () => import(/* webpackChunkName: "space" */ './components/Space');
const SpaceCreate = () => import(/* webpackChunkName: "space_create" */ './components/SpaceCreate')

const routes = [
	{
		path: '/space', component: Space,
    children: [
      {
        path: 'create',
        component: SpaceCreate
      }]
	}
]

export default routes;
