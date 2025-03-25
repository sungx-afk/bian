import Vue from 'vue';
import Main from './main.vue'
import {removeWidget} from '@/config/utils'

const NewStoryConstructor = Vue.extend(Main);

let instance;


const NewStory = options => {
  options = options || {};
  if (typeof options === 'string') {
    options = {
      NewStory: options
    }
  }

  instance = new NewStoryConstructor({
    data: options
  });

  let title = options.title || '新建文章';
  instance.closeEnd = removeWidget({key:'new_story',title,cb:() => {
      instance.close();
    }})
  document.getElementById('app').appendChild(instance.$mount().$el);
}

export default NewStory;
