import Vue from 'vue';
import Main from './main.vue'

const DialogConstructor = Vue.extend(Main);

let instance;

/**
 * ​​显示模态弹窗
 * @options title           String         选填    标题 
 * @options content         String         必填    内容
 * @options cancelShow      Boolean        选填    是否显示取消按钮
 * @options cancelColor     String         选填		 取消按钮颜色
 * @options cancelText      String         选填    取消按钮文案
 * @options confirmColor    String         选填		 确认按钮颜色
 * @options confirmText     String         选填    确认按钮文案
 * @options callback			  Function       必填    操作完成后的回调方法
 * @options androidStyle    Boolean        选填    默认ios风格
 */

const Dialog = options => {
	options = options || {};
	if (typeof options === 'string') {
	    options = {
	      	dialog: options
	    }
	}

	instance = new DialogConstructor({
    data: options
  });
 	document.getElementById('app').appendChild(instance.$mount().$el);
  	
}


export default Dialog