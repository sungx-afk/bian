<template>
  <div class="comment" v-if="count>0">
    <div class="weui-cells">
      <div class="weui-cell">
        <div class="weui-cell__bd">{{title || '动态'}}</div>
        <div class="weui-cell__ft"></div>
      </div>
      <div class="weui-cell">
        <ul class="comment-list">
          <item
            v-for="(item, index) in list"
            :key="item.uuid"
            :item="item"
            :floor="count - index"
            :showtype="true"></item>
        </ul>
      </div>
      <div class="weui-cell weui-cell_access" @click="goViewComment" v-if="count > limit">
        <div class="weui-cell__bd view-all">查看全部</div>
        <div class="weui-cell__ft"></div>
      </div>
    </div>
  </div>
</template>

<script>
  import Item from '@/modules/widget/common/CommentItems'
  import viewComment from '@/modules/widget/view-comment'
  import * as api from './api';

  export default {
    props:["subjectid","source","title"],
    components: {
      Item
    },
    data(){
      return {
        list:[],
        count:0,
        limit:2
      }
    },
    methods: {
      getCommentList(start){
        start = start || 0;
        let type = '';
        api.getCommentList({subjectId:this.subjectid,start,limit:this.limit,type},(data) => {
          this.list = data.comment;
          this.count = data.total;
        })
      },
      goViewComment(){
        viewComment({
          subjectid:this.subjectid,
          source:this.source
        })
      }
    },
    created(){
      this.getCommentList();
      eventHub.$on('fb-refres-comment',this.getCommentList)
    },
    beforeDestroy(){
      eventHub.$off('fb-refres-comment',this.getCommentList)
    }
  }
</script>

<style rel="stylesheet/less" lang="less" scoped>
  @import "~@/config/config.less";
  .comment {
    margin: 0 0 20px 0;
    .comment-list {
      width: 100%;
    }
    /deep/.item{
      padding: 13px 0px;
    }
    .view-all{
      font-size: 12px;
      color: @FONT_COLOR_FOUR;
    }
  }
</style>
