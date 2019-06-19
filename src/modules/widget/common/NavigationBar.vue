<template>
  <div class="navigation-bar">
    <div class="left-item" v-on:click="goBack">
      <div class="l-item">
        <span class="left-text">{{leftItem.title}}</span>
        <div class="left-icon" v-if="leftItem.icon.length>0"></div>
      </div>
    </div>
    <div class="title">{{title}}</div>
    <div class="right-items">
      <div v-for="(item, index) in rightItems" :key="index" class="r-item" v-on:click="rightItemsHandle(index)">
        <span class="right-text">{{item.title}}</span>
        <div class="right-icon" :class="item.icon" v-if="item.icon.length>0"></div>
      </div>
    </div>
  </div>
</template>

<script>

  import qs from 'qs'

  export default {
    name: "Navigationbar",
    props: {
      leftItem: { // 左侧返回项
        type: Object,
        default: function () {
          return {title:'',icon:'batch_icon'}
        }
      },
      title: { // 中间显示的标题
        type: String,
        default: '标题'
      },
      rightItems: { // 右侧操作项
        type: Array,
        default: function () {
          return [{title:'',icon:''}]
        }
      },
      height: { // 高度
        type: Number,
        default: 44
      },
      themeColor: { // 背景色
        type: String,
        default: '#f6f6f6'
      }
    },
    data() {
      return {
        
      }
    },
    created() {
      
    },
    methods: {
      goBack () {
        this.$emit('goback')
      },
      rightItemsHandle (index) {
        this.$emit('rightitems',index)
      }
    }
  }
</script>

<style scoped lang="less">
  @import "~@/config/config.less";
  i {
    font-style: normal;
  }
  .navigation-bar {
    width: 100%;
    min-height: 44px;
    max-height: 44px;
    display: flex;
    flex-direction: row;
    background-color: #f9f9f9;
    justify-content: space-between;
    top: 0;
    left: 0;
    position: relative;
    .left-item {
      height: 44px;
      line-height: 44px;
      width: 0;
      flex-grow: 1;
      .l-item {
        margin-left: 15px;
        .left-text {
          text-align: left;
          color: @COMMON_BLUE;
        }
        .left-icon {
          width: 24px;
          height: 24px;
          padding: 10px 0px;
          background: url('~@/modules/note/images/back.png') no-repeat 100%;
          background-size: 100%;
        }
      }
    }
    .title {
      color: black;
      height: 44px;
      font-size: 19px;
      line-height: 44px;
      text-align: center;
      width: 0;
      flex-grow: 1;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .right-items {
      width: 0;
      height: 44px;
      display: flex;
      align-items: center;
      overflow: hidden;
      flex-grow: 1;
      justify-content: flex-end;
      .r-item {
        margin-right: 14px;
        background-size: 100%;
        .right-text {
          text-align: right;
          color: @COMMON_BLUE;
        }
        .right-icon {
          min-height: 20px;
          min-width: 20px;
          width: 22px;
          height: 22px;
          background-size: 100%;
          &.note_to_task{
            background: url('~@/modules/note/images/note_to_task.png') no-repeat 100%;
            background-size: 100%;
          }
          &.note_color{
            background: url('~@/modules/note/images/note_color.png') no-repeat 100%;
            background-size: 100%;
          }
          &.note_delete{
            background: url('~@/modules/note/images/note_delete.png') no-repeat 100%;
            background-size: 100%;
          }
          &.more_icon{
            background: url('~@/modules/note/images/more_icon.png') no-repeat 100%;
            background-size: 100%;
          }
          &.batch_icon{
            background: url('~@/modules/note/images/batch_icon.png') no-repeat 100%;
            background-size: 100%;
          }
        }
      }
    }
  }
</style>