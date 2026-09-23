<template>
  <div class="epitaph-container">
    <page-header title="墓志铭"></page-header>
    <div class="epitaph-area">
      <van-field
        ref="input"
        label="墓志铭:"
        v-model="epitaph"
        type="textarea"
        placeholder="请输入墓志铭"
        maxlength="120"
        rows="2"
        :autosize="{ maxHeight: 150, minHeight: 50 }">
      </van-field>

      <van-switch-cell
          title="显示墓志铭"
          active-color="#825621"
          v-model="showEpitaph"
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
  import PageHeader from '@/modules/widget/PageHeader'

    export default {
      name: "Epitaph",
      components: {
        PageHeader
      },
      data(){
        return{
          spaceId:'',
          epitaph:'',
          showEpitaph:0
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
            this.epitaph = rsp.epitaph
            this.showEpitaph = rsp.showEpitaph
            cb && cb()
          }, error=>{

          })
        },
        cancel(){
          //入口链路：祭拜页/详情页 -> 管理页(设置) -> 本页，回退 2 层跨过管理页直接返回来源页
          this.$router.go(-2)
        },
        confirm(){
          if (!this.epitaph || !this.epitaph.trim()){
            this.$toast("请输入墓志铭内容")
            return
          }
          $API.space.updateSpace({
            sid:this.spaceId,
            param:{
              epitaph:this.epitaph,
              showEpitaph:this.showEpitaph
            }
          },rsp=>{
            eventHub.$emit(constant.EVENT_UPDATE_EPITAPH_SUCCESS,{epitaph:this.epitaph,showEpitaph:this.showEpitaph})
            this.$toast({
              message:'修改成功',
              type:'success',
              duration:1500,
              onClose:()=>{
                //与 changeThemeId 一致的交互：跨过管理页直接返回祭拜页，不新增历史记录
                this.$router.go(-2)
              }
            })
          },error=>{
            this.$toast("修改失败，请稍后重试")
          })
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
  .epitaph-container{
    background: @BG_GRAY;
    display: flex;
    flex-direction: column;
    height: 100%;
    .epitaph-area{
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
