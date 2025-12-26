<template>
  <div class="list-wrapper">
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
    .product-item{
      display: flex;
      padding:10px 20px;
      border-bottom:1px solid #f4f4f4;
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
