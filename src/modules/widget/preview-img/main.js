import Vue from 'vue';
import Main from './main.vue'
import { removeWidget } from '@/config/utils'

const PreviewImgConstructor = Vue.extend(Main)

let instance;

/**
 * ​显示操作菜单
 * @options ul          String          必填     图片地址
 */

const PreviewImg = options => {
	options = options || {};
	if (typeof options === 'string') {
	  options = {
	    upload: options
	  }
	}

	instance = new PreviewImgConstructor({
    data: options
  });

	instance.closeEnd = removeWidget({ 
		key: 'preview_img',
		title: '图片预览',
		cb: () => {
			instance.close();
		}
	})
  document.getElementById('app').appendChild(instance.$mount().$el);
  	
}

export default PreviewImg