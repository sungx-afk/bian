const Mortuary = () => import(/* webpackChunkName: "mortuary" */ './components/Mortuary');
const MortuaryCreate = () => import(/* webpackChunkName: "mortuary_create" */ './components/MortuaryCreate')
const MortuaryList = () => import(/* webpackChunkName: "mortuary_create" */ './components/List')
const Setting = () => import(/* webpackChunkName: "mortuary_setting" */ './components/Setting')
const ActivityList = () => import(/* webpackChunkName: "mortuary_setting" */ './components/activity/List')
const ProductList = () => import(/* webpackChunkName: "mortuary_setting" */ './components/product/List')
const NewProduct = () => import(/* webpackChunkName: "mortuary_setting" */ './components/product/NewProduct')
const OrderList = () => import(/* webpackChunkName: "mortuary_setting" */ './components/order/List')
const NewOrder = () => import(/* webpackChunkName: "mortuary_setting" */ './components/order/NewOrder')

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
      }
    ]
  },

]

export default routes;
