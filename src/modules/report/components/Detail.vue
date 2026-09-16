<template>
  <div class="report-detail-container">
      <div class="report-type">
        <div class="label">举报类型:</div>{{report.subjectType | reportType}}
      </div>
      <div class="report-content">
        <div class="content-wrapper">
          <div class="label">举报内容:</div>
          <div class="info comment" v-if="report.subjectType === 'comment' ">
            {{report.subjectContent}}
          </div>
          <div class="info space" v-if="report.subjectType === 'space'">
            <template v-if="space">
              <div class="cell title">馆名: {{space.name}}</div>
              <div class="cell creator">创建者: {{space.creator.name}} ( {{space.creator.id}} )</div>
              <div class="cell theme" v-if="space.themeId && space.themeId === 'custom'">
                <div>自定义背景:</div>
                <van-image style="width: 100px; height: 120px; padding-right: 4px;"
                          :src="customThemeUrl"
                          fit="fill" @click="viewImage([customThemeUrl],0)">
                </van-image>
              </div>
              <div class="users-wrapper">
                <van-collapse v-model="activeUser" accordion>
                  <van-collapse-item v-for="user in space.spaceUsers" :key="user.id" :title="user.name" :name="user.id">
                    <div class="content-wrapper">
                      <div class="base-info">
                        <div class="date-info">
                          <span>出生：{{user.birthdayStr || (user.birthday | timesToDate('yyyy年MM月dd日')) || '未填写'}}</span>
                          <span style="margin-left: 15px;">逝世：{{user.dieDayStr || (user.dieDay | timesToDate('yyyy年MM月dd日')) || '未填写'}}</span>
                        </div>
                        <div class="address-info">
                          出生地：{{user.birthAddress || '未填写'}}
                        </div>
                        <div class="address-info" v-if="false">
                          安葬地：{{user.dieAddress || '未填写'}}
                        </div>
                      </div>
                      <div class="summary-area">
                        <template v-if="user.summary && user.summary.length > 0">
                          <div class="title">生平介绍:</div>
                          <div class="summary">
                            <van-field
                              v-model="user.summary"
                              type="textarea"
                              readonly
                              :autosize="{ maxHeight: 300, minHeight: 50 }">
                            </van-field>
                          </div>
                        </template>
                        <template v-else>
                          暂无生平介绍
                        </template>
                      </div>
                    </div>
                  </van-collapse-item>
                </van-collapse>
              </div>
            </template>
          </div>
          <div class="info post" v-if="report.subjectType === 'post'">
            <template v-if="issue">
              <div class="post-creator">
                <div class="name">帖子发布人: {{issue.creator.name}}</div>
              </div>
              <div class="post-content" v-if="issue.content">
                {{issue.content}}
              </div>
              <div class="post-photos" v-if="issuePhotos.length > 0">
                <van-image v-for="(url,index) in issuePhotos" :key="url"
                          style="width: 100px; height: 120px; padding-right: 4px;"
                          :src="url"
                          fit="fill"
                           @click="viewImage(issuePhotos,index)"
                ></van-image>
              </div>
              <div class='comment-list'>
                <div class='comment-area' v-for="comment in issue.recently" :key='comment.id'>
                      <span class='comment-name'>{{comment.creator && comment.creator.name}}
                        <span v-if="comment.reply" style="color: #808080;">回复</span>
                        <span class="comment-name" v-if="comment.reply">{{comment.reply.creator && comment.reply.creator.name}}</span>
                      </span>
                  :<span class='comment-content'>{{comment.content}}</span>
                </div>
              </div>
            </template>
          </div>
        </div>
        <div class="photos-wrapper">
          <div class="label">截图:</div>
          <template v-if="report.urls.length > 0">
            <div class="photos">
              <van-image v-for="(url,index) in report.urls" :key="url"
                        style="width: 100px; height: 120px;padding-right: 4px;"
                        :src="url"
                        fit="fill"
                        @click="viewImage(report.urls,index)"
              ></van-image>
            </div>
          </template>
          <template v-else>
            <div style="font-size: 13px;color: #666">未提供</div>
          </template>

        </div>
        <div class="desc-wrapper">
          <div class="label">补充说明:</div>
          <div class="desc">{{report.content || '未填写'}}</div>
        </div>
      </div>
      <div class="operate-wrapper">
        <div class="label">操作</div>
        <div class="operate">
          <van-button type="default" v-for="item in operateList" :key="item.id" @click="handleReport(item)">{{item.name}}</van-button>
        </div>
      </div>
  </div>
</template>

<script>
  import Vue from 'vue';
  import { ImagePreview } from 'vant';
  Vue.use(ImagePreview);

    export default {
      name: "Detail",
      data(){
        return{
          report:null,
          space:null,
          issue:null,
          activeUser:'',
          operateList:[]
        }
      },
      computed:{
        customThemeUrl(){
          let url = ''

          if (this.space && this.space.customThemeId){
            let theme = JSON.parse(this.space.customThemeId)
            url = theme.url
          }

          return url
        },
        issuePhotos(){
          let photos = []
          if (this.issue && this.issue.photos && this.issue.photos.length > 0){
            photos = this.issue.photos.map(item=>item.url)
          }
          return photos
        },
      },
      filters:{
        reportType(type){
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
        }
      },
      methods:{
        initData(){
          let value = localStorage.getItem('report-handle-data')
          if (value){
            this.report = JSON.parse(value)
            localStorage.removeItem('report-handle-data')
            this.initHandleOperate()
          }
        },
        initHandleOperate(){
          let report = this.report
          if (0 === report.status){
            this.operateList = [{
              id:-1,
              name:'忽略'
            },{
              id:1,
              name:'屏蔽'
            }]
          }else if(-1 === report.status){
            this.operateList = [{
              id:1,
              name:'屏蔽'
            }]
          }else if (1 === report.status){
            this.operateList = [{
              id:'-1',
              name:'恢复'
            }]
          }
        },
        handleReport(cmd){
          $API.report.handleReport({rid:this.report.id,status:cmd.id},rsp=>{
            this.$toast('操作成功')
            setTimeout(()=>{
              this.$router.back()
              eventHub.$emit('report-handled',{status:cmd.id})
            },1000)
          })
        },
        fetchSubjectData(){
          if (this.report.subjectType === 'post'){
            this.getIssueDetail()
          }else if(this.report.subjectType === 'space'){
            this.getSpaceDetail()
          }
        },
        getSpaceDetail(){
          $API.report.getSpaceDetail({sid:this.report.subjectId},rsp=>{
            this.space = rsp
            this.activeUser = this.space.spaceUsers[0].id
          })
        },
        getIssueDetail(){
          $API.report.getIssueDetail({sid:this.report.subjectContent,cid:this.report.subjectId},rsp=>{
            this.issue = rsp
            this.getCommentList(this.report.subjectId)
          })
        },
        getCommentList(subjectId){
          $API.report.getComments({
            subject_id:subjectId,
            start:0,
            limit:50
          }, rsp => {
            this.issue.recently = rsp
          }, error => {

          })
        },
        viewImage(images,index){
          ImagePreview({
            images: images,
            startPosition: index,
            onClose() {
              // do something
            }
          });
        }
      },
      created() {
        this.initData()
        this.fetchSubjectData()
      }
    }
</script>


<style rel="stylesheet/less" lang="less" scoped>
  @import "~@/config/config.less";
  .report-detail-container{
    height: 100%;
    overflow-y: auto;
    padding: 12px;
    box-sizing: border-box;
    .label{
      height: 32px;
      line-height: 32px;
      font-weight: bold;
    }
    .report-type{
      .label{
        display: inline-block;
      }
    }
    .report-content{
      .content-wrapper{
        .info{
          background: #f4f4f4;
          padding: 12px 4px;
          box-sizing: border-box;
        }
        .post{
          .post-creator{
            display: flex;
            align-items: center;
            .name{

            }
          }
          .post-content{
            margin-top: 8px;
          }
          .post-photos{
            margin-top: 8px;
          }
          .comment-list {
            padding-top:12px;
            .comment-area {
              font-size: 13px;
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
        .space{
          .cell{
            padding: 4px 0px;
          }
          .users-wrapper{
            .el-collapse-item__header{
              background: #f4f4f4;
            }
            .el-collapse-item__wrap{
              background: #f4f4f4;
            }
            .summary{
              .van-field{
                padding: 0px;
              }
            }
          }
        }
      }
      .photos-wrapper{
        .photos{
          display: flex;
          align-items: center;
        }
      }
      .desc-wrapper{
        .desc{
          font-size: 13px;
          color: @FONT_THIRD_COLOR;
        }
      }
    }
    .operate-wrapper{
      margin-bottom: 120px;
      .operate{
        .van-button{
          width: 120px;
          height: 40px;
          line-height: 38px;
          margin-right: 12px;
        }
      }
    }
  }

</style>
