<template>
	<transition name="opacity-fade" @after-enter="afterEnter" @after-leave="afterLeave">
		<div class="toast" v-show="show">
	      <div class="weui-mask_transparent"></div>
	      <div class="weui-toast">
	          <i :class="{
	          	'weui-loading': type == 'loading',
	          	'weui-icon-success-no-circle': type == 'success',
	          	'weui-icon-info-circle': type == 'info',
	          	'weui-icon-warn': type == 'warn',
	          	'weui-icon-download': type == 'download',
	          	'weui-icon_toast': true,
	          }"></i>
	          <p class="weui-toast__content">{{ content }}</p>
	      </div>
	  </div>
	</transition>
</template>

<script>
	export default {
		methods: {
			afterEnter(){
				setTimeout(() => {
		    	this.close();
		    }, this.duration);
			},
			afterLeave(){
				this.$el &&
				this.$el.parentNode &&
				this.$el.parentNode.removeChild(this.$el);
				this.$destroy();
			},
			close(){
				this.show = false;
			}
		},
		data(){
			return {
				type: 'success',
				content: '',
				duration: 1500,

				show: false,
			}
		},
		mounted() {
		  this.$nextTick(() => {
		    this.show = true;
		  });
		}
	}
</script>

<style rel="stylesheet/less" lang="less" scoped>
  @import "~@/config/config.less";

  .toast{
  	.modal(transition);
    .weui-icon-info-circle, .weui-icon-warn, .weui-icon-download{
    	font-size: 55px;
    	color: #fff;
    }
  }
</style>