
const Space = () => import(/* webpackChunkName: "space" */ './components/Space');
const SpaceCreate = () => import(/* webpackChunkName: "space_create" */ './components/SpaceCreate')
const SpaceDetail = () => import(/* webpackChunkName: "space_detail" */ './components/SpaceDetail')
const SpaceManage = () => import(/* webpackChunkName: "space_manage" */ './components/SpaceManage')
const Blacklist = () => import(/* webpackChunkName: "blacklist" */ './components/blacklist/Blacklist')
const IssueCreate = () => import(/* webpackChunkName: "issue_create" */ './components/issue/IssueCreate')
const Agreement = () => import(/* webpackChunkName: "agreement" */ './components/agreement/Agreement')

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
	},
  {
    path: '/issue/create',
    component: IssueCreate
  },
  {
    path: '/agreement',
    component: Agreement
  },
]

export default routes;
