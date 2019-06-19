<template>
  <div class="container">
    <div class="process-item creator">
      <template v-if="base.rel && base.rel.creator">
        <div v-if="base.rel.creator[0].ico" class="img-box"><img :src="base.rel.creator[0].ico" /></div>
        <div v-if="!base.rel.creator[0].ico"><div class="name-img">{{ base.rel.creator[0].nick_name.slice(-1) }}</div></div>
        <div class="name-str">{{ base.rel.creator[0].nick_name.substring(0,3) }}</div>
        <div>发起人</div>
      </template>
    </div>
    <template v-if="workflow.v == 2">
      <div class="process-item capproval" v-for="(s, i) in workflow.steps" :key="i" :class="{'tag-group': s.split.charges[0].type == 'multi'}">
          <template v-if="s.split.charges[0].type == 'multi'">
  <!--           <div class="tit" v-if="s.split.charges[0].limit == 1">会审（单一）</div>
            <div class="tit" v-else>会审（全部）</div> -->
            <div class="multi-item" v-for="(u, j) in s.split.charges[0].users" :key="j">
              <div v-if="u.ico" class="img-box"><img :src="u.ico" /></div>
              <div v-if="!u.ico"><div class="name-img">{{ u.nick_name.slice(-1) }}</div></div>
              <div class="name-str">{{ u.nick_name.substring(0,3) }}</div>
              <div class="name">
                 <i class="iconfont icon-yishenpi" style="color: #67C23A" v-if="u.status == 1"></i>
                 <i class="iconfont icon-CombinedShape" style="color:#BFBFBF" v-if="u.status == -1"></i>
                 <i class="iconfont icon-bohui" style="color: #EA9518" v-if="u.status == 0"></i>
                 <i class="iconfont icon-dengdai" style="color:#BFBFBF" v-if="u.status == 2"></i>
              </div>
            </div>
          </template>

          <template v-else>
            <div v-if="s.split.charges[0].user.ico" class="img-box"><img :src="s.split.charges[0].user.ico" /></div>
            <div v-if="!s.split.charges[0].user.ico"><div class="name-img">{{ s.split.charges[0].user.nick_name.slice(-1) }}</div></div>
            <div class="name-str">{{ s.split.charges[0].user.nick_name.substring(0,3) }}</div>
            <div class="name">
               <i class="iconfont icon-yishenpi" style="color: #67C23A" v-if="s.split.charges[0].user.status == 1"></i>
               <i class="iconfont icon-CombinedShape" style="color:#BFBFBF" v-if="s.split.charges[0].user.status == -1"></i>
               <i class="iconfont icon-bohui" style="color: #EA9518" v-if="s.split.charges[0].user.status == 0"></i>
            </div>
          </template>
      </div>
    </template>
    <template v-else>
      <div class="process-item capproval" v-for="(s, i) in workflow.steps" :key="i">
          <div v-if="s.charges[0].ico" class="img-box"><img :src="s.charges[0].ico" /></div>
          <div v-if="!s.charges[0].ico"><div class="name-img">{{ s.charges[0].user_name.slice(-1) }}</div></div>
          <div class="name-str">{{ s.charges[0].user_name.substring(0,3) }}</div>
          <div class="name">
             <i class="iconfont icon-yishenpi" style="color: #67C23A" v-if="s.charges[0].status == 1"></i>
             <i class="iconfont icon-CombinedShape" style="color:#BFBFBF" v-if="s.charges[0].status == -1"></i>
             <i class="iconfont icon-bohui" style="color: #EA9518" v-if="s.charges[0].status == 0"></i>
          </div>
      </div>
    </template>
  </div>
</template>

<script>

  export default {
    props: {
      workflow: {
        type: Object,
        default: null,
      },
      base: {
        type: Object,
        default: null,
      }
    },

    data(){
      return {

      }
    },

    computed: {

    },

    watch: {
      'workflow'(){
        console.log('watch-workflow: ',this.workflow)
      },

      'base'(){
        console.log('watch-base: ',this.base)
      },
    },

    methods: {

    },

    created(){
        console.log('workflow: ',this.workflow)
    },

    mounted(){

    },

    beforeDestroy(){

    }
  }
</script>

<style rel="stylesheet/less" lang="less" scoped>
  @import "~@/config/config.less";

  .container{
      width: 100%;
      display: flex;
      flex-direction: row;
      overflow-x: scroll;
      .process-item{
          padding: 8px 0px 4px 0px;
          line-height: 2;
          text-align: center;
          background-color: transparent;
          color: #333;
          margin-right: 25px;
          font-size: 12px;
          position: relative;
          div.img-box{
            width: 36px;
            height: 36px;
          }
          div.name-img{
            font-style: normal;
            width: 36px;
            height: 36px;
            line-height: 36px;
            border-radius: 50%;
            background: #ff746f;
            font-size: 20px;
            color: #fff;
          }
          div.name-str{
            margin-top: 5px;
          }
          img{
            width: 36px;
            height: 36px;
            border-radius: 50%;
          }
          div.name{
            .iconfont{
               font-size: 14px;
            }
          }
          &:after{
            position: absolute;
            top: 45%;
            right: -20px;
            display: inline-block;
            content: '';
            width: 14px;
            height: 1px;
            border-top: 1px dashed #aaa;
          }
          &:nth-last-child(1){
            &:after{
              display: none;
            }
          }
      }
      div.tag-group{
        display: flex;
        flex-direction: row;
        .multi-item{
          margin-right: 2px;
          &:nth-last-child(1){
            margin-right: 0px;
          }
        }

        // strong.tit{
        //   position: absolute;
        //   top: 0px;
        //   width: 100%;
        //   text-align: center;
        //   font-style: normal;
        //   font-weight: normal;
        //   font-size: 12px;
        // }
      }
  }

</style>
