const Mortuary = () => import(/* webpackChunkName: "mortuary" */ './components/Mortuary');
const MortuaryCreate = () => import(/* webpackChunkName: "mortuary_create" */ './components/MortuaryCreate')
const MortuaryList = () => import(/* webpackChunkName: "mortuary_list" */ './components/List')
const Setting = () => import(/* webpackChunkName: "mortuary_setting" */ './components/Setting')
const ActivityList = () => import(/* webpackChunkName: "activity_list" */ './components/activity/List')
const ProductList = () => import(/* webpackChunkName: "product_list" */ './components/product/List')
const NewProduct = () => import(/* webpackChunkName: "new_product" */ './components/product/NewProduct')
const OrderList = () => import(/* webpackChunkName: "order_list" */ './components/order/List')
const NewOrder = () => import(/* webpackChunkName: "new_order" */ './components/order/NewOrder')
const OrderDetail = () => import(/* webpackChunkName: "order_detail" */ './components/order/Detail')
const FinishOrder = () => import(/* webpackChunkName: "finish_order" */ './components/order/FinishOrder')
const SetManager = () => import(/* webpackChunkName: "set_manager" */ './components/SetManager');
const Gift = () => import(/* webpackChunkName: "gift" */ './components/gift/list');

const routes = [
  {
    path: '/mortuary', component: Mortuary,
    children: [
      {
        path: 'list',
        component: MortuaryList
      },{
        path: 'create',
        component: MortuaryCreate
      },{
        path: 'setting',
        component: Setting
      },{
        path: 'activity_list',
        component: ActivityList
      },{
        path: 'product_list',
        component: ProductList
      },{
        path: 'new_product',
        component: NewProduct
      },{
        path: 'order_list',
        component: OrderList
      },{
        path: 'new_order',
        component: NewOrder
      },{
        path: 'finish_order',
        component: FinishOrder
      },{
        path: 'set_manager',
        component: SetManager
      },{
        path: 'gift',
        component: Gift
      },{
        path: 'order_detail',
        component: OrderDetail
      }
    ]
  },

]

export default routes;
