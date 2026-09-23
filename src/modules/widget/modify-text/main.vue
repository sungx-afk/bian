<template>
  <transition name="slide-fade" v-on:after-leave="afterLeave">
    <div class="box-wrapper" v-show="show">
      <div class="item-box">
        <!-- 传入 headerTitle 时显示统一页头（返回=取消，不触发保存回调） -->
        <page-header v-if="headerTitle" :title="headerTitle" @back="cancel"></page-header>
        <template v-if="multiline">
          <van-field
            ref="input"
            v-model="content"
            type="textarea"
            :placeholder="placeholder"
            :rows="rows"
            :autosize="{ maxHeight: maxH, minHeight: minH }">
          </van-field>
        </template>
        <template v-else>
          <van-field
            ref="input"
            v-model="content"
            :placeholder="placeholder"
            :border="true">
          </van-field>
        </template>

        <div class="bottom-button">
          <van-button type="default" size="large" @click.tap="btnPressed">{{btnText}}</van-button>
        </div>
      </div>
    </div>
  </transition>
</template>

<script>

import PageHeader from '@/modules/widget/PageHeader'

export default {
    data(){
      return {
        show:false,
        callback:null,
        content:'',
        placeholder:'请输入文本',
        btnText:'确定',
        multiline:false,
        maxH:500,
        minH:300,
        rows:10,
        headerTitle:'',   // 页头标题：传了才显示统一页头
        oldContent:''
      }
    },
    components: {
      PageHeader
    },
    methods: {
      // 取消：不触发保存回调
      cancel(){
        this.show = false
      },
      afterLeave(){
        this.$el &&
        this.$el.parentNode &&
        this.$el.parentNode.removeChild(this.$el);
        this.$destroy();
        this.closeEnd();
      },
      close(){
        if (this.oldContent !== this.content){
          this.callback && this.callback(this.content)
        }
        this.show = false;
      },
      btnPressed(){
        this.close()
      }
    },
    mounted() {
      this.$nextTick(() => {
        this.$refs.input.focus()
      });
    },
    created(){
      this.show = true
      this.oldContent = this.content
      this.maxH = document.documentElement.clientHeight - 120
    }
  }
</script>

<style lang='less' rel="stylesheet/less" scoped >
  @import '~@/config/config.less';
  .box-wrapper{
    overflow-y: auto;
    .modal();
    .item-box{
      position: relative;
      z-index: 11;
      background: #ffffff;
      display: flex;
      flex-direction: column;
      height: 100%;
      width: 100%;
      box-sizing: border-box;
      overflow-x: hidden;
      overflow-y: hidden;
      .bottom-button {
        display: flex;
        justify-content: center;
        margin-top: 20px;
        .van-button--large{
          width: 90%;
          color: white;
          height: 40px;
          line-height: 38px;
          background-color: @MAIN_THEME_COLOR;
        }
      }
    }
  }
</style>
