import Vue from 'vue';
import Main from './main.vue'

const PickerConstructor = Vue.extend(Main);

let instance;

const Picker = options => {
	options = options || {};

	instance = new PickerConstructor({
    data: options
  });
 	document.getElementById('app').appendChild(instance.$mount().$el);
  	
}

export default Picker