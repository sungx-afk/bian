import Vue from 'vue';
import Main from './main.vue'
import {removeWidget} from '@/config/utils'

const SelectNationConstructor = Vue.extend(Main);

let instance;


const SelectNation = options => {
  options = options || {};
  if (typeof options === 'string') {
    options = {
      SelectChance: options
    }
  }

  instance = new SelectNationConstructor({
    data: options
  });

  let title = options.title || '选择民族';
  instance.closeEnd = removeWidget({key:'select_nation',title,cb:() => {
      instance.close();
    }})
  document.getElementById('app').appendChild(instance.$mount().$el);

}

export default SelectNation;
