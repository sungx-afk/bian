import Mortuary from './modules/mortuary.js'
import Product from './modules/product.js'
import Order from './modules/order.js'
import Gift from './modules/gift.js'

export default{
  ...Mortuary,
  ...Product,
  ...Order,
  ...Gift,
}
