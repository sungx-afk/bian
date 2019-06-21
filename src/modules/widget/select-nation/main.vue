<template>
  <transition name="slide-fade" v-on:after-leave="afterLeave">
    <div class="nation-box" v-show="show">
      <div class="bg_cover" @click.stop="close"></div>
      <div class="item-box">
        <div class="common">
          <div class="item" v-for="(nation,index) in commonList" :key="index" @click.stop="selectCommonNation(nation)">
            <van-tag plain size="large">{{nation}}</van-tag>
          </div>
        </div>
        <div class="nation_list">
          <div class="item" v-for="nation in nationList">
            <div
              :class="(nation >= 'A' && nation <= 'Z') ? 'letter' : 'nation'"
              @click.stop="clickNation(nation)" >{{nation}}
            </div>
          </div>
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
        selectNation: '',
        commonList: ['汉族', '壮族', '回族', '满族', '维吾尔族', '苗族', '彝族', '藏族', '土家族', '蒙古族'],
        nationList: [
          "A","阿昌族",
          "B","白族","保安族","布朗族","布依族",
          "C","朝鲜族",
          "D","达斡尔族","傣族","德昂族","侗族","东乡族","独龙族",
          "E","鄂伦春族","俄罗斯族","鄂温克族",
          "G","高山族","仡佬族",
          "H","哈尼族","哈萨克族","汉族","赫哲族","回族",
          "J","基诺族","京族","景颇族",
          "K","柯尔克孜族",
          "L","拉祜族","黎族","傈僳族","珞巴族",
          "M","满族","毛南族","门巴族","蒙古族","苗族","仫佬族",
          "N","纳西族","怒族",
          "P","普米族",
          "Q","羌族",
          "S","撒拉族","畲族","水族",
          "T","塔吉克族","塔塔尔族","土族","土家族",
          "W","佤族","维吾尔族","乌孜别克族",
          "X","锡伯族",
          "Y","瑶族","彝族","裕固族",
          "Z","藏族","壮族"
        ]
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
        this.callback && this.callback(this.selectNation);
        this.show = false;
      },
      selectCommonNation(nation){
        if(nation){
          this.selectNation = nation;
        }
        this.close();
      },
      clickNation(nation){
        let isLetter = this.checkIsLetter(nation);
        if (!isLetter) {
          this.selectNation = nation;
          this.close();
        }
      },
      //检查是否为英文字母
      checkIsLetter(value) {
        let reg = /^[A-Za-z]+$/;
        if (reg.test(value)) { //判断是否符合正则表达式
          return true;
        } else {
          return false;
        }
      }
    },
    mounted() {
      this.$nextTick(() => {
        this.show = true;
      });
    },
    created(){
    }
  }
</script>

<style lang='less' rel="stylesheet/less" scoped >
  @import '~@/config/config.less';
  .nation-box{
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
      .common {
        flex-shrink: 0;
        width: 100%;
        background-color: white;
        padding-bottom: 10px;

        .item {
          display:inline-block;
          padding-right:10px;
          padding-left:15px;
          padding-top:10px;
        }
      }

      .nation_list {
        width: 100%;
        height: 0px;
        flex-grow: 1;
        overflow-x: hidden;
        overflow-y: auto;

        .item {
          width: 100%;

          .letter {
            height: 25px;
            line-height: 25px;
            margin-left: 15px;
            margin-right: 15px;
            font-size: 14px;
            color: #202020;
            background-color: #f6f6f6;
          }

          .nation {
            height: 35px;
            line-height: 35px;
            padding-left: 15px;
            padding-right: 15px;
            font-size: 14px;
            color: #202020;
            background-color: white;
          }
        }
      }
    }
  }
</style>
