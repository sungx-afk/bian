<template>
  <div class="info-container">
    <div class="tip">
      彼岸云纪念意在提供一个免费在线祭奠平台供大家追思逝去的亲友，寄托哀思。
    </div>
    <div class="wanlian-area">
      <van-cell-group title="自定义挽联">
        <van-field
          v-model="coupletsLeft"
          @blur="leftInputBlur"
          label="上联"
          maxlength="10"
          placeholder="请输入上联"
        ></van-field>

        <van-field
          v-model="coupletsRight"
          @blur="rightInputBlur"
          label="下联"
          maxlength="10"
          placeholder="请输入下联">
        </van-field>
      </van-cell-group>
    </div>
    <div class="charge-area">
      <van-cell-group title="以下为支付运营成本的部分收费服务，感谢您的支持。">
        <van-cell class="charge-cell">
          <span>账号余额：</span><span class="charge-remain">{{remain}}</span><span>云币</span>
          <van-button size="small" class="charge-btn" @click="charge">充值（1元 = 10云币）</van-button>
        </van-cell>
        <van-cell>
          <span>花圈装饰（永久）</span>
          <van-button size="small" class="purchase-btn">50</van-button>
        </van-cell>
        <van-cell>
          <span>香烛长燃（1年）</span>
          <van-button size="small" class="purchase-btn">500</van-button>
        </van-cell>
        <van-cell>
          <span>瓜果贡品（7天）</span>
          <van-button size="small" class="purchase-btn">5</van-button>
        </van-cell>
        <van-cell>
          <span>纸钱（当日）</span>
          <van-button size="small" class="purchase-btn">5</van-button>
        </van-cell>
      </van-cell-group>
    </div>
  </div>
</template>

<script>
  import {Link} from '@/config/utils'
  import {mapGetters} from 'vuex';
    export default {
      name: "Store",
      data(){
        return{
          spaceId:'',
          space:'',
          coupletsLeft:'',
          coupletsRight:'',
          remain:0
        }
      },
      computed: {
        ...mapGetters({
          user: 'userStore/user',
        }),
      },
      methods:{
        charge(){
          Link(`/store/charge`)
        },
        getDetail(cb){
          if (!this.spaceId){
            return
          }
          $API.space.getSpaceDetail({
            sid: this.spaceId,
          }, (rsp)=>{
            this.space = rsp
            if (this.space.spaceUsers && this.space.spaceUsers.length > 0 && this.space.spaceUsers[0].couplets){
              this.coupletsLeft = this.space.spaceUsers[0].couplets.left
              this.coupletsRight = this.space.spaceUsers[0].couplets.right
            }
            cb && cb()
          }, error=>{

          })
        },
        leftInputBlur(){
          this.updateCouplets()
        },
        rightInputBlur(){
          this.updateCouplets()
        },
        updateCouplets(){
          let sid = this.spaceId
          let uid = this.space.spaceUsers[0].id
          $API.space.modifyCouplets({
            sid,
            uid,
            left:this.coupletsLeft,
            right:this.coupletsRight
          },rsp=>{

          })
        }
      },
      created() {
        let query = this.$route.query
        if(query){
          if (query.space_id){
            this.spaceId = query.space_id
            this.getDetail(() => {

            })
          }
        }
      }
    }
</script>

<style rel="stylesheet/less" lang="less" scoped>
  @import "~@/config/config.less";
  .info-container{
    background: @BG_WHITE;
    .tip{
      padding: 20px 10px;
      color: #666666;
      font-size: 14px;
    }
    .wanlian-area{

    }
    .charge-area{
      margin-top: 20px;
      .charge-cell{
        padding: 20px 15px;
      }
      .van-cell__value{
        display: flex;
        align-items: center;
        .charge-remain{
          font-weight: bold;
        }
        .charge-btn{
          margin-left: auto;
        }
        .purchase-btn{
          margin-left: auto;
        }
      }
    }
  }

</style>
