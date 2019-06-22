<template>
  <div class="edit-user-container">
    <template v-if="user">
      <user-info :user.sync="user"></user-info>
      <div class="bottom-button">
        <van-button @click.stop="cancel">取消</van-button>
        <van-button class="confirm" type="default" @click.stop="confirm">确定</van-button>
      </div>
    </template>
  </div>
</template>

<script>
  import constant from '@/config/constant'

  import UserInfo from './UserInfo'
    export default {
      name: "EditUserInfo",
      components:{
        UserInfo
      },
      data(){
        return{
          spaceId:'',
          user:null
        }
      },
      methods:{
        initUser(){
          let value = localStorage.getItem(constant.KEY_EDIT_USER_INFO)
          if (value){
            this.user = JSON.parse(value)
            localStorage.removeItem(constant.KEY_EDIT_USER_INFO)
          }
        },
        confirm(){
          if (!this.user){
            this.$toast("参数异常")
            return
          }
          if (!this.user.name) {
            this.$toast("请填写逝者姓名")
            return;
          }
          let user = JSON.parse(JSON.stringify(this.user))

          $API.space.updateSpaceUser({
              sid:this.spaceId,
              user:user
            }, rsp=>{
            eventHub.$emit(constant.EVENT_UPDATE_SPACE_USER_SUCCESS,this.user)
            this.$router.go(-1)
            }, error=>{
            this.$toast("修改失败，请稍后重试")
          })
        },
        cancel(){
          this.$router.go(-1)
        }
      },
      created() {
        let query = this.$route.query
        if(query){
          if (query.space_id){
            this.spaceId = query.space_id
          }
        }
        this.initUser()
      }
    }
</script>

<style rel="stylesheet/less" lang="less" scoped>
  @import "~@/config/config.less";

  .edit-user-container{

    .bottom-button {
      display: flex;
      align-items: center;
      justify-content: center;
      .van-button{
        width: 40%;
        height: 40px;
        line-height: 38px;
        margin:0px 10px;

        &.confirm{
          color: white;
          background-color: @MAIN_THEME_COLOR;
        }
      }
    }
  }

</style>
