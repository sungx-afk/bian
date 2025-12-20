<template>
  <div class="mortuary-create-container">
    <div class="info">
      <van-field v-model="merchant.name" label="殡仪馆名称:" placeholder="请填写殡仪馆名称" maxlength="20" input-align="right"></van-field>
      <van-field v-model="merchant.pay_api_key" label="支付API_KEY:" placeholder="请填写支付API_KEY" maxlength="50" input-align="right"></van-field>
      <van-field v-model="merchant.pay_mch_id" label="支付商户ID:" placeholder="请填写支付商户ID" maxlength="50" input-align="right"></van-field>
      <van-field v-model="merchant.service_account_app_id" label="服务号应用ID:" placeholder="请填写服务号应用ID" maxlength="50" input-align="right"></van-field>
      <van-field v-model="merchant.service_account_app_secret" label="服务号密钥:" placeholder="请填写服务号密钥" maxlength="50" input-align="right"></van-field>
      <van-field v-model="merchant.service_account_token" :label-width="110" label="服务号验证凭证:" placeholder="请填写服务号验证凭证" maxlength="50" input-align="right"></van-field>
    </div>
    <div class="bottom-button">
      <van-button type="default" size="large" @click.tap="confirm">{{merchant.id?'修改':'创建'}}</van-button>
    </div>
  </div>
</template>
<script>
  import {mapGetters,mapActions} from 'vuex';
  import {Link,gUuid} from '@/config/utils'

  import qs from 'qs'

  export default{
    data(){
      return {
        merchant:{
          id:"",
          name:"",
          pay_api_key:"74c9a26173b8e3c446b1b28d25d8d61d",//74c9a26173b8e3c446b1b28d25d8d61d
          pay_mch_id:"1336650201",//1336650201
          service_account_app_id:"wxdb43de2e1083005a",//wxdb43de2e1083005a
          service_account_app_secret:"6961f862492261225ff993c9bb7b63ec",//6961f862492261225ff993c9bb7b63ec
          service_account_token:"8KdcJI4U7Eung37IOAq1QCpzBD7uQArU",//8KdcJI4U7Eung37IOAq1QCpzBD7uQArU



        }
      }
    },
    components: {
    },
    computed:{
      ...mapGetters({
        user: 'userStore/user',
      }),
    },
    methods:{
      confirm(){
        if (!this.merchant.name) {
          this.$toast('请填写殡仪馆名称');
          return;
        }
        if (!this.merchant.pay_api_key) {
          this.$toast('请填写支付API_KEY');
          return;
        }
        if (!this.merchant.pay_mch_id) {
          this.$toast('请填写支付商户ID');
          return;
        }
        if (!this.merchant.service_account_app_id) {
          this.$toast('请填写服务号应用ID');
          return;
        }
        if (!this.merchant.service_account_app_secret) {
          this.$toast('请填写服务号密钥');
          return;
        }
        if (!this.merchant.service_account_token) {
          this.$toast('请填写服务号验证凭证');
          return;
        }
        if(this.merchant.id){
          $API.mortuary.modifyMortuary(this.merchant, rsp => {
            this.$toast({
              message:'修改成功',
              type:'success',
              duration:1500,
              onClose:()=>{
                this.$router.go(-1)
              }
            })
          }, error => {
            this.$toast('修改失败，请稍后重试')
          })
        }else{
          let params = JSON.parse(JSON.stringify(this.merchant))
          delete params.id;
          $API.mortuary.createMortuary(params, rsp => {
            this.$toast({
              message:'创建成功',
              type:'success',
              duration:1500,
              onClose:()=>{
                this.$router.go(-1)
              }
            })
          }, error => {
            this.$toast('创建失败，请稍后重试')
          })
        }



      },
      getMortuaryDetail(id){
        $API.mortuary.getMortuaryDetail({id}, rsp => {
          this.merchant = rsp;
        })
      }
    },
    created() {
      console.log(this.$route)
      if(this.$route.query.id){
        this.getMortuaryDetail(this.$route.query.id);
      }
    },
    beforeDestroy() {
    }
  }
</script>

<style rel="stylesheet/less" lang="less" scoped>
  @import "~@/config/config.less";

  .mortuary-create-container {
    width: 100%;
    height: 100%;
    box-sizing: border-box;
    background-color: #f6f6f6;
    overflow-x: hidden;
    overflow-y: auto;
    padding-bottom: 32px;

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

</style>
