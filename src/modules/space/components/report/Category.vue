<template>
  <div class="category-wrapper">
    <div class="category-title">
      请选择投诉原因
    </div>
    <div class="list-wrapper">
      <van-list
        :finished="true"
        finished-text="">
        <van-cell
          v-for="item in categoryList"
          :key="item.id"
          is-link
          @click="goSubmit(item)">
          <div class="category">
            {{item.name}}
          </div>
        </van-cell>
      </van-list>
    </div>

  </div>

</template>

<script>
  import {Link} from '@/config/utils'
    export default {
      name: "Category",
      data(){
        return{
          categoryList:[{
            id:'porn',
            name:'色情'
          }]
        }
      },
      methods:{
        goSubmit(){
          Link(`/report/submit`)
        }
      }
    }
</script>

<style rel="stylesheet/less" lang="less" scoped>
  @import "~@/config/config.less";

  .category-wrapper{
    display: flex;
    flex-direction: column;

    .category-title{
      height: 50px;
      line-height: 50px;
      font-size: 20px;
      text-align: center;
      padding: 20px 0px;
    }
    .list-wrapper{
      border-top:1px solid #eeeeee;
      .category{
        font-size: 16px;
      }
    }
  }

</style>
