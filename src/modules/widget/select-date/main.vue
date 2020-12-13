<template>
  <transition name="slide-fade" v-on:after-leave="afterLeave">
    <div class="select-date-box" v-show="show">
      <div class="item-box">
        <div class="date-type-wrapper">
          <van-radio-group v-model="dateType" class="type-radio-group" direction="horizontal">
              <van-radio v-for="item in dateTypeList" :key="item.value" :name="item.value" checked-color="#825621">{{item.name}}</van-radio>
          </van-radio-group>
        </div>
        <div class="date-select-wrapper">
          <van-cell class="date-cell" title="出生日期:" is-link :value="birthday?dateText(birthday):'未填写'" @click.stop="selectBirthday"></van-cell>
          <van-cell class="date-cell" title="逝世日期:" is-link :value="dieDay?dateText(dieDay):'未填写'" @click.stop="selectDieDay"></van-cell>
        </div>
        <div class="push-setting-wrapper">
            <van-checkbox checked-color="#825621" shape="square" v-model="pushChecked"></van-checkbox>
            <span class="text" style="margin-left:8px;">在忌日前</span>
            <van-field
                v-model="pushDays">
            </van-field>
            <span class="text">天发送消息提醒</span>
        </div>
        <div class="bottom-button">
          <van-button type="default" @click.tap="cancel">取消</van-button>
          <van-button type="default" @click.tap="confirm">确定</van-button>
        </div>
      </div>
      <van-popup v-model="showBirthdayPicker" position="bottom" close-on-popstate @closed="birthdayPickerClosed">
        <van-datetime-picker
          v-model="birthdayPickerDate"
          type="date"
          :min-date="minPickerDate"
          :max-date="maxPickerDate"
          @cancel="birthdayPickerCancel"
          @confirm="birthdayPickerConfirm">
        </van-datetime-picker>
      </van-popup>
      <van-popup v-model="showDieDayPicker" position="bottom" close-on-popstate @closed="dieDayPickerClosed">
        <van-datetime-picker
          v-model="dieDayPickerDate"
          type="date"
          :min-date="minPickerDate"
          :max-date="maxPickerDate"
          @cancel="dieDayPickerCancel"
          @confirm="dieDayPickerConfirm">
        </van-datetime-picker>
      </van-popup>
    </div>
  </transition>
</template>

<script>
  
  import {timesToDate,Link,gUuid} from '@/config/utils'

  export default {
    data(){
      return {
        show:false,
        callback:null,
        birthday:null,
        dieDay:null,
        dateType:'solar',
        dateTypeList:[{
          value:'solar',
          name:'公历'
        },{
          value:'lunar',
          name:'阴历'
        }],
        minPickerDate:'',
        maxPickerDate:'',
        birthdayPickerDate:'',
        dieDayPickerDate:'',
        showBirthdayPicker:false,
        showDieDayPicker:false,
        pushChecked:false,
        pushDays:1
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
        this.show = false;
      },
      dateText(timestamp){
        return timesToDate(timestamp,'yyyy年MM月dd日')
      },
      initMinMaxDate(){
          let now = new Date()
          this.maxPickerDate = now
          this.minPickerDate = new Date(1600,0,1)
        },
      selectBirthday(){
        this.initMinMaxDate()
        if (this.birthday){
          this.birthdayPickerDate = new Date(this.birthday)
        }else{
          this.birthdayPickerDate = new Date(1900,0,1)
        }
        this.showBirthdayPicker = true
      },
      selectDieDay(){
        this.initMinMaxDate()
        if (this.dieDay){
          this.dieDayPickerDate = new Date(this.dieDay)
        }else{
          this.dieDayPickerDate = new Date()
        }
        this.showDieDayPicker = true
      },
      birthdayPickerClosed(){
        this.showBirthdayPicker = false
      },
      dieDayPickerClosed(){
        this.showDieDayPicker = false
      },
      birthdayPickerCancel(){
        this.showBirthdayPicker = false
      },
      dieDayPickerCancel(){
        this.showDieDayPicker = false
      },
      birthdayPickerConfirm(date){
        this.birthday = date.getTime()
        this.showBirthdayPicker = false
      },
      dieDayPickerConfirm(date){
        this.dieDay = date.getTime()
        this.showDieDayPicker = false
      },
      cancel(){
        this.close()
      },
      confirm(){
        let data = {
          birthday:this.birthday,
          dieDay:this.dieDay,
          type:this.dateType
        }
        
        this.callback && this.callback(data)
        this.close()
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
  .select-date-box{
    overflow-y: auto;
    .modal();
    .item-box{
      position: relative;
      z-index: 10;
      width: 100%;
      height: 100%;
      background: #ffffff;
      display: flex;
      flex-direction: column;
      box-sizing: border-box;
      overflow-x: hidden;
      overflow-y: hidden;
      .date-type-wrapper{
        padding: 20px 16px;
        border-bottom: 1px solid #ebedf0;
      }
      .date-select-wrapper{
        .date-cell{
          padding: 18px 16px;
          &::after{
            left:0px;
            right: 0px;
            transform: scale(1);
          }
        }
      }
      .push-setting-wrapper{
        padding: 20px 16px;
        display: flex;
        align-items: center;
        border-top: 1px solid #ebedf0;
        border-bottom: 1px solid #ebedf0;
        /deep/.van-field{
          padding: 0;
          width: 40px;
          display: inline-block;
          .van-field__control{
            text-align: center;
          }
        }
      }
       .bottom-button {
        display: flex;
        justify-content: center;
        margin-top: 40px;
        .van-button{
          width: 40%;
          color: white;
          height: 40px;
          line-height: 38px;
          background-color: @MAIN_THEME_COLOR;
          &:first-child{
            color:#666666;
            background-color:white;
            margin-right: 16px;
          }
        }
      }
    }
  }
</style>
