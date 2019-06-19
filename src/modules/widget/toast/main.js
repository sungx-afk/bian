import Vue from 'vue';
import Main from './main.vue'

const ToastConstructor = Vue.extend(Main);

let instance;

/**
 * ​显示消息提示框
 * @options type         String      选填    图标，有效值 "success", "loading", "info", "warn", "download" 默认："success"
 * @options content      String      必填    提示的内容
 * @options duration     Number      选填		 提示的延迟时间，单位毫秒，默认：1500
 */

const Toast = options => {
	options = options || {};
	if (typeof options === 'string') {
	    options = {
	      	toast: options
	    }
	}

	instance = new ToastConstructor({
    data: options
  });
 	document.getElementById('app').appendChild(instance.$mount().$el);
  	
}


export default Toast