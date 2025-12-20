import Vue from 'vue';
import Main from './main.vue'
import {removeWidget} from '@/config/utils'

const FinishOrderConstructor = Vue.extend(Main);

let instance;


const FinishOrder = options => {
  options = options || {};
  if (typeof options === 'string') {
    options = {
      FinishOrder: options
    }
  }

  instance = new FinishOrderConstructor({
    data: options
  });

  let title = options.title || '完成订单';
  instance.closeEnd = removeWidget({key:'finish_order',title,cb:() => {
      instance.close();
    }})
  document.getElementById('app').appendChild(instance.$mount().$el);

}

export default FinishOrder;
