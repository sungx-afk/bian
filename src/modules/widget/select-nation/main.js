import Vue from 'vue';
import Main from './main.vue'
import {removeWidget} from '@/config/utils'

const SelectNationConstructor = Vue.extend(Main);

let instance;


const SelectNation = options => {
  options = options || {};
  if (typeof options === 'string') {
    options = {
      SelectNation: options
    }
  }

  instance = new SelectNationConstructor({
    data: options
  });

  let title = options.title || '彼岸思念';
  instance.closeEnd = removeWidget({key:'select_nation',title,cb:() => {
      instance.close();
    }})
  document.getElementById('app').appendChild(instance.$mount().$el);

}

export default SelectNation;
