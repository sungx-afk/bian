<template>
  <div class="couplets-container">
    <div class="wanlian-area">
      <van-field
        v-model="coupletsLeft"
        label-width="50"
        label="上联"
        maxlength="15"
        placeholder="请输入上联"
      ></van-field>

      <van-field
        v-model="coupletsRight"
        label-width="50"
        label="下联"
        maxlength="15"
        placeholder="请输入下联">
      </van-field>
    </div>
    <div class="bottom-button">
      <van-button @click.stop="cancel">取消</van-button>
      <van-button class="confirm" type="default" @click.stop="confirm">确定</van-button>
    </div>
  </div>
</template>

<script>
  import constant from '@/config/constant'
  import {mapGetters} from 'vuex'

    export default {
      name: "Couplets",
      data(){
        return{
          spaceId:'',
          coupletsLeft:'',
          coupletsRight:''
        }
      },
      computed: {
        ...mapGetters({
          user: 'userStore/user',
        }),
      },
      methods:{
        getDetail(cb){
          if (!this.spaceId){
            return
          }
          $API.space.getSpaceDetail({
            sid: this.spaceId,
          }, (rsp)=>{
            if (rsp.couplets){
              this.coupletsLeft = rsp.couplets.left
              this.coupletsRight = rsp.couplets.right
            }
            cb && cb()
          }, error=>{

          })
        },
        cancel(){
          this.$router.go(-1)
        },
        confirm(){
          if (!this.coupletsLeft || !this.coupletsRight){
            this.$toast("请输入挽联内容")
            return
          }
          $API.space.modifyCouplets({
            sid:this.spaceId,
            left:this.coupletsLeft,
            right:this.coupletsRight
          },rsp=>{
            eventHub.$emit(constant.EVENT_UPDATE_COUPLETS_SUCCESS,{left:this.coupletsLeft,right:this.coupletsRight})
            this.$toast({
              message:'修改成功',
              type:'success',
              duration:1500,
              onClose:()=>{
                this.$router.go(-1)
              }
            })
          },error=>{
            this.$toast("修改失败，请稍后重试")
          })
        }
      },
      created() {
        let query = this.$route.query
        if(query){
          if (query.space_id){
            this.spaceId = query.space_id
            this.getDetail(() => {

            })
          }
        }
      }
    }
</script>

<style rel="stylesheet/less" lang="less" scoped>
  @import "~@/config/config.less";
  .couplets-container{
    background: @BG_GRAY;
    display: flex;
    flex-direction: column;
    height: 100%;
    .wanlian-area{
      background: @BG_WHITE;
      .van-cell{
        line-height: 40px;
      }
    }
    .bottom-button {
      display: flex;
      align-items: center;
      justify-content: center;
      margin-top: 20px;
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
