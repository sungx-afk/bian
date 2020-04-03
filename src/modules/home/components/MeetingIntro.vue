<template>
  <div class="meeting-intro-container">
    <div class="tip">
      <div>您可以在纪念馆->首页->右下角菜单 发起 云追悼会</div>
      <img src="https://static-app01.yugusoft.com/bian/meeting_guide.png">
    </div>
    <div class="list-wrapper">
      <template v-if="loaded">
        <div class="list" v-if="list.length > 0">
          <div class="label">
            您已创建的纪念馆：
          </div>
          <van-cell v-for="space in list" :key="space.id" is-link>
            <div class="space">
              <div class="name">
                {{space.name}}
              </div>
              <div class="meeting" @click.stop="goMemorialMeeting(space)">
                发起追悼会
              </div>
            </div>
          </van-cell>
        </div>
        <div class="no-data" v-else>
          您还未创建纪念馆，<span class="create" @click="createSpace">马上创建</span>
        </div>
      </template>
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
          loaded:false,
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
            this.loaded = true
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
    .tip{
      font-size: 16px;
      padding: 16px;
      display: flex;
      flex-direction: column;
      align-items: center;
      img{
        width: 256px;
      }
    }
    .list-wrapper{
      font-size: 14px;
      color: @FONT_SECOND_COLOR;
      border-top: 1px solid @BORDER_COLOR_1;
      .list{
        .label{
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
      .no-data{
        padding: 16px;
        .create{
          color: @MAIN_THEME_COLOR;
        }
      }
    }
  }

</style>
