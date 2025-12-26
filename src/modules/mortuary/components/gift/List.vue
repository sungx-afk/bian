<template>
  <div class="list-wrapper">
    <div class="gift-item" v-for="item in list">
      <div class="name">{{item.name}}</div>
      <div class="content">
        <div class="price">
          <span class="label">单价：</span>
          <input type="number" @change="goChangeGift(item)" v-model="item.price"/>
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
      }
    },
    computed:{
      ...mapGetters({
        user: 'userStore/user',
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
      }
    },
    activated(){
      this.getList();
    },
    created(){
      this.getList();
    }
  }
</script>

<style rel="stylesheet/less" lang="less" scoped>
  @import "~@/config/config.less";
  .list-wrapper{
    width:100%;
    height:100%;
    overflow: auto;
    .gift-item{
      font-size: 14px;
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
