<template>
  <div class='item-area' v-if="item" @click.stop="itemPressed">
    <!-- header区 -->
    <div class='issue-header' v-if="item.creator && (type !== 'PRIVATE')">
      <img class='header-avatar' :src='item.creator.avatarUrl' />
      <div class='right-content'>
        <div class='top'>
          <div class='header-info'>
            <div class='info-name'>{{item.creator.name}}</div>
          </div>
        </div>
      </div>
    </div>
    <!-- 文本内容区 -->
    <div class='issue-content' v-if='item.content'>
      <div class='content-text'>{{item.content}}</div>
    </div>
    <!-- 图片 -->
    <template v-if='item.photos && item.photos.length > 0'>
      <div class="photo-area">
        <div v-if="item.photos.length===1">
          <img class='t1-1' :src="item.photos[0].thumbnailUrl || item.photos[0].url" @click.top='imagePressed(0)' />
        </div>
        <div v-else-if="item.photos.length===2">
          <div class='t2-1-view'>
            <img class='t2-1-image1' :src='item.photos[0].thumbnailUrl || item.photos[0].url' @click.stop='imagePressed(0)' />
            <img class='t2-1-image2' :src='item.photos[1].thumbnailUrl || item.photos[1].url' @click.stop='imagePressed(1)' />
          </div>
        </div>
        <div v-else-if="item.photos.length===3">
          <div class='t3-2-view'>
            <img class='t3-2-image1' :src='item.photos[0].thumbnailUrl || item.photos[0].url' @click.stop='imagePressed(0)' />
            <div class='t3-2-right'>
              <img class='t3-2-image2' :src='item.photos[1].thumbnailUrl || item.photos[1].url' @click.stop='imagePressed(1)' />
              <img class='t3-2-image3' :src='item.photos[2].thumbnailUrl || item.photos[2].url' @click.stop='imagePressed(2)' />
            </div>
          </div>
        </div>
        <div v-else-if="item.photos.length===4">
          <div class='t4-1-view'>
            <div class='t4-1-top'>
              <img class='t4-1-image1' :src='item.photos[0].thumbnailUrl || item.photos[0].url' @click.stop='imagePressed(0)' />
              <img class='t4-1-image2' :src='item.photos[1].thumbnailUrl || item.photos[1].url' @click.stop='imagePressed(1)' />
            </div>
            <div class='t4-1-bottom'>
              <img class='t4-1-image3' :src='item.photos[2].thumbnailUrl || item.photos[2].url' @click.stop='imagePressed(2)' />
              <img class='t4-1-image4' :src='item.photos[3].thumbnailUrl || item.photos[3].url' @click.stop='imagePressed(3)' />
            </div>
          </div>
        </div>
        <div v-else-if="item.photos.length===5">
          <div class='t5-1-view'>
            <img class='t5-1-image1' :src='item.photos[0].thumbnailUrl || item.photos[0].url' @click.stop='imagePressed(0)' />
            <img class='t5-1-image2' :src='item.photos[1].thumbnailUrl || item.photos[1].url' @click.stop='imagePressed(1)' />
            <img class='t5-1-image3' :src='item.photos[2].thumbnailUrl || item.photos[2].url' @click.stop='imagePressed(2)' />
            <img class='t5-1-image4' :src='item.photos[3].thumbnailUrl || item.photos[3].url' @click.stop='imagePressed(3)' />
            <img class='t5-1-image5' :src='item.photos[4].thumbnailUrl || item.photos[4].url' @click.stop='imagePressed(4)' />
          </div>
        </div>
        <div v-else-if="item.photos.length===6">
          <div class='t6-1-view'>
            <div class='t6-1-left'>
              <img class='t6-1-image1' :src='item.photos[0].thumbnailUrl || item.photos[0].url' @click.stop='imagePressed(0)' />
              <view class='t6-1-top'>
                <img class='t6-1-image2' :src='item.photos[1].thumbnailUrl || item.photos[1].url' @click.stop='imagePressed(1)' />
                <img class='t6-1-image3' :src='item.photos[2].thumbnailUrl || item.photos[2].url' @click.stop='imagePressed(2)' />
              </view>
            </div>
            <div class='t6-1-right'>
              <img class='t6-1-image4' :src='item.photos[3].thumbnailUrl || item.photos[3].url' @click.stop='imagePressed(3)' />
              <img class='t6-1-image5' :src='item.photos[4].thumbnailUrl || item.photos[4].url' @click.stop='imagePressed(4)' />
              <img class='t6-1-image6' :src='item.photos[5].thumbnailUrl || item.photos[5].url' @click.stop='imagePressed(5)' />
            </div>
          </div>
        </div>
        <div v-else-if="item.photos.length===7">
          <div class='t7-1-view'>
            <div class='t7-1-left'>
              <img class='t7-1-image1' :src='item.photos[0].thumbnailUrl || item.photos[0].url' @click.stop='imagePressed(0)' />
              <img class='t7-1-image2' :src='item.photos[1].thumbnailUrl || item.photos[1].url' @click.stop='imagePressed(1)' />
            </div>
            <div class='t7-1-right'>
              <div class='t7-1-top'>
                <img class='t7-1-image3' :src='item.photos[2].thumbnailUrl || item.photos[2].url' @click.stop='imagePressed(2)' />
                <img class='t7-1-image4' :src='item.photos[3].thumbnailUrl || item.photos[3].url' @click.stop='imagePressed(3)' />
              </div>
              <div class='t7-1-middle'>
                <img class='t7-1-image5' :src='item.photos[4].thumbnailUrl || item.photos[4].url' @click.stop='imagePressed(4)' />
                <img class='t7-1-image6' :src='item.photos[5].thumbnailUrl || item.photos[5].url' @click.stop='imagePressed(5)' />
              </div>
              <img class='t7-1-image7' :src='item.photos[6].thumbnailUrl || item.photos[6].url' @click.stop='imagePressed(6)' />
            </div>
          </div>
        </div>
        <div v-else-if="item.photos.length===8">
          <div class='t8-1-view'>
            <div class='t8-1-left'>
              <img class='t8-1-image1' :src='item.photos[0].thumbnailUrl || item.photos[0].url' @click.stop='imagePressed(0)' />
              <img class='t8-1-image2' :src='item.photos[1].thumbnailUrl || item.photos[1].url' @click.stop='imagePressed(1)' />
              <img class='t8-1-image3' :src='item.photos[2].thumbnailUrl || item.photos[2].url' @click.stop='imagePressed(2)' />
            </div>
            <div class='t8-1-middle'>
              <img class='t8-1-image4' :src='item.photos[3].thumbnailUrl || item.photos[3].url' @click.stop='imagePressed(3)' />
              <img class='t8-1-image5' :src='item.photos[4].thumbnailUrl || item.photos[4].url' @click.stop='imagePressed(4)' />
            </div>
            <div class='t8-1-right'>
              <img class='t8-1-image6' :src='item.photos[5].thumbnailUrl || item.photos[5].url' @click.stop='imagePressed(5)' />
              <img class='t8-1-image7' :src='item.photos[6].thumbnailUrl || item.photos[6].url' @click.stop='imagePressed(6)' />
              <img class='t8-1-image8' :src='item.photos[7].thumbnailUrl || item.photos[7].url' @click.stop='imagePressed(7)' />
            </div>
          </div>
        </div>
        <div v-else-if="item.photos.length===9">
          <div class='t9-1-view'>
            <div class='t9-1' v-for="(photo,index) in item.photos" :key='photo.url'  @click.stop='imagePressed(index)'>
              <img class='t9-1-image' :src='photo.thumbnailUrl || photo.url' />
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- 视频 -->
    <template v-if='item.video && item.video.length > 0'>
      <div class='issue-video' @click='playVideo'>
        <img class='video-thumbnail' :src='item.video[0].thumbnailUrl' />
        <img class='video-play-image' src='~@/modules/images/icon_play_btn.png' />
      </div>
    </template>

    <!-- 评论区 -->
    <div class='issue-comment'>
      <!-- 评论操作按钮区 -->
      <div class='operate-area'>
        <span class='date' v-if="item.createDate">{{item.createDate | timeAgo}}</span>
        <template v-if="canComment">
          <i class="comment-reply iconfont icon-pinglun1" @click.stop='postCommentEvent'></i>
        </template>
        <template v-if="canOperate">
          <i class="comment-more iconfont icon-gengduo" @click.stop="clickOperateMenu"></i>
        </template>
      </div>
      <div class='inter-area' v-if=' item.recently && item.recently.length > 0'>
        <!-- 评论列表 -->
        <div class='comment-list' v-for="comment in item.recently" :key='comment.id'>
          <div class='comment-area' @click.stop="commentPressed(comment)">
            <span class='comment-name'>{{comment.creator && comment.creator.name}}
              <span v-if="comment.reply" style="color: #808080;">回复</span>
              <span class="comment-name" v-if="comment.reply">{{comment.reply.creator && comment.reply.creator.name}}</span>
            </span>:
            <span class='comment-content'>{{comment.content}}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
    export default {
      name: "IssueItem",
      props:{
        item:{
          type:Object,
          default:null
        },
        type:{
          type: String,
          default: ''
        },
        canOperate:{
          type: Boolean,
          default: false
        },
        canComment:{
          type: Boolean,
          default: false
        }
      },
      methods:{
        clickOperateMenu(e){
          this.$emit('click-menu',this.item)
        },
        itemPressed(){
          this.$emit('click-item',this.item)
        },
        imagePressed(index){
          this.$emit('click-image',index,this.item)
        },
        postCommentEvent(e){
          this.$emit('comment',this.item)
        },
        commentPressed(comment){
          this.$emit('comment-reply',{issue:this.item,comment:comment})
        }
      }
    }
</script>

<style rel="stylesheet/less" lang="less" scoped>
  @import "~@/config/config.less";
  .item-area{
    background:@BG_WHITE;
    .issue-header {
      height: 46px;
      display:flex;
      margin:10px 0px;
      align-items:center;
      position: relative;
      .header-avatar {
        width:35px;
        height:35px;
        border-radius:17px;
        flex-shrink:0;
      }
      .right-content{
        display:flex;
        flex-direction:column;
        width:100%;
        .top{
          display:flex;
          .header-info
          {
            display:flex;
            align-items:center;
            align-self:flex-start;
            margin-left:10px;
            margin-top:5px;
            .info-name {
              color:@FONT_SECOND_COLOR;
              font-size:14px;
            }
          }
        }
      }
    }
    .issue-content {
      color:@FONT_SECOND_COLOR;
      font-size:16px;
      height:100%;
      margin: 5px 0px;
      word-wrap:break-word;
    }
    .issue-video {
      width: 100%;
      height:240px;
      box-sizing: border-box;
      background-color:black;
      .video-thumbnail {
        width:100%;
        height:100%;
      }
      .video-play-image {
        position:relative;
        left:50%;
        top:-50%;
        margin-left:-25px;
        margin-top:-25px;
        width:50px;
        height:50px;
      }
    }
    /* 评论区 */
    .issue-comment {
      width: 100%;
      margin-top:5px;
      display:flex;
      flex-direction:column;
      .operate-area {
        height:30px;
        display:flex;
        position: relative;
        align-items:center;
        .date {
          color:#aaaaaa;
          font-size:11px;
        }
        .comment-reply {
          padding:14px 10px 10px 10px;
          margin-left:auto;
        }
        .comment-more {
          width: 18px;
          height: 18px;
          padding:10px;
        }
      }
      .inter-area{
        padding:10px;
        background-color:@BG_GRAY;
        .comment-list {
          padding-top:5px;
          .comment-area {
            font-size: 14px;
            width: 100%;
            .comment-name {
              color: @FONT_THIRD_COLOR;
            }
            .comment-content {
              margin-left: 2px;
              color: #808080;
            }
          }
          .comment-more{
            font-size:12px;
            color:#30a5ff;
            margin-top:5px;
          }
        }
      }
    }
    .t1-1 {
      width: 100%;
      max-height: 200px;
      object-fit: cover;
      display: flex;
    }

    /* t2 */
    .t2-1-view {
      display:flex;
      .t2-1-image1 {
        width:50%;
        height:150px;
        margin-right: 3px;
        object-fit: cover;
      }
      .t2-1-image2 {
        width:50%;
        height:150px;
        margin-left:3px;
        object-fit: cover;
      }
    }

    .t3-2-view {
      width:100%;
      display:flex;
      .t3-2-image1 {
        width:54%;
        height:340px;
        object-fit: cover;
      }
      .t3-2-right {
        width:46%;
        height:340px;
        margin-left:6px;
      }
      .t3-2-image2 {
        width:100%;
        height:120px;
        object-fit: cover;
      }
      .t3-2-image3 {
        width:100%;
        height:220px;
        object-fit: cover;
      }
    }

    /* t4-1 */
    .t4-1-view {
      .t4-1-top {
        display: flex;
        .t4-1-image1 {
          width: 50%;
          height: 175px;
          margin-right:3px;
          object-fit: cover;
        }
        .t4-1-image2 {
          width: 50%;
          height: 175px;
          margin-left:3px;
          object-fit: cover;
        }
      }
      .t4-1-bottom {
        display: flex;
        margin-top: 6px;
        .t4-1-image3 {
          width: 50%;
          height: 175px;
          margin-right:3px;
          object-fit: cover;
        }

        .t4-1-image4 {
          width: 50%;
          height: 175px;
          margin-left:3px;
          object-fit: cover;
        }
      }
    }

    /* t5-1 */
    .t5-1-view {
      height:350px;
      .t5-1-image1 {
        width:122px;
        height:230px;
        position:relative;
        object-fit: cover;
      }
      .t5-1-image2 {
        left:6px;
        width:250px;
        bottom:122px;
        height:107px;
        position:relative;
        object-fit: cover;
      }

      .t5-1-image3 {
        top:-235px;
        left:128px;
        width:117px;
        height:117px;
        position:relative;
        object-fit: cover;
      }

      .t5-1-image4 {
        top:-121px;
        left:125px;
        width:125px;
        height:230px;
        position:relative;
        object-fit: cover;
      }

      .t5-1-image5 {
        top:-235px;
        width:246px;
        height:107px;
        position:relative;
        object-fit: cover;
      }
    }

    /* t6-1 */
    .t6-1-view {
      display:flex;
      .t6-1-left {
        width:70%;
        margin-right:3px;
        .t6-1-image1 {
          width:100%;
          height:242px;
          object-fit: cover;
        }
        .t6-1-top {
          height:110px;
          .t6-1-image2 {
            width:45%;
            height:110px;
            margin-right:3px;
            object-fit: cover;
          }

          .t6-1-image3 {
            width:52.4%;
            height:110px;
            margin-left:3px;
            object-fit: cover;
          }
        }

      }
      .t6-1-right {
        width:30%;
        margin-left:3px;
        .t6-1-image4 {
          width: 100%;
          height: 110px;
          object-fit: cover;
        }

        .t6-1-image5 {
          width: 100%;
          height: 126px;
          object-fit: cover;
        }

        .t6-1-image6 {
          width: 100%;
          height: 110px;
          object-fit: cover;
        }
      }
    }


    /* t7-1 */
    .t7-1-view
    {
      display:flex;
      height:345px;
      .t7-1-left {
        width:50%;
        margin-right:3px;
        .t7-1-image1 {
          width:100%;
          height:200px;
          object-fit: cover;
        }

        .t7-1-image2 {
          width:100%;
          height:137px;
          object-fit: cover;
        }
      }
      .t7-1-right {
        width:50%;
        margin-left:3px;
        .t7-1-top {
          display: flex;
          height:110px;
          margin-bottom:6px;
          .t7-1-image3 {
            width:50%;
            height:110px;
            margin-right:6px;
            object-fit: cover;
          }

          .t7-1-image4 {
            width: 50%;
            height: 110px;
            object-fit: cover;
          }
        }
        .t7-1-middle {
          display: flex;
          height:110px;
          margin-bottom:6px;
          .t7-1-image5 {
            width: 50%;
            height: 110px;
            margin-right:6px;
            object-fit: cover;
          }

          .t7-1-image6 {
            width: 50%;
            height: 110px;
            object-fit: cover;
          }
        }
        .t7-1-image7 {
          width: 100%;
          height: 111px;
          object-fit: cover;
        }
      }
    }

    /* t8-1 */
    .t8-1-view {
      display:flex;
      .t8-1-left {
        width: 30%;
        margin-right:6px;
        .t8-1-image1 {
          width:100%;
          height:110px;
          object-fit: cover;
        }

        .t8-1-image2 {
          width:100%;
          height:118px;
          object-fit: cover;
        }

        .t8-1-image3 {
          width:100%;
          height:110px;
          object-fit: cover;
        }
      }

      .t8-1-middle {
        width: 37%;
        margin-right:6px;
        .t8-1-image4 {
          width: 100%;
          height: 172px;
          object-fit: cover;
        }

        .t8-1-image5 {
          width:100%;
          height:172px;
          object-fit: cover;
        }
      }

      .t8-1-right {
        width: 30%;
        .t8-1-image6 {
          width:100%;
          height:110px;
          object-fit: cover;
        }

        .t8-1-image7 {
          width:100%;
          height:118px;
          object-fit: cover;
        }

        .t8-1-image8 {
          width:100%;
          height:110px;
          object-fit: cover;
        }
      }
    }

    /* t9 */
    .t9-1-view
    {
      display:flex;
      width:100%;
      height:350px;
      flex-wrap:wrap;
      justify-content:space-between;
      align-content:space-between;
      .t9-1 {
        width:32%;
        height:112px;
        position: static;
        .t9-1-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
      }
    }
  }
</style>
