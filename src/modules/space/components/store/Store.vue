<template>
  <div class="store-container">
    <div class="tip">
      彼岸云纪念意在提供一个免费在线祭奠平台供大家追思逝去的亲友，寄托哀思。
    </div>
    <div class="wanlian-area">
      <van-cell-group title="自定义挽联">
        <van-field
          v-model="wanlianLeft"
          label="上联"
          maxlength="10"
          placeholder="请输入上联"
        ></van-field>

        <van-field
          v-model="wanlianRight"
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
          <van-button size="small" class="charge-btn">充值（1元 = 100云币）</van-button>
        </van-cell>
        <van-cell>
          <span>花圈装饰（永久）</span>
          <van-button size="small" class="purchase-btn">500</van-button>
        </van-cell>
        <van-cell>
          <span>香烛长燃（1年）</span>
          <van-button size="small" class="purchase-btn">5000</van-button>
        </van-cell>
        <van-cell>
          <span>瓜果贡品（7天）</span>
          <van-button size="small" class="purchase-btn">50</van-button>
        </van-cell>
        <van-cell>
          <span>纸钱（当日）</span>
          <van-button size="small" class="purchase-btn">50</van-button>
        </van-cell>
      </van-cell-group>
    </div>
  </div>
</template>

<script>
    export default {
      name: "Store",
      data(){
        return{
          wanlianLeft:'',
          wanlianRight:'',
          remain:0
        }
      }
    }
</script>

<style rel="stylesheet/less" lang="less" scoped>
  @import "~@/config/config.less";
  .store-container{
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
