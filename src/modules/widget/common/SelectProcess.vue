<template>
  <div class="container">
      <div class="line"></div>
      <div class="weui-cell" @click="">
      <div class="weui-cell__bd">
        <p><span class="must_fill">* </span>审批流程</p>
      </div>
      <div class="weui-cell__ft">
        <div class="process-radio" v-if="isProcessCanChange">
          <input type="radio" id="default" value="default" v-model="processType" v-if="processes.length > 0">
          <label for="default" v-if="processes.length > 0" class="label">{{processes[0].name}}</label>
          &nbsp &nbsp &nbsp
          <input type="radio" id="custom" value="custom" v-model="processType">
          <label for="custom">自定义</label>
        </div>
        <template v-else>
           {{processName()}}
        </template>
      </div>
    </div>
    <div class="process-detail">
      <div class="loading" v-if="loadingProcessDetail">
        <mt-spinner type="fading-circle"></mt-spinner>加载中...
      </div>
        <div class="item-custom" v-if="form.process == '0'">
          <div class="el-tag">
            <span>发起人</span><br />
            <template v-if="user.ico"><img :src="user.ico" /><br /></template>
            <template v-if="!user.ico"><i class="name">{{ user.nick_name.slice(-1) }}</i><br /></template>
            <span>{{ user.nick_name }}</span>
          </div>

          <div class="el-tag" v-for="(s, i) in customProcess.steps" :key="i">
            <span>审批人</span><br />
            <strong v-if="s.splits[0].charges[0].user.ico" @click="removeStep(i)">
              <img :src="s.splits[0].charges[0].user.ico"/>
              <!-- <i @click="removeStep(i)" class="el-icon el-icon-delete"></i> -->
              <br />
            </strong>
            <strong v-if="!s.splits[0].charges[0].user.ico" @click="removeStep(i)">
              <i class="name">{{ s.splits[0].charges[0].user.nick_name ? s.splits[0].charges[0].user.nick_name.slice(-1) : '' }}</i>
              <!-- <i @click="removeStep(i)" class="el-icon el-icon-delete"></i> -->
              <br />
            </strong>
            <span>{{ s.splits[0].charges[0].user.nick_name }}</span>
          </div>

          <div class="el-tag">
            <span>审批人</span><br />
            <i @click="newStep" class="iconfont icon-anonymous-iconfont" style="background-color:#ddd; cursor:pointer;"></i><br />
            <span>添加</span>
          </div>
        </div>

        <div class="item-process" v-if="form.process && form.process !== '0'">
          <p v-for="(s, i) in processSteps" :key="i" :class="{'tag-group': s.split.charges[0].type == 'multi'}">
            <template v-if="s.split.charges[0].type == 'multi'">
              <strong class="tit" v-if="s.split.charges[0].limit == 1">会审（单一）</strong>
              <strong class="tit" v-else>会审（全部）</strong>
              <div class="el-tag" style="display: inline-block" v-for="(u, j) in s.split.charges[0].users" :key="j">
                <!-- <i class="el-icon-circle-check"></i><br /> -->

                <strong class="name" v-if="u.ico">
                  <img :src="u.ico" />
                </strong>
                <strong class="name" v-if="!u.ico">
                  <i>{{ u.nick_name ? u.nick_name.slice(-1) : '' }}</i>
                </strong>
                <span>{{ u.nick_name }}</span>
              </div>
            </template>

            <template  v-else>
              <div class="el-tag">
                <!-- <i class="el-icon-circle-check"></i><br /> -->
                <strong class="name" v-if="s.split.charges[0].user.ico">
                  <img :src="s.split.charges[0].user.ico" />
                </strong>
                <strong class="name" v-if="!s.split.charges[0].user.ico">
                  <i>{{ s.split.charges[0].user.nick_name ? s.split.charges[0].user.nick_name.slice(-1) : '' }}</i>
                </strong>
                <span>{{ s.split.charges[0].user.nick_name }}</span>
              </div>
            </template>
          </p>
        </div>
      </div>
  </div>
</template>

<script>
  import SelectUser from '@/modules/widget/select-user'
  import config_server from '@/config/config'
  import qs from 'qs'
  const api = config_server.server_api;


  export default {
    props: {
      form: {
        type: Object,
        default: null,
      },

      customProcess: {
        type: Object,
        default: null,
      },

      total_money: {
        type: Number,
        default: 0,
      }
    },

    data(){
      return {
        processType: '',
        processes: [],
        processSteps: [],
        user: '',
        loadingProcessDetail:false
      }
    },

    computed: {

       isProcessCanChange(){
        let enable = true;
        if (this.form.uuid) {
          enable = false;
        }

        return enable;
      }
    },

    watch: {
       'processType'(){
          console.log('processType: ', this.processType);
          if (this.processType == 'default') {
             this.form.process = this.processes[0].uuid
             this.processChange();
          }else if (this.processType == 'custom') {
             this.form.process = 0;
          }
       },

    },

    methods: {
        getProcesses() { // 获取流程列表内容
        let type_id = this.form.id

        let url = api + '/approval/process/type/bind.json?'

        let param = {
          type_id,
          v:2,
        }

         $axios.get(url + qs.stringify(param, { indices: false }))
          .then(response=>{
             console.log("success: ",response)
             if (0 == response.data.result) {
                 this.processes = response.data.list.map(item => {
                  return { uuid:item.proc_id, name:item.proc_name }
                })

             }else{

             }
          })
          .catch(function (error) {
              console.log('error：',error);
          });
      },

      processName() {
        if (!this.form.process){
          return ''
        }
        if (!this.processes || this.processes.length === 0){
          return ''
        }
        let index = this.processes.findIndex((item)=>{
          return item.uuid === this.form.process
        })
        if (index > -1){
          return this.processes[index].name
        }else{
          return '自定义流程'
        }
      },

      initMyInfo() {
        const user = getMyInfo()
         console.log('user: ',user)
        this.user = user

        // 自定义流程
        const { nick_name, id, ico, } = user
        this.customProcess.scopes = [
          {
            users:[
              { nick_name, id, ico, }
            ],
            name: '指定人员',
            type: 'obj_user_scope',
          }
        ]
      },

      newStep(e) { // 自定义审批流程新建审批人
        e.stopPropagation()

        SelectUser({
          multi:false,
          title: '选择人员',
          callback: (persons) => {
            if (persons.length) {
              const { nick_name, uuid, ico, } = persons[0]

              const step = {
                type: 'normal',
                charge: '',
                rule_type: null,
                splits: [{
                  charges: [{
                    type: 'user',
                    label: '指定人',
                    user: {
                      name: nick_name,
                      nick_name,
                      ico,
                      uuid,
                    }
                  }],
                  rule_data: null
                }]
              }

              this.customProcess.steps.push(step)
            }
          }
        })

        return false
      },

      removeStep(index) {
        this.customProcess.steps.splice(index, 1)
      },

      processChange() {

        if (this.form.uuid) {
          return;
        }
        if (this.processSteps.length > 0){
          return
        }

        this.postProcessCall();
      },

      postProcessCall(){
         var param = {};
         var uuid = this.form.process;
         param.val = this.total_money;
         this.loadingProcessDetail = true
        let url = api + `/approval/process/${uuid}/call.json`

         $axios.post(url,qs.stringify(param, { indices: false }))
          .then(response=>{
            this.loadingProcessDetail = false
            this.processSteps = response.data.steps
          })
          .catch(function (error) {
            this.loadingProcessDetail = false
          });
      }

    },

    created(){
        this.getProcesses();
        this.initMyInfo();

        if (this.form.process) {
           this.postProcessCall();
        }
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
      .line{
         height: 1px;
         color: #e5e5e5;
         margin-left: 15px;
         z-index: 2;
      }
       .process-radio{
          input{
             font-size: 15px;
          }
          .label{
             display: inline-block;
             max-width: 100px;
             overflow: hidden;
             text-overflow: ellipsis;
             white-space: nowrap;
             vertical-align: middle;
          }
        }

        .weui-cell{
        .weui-cell__bd{
          .must_fill{
             color: #FF0000;
          }

        }
      }

        .process-detail{
          .loading{
            text-align: center;
            padding: 6px 0;
            height: 25px;
            line-height: 25px;
            font-size: 14px;
            color: #303030;
            >span{
              display: inline-block;
              vertical-align: middle;
              margin-right: 10px;
            }
            /deep/ .mint-spinner-fading-circle{
              display: inline-block;
            }
          }
             .item-custom{
                padding-top: 10px;
                padding-bottom: 10px;
                margin-left: 15px;
                margin-right: 15px;
                display:flex;
                flex-direction: row;
                overflow-x: auto;
                .el-tag{
                  height: auto;
                  padding: 0;
                  border: none;
                  border-radius: 0;
                  line-height: 2;
                  text-align: center;
                  background-color: transparent;
                  color: #333;
                  font-size: 0;
                  margin-right: 50px;
                  position: relative;
                  i.name, .iconfont{
                    font-style: normal;
                    display: inline-block;
                    width: 36px;
                    height: 36px;
                    line-height: 36px;
                    border-radius: 50%;
                    background: #ff746f;
                    font-size: 20px;
                    color: #fff;
                  }
                  strong{
                    position: relative;
                    display: block;
                    &:after{
                      display: none;
                      position: absolute;
                      z-index: 10;
                      content: '';
                      width: 36px;
                      height: 36px;
                      line-height: 36px;
                      border-radius: 50%;
                      top: 0;
                      left: 0;
                      background-color: rgba(0, 0, 0, 0.28);
                    }
                    i.el-icon{
                      display: none;
                      position: absolute;
                      z-index: 11;
                      font-size: 12px;
                      top: 5px;
                      left: 6px;
                      font-size: 24px;
                      color: #F56C6C;
                      cursor: pointer;
                    }
                    &:hover{
                      &:after{
                        display: inline-block;
                      }
                      i.el-icon{
                        display: inline-block;
                      }
                    }
                  }
                  span{
                    font-size: 12px;
                  }
                  img{
                    width: 36px;
                    height: 36px;
                    border-radius: 50%;
                  }
                  &:after{
                    position: absolute;
                    top: 50%;
                    right: -40px;
                    display: inline-block;
                    content: '';
                    width: 28px;
                    height: 1px;
                    border-top: 1px dashed #aaa;
                  }
                  &:nth-last-child(1){
                    &:after{
                      display: none;
                    }
                  }
                }
              }
              .item-process{
                padding-top: 10px;
                padding-bottom: 10px;
                margin-top: 10px;
                margin-left: 15px;
                margin-right: 15px;
                display:flex;
                flex-direction: row;
                overflow-x: auto;
                p{
                  display: inline-block;
                  position: relative;
                  margin-right: 50px;
                  .el-tag{
                    height: auto;
                    padding: 0;
                    border: none;
                    border-radius: 0;
                    line-height: 2;
                    text-align: center;
                    background-color: transparent;
                    color: #333;
                    font-size: 0;
                    i.el-icon-circle-check{
                      font-size: 32px;
                      color: #67C23A;
                    }
                    span{
                      font-size: 12px;
                    }
                    strong.name{
                      position: relative;
                      display: block;
                      &:after{
                        display: none;
                        position: absolute;
                        z-index: 10;
                        content: '';
                        width: 36px;
                        height: 36px;
                        line-height: 36px;
                        border-radius: 50%;
                        top: 0;
                        left: 0;
                        background-color: rgba(0, 0, 0, 0.28);
                      }
                      i{
                        font-style: normal;
                        display: inline-block;
                        width: 36px;
                        height: 36px;
                        line-height: 36px;
                        border-radius: 50%;
                        background: #ff746f;
                        font-size: 20px;
                        color: #fff;
                      }
                      img{
                        width: 36px;
                        height: 36px;
                        border-radius: 50%;
                      }
                    }
                  }
                  &:after{
                    position: absolute;
                    top: 20%;
                    right: -40px;
                    display: inline-block;
                    content: '';
                    width: 28px;
                    height: 1px;
                    border-top: 1px dashed #aaa;
                  }
                  &:nth-last-child(1){
                    &:after{
                      display: none;
                    }
                  }
                }
                p.tag-group{
                  display: flex;
                  margin-right: 50px;
                  border: 1px dashed #ddd;
                  padding: 10px 10px 4px 10px;
                  strong.tit{
                    position: absolute;
                    top: -13px;
                    width: 100%;
                    text-align: center;
                    font-style: normal;
                    font-weight: normal;
                    font-size: 12px;
                  }
                  /deep/.el-tag{
                    margin: 0 5px;
                    i.el-icon-circle{
                      width: 28px;
                      height: 28px;
                      border-radius: 50%;
                      background-color: #ccc;
                    }
                  }
                }
              }
        }
  }
</style>
