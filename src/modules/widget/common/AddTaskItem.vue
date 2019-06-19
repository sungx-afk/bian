<template>
  <div class="create-item-area">
    <div class="create-body">
      <div class="top">
        <textarea type="text" @keydown.enter="confirmOp" ref="itemname" placeholder="请输入子项名称，确认后连续创建"></textarea>
      </div>
      <div class="bottom">
        <div class="manager" @click.stop="goChangeManager">
          <user-icon :user="manager" :size="30"></user-icon>
        </div>
        <div class="date-area">
          <div class="icon iconfont icon-time" :class="{'active':plan_end_date}">
            <input @change="changeEndTime" class="weui-input" type="date" :value="plan_end_date | timesToDate('yyyy-MM-dd')">
          </div>
          <div class="date" v-if="plan_end_date">{{plan_end_date | timesToDate('MM-dd')}}</div>
        </div>
        <div class="btn-area">
          <mt-button class="btn" size="small" type="default" @click.native="cancelOp">取消</mt-button>
          <mt-button class="btn" size="small" type="primary" @click.native="confirmOp">确定</mt-button>
        </div>
      </div>
    </div>
    <div class="blank" @click="cancelOp"></div>
  </div>
</template>

<script>
  import UserIcon from '@/modules/widget/common/UserIcon'
  import SelectUser from '@/modules/widget/select-user'
  import {dateToTimes} from '@/config/utils'

  export default {
    name: "AddTaskItem",
    props:['confirm','cancel'],
    components:{
      UserIcon
    },
    data(){
      return{
        manager:null,
        plan_end_date:''
      }
    },
    methods:{
      goChangeManager(){
        let select = [];
        if(this.manager){
          select.push(this.manager)
        }
        SelectUser({
          multi:false,
          select:select,
          title:"选择负责人",
          callback:(data) => {
            let manager = data.length > 0?data[0]:null
            if (manager){
              this.manager = manager
            }
          }
        })
      },
      changeEndTime(e){
        const plan_end_date = dateToTimes(e.target.value + ' 23:59:59');
        this.plan_end_date = plan_end_date;
      },
      cancelOp(){
        if (this.cancel){
          this.cancel()
        }
      },
      confirmOp(){
        let data = {}
        data.manager = this.manager
        data.plan_end_date = this.plan_end_date
        data.name = this.$refs.itemname.value.trim()

        if (this.confirm){
          this.confirm(data)
        }
      },
      reset(){
        this.manager = null
        this.$refs.itemname.value = '';
        this.$refs.itemname.focus();
      }
    },
    mounted(){
      setTimeout(() => {
        this.$refs.itemname.focus();
      },500)
    }
  }
</script>

<style rel="stylesheet/less" lang="less" scoped>
  @import "~@/config/config.less";

  .create-item-area {
    display: flex;
    flex-direction: column;
    height: 100%;
    position: absolute;
    top: 0px;
    left: 0px;
    bottom: 0px;
    right: 0px;
    z-index: 2;
    .create-body{
      height: 230px;
      padding: 10px 20px 0px 20px;
      background-color: @BG_COLOR;
      flex-shrink: 0;
      .top {
        height: 190px;
        textarea {
          width: 100%;
          display: block;
          height: 180px;
          border: none;
          background-color: #fff;
          outline: none;
          border: 1px solid @BORDER_COLOR;
          border-radius: 4px;
          box-shadow: none;
          appearance: none;
          font-size: 16px;
          resize: none;
          padding: 5px;
          box-sizing: border-box;
        }
      }
      .bottom {
        height: 30px;
        display: flex;
        flex-direction: row;
        justify-content: space-between;
        align-items: center;
        .manager{
          margin-right: 20px;
          margin-top: 2px;
        }
        .date-area{
          display: flex;
          align-items: center;
          .icon{
            font-size: 30px;
            position: relative;
            input{
              position: absolute;
              left: 0;
              right: 0;
              top: 0;
              bottom:0;
              opacity: 0;
            }
            &.active{
              color: @COMMON_BLUE;
            }
          }
          .date{
            margin-left: 10px;
            color: @COMMON_BLUE;
          }
        }
        .btn-area{
          margin-left: auto;
          .btn {
            margin-right: 10px;
            flex-shrink: 0;
          }
        }
      }
    }
    .blank{
      height: 0;
      flex-grow: 1;
      background-color: rgba(0, 0, 0, 0.6);
    }
  }

</style>
