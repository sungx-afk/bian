<template>
  <transition name="slide-fade" v-on:after-leave="afterLeave">
    <div class="box-wrapper" v-show="show">
      <div class="bg_cover" @click.stop="close"></div>
      <div class="item-box">
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


  export default {
    data(){
      return {
        show:false,
        callback:null,
        content:'',
        placeholder:'请输入文本',
        btnText:'确定',
        multiline:false,
        maxH:800,
        minH:400,
        rows:10,
        oldContent:''
      }
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
    }
  }
</script>

<style lang='less' rel="stylesheet/less" scoped >
  @import '~@/config/config.less';
  .box-wrapper{
    overflow-y: auto;
    .modal();
    .bg_cover{
      width: 100%;
      height: 100%;
      background: @BG_GRAY2;
      opacity: .8;
      position: absolute;
      left: 0;
      top:0;
      z-index: 10;
    }
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
