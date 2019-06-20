
const Space = () => import(/* webpackChunkName: "space" */ './components/Space');
const SpaceCreate = () => import(/* webpackChunkName: "space_create" */ './components/SpaceCreate')
const SpaceDetail = () => import(/* webpackChunkName: "space_detail" */ './components/SpaceDetail')
const SpaceManage = () => import(/* webpackChunkName: "space_manage" */ './components/SpaceManage')
const Blacklist = () => import(/* webpackChunkName: "blacklist" */ './components/blacklist/Blacklist')

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
      },{
        path: 'manage/:id',
        component: SpaceManage
      },
      {
        path: 'blacklist/:id',
        component: Blacklist
      }
    ]
	}
]

export default routes;
