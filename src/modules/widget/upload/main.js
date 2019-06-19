import Vue from 'vue';
import Main from './main.vue'
import { removeWidget } from '@/config/utils'

const UploadConstructor = Vue.extend(Main)

let instance;

/**
 * ​显示操作菜单
 * @options list          Array          选填    初始化的文件列表
 * @options reqType       String         选填    上传类型 不同模式下的上传类型不同 默认"general_file"
 * @options folderId      String         选填		 文件夹ID 该模式下reqType为 pan_comp_file公司网盘文件，pan_my_file网盘我的文件，pan_share_file网盘共享文件
 * @options projectId     String         选填    项目ID 该模式下reqType为 pan_project_file网盘项目文件
 * @options resId         String         选填    替换文件ID 该模式下reqType为 replace_file文件替换
 * @options callback			Function       必填    操作完成后的回调方法
 */

const Upload = options => {
	options = options || {};
	if (typeof options === 'string') {
	  options = {
	    upload: options
	  }
	}

	instance = new UploadConstructor({
    data: options
  });

	instance.closeEnd = removeWidget({ 
		key: 'upload',
		title: '附件',
		cb: () => {
			instance.close();
		}
	})
  document.getElementById('app').appendChild(instance.$mount().$el);
  	
}

export default Upload