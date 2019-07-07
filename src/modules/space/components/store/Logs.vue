<template>
  <div class="charge-logs-container">
    <template v-if="noData">
      <no-data></no-data>
    </template>
    <template v-else>
      <van-list
        v-model="loading"
        :finished="finished"
        finished-text="没有更多数据了"
        @load="onLoadMoreData">
        <van-cell class="list-cell"
          v-for="item in list"
          :key="item.id">
          <div class="item-content">
            <div class="item-content-left">
              {{item.createDate | timesToDate('yyyy-MM-dd HH:mm')}}
            </div>
            <div class="item-content-middle">
              <span class="summary">{{item.summary}}</span><span>{{item.change}}云币</span>
            </div>
            <div class="item-content-right">
              余额：{{item.after}}云币
            </div>
          </div>
        </van-cell>
      </van-list>
    </template>
  </div>
</template>

<script>
  const LIMIT = 20
  import NoData from '@/modules/widget/space/NoData'

    export default {
      name: "Logs",
      components:{
        NoData
      },
      data(){
        return{
          list:[],
          noData:false,
          loading:false,
          finished:false
        }
      },
      methods:{
        getLogs(start){
          let that = this
          let limit = LIMIT

          if (start === undefined){
            start = 0
          }
          $API.space.getChargeLogs({start,limit},rsp=>{
            that.loading = false
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
            that.loading = false
          })
        },
        onLoadMoreData(){
          let start = this.list.length
          this.getLogs(start)
        },
      }
    }
</script>


<style rel="stylesheet/less" lang="less" scoped>
  @import "~@/config/config.less";
  .charge-logs-container{
    .list-cell{
      .item-content{
        display: flex;
        align-items: center;
        justify-content: space-between;
        .item-content-left{

        }
        .item-content-middle{
          .summary{

          }
        }
        .item-content-right{

        }
      }
    }
  }
</style>
