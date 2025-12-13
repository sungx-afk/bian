<template>
  <div class="mortuary-create-container">
    <div class="info">
      <van-field v-model="name" label="殡仪馆名称:" placeholder="请填写殡仪馆名称" maxlength="20" input-align="right"></van-field>
    </div>
    <div class="bottom-button">
      <van-button type="default" size="large" @click.tap="confirm">{{id?'修改':'创建'}}</van-button>
    </div>
  </div>
</template>
<script>
  import {mapGetters,mapActions} from 'vuex';
  import {Link,gUuid} from '@/config/utils'

  import qs from 'qs'

  export default{
    data(){
      return {
        id:"",
        name:"",
      }
    },
    components: {
    },
    computed:{
      ...mapGetters({
        user: 'userStore/user',
      }),
    },
    methods:{
      confirm(){
        if (!this.name) {
          this.$toast('请填写殡仪馆名称');
          return;
        }

      }
    },
    created() {
    },
    beforeDestroy() {
    }
  }
</script>

<style rel="stylesheet/less" lang="less" scoped>
  @import "~@/config/config.less";

  .mortuary-create-container {
    width: 100%;
    height: 100%;
    box-sizing: border-box;
    background-color: #f6f6f6;
    overflow-x: hidden;
    overflow-y: auto;
    padding-bottom: 32px;

    .bottom-button {
      display: flex;
      justify-content: center;
      margin-top: 20px;
      .van-button--large{
        width: 90%;
        color: white;
        height: 40px;
        line-height: 38px;
        background-color: @MAIN_THEME_COLOR;
      }
    }

  }

</style>
