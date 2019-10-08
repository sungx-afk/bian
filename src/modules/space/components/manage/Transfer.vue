<template>
  <div class="transfer-container">
    <div class="transfer-member-list-area" v-if="transferMember.length > 0">
      <div class="transfer-title-area">
        <div class="transfer-title">移交给亲属</div>
      </div>
      <van-list class="transfer-member-list">
        <van-cell
          v-for="item in transferMember"
          :key="item.id">
          <div class="list-item" @click.stop="transferToMember(item)">
            <div class="left-content">
              <img class="avatar" :src="item.avatarUrl" />
              <div class="title">{{item.name}}</div>
            </div>
          </div>
        </van-cell>
      </van-list>
    </div>
    <div class="transfer-copy-link">
      <div class="transfer-title" v-if="transferMember.length > 0">移交的人不在亲属里？</div>
      <span class="copy-link-tip">
        请点击复制移交链接按钮，然后直接发送给好友，好友点击链接后该纪念馆创建信息会变为该好友信息。请不要将此链接发到聊天群，以免出现多人点击的情况。（此链接48小时过期）
      </span>
      <button class="copy-link" :data-clipboard-text="copyContent" @click="copyLink">复制移交链接</button>
    </div>
  </div>
</template>

<script>
  import constant from '@/config/constant'
  import {mapGetters,mapActions} from 'vuex';

  import base64 from 'js-base64'
  import ClipboardJS from 'clipboard'

    export default {
      name: "Transfer",
      data(){
        return{
          spaceId:'',
          space:null,
          transferMember:[],
          copyContent:''
        }
      },
      computed: {
        ...mapGetters({
          user: 'userStore/user'
        }),
      },
      methods:{
        getSpaceDetail(cb){
          $API.space.getSpaceDetail({
            sid:this.spaceId
          }, rsp=>{
            this.space = rsp
            cb && cb()
          })
        },
        initTransferMembers(){
          if (this.space && this.space.config && this.space.config.friends && this.space.config.friends.length > 0){
            this.transferMember = this.space.config.friends
          }
        },
        transferToMember(item){
          let that = this
          this.$dialog.confirm({
            message: `确认移交该纪念馆?`
          }).then(() => {
            $API.space.transferSpace({
              sid:that.spaceId,
              toUserId:item.id
            }, rsp=>{
              eventHub.$emit(constant.EVENT_TRANSFER_SPACE_SUCCESS,that.spaceId)
              this.$router.go(-2)
            }, error=>{
              this.$toast('移交失败，请稍后重试')
            })
          }).catch(() => {

          })
        },
        copyLink(){
          let content = `origin_from=transfer_space&space_id=${this.spaceId}&invite_user_id=${this.user.id}&ticket=${this.space.ticket}`

          content = content + '&timestamp=' + new Date().getTime()
          content = base64.Base64.encode(content)
          content = content.replace(/\+/g, '-').replace(/\//g, '_')  // Convert '+' to '-' and '/' to '_'


          this.copyContent = `${config_server.domain}/home?copylink=${content}`

          let clipboard = new ClipboardJS('.copy-link');
          clipboard.on('success', (e)=> {
            this.$notify({
              type:'info',
              message: '已复制到剪贴板',
              color: '#ffffff',
              background: '#825621'
            });
            // 释放内存
            clipboard.destroy()
          });
          clipboard.on('error', function (e) {
            console.log(e);
          });
        }
      },
      created() {
        if(this.$route.params.id){
          this.spaceId = this.$route.params.id
          this.getSpaceDetail(()=>{
            this.initTransferMembers()
          })
        }
      }
    }
</script>

<style rel="stylesheet/less" lang="less" scoped>
  @import "~@/config/config.less";
  .transfer-container{
    height: 100%;
    background: @BG_WHITE;
    .transfer-member-list-area{
      .transfer-title-area{
        padding: 0px 20px;
      }
      .transfer-member-list{
        .list-item{
          display: flex;
          align-items: center;
          .left-content{
            display: flex;
            align-items: center;
            .avatar{
              width: 30px;
              height: 30px;
              border-radius: 15px;
            }
            .title{
              margin-left: 10px;
            }
          }
        }
      }
    }
    .transfer-copy-link{
      display: flex;
      flex-direction: column;
      padding: 20px 20px;
      .copy-link-tip{
        margin: 20px 0px;
        color: @FONT_THIRD_COLOR;
      }
      .copy-link{
        border: 1px solid #eeeeee;
        padding: 10px;
        background: white;
        &:active{
          background:#eeeeee;
        }
      }
    }
    .transfer-title{
      font-weight: bold;
      padding: 20px 0px 10px 0px;
      border-bottom: 1px solid #ebedf0;
    }
  }

</style>
