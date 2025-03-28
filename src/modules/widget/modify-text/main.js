import Vue from 'vue';
import Main from './main.vue'
import {removeWidget} from '@/config/utils'

const ModifyTextConstructor = Vue.extend(Main);

let instance;


const ModifyText = options => {
  options = options || {};
  if (typeof options === 'string') {
    options = {
      ModifyText: options
    }
  }

  instance = new ModifyTextConstructor({
    data: options
  });

  let title = options.title || '彼岸思念';
  instance.closeEnd = removeWidget({key:'modify_text',title,cb:() => {
      instance.close();
    }})
  document.getElementById('app').appendChild(instance.$mount().$el);

}

export default ModifyText;
