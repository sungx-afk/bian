<template>
  <div class="list-wrapper">
    <div class="all_free">
      <span>全部免费：</span><van-switch  v-model="virtual_goods_free" @change="goSaveGoodsFree" :active-value="1" :inactive-value="0" size="20"/>
    </div>
    <div class="gift-item" v-for="item in list">
      <div class="name">{{item.name}}</div>
      <div class="content">
        <div class="price">
          <span class="label">单价：</span>
          <span v-if="virtual_goods_free">0</span>
          <input v-else type="number" @change="goChangeGift(item)" v-model="item.price"/>
        </div>
        <div class="open">
          <span class="label">开启：</span><van-switch @change="goChangeGift(item)" v-model="item.show" size="20"/>
        </div>
      </div>
    </div>

  </div>
</template>

<script>
  import {mapGetters,mapActions} from 'vuex';
  import {Link,gUuid} from '@/config/utils'
  export default{
    data(){
      return {
        list:[],
        support_id:["package-gua-guo","package-jiu-xi","package-hua-quan","package-xiang-zhu","item-zhang-min-ding","item-space-vip"],
        locked:false,
        gift_locked:false,
        virtual_goods_free:0,
      }
    },
    computed:{
      ...mapGetters({
        user: 'userStore/user',
        merchant: 'userStore/merchant',
      }),
    },
    methods:{
      getList(){
        if(this.locked){
          return false;
        }
        this.locked = true;
        $API.mortuary.getGiftList({},(rsp) => {
          let t_list = [];
          this.support_id.forEach(a => {
            let [obj] = rsp.filter(b => b.id == a);
            if(obj){
              // obj.show = true;
              t_list.push(obj);
            }
          })
          this.list = t_list;
          this.locked = false;
        },() => {
          this.locked = false;
        })
      },
      goChangeGift(item){
        console.log("goChangeGift",item)
        let param = {
          id:item.id,
          name:item.name,
          price:item.price,
          show:item.show
        }
        $API.mortuary.modifyGift(param,(rsp) => {
          // this.getList();
        })
      },
      initGoodsFree(){
        if(this.user){
          let merchant_id = this.user.merchant_id;
          if(merchant_id){
            if(this.gift_locked){
              return false;
            }
            this.gift_locked = true;
            $API.mortuary.getMortuaryDetail({id:merchant_id},(resp) => {
              this.virtual_goods_free = resp.virtual_goods_free;
              this.gift_locked = false;
            },() => {
              this.gift_locked = false;
            })
          }
        }
      },
      goSaveGoodsFree(){
        let merchant_id = this.user.merchant_id;
        if(!merchant_id){
          return false;
        }
        let params = {
          virtual_goods_free:this.virtual_goods_free,
          name:this.merchant.name,
          service_subscript_message:this.merchant.service_subscript_message,
          id:merchant_id
        }
        $API.mortuary.modifyMortuary(params, rsp => {
          this.$store.dispatch('userStore/getMerchantInfo',{id:merchant_id})
        })
      }
    },
    watch:{
      'user'(){
        this.$nextTick(() => {
          this.initGoodsFree();
        })
      }
    },
    activated(){
      this.getList();
      this.initGoodsFree();
    },
    created(){
      this.getList();
      this.initGoodsFree();
    }
  }
</script>

<style rel="stylesheet/less" lang="less" scoped>
  @import "~@/config/config.less";
  .list-wrapper{
    width:100%;
    height:100%;
    overflow: auto;
    .all_free{
      display: flex;
      align-items: center;
      padding:10px;
      border-bottom: 1px solid #f4f4f4;
    }
    .gift-item{
      font-size: 16px;
      border-bottom:1px solid #f4f4f4;
      margin-bottom: 10px;
      padding:10px;
      .name{
        font-size: 16px;
      }
      .content{
        display: flex;
        align-items: center;
        margin-top: 6px;
        .price,.open{
          flex: 1;
          display: flex;
          align-items: center;
          .label{
            display: inline-block;
            min-width: 46px;
          }
        }
      }
    }
    .new-btn{
      width:50px;
      height:50px;
      line-height:50px;
      color:#fff;
      text-align: center;
      background: @MAIN_THEME_COLOR;
      border-radius: 100%;
      position: fixed;
      bottom: 25px;
      right: 20px;
      .iconfont{
        font-size:20px;
      }
    }
  }
</style>
