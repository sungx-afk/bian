<template>
  <div class="item" @click.stop="itemPress">
    <img class="icon" src="~@/modules/images/candle.png" />
    <div class="text">{{item.name}}</div>
    <div class="operate">
      <template v-if="moreMenu">
        <i class="more iconfont icon-gengduo" @click.stop="menuPress"></i>
      </template>
    </div>
  </div>
</template>

<script>
    export default {
      name: "Item",
      props: {
        item: {
          type: Object,
          default: {}
        },
        moreMenu:{
          type: Boolean,
          default: false
        }
      },
      methods:{
        itemPress () {
          this.$emit('item-press',this.item)
        },
        menuPress(){
          this.$emit('menu-press',this.item)
        }
      }
    }
</script>

<style rel="stylesheet/less" lang="less" scoped>
  @import "~@/config/config.less";

  .item {
    display: flex;
    height: 60px;
    align-items: center;
    border-bottom: 1px solid #f4f4f4;
    padding: 0 20px;
    .icon {
      width: 25px;
      height: 25px;
    }
    .text {
      padding-left: 10px;
      color: #202020;
      flex-grow: 1;
      overflow:hidden;
      text-overflow:ellipsis;
      white-space:nowrap;
      font-size: 16px;
    }
    .operate {
      width: 60px;
      display: flex;
      justify-content: flex-end;
      .more {
        width: 20px;
        height: 20px;
      }
    }
  }
</style>
