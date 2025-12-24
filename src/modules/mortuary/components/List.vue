<template>
  <div class="activity-list-wrapper">
    <van-cell v-for="item in list" :key="item.id" :title="item.name" clickable @click="goViewDetail(item)">
      <!-- 使用 right-icon 插槽来自定义右侧图标 -->
      <template #right-icon>
        <i class="iconfont icon-gengduo" @click.stop="goEdit(item)"></i>
      </template>
    </van-cell>

<!--    <div class="new-activity-btn" @click="goNewActivity">
      <i class="iconfont icon-anonymous-iconfont"></i>
    </div> -->


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
        list:[],
        limit:30,
        showAction:false,
        actions:[],
        opt_obj:null
      }
    },
    methods:{
      getList(start){
        start = start || 0;
        let params = {
          start,
          limit:this.limit
        }
        $API.mortuary.getMortuaryList(params, rsp => {
          this.list = rsp;
        })

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
        },{
          id:'set_manager',
          name:'设置管理员',
        }]
        this.showAction = true
      },
      onActionSelect(item){
        this.showAction = false
        console.log(item)
        if(this.opt_obj){
          if(item.id == 'modify'){
            localStorage.setItem('local_mortuary_'+this.opt_obj.id,JSON.stringify(this.opt_obj))
            Link('/mortuary/create?id='+this.opt_obj.id);
          }else if(item.id == 'del'){
            this.$dialog.confirm({
              title: '提示',
              message: '确定要删除吗？',
            })
            .then(() => {
              $API.mortuary.deleteMortuary({sid:this.opt_obj.id}, rsp => {
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
          }else if(item.id == 'set_manager'){
            Link('/mortuary/set_manager?id='+this.opt_obj.id);
          }
        }
      },
      onActionClose(){
        this.showAction = false
        this.actions = []
      },
      goViewDetail(obj){
        Link('/list?mortuary_id='+obj.id);
      }
    },
    created(){
      this.getList();
    }
  }
</script>

<style rel="stylesheet/less" lang="less" scoped>
  @import "~@/config/config.less";
  .activity-list-wrapper{

    .new-activity-btn{
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
