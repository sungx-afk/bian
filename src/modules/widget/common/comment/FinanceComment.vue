<template>
  <div class="comment" >
      <ul class="comment-list" v-if="count>0"
          v-infinite-scroll="loadMore"
          infinite-scroll-disabled="locked"
          infinite-scroll-distance="10">
        <item
          v-for="(item, index) in list"
          :key="item.uuid"
          :item="item"
          :floor="count - index"
          :showtype="true"></item>
      </ul>

      <div class="nodata" v-else>
         暂无评论
      </div>

  </div>
</template>

<script>
  import Item from '@/modules/widget/common/CommentItems'
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
        limit:10,
        locked: false,
      }
    },
    methods: {
      getCommentList(start){
        start = start || 0;
        let type = '';
        api.getCommentList({subjectId:this.subjectid,start,limit:this.limit,type},(data) => {

          if(start == 0){
          this.list = data.comment;
          }else{
            this.list = this.list.concat(data.comment);
          }
          
          this.count = data.total;
        })
      },

      loadMore(){
        console.log("load more")
        if(!this.locked){
          if(this.list.length < this.count){
            this.locked = true;
            setTimeout(() => {
              this.locked = false;
            },5000)
            this.getCommentList(this.list.length)
          }else{
            this.locked = false;
          }
        }

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
    flex-grow: 1;
    margin: 0 0 0 0;
    .comment-list {
       overflow: auto;
       background:#fff;
       .loading{
        text-align: center;
        padding: 6px 0;
        height: 25px;
        line-height: 25px;
        font-size: 14px;
        color: #303030;
        >span{
            display: inline-block;
            vertical-align: middle;
            margin-right: 10px;
        }
        /deep/ .mint-spinner-fading-circle{
          display: inline-block;
        }
      }
    }
    .nodata{
      height: 45px;
      line-height: 45px;
      font-size: 13px;
      text-align: center;
      color:@FONT_COLOR_FOUR;
    }
  }
</style>
