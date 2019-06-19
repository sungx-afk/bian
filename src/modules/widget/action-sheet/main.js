import Vue from 'vue';
import Main from './main.vue'

const ActionSheetConstructor = Vue.extend(Main);

let instance;

/**
 * ​显示操作菜单
 * @options title          String                         选填    标题 
 * @options cancelShow     Boolean                        选填    在ios风格下是否显示取消按钮
 * @options cancelColor    String                         选填		取消按钮颜色
 * @options cancelText     String                         选填    取消按钮文案
 * @options itemList       Aarray ( Object | String )     必填    操作菜菜单的数组 可以选择对象数组活字符串数组 分别对应返回对象和下标
 * @options callback			 Function                       必填    操作完成后的回调方法
 * @options androidStyle   Boolean                        选填    默认ios风格 在Android风格中不显示title cancel
 */

const ActionSheet = options => {
	options = options || {};
	if (typeof options === 'string') {
	    options = {
	      	actionSheet: options
	    }
	}

	instance = new ActionSheetConstructor({
    data: options
  });
 	document.getElementById('app').appendChild(instance.$mount().$el);
  	
}

export default ActionSheet