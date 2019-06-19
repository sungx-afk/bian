<template>
  <!--通用任务显示组件，兼容动态和任务-->
  <div class="task-list-item" :class="{'unread':unread}" @click="viewTaskDetail">
    <div class="item-top">
      <div v-if="task.priority != 0" class="priority" :class="['priority_'+task.priority]"><i class="icon-gantanhao iconfont"></i></div>
      <!-- <div class="priority" :class="{ 'high': task.priority == 3 }" v-if="(task.type == 'BUG' && task.priority == 0 || task.priority != 0) ">[ {{task.priority | taskPriority(task.type)}} ]</div> -->
      <div class="name">
        {{task.name}}
      </div>
      <div class="right">
        <template v-if="isDynamic">
          <span v-if="task.status == 'RUNNING'" class="status">{{task.progress_percent}}%</span>
          <span v-else class="status" :class="['status_'+task.status]">{{filterStatus}}</span>
        </template>

        <span v-else class="date" :class="{'delay':isDelay}">{{task.plan_end_date | deadlineV2('MM-dd', task.status) }}</span>
      </div>
    </div>
    <div class="item-middle" v-if="isDynamic">
      {{task.summary}}
    </div>
    <div class="item-bottom">
      <div v-if="isDynamic && !showProject" class="type items"><i></i>{{filterType}}</div>
      <div v-if="task.project_id && showProject" class="project items">[ {{task.project_name}} ]</div>
      <div class="tags items" v-if="task.tags.length > 0 && showTags">
        <span class="tag" v-for="(item,index) in task.tags" v-if="index==0" :style="{'background-color':item.color}">{{item.name}}</span>
      </div>
      <div v-if="!isDynamic" class="status items" :class="['status_'+task.status]">{{filterStatus}}</div>
      <div v-if="isDynamic" class="date items">
        {{timeFormat(task.last_up_date)}}
      </div>
    </div>
  </div>
</template>
<script>
  import {timesToDate,Link} from '@/config/utils';


  export default{
    props:["task","isDynamic","setting","unread"],
    data(){
      return {
        showProject:false,
        showTags:true
      }
    },
    computed:{
      filterStatus(){
        var result = '';
        switch(this.task.status){
          case 'WAITING_AGREE': result = '待审核';break;
          case 'FINISH': result = '已完成';break;
          case 'FINISH_DELAY': result = '已完成';break;
          case 'CANCEL': result = '已取消';break;
          case 'POST_PONE': result = '已搁置';break;
        }
        return result;
      },
      filterType(){
        var result = '';
        switch(this.task.type){
          case 'TASK': result = '任务';break;
          case 'STORY': result = '需求';break;
          case 'BUG': result = '缺陷';break;
          case 'QUESTION': result = '问题';break;
          case 'GOAL': result = '目标';break;
        }
        return result;
      },
      isDelay(){
        var result = false;
        const plan_end_date = this.task.plan_end_date;
        const status = this.task.status;
        if(!plan_end_date){
          result = false;
        }
        let time = new Date().getTime();
        if(time - plan_end_date > 0 && (status == 'WAITING' || status == 'RUNNING' || status == 'WAITING_AGREE')){
          result = true;
        }
        return result;
      }
    },
    methods:{
      timeFormat(date){
        const timeagoInstance = $.timeago(timesToDate(date, 'yyyy-MM-dd HH:mm:ss'));
        return timeagoInstance
      },
      viewTaskDetail(){
        let url = '/tasks/'+this.task.uuid;
        Link(url)
        if(this.isDynamic && this.unread){
          this.$emit('signRead',this.task)
        }
      }
    },
    watch:{
      setting(){
        this.$nextTick(() => {
          this.showProject = this.setting.showProject;
          this.showTags = this.setting.showTags;
        })
      }
    },
    created(){
      if(this.setting){
        this.showProject = this.setting.showProject;
        this.showTags = this.setting.showTags;
      }

    },
  }
</script>

<style lang='less' rel="stylesheet/less" scoped >
  @import '~@/config/config.less';
  .task-list-item{
    border-bottom: 1px solid @BORDER_COLOR;
    list-style: none;
    padding: 10px 15px;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    justify-content: center;
    min-height: 72px;
    background: #fff;
    &:active{
      background-color: #ececec;
    }
    .item-top{
      display: flex;
      flex-direction: row;
      box-sizing: border-box;
      justify-content: center;
      .priority{
        flex-shrink: 0;
        font-size: 13px;
        height: 25px;
        line-height: 25px;
        font-weight: bold;
        &.high{
          color:@TASK_PRIORITY_HIGHEST;
        }
        &.priority_1{
          color:#e6a23c;
        }
        &.priority_2{
          color:#fab6b6;
        }
        &.priority_3{
          color:#f56c6c;
        }
        // &.priority_1{
        //   i{
        //     width: 12px;
        //     height: 12px;
        //     background: url(~@/modules/widget/common/images/info_pri_sm_1.png) no-repeat;
        //     display: inline-block;
        //   }
        // }
        // &.priority_2{
        //   i{
        //     width: 12px;
        //     height: 12px;
        //     background: url(~@/modules/widget/common/images/info_pri_sm_2.png) no-repeat;
        //     display: inline-block;
        //   }
        // }
        // &.priority_3{
        //   i{
        //     width: 12px;
        //     height: 12px;
        //     background: url(~@/modules/widget/common/images/info_pri_sm_3.png) no-repeat;
        //     display: inline-block;
        //   }
        // }
      }
      .name{
        flex-grow: 1;
        font-size: 16px;
        color: #000;
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
        word-wrap: break-word;
        word-break: break-all;
      }
      .right{
        flex-shrink: 0;
        .status{
          color:@FONT_COLOR_THIRD;
          font-size: 13px;
        }
        .status_WAITING_AGREE{
          color:#e6a23c;
        }
        .date{
          font-size: 13px;
          color: @FONT_COLOR_THIRD;
          &.delay{
            color:@TASK_PRIORITY_HIGHEST;
          }
        }
      }
    }

    &.unread{
      .item-top{
        .name{
          font-weight:500 !important;
        }
      }
    }
    .item-middle{
      font-size: 14px;
      color:@FONT_COLOR_THIRD;
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
      word-wrap: break-word;
      word-break: break-all;
      margin: 6px 0 0 0;
    }
    .item-bottom{
      box-sizing: border-box;
      color: #333;
      font-size: 13px;
      margin-top: 6px;
      color: @FONT_COLOR_THIRD;
      font-size: 13px;
      .items{
        float: left;
        &.type{
          height: 20px;
          line-height: 20px;
          margin-right: 10px;
          i{
            width: 4px;
            height: 12px;
            background: rgb(169, 169, 169);
            display: inline-block;
            margin-right: 4px;
            float: left;
            margin-top: 3px;
          }
        }
        &.tags{
          .tag{
            float: left;
            height: 20px;
            line-height: 20px;
            overflow: hidden;
            white-space: nowrap;
            text-overflow: ellipsis;
            text-align: center;
            padding: 0 8px;
            font-size: 12px;
            color: #fff;
            border-radius: 3px;
            max-width: 130px;
          }
        }
        &.status{
          float: right;
          &.status_WAITING_AGREE{
            color:#e6a23c;
          }
        }
        &.date{
          float: right;
          font-size: 13px;
          color:@FONT_COLOR_THIRD;
        }
      }
      
    }


  }



</style>


