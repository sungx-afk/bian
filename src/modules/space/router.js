const Space = () => import(/* webpackChunkName: "space" */ './components/Space');
const SpaceCreate = () => import(/* webpackChunkName: "space_create" */ './components/SpaceCreate')
const SpaceDetail = () => import(/* webpackChunkName: "space_detail" */ './components/SpaceDetail')
const SpaceManage = () => import(/* webpackChunkName: "space_manage" */ './components/SpaceManage')
const Blacklist = () => import(/* webpackChunkName: "blacklist" */ './components/blacklist/Blacklist')
const Bgm = () => import(/* webpackChunkName: "bgm" */ './components/manage/Bgm')
const Transfer = () => import(/* webpackChunkName: "transfer" */ './components/manage/Transfer')
const FriendsManage = () => import(/* webpackChunkName: "friends-manage" */ './components/friends/FriendsManage')
const Meeting = () => import(/* webpackChunkName: "meeting" */ './components/meeting/Meeting')

const Agreement = () => import(/* webpackChunkName: "agreement" */ './components/agreement/Agreement')
const EditUserInfo = () => import(/* webpackChunkName: "edit_user" */ './components/userinfo/EditUserInfo')

const Issue = () => import(/* webpackChunkName: "issue" */ './components/issue/Issue')
const IssueCreate = () => import(/* webpackChunkName: "issue_create" */ './components/issue/IssueCreate')
const IssueDetail = () => import(/* webpackChunkName: "issue_detail" */ './components/issue/IssueDetail')

const ImageCropper = () => import(/* webpackChunkName: "image_cropper" */ './components/cropper/ImageCropper')

const Sacrifice = () => import(/* webpackChunkName: "space_manage" */ './components/sacrifice/Index')

const Share = () => import(/* webpackChunkName: "share" */ './components/share/Share')

const Store = () => import(/* webpackChunkName: "store" */ './components/store/Store')
const Info = () => import(/* webpackChunkName: "Info" */ './components/store/Info')
const Charge = () => import(/* webpackChunkName: "charge" */ './components/store/Charge')
const Logs = () => import(/* webpackChunkName: "logs" */ './components/store/Logs')
const Couplets = () => import(/* webpackChunkName: "couplets" */ './components/store/Couplets')

const Report = () => import(/* webpackChunkName: "report" */ './components/report/Report')
const Theme = () => import(/* webpackChunkName: "theme" */ './components/theme/Theme')
const Summary = () => import(/* webpackChunkName: "summary" */ './components/userinfo/UserSummary')

const StoryDetail = () => import(/* webpackChunkName: "story-detail" */ './components/userinfo/story/StoryDetail')

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
      },
      {
        path: 'bgm/:id',
        component: Bgm
      },
      {
        path: 'transfer/:id',
        component: Transfer
      }, {
        path: 'theme',
        component: Theme
      },
      {
        path: 'summary',
        component: Summary
      },
      {
        path: 'story/:id',
        component: StoryDetail
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
  {
    path: '/share',
    component: Share
  },
  {
    path: '/store', component: Store,
    children: [
      {
        path:'info',
        component:Info,
      },
      {
        path:'charge',
        component:Charge,
      },
      {
        path:'logs',
        component:Logs,
      },
      {
        path:'couplets',
        component:Couplets,
      }
    ]
  },
  {
    path: '/report',
    component: Report,
  },
]

export default routes;
