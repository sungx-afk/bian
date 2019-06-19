<template>
  <li class="item">
    <template v-if="item.is_dynamics">
      <div class="dynamics"><i class="icon"></i>{{ item.create_date | timesToDate('yyyy-MM-dd HH:mm') }} {{ item.rel.creator[0].nick_name }} <span v-html="item.content"></span></div>
    </template>
    <template v-else>
      <div class="icon">
        <icon :user="item.rel.creator[0]" :size="26"></icon>
      </div>
      <div class="content">
        <div class="name">{{ item.rel.creator[0].nick_name }}</div>
        <div class="time">{{ item.create_date | timesToDate('yyyy-MM-dd HH:mm') }}  ( {{ floor }}楼 )
          <div v-if="showtype && item.type" class="comment_type">
            {{item.type | filterCommentType}}
          </div>
        </div>

        <template v-if="item.delete==1">
          <div class="summary">此评论已删除</div>
        </template>
        <template v-else>
          <div class="summary">
            <filter-detail-custom :content="item.content"></filter-detail-custom>
          </div>
          <files class="files" v-if='item.rel && item.rel.attach_file && item.rel.attach_file.length>0' :files="item.rel && item.rel.attach_file"></files>
        </template>
      </div>
      <div class="operate">
        <span class="btn" @click="deleteComment" v-if="overDue"><i class="iconfont icon-shanchu2"></i></span>
        <span class="btn" @click="replyComment" v-if="canReply"><i class="iconfont icon-iconfankui"></i></span>
      </div>

    </template>
  </li>
</template>

<script>
  import Icon from '@/modules/widget/common/UserIcon'
  import Files from '@/modules/widget/common/Files'
  import FilterDetailCustom from '@/modules/widget/common/FilterDetailCustom'//处理详情show_id  链接  双击查看图片

	export default {
    components: {
      Icon,
      Files,
      FilterDetailCustom
    },
		props: {
			item: {
				type: Object,
				default: null,
			},
			floor: {
				type: Number,
				default: 0,
			},
      reply: {
        type: Function,
        default: null
      },
      showtype:{
        type:Boolean,
        default:false
      },
      user: {
        type: Object,
        default: null,
      },
      delete:{
        type: Function,
        default: null
      }
		},
    computed:{
      overDue(){
        if(!this.delete){//没有删除功能
          return false;
        }
        if (!this.user){
          return false;
        }
        let overdue = false;
        let past = new Date().getTime() - this.item.create_date;
        let creator = this.item.rel.creator && this.item.rel.creator[0].uuid == this.user.uuid;
        if(past>1000*60*10||this.item.delete==1||!creator){
          overdue = true;
        }
        return !overdue;
      },
      canReply(){
        let result = true
        if (this.item.delete==1){
          result = false
        }
        if (!this.reply){
          result = false
        }
        return result
      }
    },
    methods: {
      replyComment(){
        this.reply(this.item.uuid)
      },
      deleteComment(){
        this.delete(this.item)
      }
    }
	}
</script>

<style rel="stylesheet/less" lang="less" scoped>
  @import "~@/config/config.less";

  .item {
    display: flex;
    padding: 13px 20px;
    .is_delete{
      font-size: 14px;
      color: #303030;
    }
    .dynamics{
      flex-grow: 1;
      font-size: 14px;
      color: #303030;
      .icon{
        display: inline-block;
        width: 16px;
        height: 16px;
        background-image: url(~@/modules/widget/images/notification.png);
        background-repeat: no-repeat;
        background-size: 100%;
        margin-bottom: -3px;
        margin-right: 5px;
      }
    }
    .icon {
      width: 26px;
      height: 26px;
      flex-shrink: 0;
      margin-top: 5px;
    }
    .content {
      flex-grow: 1;
      margin: 0 10px;
      min-width: 0;
     	& /deep/ .summary{
        word-wrap: break-word;
        word-break: break-all;
        img{
          max-width: 100%;
        }
      	&div{
          word-wrap: break-word;
          word-break: break-all;
		    	padding-left: 10px;
		    	border-left: 6px solid @BORDER_COLOR;
		    	margin-bottom: 10px;
          .rel{
            padding-left: 10px;
            border-left: 6px solid @BORDER_COLOR;
            margin-bottom: 10px;
          }
		    	h4{
		    		font-weight: normal;
		    		color: @FONT_COLOR_FOUR;
		    	}
		    	.fbui-files-list{
		    		.files-item{
		    			.files_container{
		    				.operate{
		    					display: none;
		    				}
		    				.name{
		    					line-height: 25px;
		    					.size{
			    					font-size: 10px;
			    					margin-left: 4px;
			    				}
		    				}

		    			}
		    		}
		    	}
		    }
      }
      .name {
        font-size: 13px;
        color: #aaa;
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
      }
      .time {
        font-size: 10px;
        color: #aaa;
        //line-height: 20px;
        .comment_type{
          display: inline-block;
          height: 18px;
          line-height: 18px;
          margin-left: 10px;
          box-sizing: border-box;
          padding: 0 6px;
          color: @COMMON_BLUE;
          border:1px solid @COMMON_BLUE;
        }

      }
      .summary {
        font-size: 14px;
        color: #303030;
        line-height: 25px;
      }
    }
    .operate {
      cursor: pointer;
      display: flex;
      align-items: center;
      height: 18px;
      flex-shrink: 0;
      .btn{
        color: @FONT_COLOR_FOUR;
        padding: 0 10px;
        .icon-iconfankui{
          font-size: 18px;
          font-weight: 600;
        }
      }
    }
    .files{
      margin-top: 10px;
    }
  }
</style>
