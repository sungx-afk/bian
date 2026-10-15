<template>
  <transition name="slide-fade" v-on:after-leave="afterLeave">
    <div class="select-date-box" v-show="show">
      <div class="item-box">
        <div class="calendar-type-wrapper">
          <van-radio-group v-model="calType" class="type-radio-group" direction="horizontal">
              <van-radio v-for="item in calTypeList" :key="item.value" :name="item.value" checked-color="#825621" @click="calTypeClicked">{{ $t(item.name) }}</van-radio>
          </van-radio-group>
        </div>
        <div class="date-select-wrapper">
          <div class="date-input-wrapper">
            <label for="birthday_selector">{{ $t('出生日期：') }}</label>
              <input id="birthday_selector" class="date-input" type="text" data-toid-date="birthday_input" name="input_date" :placeholder="$t('请选择出生日期')" :data-type="calType" :data-date="birthdayDate" readonly="readonly"/></input>
              <input type="hidden" id="birthday_input" name="birthday">
          </div>
          <div class="date-input-wrapper">
            <label for="dieday_selector">{{ $t('逝世日期：') }}</label>
              <input id="dieday_selector" class="date-input" type="text" data-toid-date="dieday_input" name="input_date" :placeholder="$t('请选择逝世日期')" :data-type="calType" :data-date="dieDayDate" readonly="readonly"/></input>
              <input type="hidden" id="dieday_input" name="dieday">
          </div>
        </div>
        <div class="notify-setting-wrapper">
            <van-checkbox checked-color="#825621" shape="square" v-model="notifyChecked"></van-checkbox>
            <span class="text" style="margin-left:8px;">{{ $t('在忌日前 1 天发送提醒消息') }}</span>
        </div>
        <div class="bottom-button">
          <van-button type="default" @click.tap="cancel">{{ $t('取消') }}</van-button>
          <van-button type="default" @click.tap="confirm">{{ $t('确定') }}</van-button>
        </div>
      </div>
    </div>
  </transition>
</template>

<script>
  
  import { datePickerOptions, formatMemorialDate } from '@/i18n/dates'
  import {timesToDate,dateToTimes} from '@/config/utils'
  export default {
    data(){
      return {
        show:false,
        callback:null,
        birthday:null,
        dieDay:null,
        birthdayStr:'',
        dieDayStr:'',
        calType:0,
        calTypeList:[{
          value:0,
          name:'公历'
        },{
          value:1,
          name:'阴历'
        }],
        notifyChecked:true
      }
    },
    computed:{
      dieDayDate(){
        return this.dieDay?timesToDate(this.dieDay,'yyyy-MM-dd'):''
      },
      birthdayDate(){
        return this.birthday?timesToDate(this.birthday,'yyyy-MM-dd'):'1901-2-19'
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
      cancel(){
        this.close()
      },
      confirm(){
        let inputValue = document.getElementById('birthday_input').value
        if (inputValue){
          this.birthday = dateToTimes(inputValue)
        }
        inputValue = document.getElementById('dieday_input').value
        if (inputValue){
          this.dieDay = dateToTimes(inputValue)
        }
        let birthdayStr = document.getElementById('birthday_selector').getAttribute('data-canonical-date') || this.birthdayStr || document.getElementById('birthday_selector').value
        let dieDayStr = document.getElementById('dieday_selector').getAttribute('data-canonical-date') || this.dieDayStr || document.getElementById('dieday_selector').value
        let data = {
          calType:this.calType,
          birthday:this.birthday,
          dieDay:this.dieDay,
          birthdayStr,
          dieDayStr,
          notifyStatus:this.notifyChecked?1:0
        }
        this.callback && this.callback(data)
        this.close()
      },
      calTypeClicked(e){
        this.birthdayStr = ''
        this.dieDayStr = ''
        document.getElementById('birthday_selector').removeAttribute('data-canonical-date')
        document.getElementById('dieday_selector').removeAttribute('data-canonical-date')
        document.getElementById('birthday_input').value = ''
        document.getElementById('dieday_input').value = ''
        document.getElementById('birthday_selector').value = ''
        document.getElementById('dieday_selector').value = ''
      }
    },
    mounted() {
      this.$nextTick(() => {
        this.show = true;

        let birthdaySelector = document.getElementById('birthday_selector')
        let dieDaySelector = document.getElementById('dieday_selector')
        const birthdayCanonical = this.birthdayStr || (this.birthday ? timesToDate(this.birthday, 'yyyy年MM月dd日') : '')
        const dieDayCanonical = this.dieDayStr || (this.dieDay ? timesToDate(this.dieDay, 'yyyy年MM月dd日') : '')
        birthdaySelector.setAttribute('data-canonical-date', birthdayCanonical)
        dieDaySelector.setAttribute('data-canonical-date', dieDayCanonical)
        birthdaySelector.value = formatMemorialDate(birthdayCanonical)
        dieDaySelector.value = formatMemorialDate(dieDayCanonical)
        
        new ruiDatepicker().init('#birthday_selector','',datePickerOptions());
        new ruiDatepicker().init('#dieday_selector','',datePickerOptions());

      });
    },
    created(){
      this.calType = this.calType !== undefined && this.calType !== null? this.calType : 0
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
      .calendar-type-wrapper{
        padding: 20px 16px;
        border-bottom: 1px solid #ebedf0;
      }
      .date-select-wrapper{
        .date-input-wrapper{
          display: block;
          padding: 8px 16px;
          box-sizing: border-box;
          /* label 在上，输入框占满下方整行 */
          label { display: block; width: 100%; margin-bottom: 6px; line-height: 1.4; }
          .date-input{
            width: 100%;
            height: 48px;
          }
           border-bottom: 1px solid #ebedf0;
        }
      }
      .notify-setting-wrapper{
        padding: 20px 16px;
        display: flex;
        align-items: center;
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
