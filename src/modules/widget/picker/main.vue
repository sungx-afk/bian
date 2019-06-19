<template>
	<transition name="opacity-fade" @after-leave="afterLeave">
		<div class="picker-modal" v-show="show">
		  <div class="weui-mask" @click.stop="close"></div>
		  <div class="picker-body">
		  	<div class="picker-toolbar">
		  		<div class="item"><a @click="close">取消</a></div>
		  		<div class="item"><a @click="submit">确定</a></div>
		  	</div>
		  	<picker :item-list="itemList" :default-index="defaultIndex" @change="changeItem"></picker>
		  </div>
		</div>
	</transition>
</template>

<script>
	import Picker from './Picker'
	export default {
		components: {
      Picker,
    },
		methods: {
			afterLeave(){
				this.$el &&
				this.$el.parentNode &&
				this.$el.parentNode.removeChild(this.$el);
				this.$destroy();
			},
			close(){
				this.show = false;
			},
			changeItem(item, index){
				this.current = item;
				this.defaultIndex = index;
			},
			submit(){
				this.callback && this.callback(this.current, this.defaultIndex);
				this.close();
			}
		},
		data(){
			return {
				itemList: [],
				current: null,
				defaultIndex: 0,
				callback: null,

				show: false,
			}
		},
		created(){
			this.current = this.itemList[this.defaultIndex];
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

  .picker-modal{
    .modal(transparent);
    .picker-body{
    	z-index: 5000;
    	width: 100%;
    	position: fixed;
	    left: 0;
	    bottom: 0;
	    background-color: #fff;
	    .picker-toolbar{
	    	display: flex;
	    	.item{
	    		flex-grow: 1;
					width: 0;
					height: 40px;
					line-height: 40px;
					color: @COMMON_BLUE;
					padding: 0 10px;
					&:last-child{
						text-align: right;
					}
	    	}
	    }
    }
  }
</style>