<template>
  <div class="list-wrapper">
    <div class="back-home">
      <div class="left-btn" @click="goHome">
        <van-icon name="arrow-left" /><span>返回</span>
      </div>
    </div>
    <div class="list-container">
      <template v-if="list.length > 0">
        <div class="product-item" v-for="item in list" :key="item.id">
          <div class="icon">
            <img v-if="filterImg(item)" :src="filterImg(item)"/>
            <div class="no-image" v-else></div>
          </div>
          <div class="info">
            <div class="name">{{item.name}}</div>
            <div class="price">¥{{item.price | filterMoney}}</div>
          </div>
          <div class="operate" @click.stop="goEdit(item)">
            <i class="iconfont icon-gengduo"></i>
          </div>
        </div>
      </template>
      <div v-else>
        <van-empty description="暂无商品数据" />
      </div>
    </div>



    <div class="new-btn" @click="goNewProduct">
      <i class="iconfont icon-anonymous-iconfont"></i>
    </div>

    <van-action-sheet
      v-model="showAction"
      :actions="actions"
      close-on-popstate
      close-on-click-action
      @select="onActionSelect"
      @click-overlay="onActionClose">
    </van-action-sheet>

  </div>
</template>

<script>
  import {mapGetters,mapActions} from 'vuex';
  import {Link,gUuid} from '@/config/utils'
  export default{
    data(){
      return {
        scope:"",
        list:[],
        showAction:false,
        actions:[],
        opt_obj:null,
        locked:false,
      }
    },
    computed:{
      ...mapGetters({
        user: 'userStore/user',
      }),
      showBack(){
        let result = false;
        if(this.$route && this.$route.query.opt_from && this.$route.query.opt_from == 'notice'){
          result = true;
        }
        return result;
      }
    },
    methods:{
      goNewProduct(){
        let url = '/mortuary/new_product'
        Link(url)
      },
      getList(){
        if(this.locked){
          return false;
        }
        this.locked = true;
        $API.mortuary.getProductList({},(rsp) => {
          this.list = rsp;
          this.locked = false;
        },() => {
          this.locked = false;
        })
      },
      filterImg(item){
        let url = "";
        if(item.images && item.images.length > 0){
          for(var i=0;i<item.images.length;i++){
            let obj = JSON.parse(item.images[i]);
            if(obj.url){
              url = obj.url;
              break;
            }
          }
        }
        return url;
      },
      goEdit(obj){
        console.log(obj);
        this.opt_obj = obj;
        this.actions = [{
          id:'modify',
          name:'修改',
        },{
          id:'del',
          name:'删除',
        }]
        this.showAction = true
      },
      onActionSelect(item){
        this.showAction = false
        console.log(item)
        if(this.opt_obj){
          if(item.id == 'modify'){
            Link('/mortuary/new_product?id='+this.opt_obj.id);
          }else if(item.id == 'del'){
            this.$dialog.confirm({
              title: '提示',
              message: '确定要删除吗？',
            })
            .then(() => {
              $API.mortuary.deleteProduct({sid:this.opt_obj.id}, rsp => {
                this.$toast({
                  message:'删除成功',
                  type:'success',
                  duration:1500,
                  onClose:()=>{
                    this.getList()
                  }
                })
              }, error => {
                this.$toast('操作失败，请稍后重试')
              })
            })
            .catch(() => {
              // on cancel
            });
          }
        }
      },
      onActionClose(){
        this.showAction = false
        this.actions = []
      },
      goHome(){
        if(this.showBack){
          Link('/list')
        }else{
          this.$router.go(-1)
        }
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
    width: 100%;
    height:100%;
    display: flex;
    flex-direction: column;
    background-color: #f6f6f6;
    .back-home{
      font-size: 16px;
      padding:12px 16px;
      background-color: #fff;
      border-bottom: 1px solid #ccc;
      display: flex;
      align-items: center;
      justify-content: space-between;
      .left-btn,.right-btn{
        display: flex;
        align-items: center;
      }
      .right-btn{
        font-size: 14px;
        color:#999;
      }
    }
    .list-container{
      flex-grow:1;
      height:0;
      overflow:auto;
      padding:16px;
      box-sizing: border-box;
    }
    .product-item{
      display: flex;
      padding:10px 20px;
      background: #fff;
      border-radius: 16px;
      margin-bottom: 16px;
      &:last-child{
        border-bottom: none;
      }
      .icon{
        width:70px;
        height:70px;
        flex-shrink: 0;
        border-radius: 5px;
        overflow: hidden;
        img{
          width:100%;
        }
        .no-image{
          width:100%;
          height:100%;
          background: url(~@/modules/images/no_image.png) no-repeat;
        }
      }
      .info{
        flex-grow:1;
        padding-left:10px;
        .name{
          font-size:16px;
          font-weight: 700;
        }
        .price{
          font-size: 14px;
          margin-top: 10px;
        }
      }
      .operate{
        flex-shrink: 0;
        .iconfont{
          font-weight: 700;
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
