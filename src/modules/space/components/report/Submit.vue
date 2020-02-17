<template>
  <div class="report-submit-wrapper">
    <div class="report-subject">
      <div class="label">
        投诉内容
      </div>
      <div class="subject">
        投诉的评论
      </div>
    </div>
    <div class="report-description">
      <van-field
        v-model="desc"
        rows="3"
        autosize
        :border="false"
        type="textarea"
        maxlength="200"
        placeholder="请输入投诉描述"
        show-word-limit
        @input="descChanged"/>
    </div>
    <div class="footer">
      <van-button class="submit" size="large" @click.stop="submit" :disabled="disabledBtn">提交</van-button>
    </div>
  </div>
</template>

<script>
    export default {
      name: "Submit",
      data(){
        return{
          desc:'',
          disabledBtn:true
        }
      },
      methods:{
        descChanged(){
          if (this.desc.length > 0){
            this.disabledBtn = false
          }else {
            this.disabledBtn = true
          }
        },
        submit(){

        }
      }
    }
</script>

<style rel="stylesheet/less" lang="less" scoped>
  @import "~@/config/config.less";

  .report-submit-wrapper{
    .report-subject{
      padding: 14px;
      .label{
        font-size: 13px;
        color: #808080;
      }
      .subject{
        color: @FONT_SECOND_COLOR;
        margin-top: 12px;
      }
    }
    .report-description{
      border-top: 1px solid @BORDER_COLOR_1;
      border-bottom: 1px solid @BORDER_COLOR_1;
    }
    .footer{
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

</style>
