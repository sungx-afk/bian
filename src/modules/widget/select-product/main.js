import Vue from 'vue';
import Main from './main.vue'
import {removeWidget} from '@/config/utils'

const SelectProductConstructor = Vue.extend(Main);

let instance;


const SelectProduct = options => {
  options = options || {};
  if (typeof options === 'string') {
    options = {
      SelectProduct: options
    }
  }

  instance = new SelectProductConstructor({
    data: options
  });

  let title = options.title || '选择商品';
  instance.closeEnd = removeWidget({key:'select_product',title,cb:() => {
      instance.close();
    }})
  document.getElementById('app').appendChild(instance.$mount().$el);

}

export default SelectProduct;
