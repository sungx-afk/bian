<template>
  <div class="report-container">
    <van-tabs v-model="status" @change="onTabChange" color="#825621">
      <van-tab :title="item.label" v-for="item in statusList" :key="item.id" :name="item.id">
        <template v-if="status === item.id">
          <div class="report-list-container" v-bind:style="{ 'height': containerHeight + 'px' }">
            <template v-if="noData">
              <no-data></no-data>
            </template>
            <template v-else>
              <div class="report-list" ref="reportList" @scroll="listScroll">
                <van-list
                  v-model="loading"
                  :finished="finished"
                  :finished-text="finishedText"
                  @load="onLoadMoreData">
                  <van-cell
                    v-for="item in list"
                    :key="item.id"
                    is-link
                    center
                    @click.stop="goReportDetail(item)">
                    <div class="report-card">
                      <div class="cell" v-if="item.creator">
                        <span class="label">举报人:</span>
                        {{ item.creator.name }} - {{item.creator.id}}
                      </div>
                      <div class="cell">
                        <span class="label">举报类型:</span>
                        {{reportType(item)}}
                      </div>
                      <div class="cell">
                        <span class="label">举报原因:</span>
                        {{ item.reason | filterReason }}</div>
                    </div>
                  </van-cell>
                </van-list>
              </div>
            </template>
          </div>
        </template>
      </van-tab>
    </van-tabs>
  </div>
</template>

<script>
  import NoData from '@/modules/widget/space/NoData'
  import {Link} from '@/config/utils'

  export default {
    name: "ReportList",
    components:{
      NoData
    },
    data(){
      return{
        list:[],
        status:0,
        statusList:[{
          id:0,
          label:'未处理'
        },{
          id:1,
          label:'已屏蔽',
        },{
          id:-1,
          label:'已忽略'
        },{
          id:'all',
          label:'全部'
        }],
        start:0,
        limit:20,
        count:0,
        loading:false,
        finished:false,
        noData:false,
        containerHeight:0,
        scrollTop:0
      }
    },
    computed:{
      finishedText(){
        let result = ''

        if (this.list.length < 20){
          result = ''
        }else {
          result = '没有更多数据了'
        }

        return result
      },
    },
    filters:{
      filterReason(value){
        let result = ''
        let reasonList = [{
          id:'violation',
          name:'涉嫌违法违规'
        },{
          id:'porn',
          name:'色情/暴力/低俗',
        },{
          id:'defraud',
          name:'诈骗和虚假信息',
        },{
          id:'illegal',
          name:'非法言论',
        },{
          id:'private',
          name:'泄露隐私',
        },{
          id:'ads',
          name:'广告行为',
        },{
          id:'other',
          name:'其他',
        }]
        value.forEach((item,index)=>{
          let idx = reasonList.findIndex(reason=>reason.id === item)
          if (idx > -1){
            result += reasonList[idx].name
            if (index !== value.length - 1){
              result += ','
            }
          }
        })
        return result
      }
    },
    methods:{
      initContainerHeight(){
        this.containerHeight = document.body.clientHeight - 44
      },
      onTabChange(e){
        this.list = []
        this.loading = false
        this.finished = false
        this.noData = false
      },
      getList(start = 0){
        this.start = start
        let status = []
        if (this.status === 'all'){
          status = [-1,0,1]
        }else {
          status = [this.status]
        }
        $API.report.getReportList({
          start,
          limit:this.limit,
          status
        },rsp=>{
          this.loading = false
          if (start === 0){
            this.list = rsp.list
          }else{
            this.list = this.list.concat(rsp.list)
          }
          this.noData = false
          if (this.list.length === 0){
            this.noData = true
            this.finished = true
          }else if(rsp.list.length < this.limit){
            this.finished = true
          }
        },error=>{
          this.loading = false
        })
      },
      listScroll(e){
        this.scrollTop = e.currentTarget.scrollTop
      },
      onLoadMoreData(){
        if (!this.finished){
          let start = this.list.length
          this.getList(start)
        }
      },
      reportType(report){
        if (!report){
          return ''
        }
        let type = report.subjectType
        let result = ''

        switch (type) {
          case 'space':
            result = '纪念馆'
            break
          case 'comment':
            result = '评论'
            break
          case 'post':
            result = '帖子'
            break
        }

        return result
      },
      goReportDetail(report){
        localStorage.setItem('report-handle-data',JSON.stringify(report))
        Link(`/report_handle/detail`)
      },
      updateList(){
        this.getList()
      }
    },
    created() {
      this.initContainerHeight()
      eventHub.$on('report-handled',this.updateList)
    },
    activated() {
      //因为有for循环，这里refs返回的是数组
      this.$refs.reportList[0].scrollTop = this.scrollTop
    },
    beforeDestroy() {
      eventHub.$off('report-handled',this.updateList)
    }
  }
</script>

<style rel="stylesheet/less" lang="less" scoped>
  @import "~@/config/config.less";
  .report-container{
    height: 100%;
    background: @BG_WHITE;
    .report-list{
      height: 100%;
      overflow-y: scroll;
      .report-card{
        display: flex;
        flex-direction: column;
        align-items: flex-start;
      }
    }
  }

</style>
