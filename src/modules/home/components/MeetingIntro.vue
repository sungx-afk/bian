<template>
  <div class="meeting-intro-container">
    <div class="create-wrapper">
      <div class="label">
        1. 请创建纪念馆后再发起云追悼会
      </div>
      <div class='create-btn-wrapper'>
        <van-button class="btn" @click.stop="createSpace">马上创建</van-button>
      </div>

      <div class="tip">
        <div>创建完成后在 纪念馆->首页->更多菜单 发起云追悼会</div>
        <img src="https://static-app01.yugusoft.com/bian/meeting_guide.png">
      </div>
    </div>

    <div class="list-wrapper" v-if="list.length > 0">
      <div class="label">
        2. 选择已创建的纪念馆，发起云追悼会
      </div>
      <van-cell v-for="space in list" :key="space.id" is-link>
        <div class="space">
          <div class="name">
            {{space.name}}
          </div>
          <div class="meeting" @click.stop="goMemorialMeeting(space)">
            发起
          </div>
        </div>
      </van-cell>
    </div>

    <van-action-sheet
      v-model="showAction"
      :actions="actions"
      close-on-popstate
      @select="onActionSelect"
      @click-overlay="onActionClose">
    </van-action-sheet>
  </div>
</template>

<script>
  import {mapGetters,mapActions} from 'vuex';
  import {Link} from '@/config/utils'

    export default {
      name: "MeetingIntro",
      data(){
        return{
          list:[],
          showAction:false,
          actions:[],
        }
      },
      computed:{
        ...mapGetters({
          user: 'userStore/user'
        })
      },
      methods:{
        getList(){
          $API.home.getSpaceList((rsp)=>{
            this.list = rsp.filter(item=>item.creatorId === this.user.id)
          },(error)=>{
            console.log("error:",error)
          })
        },
        goMemorialMeeting(space){
          Link(`/space/meeting/${space.id}`)
        },
        createSpace(){
          this.actions = [{
            id:'kinsfolk',
            name:'为亲属创建',
          },{
            id:'friends',
            name:'为朋友/老师/同事创建',
          }]
          this.showAction = true
        },
        onActionSelect(item){
          this.showAction = false
          this.actions = []
          let menu = item.id
          let type = 0
          if (menu === 'friends'){
            type = 1
          }else if(menu === 'public'){
            type = 2
          }

          Link(`/space/create`,{type},true)
        },
        onActionClose(){
          this.showAction = false
          this.actions = []
        },
      },
      created() {
        this.getList()
      }
    }
</script>

<style rel="stylesheet/less" lang="less" scoped>
  @import "~@/config/config.less";
  .meeting-intro-container{
    height: 100%;
    display: flex;
    flex-direction: column;
    .create-wrapper{
      font-size: 14px;
      color: @FONT_SECOND_COLOR;
      .label{
        font-size: 16px;
        padding: 16px;
      }
      .create-btn-wrapper {
        display: flex;
        align-items: center;
        justify-content: center;
        .van-button{
          width: 90%;
          height: 40px;
          line-height: 38px;
          margin:0px 10px;
          &.btn{
            color: white;
            background-color: @MAIN_THEME_COLOR;
          }
        }
      }
      .tip{
        font-size: 14px;
        padding: 16px;
        display: flex;
        flex-direction: column;
        align-items: center;
        img{
          width: 256px;
        }
      }
    }

    .list-wrapper{
      font-size: 14px;
      color: @FONT_SECOND_COLOR;
      .label{
        font-size: 16px;
        padding: 16px;
      }
      .space{
        display: flex;
        align-items: center;
        .name{
          overflow:hidden;
          text-overflow:ellipsis;
          white-space:nowrap;
        }
        .meeting{
          margin-left: auto;
        }
      }
    }
  }

</style>
