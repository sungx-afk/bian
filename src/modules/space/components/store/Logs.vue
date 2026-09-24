<template>
  <div class="charge-logs-container">
    <template v-if="noData">
      <no-data></no-data>
    </template>
    <template v-else>
      <div class="log-list">
        <van-list
          v-model="loading"
          :finished="finished"
          :finished-text="finishedText"
          @load="onLoadMoreData">
          <template v-if="list && list.length > 0">
            <van-cell class="list-cell"
                      v-for="item in list"
                      :key="item.id">
              <div class="item-content">
                <div class="item-content-top">
                  <span>{{item.createDate | timesToDate('yyyy-MM-dd HH:mm')}}</span>
                  <span v-if="supportPoint">余额：{{item.after}} 云币</span>
                </div>
                <div class="item-content-bottom">
                  <span class="summary">{{item.summary}}</span>
                  <span class="change-point" v-if="supportPoint" :class="{recharge:item.type == 'RECHARGE'}">
                    <span v-if="item.type == 'CONSUME'"> -</span>
                    <span v-if="item.type == 'RECHARGE'"> +</span>
                    {{item.change}} 云币
                  </span>


                </div>
              </div>
            </van-cell>
          </template>
        </van-list>
      </div>

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
      computed:{
        // 全局开关：关闭后记录里不展示云币
        supportPoint(){
          return !!config_server.supportPoint
        },
        finishedText(){
          let result = ''

          if (this.list.length < LIMIT){
            result = ''
          }else {
            result = '没有更多数据了'
          }

          return result
        },
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
            that.noData = false
            if (that.list.length === 0){
              that.noData = true
              that.finished = true
            }else if(rsp.length < limit){
              that.finished = true
            }
          },error=>{
            that.loading = false
            that.finished = true
            that.$toast("获取列表失败，请稍后重试")
          })
        },
        onLoadMoreData(){
          if (this.finished) {
            return
          }
          let start = this.list.length
          this.getLogs(start)
        },
      }
    }
</script>


<style rel="stylesheet/less" lang="less" scoped>
  @import "~@/config/config.less";
  .charge-logs-container{
    height: 100%;
    background: @BG_WHITE;
    .log-list{
      height: 100%;
      overflow-y: scroll;
      .list-cell{
        .item-content{
          display: flex;
          flex-direction: column;
          .item-content-top{
            display: flex;
            align-items: center;
            justify-content: space-between;
            color: @FONT_SECOND_COLOR;
          }
          .item-content-bottom{
            margin-top: 10px;
            color: @FONT_THIRD_COLOR;
            display: flex;
            align-items: center;
            .change-point{
              margin-left: auto;
              &.recharge{
                color: @SECOND_THEME_COLOR;
              }
            }
          }
        }
      }
    }
  }
</style>
