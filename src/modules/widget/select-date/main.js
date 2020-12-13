import Vue from 'vue';
import Main from './main.vue'
import {removeWidget} from '@/config/utils'

const SelectDateConstructor = Vue.extend(Main);

let instance;


const SelectDate = options => {
  options = options || {};
  if (typeof options === 'string') {
    options = {
      SelectDate: options
    }
  }

  instance = new SelectDateConstructor({
    data: options
  });

  let title = options.title || '选择日期';
  instance.closeEnd = removeWidget({key:'select_date',title,cb:() => {
      instance.close();
    }})
  document.getElementById('app').appendChild(instance.$mount().$el);

}

export default SelectDate;
