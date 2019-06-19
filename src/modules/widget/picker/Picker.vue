<template>
  <div class="picker">
    <div class="select-body">
      <div class="select-list">
		    <div class="list" 
		    :class="{ dragging: dragging }" 
		    @touchstart="dragStart" 
		    @touchmove="dragMove" 
		    @touchend="dragEnd" 
		    @touchcancel="dragCancel" 
		    ref="list">
		      <div class="item" v-for="item in itemList" :class="{ selected: item === current }">{{ item }}</div>
		    </div>
		  </div>
      <div class="select-highlight"></div>
    </div>
  </div>
</template>

<script>
	export default {
		props: {
			itemList: {
				type: Array,
				default: Array,
			},
			defaultIndex: {
				type: Number,
				default: 0,
			}
		},
		computed:{
			dragRange() {
        const itemList = this.itemList;
        const visibleItemCount = this.visibleItemCount;
        const itemHeight = this.itemHeight;
        return [ -itemHeight * (itemList.length - Math.ceil(visibleItemCount / 2)), itemHeight * Math.floor(visibleItemCount / 2) ];
      },
			minTranslateY() {
        return this.itemHeight * (Math.ceil(this.visibleItemCount / 2) - this.itemList.length);
      },
      maxTranslateY() {
        return this.itemHeight * Math.floor(this.visibleItemCount / 2);
      }
		},
		methods: {
			dragStart(e){
				const event = e.changedTouches[0] || e.touches[0];
        this.dragState = {
          range: this.dragRange,
          start: new Date(),
          startLeft: event.pageX,
          startTop: event.pageY,
          startTranslateTop: this.getTranslate(this.$refs.list).top
        };
			},
			dragMove(e){
				//console.log(e)
				const event = e.changedTouches[0] || e.touches[0];
				this.dragging = true;
        this.dragState.left = event.pageX;
        this.dragState.top = event.pageY;
        const deltaY = this.dragState.top - this.dragState.startTop;
        const translate = this.dragState.startTranslateTop + deltaY;
        this.translateElement(this.$refs.list, null, translate);
       	this.velocityTranslate = translate - this.prevTranslate || translate;
        this.prevTranslate = translate;
			},
			dragEnd(e){
				const event = e.changedTouches[0] || e.touches[0];
				this.dragging = false;
        const momentumRatio = 7;
        let currentTranslate = this.getTranslate(this.$refs.list).top;
        const duration = new Date() - this.dragState.start;
        const distance = Math.abs(this.dragState.startTranslateTop - currentTranslate);
        const itemHeight = this.itemHeight;
        const visibleItemCount = this.visibleItemCount;

        let rect, offset;
        if (distance < 6) {
          rect = this.$el.getBoundingClientRect();
          offset = Math.floor((event.clientY - (rect.top + (visibleItemCount - 1) * itemHeight / 2)) / itemHeight) * itemHeight;
          if (offset > this.maxTranslateY) {
            offset = this.maxTranslateY;
          }
          this.velocityTranslate = 0;
          currentTranslate -= offset;
        }
        let momentumTranslate;
        if (duration < 300) {
          momentumTranslate = currentTranslate + this.velocityTranslate * momentumRatio;
        }

        let dragRange = this.dragState.range;
        this.$nextTick(() => {
          let translate;
          if (momentumTranslate) {
            translate = Math.round(momentumTranslate / itemHeight) * itemHeight;
          } else {
            translate = Math.round(currentTranslate / itemHeight) * itemHeight;
          }
          translate = Math.max(Math.min(translate, dragRange[1]), dragRange[0]);
          this.translateElement(this.$refs.list, null, translate);
          const index = this.translate2Index(translate);
          this.current = this.itemList[index];
          this.$emit('change', this.current, index);
        });
        this.dragState = {};
			},
			dragCancel(e){
				this.dragEnd(e)
			},
			getTranslate(element) {
		    const result = {left: 0, top: 0};
		    if (element === null || element.style === null) return result;
		    const transform = element.style.transform;
		    const matches = /translate\(\s*(-?\d+(\.?\d+?)?)px,\s*(-?\d+(\.\d+)?)px\)\s*translateZ\(0px\)/ig.exec(transform);
		    if (matches) {
		      result.left = +matches[1];
		      result.top = +matches[3];
		    }
		    return result;
		  },
		  cancelTranslateElement(element){
		  	if (element === null || element.style === null) return;
		    let transform = element.style.transform;
		    if (transform) {
		      transform = transform.replace(/translate\(\s*(-?\d+(\.?\d+?)?)px,\s*(-?\d+(\.\d+)?)px\)\s*translateZ\(0px\)/g, '');
		      element.style.transform = transform;
		    }
		  },
			translateElement(element, x, y){
				if (x === null && y === null) return;
		    if (element === null || element === undefined || element.style === null) return;
		    if (!element.style.transform && x === 0 && y === 0) return;
		    if (x === null || y === null) {
		      const translate = this.getTranslate(element);
		      if (x === null) {
		        x = translate.left;
		      }
		      if (y === null) {
		        y = translate.top;
		      }
		    }
		    this.cancelTranslateElement(element);
		    element.style.transform += ' translate(' + (x ? (x + 'px') : '0px') + ',' + (y ? (y + 'px') : '0px') + ') translateZ(0px)';
			},
			translate2Index(translate) {
        const itemHeight = this.itemHeight;
        translate = Math.round(translate / itemHeight) * itemHeight;
        const index = -(translate - Math.floor(this.visibleItemCount / 2) * itemHeight) / itemHeight;
        return index;
      },
      index2Translate(index) {
        const offset = Math.floor(this.visibleItemCount / 2);
        const itemHeight = this.itemHeight;
        if (index !== -1) {
          return (index - offset) * -itemHeight;
        }
      },
		},
		data(){
			return {
				current: null,
				dragging: false,
				dragState: {},
				velocityTranslate: 0,
				prevTranslate: 0,

				itemHeight: 48,
				visibleItemCount: 5,
			}
		},
		mounted() {
			this.translateElement(this.$refs.list, null, this.index2Translate(this.defaultIndex));
		}
	}
</script>

<style rel="stylesheet/less" lang="less">
	@import "~@/config/config.less";

	.picker{
		overflow: hidden;
		.select-body {
	    display: flex;
	    justify-content: center;
	    font-size: 20px;
	    position: relative;
	  }
	  .select-list{
	  	overflow: hidden;
	    position: relative;
	    max-height: 100%;
	    .list{
	    	height: 240px;
	    	transition-duration: 0.3s;
		    transition-timing-function: ease-out;
		    backface-visibility: hidden;
		    &.dragging{
		    	transition-duration: 0s;
		    }
		    .item{
		    	height: 48px;
    			line-height: 48px;
    			padding: 0 10px;
			    white-space: nowrap;
			    overflow: hidden;
			    text-overflow: ellipsis;
			    transition-duration: .3s;
    			backface-visibility: hidden;
		    	&.selected{
		    		color: #000;
    				transform: translate3d(0, 0, 0) rotateX(0);
		    	}
		    }
	    }
	  }
	  .select-highlight {
	  	width: 100%;
	  	height: 48px;
	    box-sizing: border-box;
	    position: absolute;
	    left: 0;
	    top: 50%;
	    margin-top: -24px;
	    pointer-events: none;
	    border-top: 1px solid @BORDER_COLOR;
	    border-bottom: 1px solid @BORDER_COLOR;
	  }
	}
</style>