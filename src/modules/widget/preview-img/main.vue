<template>
	<transition name="slide-fade" @after-leave="afterLeave">
		<div v-show="show" class="preview-img">
			<!-- <div class="error" v-if="error">图片加载失败</div>
			<img :src="url" @error="loadError" v-else> -->
			<div class="bg_cover" @click="close"></div>
			<VuerSingle
					v-if="url"
          class="item"
          ref="img"
          :src="url"
          :class="{z1:true}"
          @disableSwipe="allowSwipe = false"
          @enableSwipe="allowSwipe = true"
        />

		</div>
	</transition>
</template>

<script>
	import VuerSingle from './VuerSingle'

	export default {
		components:{
			VuerSingle
		},
		methods: {
			afterLeave(){
				this.$el &&
        this.$el.parentNode &&
        this.$el.parentNode.removeChild(this.$el);
        this.$destroy();
        this.closeEnd();
			},
			close(){
				this.show = false;
			},
			loadError(){
				this.error = true;
			}
		},
		data(){
			return {
				url: '',
				show: false,
				error: false,
				allowSwipe: false,
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
  .preview-img{
  	.modal;
  	background: #000;
  	.bg_cover{
  		position: absolute;
  		left: 0;
  		top: 0;
  		right: 0;
  		bottom: 0;
  		z-index: 8;
  	}
  	// display: flex;
  	// justify-content: center;
  	// align-items: center;
  }
  // .preview-img{
  // 	.modal;
  // 	display: flex;
  // 	justify-content: center;
  // 	align-items: center;
  // 	img{
  // 		max-width: 100%;
  // 		max-height: 100%;
  // 	}
  // }
</style>