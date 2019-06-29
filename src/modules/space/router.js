const Space = () => import(/* webpackChunkName: "space" */ './components/Space');
const SpaceCreate = () => import(/* webpackChunkName: "space_create" */ './components/SpaceCreate')
const SpaceDetail = () => import(/* webpackChunkName: "space_detail" */ './components/SpaceDetail')
const SpaceManage = () => import(/* webpackChunkName: "space_manage" */ './components/SpaceManage')
const Blacklist = () => import(/* webpackChunkName: "blacklist" */ './components/blacklist/Blacklist')
const FriendsManage = () => import(/* webpackChunkName: "friends-manage" */ './components/friends/FriendsManage')
const Meeting = () => import(/* webpackChunkName: "meeting" */ './components/meeting/Meeting')

const Agreement = () => import(/* webpackChunkName: "agreement" */ './components/agreement/Agreement')
const EditUserInfo = () => import(/* webpackChunkName: "edit_user" */ './components/userinfo/EditUserInfo')

const Issue = () => import(/* webpackChunkName: "issue" */ './components/issue/Issue')
const IssueCreate = () => import(/* webpackChunkName: "issue_create" */ './components/issue/IssueCreate')
const IssueDetail = () => import(/* webpackChunkName: "issue_detail" */ './components/issue/IssueDetail')

const ImageCropper = () => import(/* webpackChunkName: "image_cropper" */ './components/cropper/ImageCropper')

const Sacrifice = () => import(/* webpackChunkName: "space_manage" */ './components/sacrifice/Index')

const routes = [
  {
    path: '/space', component: Space,
    children: [
      {
        path: 'create',
        component: SpaceCreate
      }, {
        path: 'detail/:id',
        component: SpaceDetail,
      }, {
        path: 'sacrifice/:id',
        component: Sacrifice
      }, {
        path: 'manage/:id',
        component: SpaceManage
      },
      {
        path: 'blacklist/:id',
        component: Blacklist
      },
      {
        path: 'friends/:id',
        component: FriendsManage
      },
      {
        path: 'meeting/:id',
        component: Meeting
      }
    ]
  },
  {
    path: '/user_edit',
    component: EditUserInfo
  },
  {
    path: '/issue', component: Issue,
    children: [
      {
        path: 'create',
        component: IssueCreate
      }, {
        path: 'detail/:id',
        component: IssueDetail
      }]
  },
  {
    path: '/agreement',
    component: Agreement
  },
  {
    path: '/cropper',
    component: ImageCropper
  },
]

export default routes;
