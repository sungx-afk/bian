<template>
	<transition name="opacity-fade" @after-leave="afterLeave">
		<div class="action-sheet" :class="{	'weui-skin_android': androidStyle }" v-show="show">
		  <div class="weui-mask" @click.stop="pressMask"></div>
		  <div class="weui-actionsheet" :class="{ 'weui-actionsheet_toggle': show && !androidStyle }">
		      <div class="weui-actionsheet__title" v-if="title && !androidStyle">
		          <p class="weui-actionsheet__title-text">{{ title }}</p>
		      </div>
		      <div class="weui-actionsheet__menu">
		          <div class="weui-actionsheet__cell"
		          v-for="(item, index) in itemList"
		          :key="index"
		          :style="{ color: item.color ? item.color : null }"
		          @click.stop="confirm(item, index)">{{ typeof item == 'object' ? item.name : item }}</div>
		      </div>
		      <div class="weui-actionsheet__action" v-if="cancelShow && !androidStyle">
		          <div class="weui-actionsheet__cell" :style="{ color: cancelColor }" @click="close">{{ cancelText ? cancelText : '取消' }}</div>
		      </div>
		  </div>
		</div>
	</transition>
</template>

<script>
	export default {
		methods: {
			confirm(item, index){
			  if (this.clickLong){
			    this.clickLong = false
			    return
        }
				if(typeof item == 'object'){
					this.callback && this.callback(item, index);
				}else{
					this.callback && this.callback(index);
				}
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
			},
      pressMask(){
        if (this.clickLong){
          this.clickLong = false
          return
        }
        this.close()
      }
		},
		data(){
			return {
				title: '',

				cancelShow: true,
				cancelColor: null,
				cancelText: '',

				itemList: [],

				callback: null,

				androidStyle: false, //Android风格 没有 不显示title cancel

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

  .action-sheet{
    .modal(transparent);
    user-select: none;
  }
</style>
