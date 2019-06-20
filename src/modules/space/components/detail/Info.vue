<template>
  <div class="main-container" v-if="space">
    <div class="space-area">
      <div class="space-top">
        <div class="space-name" @click.stop="goRenameSpace">
          {{space.name}}
        </div>
        <div class="operate" v-if="operate">
          <i class="setting iconfont icon-shezhi1" @click.stop="goSpaceManage"></i>
        </div>
      </div>
      <div class="create-info">
        该馆由 {{space.creator.name}} 于 {{space.createDate | timesToDate('yyyy年MM月dd日')}}创建，有{{space.visitedTimes}}人次到访
      </div>
    </div>
    <div class="avatar-area">
      <div v-for="user in space.spaceUsers" :key="user.id">
        <img v-if="user.avatarUrl" class="image" :src="user.avatarUrl" />
        <view class="tombstone" v-else>
          <image class="tombstone-image" src="~@/modules/images/tombstone.png"></image>
          <view class="tombstone-text">{{user.name}}</view>
        </view>
      </div>
    </div>
    <div class="lifetime-area">
      <div class="lifetime-content" v-for="user in space.spaceUsers" :key="user.id">
        <div class="lifetime-top">
          <div class="name">{{user.name}}</div>
          <i class="edit iconfont icon-bianji" @tap.stop="editMenu(user)"></i>
        </div>
        <div class="lifetime-bottom">
          <div class="base-info">
            <div class="date-info">
              <span>出生：{{user.birthday | timesToDate('yyyy年MM月dd日') || '未填写'}}</span>
              <span style="margin-left: 15px;">逝世：{{user.dieDay | timesToDate('yyyy年MM月dd日') || '未填写'}}</span>
            </div>
            <div class="address-info">
              出生地点：{{user.birthAddress || '未填写'}}
            </div>
            <div class="address-info">
              安葬地点：{{user.dieAddress || '未填写'}}
            </div>
          </div>
          <div class="summary-area">
            <template v-if="user.summary && user.summary.length > 0">
              <view class="title">生平介绍:</view>
              <view class="summary">
                <textarea :value="user.summary" disabled maxlength='10000' auto-height/>
              </view>
            </template>
            <template v-else>
              暂无生平介绍
            </template>
          </div>
        </div>
      </div>
    </div>
    <template v-if="showMeeting">
      <div class="memorial-meeting" @click.stop="goMemorialMeeting">
        <div class="meeting">追悼会</div>
        <template v-if="operate">
          <div class="operate" @click.stop="closeMemorialMeeting">
            <i class="close-image iconfont icon-close"></i>
          </div>
        </template>
      </div>
    </template>
    <div class="split-space"></div>
  </div>
</template>

<script>
    export default {
      name: "Main",
      props:{
        space:{
          type:Object,
          default:null
        },
        operate:{
          type:Boolean,
          default: false
        },
        showMeeting:{
          type:Boolean,
          default: false
        }
      }
    }
</script>

<style rel="stylesheet/less" lang="less" scoped>
  @import "~@/config/config.less";
  .main-container{
    height: 100%;
    .space-area{
      display: flex;
      flex-direction:column;
      background: @BG_WHITE;
      padding: 10px 15px;
      margin-bottom: 10px;
      .space-top{
        display: flex;
        align-items:center;
        .space-name{
          font-size: 20px;
          font-weight: bold;
        }
        .operate{
          display: flex;
          margin-left: auto;
          .setting{
            &.iconfont{
              font-size: 20px;
              font-weight: bold;
              color: @MAIN_THEME_COLOR;
            }
          }
        }
      }
      .create-info{
        font-size: 12px;
        color: @FONT_FOUR_COLOR;
        margin-top: 5px;
      }
    }
    .avatar-area{
      display: flex;
      justify-content:center;
      background:@BG_WHITE;
      margin:2px 0px 10px;
      padding:10px 0px;
      .image{
        width: 140px;
        height: 140px;
        margin:0 5px;
      }
      .tombstone{
        width: 140px;
        height: 140px;
        margin:0 5px;
        position: relative;
        .tombstone-image{
          width: 100%;
          height: 100%;
        }
        .tombstone-text{
          position:absolute;
          top:50px;
          left:60px;
          font-size: 14px;
          writing-mode: vertical-lr
        }
      }
    }
    .lifetime-area{
      .lifetime-content{
        display:flex;
        flex-direction:column;
        background:@BG_WHITE;
        border-bottom:1px solid @BORDER_COLOR_1;
        &:last-child{
          border-bottom:none;
        }
        .lifetime-top{
          display:flex;
          align-items: center;
          height: 40px;
          margin:0 15px;
          border-bottom:1px solid #eeeeee;
          .name{
            font-size:14px;
            font-weight:bold;
          }
          .edit{
            margin-left: auto;
          }
        }
        .lifetime-bottom{
          padding: 15px;
          font-size: 14px;
          color: @FONT_THIRD_COLOR;
          max-height: 400px;
          overflow-y: auto;
          .base-info{
            .date-info{
              padding: 5px 0px;
            }
            .address-info{
              padding: 5px 0px;
            }
          }
          .summary-area{
            margin-top: 10px;
            .title{
              margin-bottom: 10px;
            }
            .summary{

            }
          }
        }
      }
    }
    .memorial-meeting{
      display: flex;
      align-items: center;
      height:60px;
      background:@BG_WHITE;
      margin-top:10px;
      padding:0 15px;

      .meeting{
        font-size: 14px;
      }
      .operate{
        margin-left: auto;
        display:flex;
        align-items:center;
        .close-image{

        }
      }
    }
    .split-space{
      height: 10px;
      background: #f4f4f4;
    }
  }

</style>
