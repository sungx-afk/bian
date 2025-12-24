<template>
  <div class="set-manager-container">
    <div class="info">
      <template v-for="(item,index) in ids">
        <van-field v-model="item.id" label="用户id:" placeholder="请填写用户id" maxlength="20" input-align="right">
          <template #button>
              <van-button size="mini" type="danger" @click="goDel(index)">删除</van-button>
            </template>
        </van-field>
      </template>
      <div class="add-user" @click="goAdd">
        <van-icon name="plus" />添加用户
      </div>

    </div>
    <div class="bottom-button">
      <van-button type="default" size="large" @click.tap="confirm">保存</van-button>
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
        id:"",
        ids:[{
          id:""
        }],
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
      goAdd(){
        this.ids.push({
          id:""
        })
      },
      goDel(index){
        this.ids.splice(index,1)
      },
      confirm(){
        let ids = this.ids.filter(a => a.id != '');
        if(ids.length == 0){
          this.$toast('请填写用户id');
          return;
        }
        ids = ids.map(a => {return a.id});
        $API.mortuary.setManager({id:this.id,ids}, rsp => {
          this.$toast({
            message:'设置成功',
            type:'success',
            duration:1500,
            onClose:()=>{
              this.$router.go(-1)
            }
          })
        }, error => {
          this.$toast('设置失败，请稍后重试')
        })




      },
    },
    created() {
      if(this.$route.query.id){
        this.id = this.$route.query.id;
      }
    },
    beforeDestroy() {
    }
  }
</script>

<style rel="stylesheet/less" lang="less" scoped>
  @import "~@/config/config.less";

  .set-manager-container {
    width: 100%;
    height: 100%;
    box-sizing: border-box;
    background-color: #f6f6f6;
    overflow-x: hidden;
    overflow-y: auto;
    padding-bottom: 32px;

    .add-user{
      display: flex;
      align-items: center;
      padding:10px;
      background-color: #fff;
      position: relative;
      font-size: 15px;
      color:#825621;
      &:active{
        background-color: #f2f3f5;
      }
      &::after{
        position: absolute;
        box-sizing: border-box;
        content: ' ';
        pointer-events: none;
        right: 0;
        bottom: 0;
        left: 16px;
        border-bottom: 1px solid #ebedf0;
        transform: scaleY(.5);
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

  }

</style>
