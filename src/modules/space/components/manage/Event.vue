<template>
  <div class="event-list-container">
    <template v-if="noData">
      <no-data></no-data>
    </template>
    <template v-else>
      <van-list
        v-model="loading"
        :finished="finished"
        finished-text="没有更多数据了"
        @load="onLoadMoreData">
        <van-cell
          v-for="item in list"
          :key="item.id">
          <div class="event">
            <div class="event-top" v-if="item.hasHeader">{{item.date}}</div>
            <div class="event-bottom">
              <img class="avatar" :src="item.creator && item.creator.avatarUrl || '~@/modules/images/default_header.png'" />
              <div class="middle-content">
                <div class="name">{{item.creator && item.creator.name}}</div>
                <div class="content">{{item.time}}  {{item.content}}</div>
              </div>
            </div>
          </div>
        </van-cell>
      </van-list>
    </template>
  </div>
</template>

<script>
  const LIMIT = 20
  import {timesToDate} from '@/config/utils'

  import NoData from '@/modules/widget/space/NoData'

    export default {
      name: "Event",
      props:{
        space:{
          type:Object,
          default:null,
        }
      },
      components:{
        NoData
      },
      watch:{
        'space.id'(){
          this.getSpaceEvents(0)
        }
      },
      data(){
        return{
          list:[],
          loading:false,
          finished:false,
          noData:false,
        }
      },
      methods:{
        getSpaceEvents(start){
          let that = this
          let limit = LIMIT

          if (start === undefined){
            start = 0
          }
          $API.space.getSpaceEvents({
            start,
            limit,
            sid:that.space.id
          }, rsp=>{
            this.loading = false
            let prevUserId = null
            let prevCreateDay = null
            rsp = rsp.map(item=>{
              let o = item
              if (prevUserId !== item.creator.id){
                o.hasHeader = true
              }else{
                let day = new Date(item.createDate).getDay()
                if (day !== prevCreateDay){
                  o.hasHeader = true
                }
              }

              prevUserId = item.creator.id
              prevCreateDay = new Date(item.createDate).getDay()

              let c = that.convertDateTime(item.createDate)
              o.date = c.date
              o.time = c.time
              return o
            })
            if (start === 0){
              this.list = rsp
            }else{
              this.list = this.list.concat(rsp)
            }
            if (that.list.length === 0){
              that.noData = true
              that.finished = true
            }else if(rsp.length < limit){
              that.finished = true
            }
          },error=>{
            this.loading = false
          })
        },
        convertDateTime(timestamp){
          let date = timesToDate(timestamp,'yyyy年MM月dd日')
          let time = timesToDate(timestamp,'HH:mm')
          return {date,time}
        },
        onLoadMoreData(){
          if (this.space){
            let start = this.list.length
            this.getSpaceEvents(start)
          }
        }
      }
    }
</script>

<style rel="stylesheet/less" lang="less" scoped>
  @import "~@/config/config.less";
  .event-list-container{
    height: 100%;
    .event{
      display: flex;
      flex-direction: column;
      color:@FONT_THIRD_COLOR;
      .event-top{
        height: 20px;
        text-align:left;
        padding-left: 5px;
      }
      .event-bottom{
        display: flex;
        align-items: center;
        margin-top: 10px;
        .avatar{
          width: 40px;
          height: 40px;
          border-radius: 20px;
        }
        .middle-content{
          display: flex;
          flex-direction: column;
          margin-left: 10px;
          .name{
            font-size: 16px;
            font-weight: bold;
            text-align:left;
          }
          .content{
            font-size: 12px;
          }
        }
      }
    }
  }

</style>
