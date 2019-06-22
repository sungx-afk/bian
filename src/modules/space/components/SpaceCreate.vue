<template>
  <div class="space-create-container">
    <div class="info">
      <van-cell class="type-cell">
        <van-radio-group v-model="currentType" class="type-radio-group" @change="typeChanged">
          <van-radio v-for="item in typeList" :key="item.value" :name="item.value" checked-color="#825621">{{item.name}}</van-radio>
        </van-radio-group>
      </van-cell>
      <div class="users-area" v-for="(user,index) in users" :key="index">
        <user-info :user="user"></user-info>
      </div>
    </div>
    <div class="bottom-button">
      <van-button type="default" size="large" @click.tap="create">创建</van-button>
    </div>
    <div class="agreement">
      <van-checkbox custom-class="agreement-icon" checked-color="#825621" shape="square" v-model="isAgreementChecked"></van-checkbox>
      <span class="text">我已详细阅读并同意</span>
      <span class="text" style="margin-left: 0px;color: #825621" @click.stop="readAgreement">《服务协议》</span>
    </div>
  </div>
</template>
<script>
  import {mapGetters} from 'vuex';
  import {Link} from '@/config/utils'
  import constant from '@/config/constant'

  import UserInfo from './userinfo/UserInfo'

  export default{
    data(){
      return {
        users:[{
          name: '',
          birthday:'',         //诞辰
          birthAddress: '',    //出生地
          dieDay: '',         //忌日
          dieAddress: '',     //安葬地点
          sex: 0,
          nation: '',         //民族
          avatarUrl: '',      //遗像地址
        }],
        typeList:[
          { name: '单人', value: 0},
          { name: '双人', value: 1 }
        ],
        currentType:0,
        isAgreementChecked: true  //是否选择了鱼骨协议
      }
    },
    components: {
      UserInfo
    },
    computed:{
      isIPhoneX(){
        return false
      }
    },
    methods:{
      typeChanged(type){
        this.currentType = type
        if (this.currentType == 0 && this.users.length > 1){
          this.users.splice(1,1)
        }else if(this.currentType == 1 && this.users.length <= 1){
          this.users.push({
            name: '',
            birthday:'',
            birthAddress: '',
            dieDay: '',
            dieAddress: '',
            sex: 0,
            nation: '',
            avatarUrl: '',
          })
        }
      },
      create() {
        //判断所有的dead
        let empty = false
        this.users.forEach(item=>{
          if (!item.name){
            empty = true
            return false
          }
        })
        if (empty) {
          this.$toast('请填写逝者姓名');
          return;
        }

        if (!this.isAgreementChecked) {
          this.$toast('请先阅读服务协议');
          return;
        }

        let spaceName = ''

        this.users.forEach((item,index)=>{
          spaceName += item.name
          if (index !== this.users.length - 1){
            spaceName += '和'
          }
        })
        spaceName += '的纪念馆'

        $API.space.createSpace({
            name: spaceName,
            users: this.users
          }, rsp => {
            eventHub.$emit(constant.EVENT_CREATE_SPACE_SUCCESS)
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
      },
      readAgreement(){
        Link('/agreement')
      }
    },
    created() {

    }
  }
</script>

<style rel="stylesheet/less" lang="less" scoped>
  @import "~@/config/config.less";

  .space-create-container {
    width: 100%;
    height: 100%;
    box-sizing: border-box;
    background-color: #f6f6f6;
    overflow-x: hidden;
    overflow-y: auto;

    .info {
      .type-cell{
        background-color: white;
        .type-radio-group{
          display: flex;
          width: 50%;
          height: 40px;
          justify-content: space-around;
          margin-left: 25%;
        }
      }
    }

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

    .agreement {
      display: flex;
      flex-direction: row;
      justify-content: center;
      height: 30px;
      align-items: center;
      margin-top: 20px;
      margin-bottom: 20px;

      .text {
        height: 30px;
        line-height: 30px;
        margin-left: 5px;
        text-align: center;
        font-size: 13px;
        color: #202020;
      }
    }
  }

</style>
