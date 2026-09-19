<template>
  <div class="couplets-container">
    <div class="wanlian-area">
      <van-field
        v-model="coupletsLeft"
        label-width="30"
        label="上联"
        maxlength="15"
        placeholder="请输入上联，最多15个字"
      ></van-field>

      <van-field
        v-model="coupletsRight"
        label-width="30"
        label="下联"
        maxlength="15"
        placeholder="请输入下联，最多15个字">
      </van-field>

      <van-switch-cell
          title="显示挽联"
          active-color="#825621"
          v-model="showCouplet"
          :active-value="1" 
          :inactive-value="0">
        </van-switch-cell>
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
          coupletsRight:'',
          showCouplet:0
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
            this.showCouplet = rsp.showCouplet
            cb && cb()
          }, error=>{

          })
        },
        cancel(){
          //入口链路：祭拜页/详情页 -> 管理页(设置) -> 本页，回退 2 层跨过管理页直接返回来源页
          this.$router.go(-2)
        },
        confirm(){
          if (!this.coupletsLeft || !this.coupletsRight){
            this.$toast("请输入挽联内容")
            return
          }
          let p1 = new Promise((resolve, reject) => {
            $API.space.modifyCouplets({
              sid:this.spaceId,
              left:this.coupletsLeft,
              right:this.coupletsRight,
              showCouplet:this.showCouplet
            },rsp=>{
              resolve()
            },error=>{
              reject(error)
            })
          })

          let p2 = new Promise((resolve, reject) => {
            $API.space.updateSpace({
              sid:this.spaceId,
              param:{
                showCouplet:this.showCouplet
              }
            },rsp=>{
              resolve()
            },error=>{
              reject(error)
            })
          })
          
          let promises = [p1,p2]
          Promise.all(promises).then(() => {
            eventHub.$emit(constant.EVENT_UPDATE_COUPLETS_SUCCESS,{left:this.coupletsLeft,right:this.coupletsRight,showCouplet:this.showCouplet})
            
            this.$toast({
              message:'修改成功',
              type:'success',
              duration:1500,
              onClose:()=>{
                //与 changeThemeId 一致的交互：跨过管理页直接返回祭拜页，不新增历史记录
                this.$router.go(-2)
              }
            })
          }).catch((error) => {
            this.$toast("修改失败，请稍后重试")
          });
        }
      },
      created() {
        if(this.$route.params.id){
          this.spaceId = this.$route.params.id
          this.getDetail(() => {

          })
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
