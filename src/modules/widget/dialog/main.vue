<template>
	<transition name="opacity-fade" @after-leave="afterLeave">
		<div class="dialog" v-show="show">
	      <div class="weui-mask"></div>
	      <div class="weui-dialog" :class="{ 'weui-skin_android': androidStyle }">
	          <div class="weui-dialog__hd" v-if="title"><strong class="weui-dialog__title">{{ title }}</strong></div>
	          <div class="weui-dialog__bd">{{ content }}</div>
	          <div class="weui-dialog__ft">
	              <a href="javascript:;" class="weui-dialog__btn weui-dialog__btn_default" v-if="cancelShow" :style="{ color: cancelColor }" @click="close">{{ cancelText ? cancelText : '取消' }}</a>
	              <a href="javascript:;" class="weui-dialog__btn weui-dialog__btn_primary" :style="{ color: confirmColor }" @click="confirm">{{ confirmText ? confirmText : '确定' }}</a>
	          </div>
	      </div>
	  </div>
	</transition>
</template>

<script>
	export default {
		methods: {
			confirm(){
				this.callback && this.callback();
				this.close();
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
				title: '',
				content: '',

				cancelShow: true,
				cancelColor: null,
				cancelText: '',

				confirmColor: null,
				confirmText: '',

				callback: null,

				androidStyle: false,

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

  .dialog{
    .modal(transition);
    .weui-dialog__title{
    	word-wrap:break-word;
    	word-break:break-all;
    }
  }
</style>