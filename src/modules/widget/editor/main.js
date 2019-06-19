import Vue from 'vue';
import Main from './main.vue'
import { removeWidget } from '@/config/utils'

const EditorConstructor = Vue.extend(Main);

let instance;

/**
 * ​​编辑器
 * @options content         String         选填    内容
 * @options callback			  Function       必填    操作完成后的回调方法
 */

const Editor = options => {
	options = options || {};
	if (typeof options === 'string') {
	    options = {
	      	editor: options
	    }
	}

	instance = new EditorConstructor({
    data: options
  });

  instance.closeEnd = removeWidget({ 
		key: 'editor',
		title: '编辑',
		cb: () => {
			instance.close();
		}
	})
 	document.getElementById('app').appendChild(instance.$mount().$el);
  	
}


export default Editor