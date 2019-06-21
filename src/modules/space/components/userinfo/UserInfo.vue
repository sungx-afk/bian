<template>
  <div class="users-info" v-if="user">
    <van-field v-model="name" label="逝者姓名:" placeholder="请输入逝者姓名" maxlength="25" input-align="right"></van-field>
    <van-cell title="出生日期:" is-link :value="birthday?dateText(birthday):'未填写'" @click.stop="selectBirthday"></van-cell>
    <van-cell title="逝世日期:" is-link :value="dieDay?dateText(dieDay):'未填写'" @click.stop="selectDieDay"></van-cell>
    <van-field v-model="birthAddress" label="出生地点:" placeholder="未填写" maxlength="100" input-align="right"></van-field>
    <van-field v-model="dieAddress" label="安葬地点:" placeholder="未填写" maxlength="100" input-align="right"></van-field>

    <van-cell title="性 别:">
      <van-radio-group v-model="currentSex" class="sex-radio-group">
        <van-radio v-for="item in sexList" :key="item.value" :name="item.value" checked-color="#825621">{{item.name}}</van-radio>
      </van-radio-group>
    </van-cell>

    <van-cell title="遗 像:" is-link :value="avatarUrl?'已选择':'请选择'" @click.stop="selectAvatar"></van-cell>
    <div class="avatar-preview" v-if="avatarUrl">
      <img :src="item.avatarUrl" @click.stop="selectAvatar" />
    </div>
  </div>
</template>

<script>
  import {timesToDate} from '@/config/utils'
    export default {
      name: "UserInfo",
      props:{
        user:{
          type:Object,
          default:null
        }
      },
      data(){
        return{
          name: '',
          birthday:'',         //诞辰
          birthAddress: '',    //出生地
          dieDay: '',         //忌日
          dieAddress: '',     //安葬地点
          sex: 0,
          nation: '',         //民族
          avatarUrl: '',      //遗像地址
          sexList: [
            { name: '男', value: 0 },
            { name: '女', value: 1 }
          ],
          currentSex:0
        }
      },
      methods:{
        dateText(timestamp){
          return timesToDate(timestamp,'yyyy年MM月dd日')
        },
        selectBirthday(){

        },
        selectDieDay(){

        },
        selectAvatar(){

        }
      }
    }
</script>


<style rel="stylesheet/less" lang="less" scoped>
  @import "~@/config/config.less";

  .users-info{
    margin-bottom:10px;
    .sex-radio-group{
      display: flex;
      justify-content: flex-end;
    }
  }


</style>
