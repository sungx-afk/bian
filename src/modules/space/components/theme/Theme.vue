<template>
  <div class="theme-container">
    <div v-for="theme in themes" :key="theme.uuid" class="theme-wrapper" @click="goSelectTheme(theme)">
      <img class="image" :src="theme.url" />
      <div class="name" :class="{'red':needRed(theme)}">
        {{theme.name}}
      </div>
      <div class="selected-wrapper" v-if="selected === theme.uuid">
        <div class="selected">
          <i class="iconfont icon-duigou1"></i>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
  import constant from '@/config/constant'
  export default {
    name: "Style",
    data(){
      return{
        selected:''
      }
    },
    computed:{
      themes(){
        return this.getThemes()
      }
    },
    methods:{
      needRed(theme){
        let result = false

        if (theme.uuid === 't37lsByGDFkTfLj6' || theme.uuid === 'MozabJlp2wvKAjAu'){
          result = true
        }

        return result
      },
      goSelectTheme(theme){
        this.selected = theme.uuid
        eventHub.$emit(constant.EVENT_SELECT_THEME,theme)
        this.$router.back()
      }
    }
  }
</script>

<style rel="stylesheet/less" lang="less" scoped>
  @import "~@/config/config.less";
  .theme-container{
    display: flex;
    flex-wrap: wrap;
    overflow-y: auto;
    .theme-wrapper{
       display: flex;
       flex-direction: column;
       align-items: center;
       padding: 12px;
      position: relative;
      .image{
        width: 100px;
        height: 120px;
      }
      .name{
        font-size: 15px;
        color: @FONT_THIRD_COLOR;
        margin-top: 4px;
        &.red{
          color:#d81e06;
        }
      }
      .selected-wrapper{
        position: absolute;
        right: 20px;
        bottom: 40px;

        .selected{
          border-radius: 50%;
          background: rgba(130,86,33,1);
          padding: 4px;
          .iconfont{
            color: @FONT_WHITE_COLOR;
          }
        }
      }
    }
  }

</style>
