<template>
  <div class="message-popup">
    <van-popup
      v-model="showPopup"
      position="top"
      :close-on-click-overlay="false"
      :style="{ height: '360px' }">
      <div class="message-wrapper">
        <div class="product" v-if="product">
          {{product.name}} : {{product.point}} 云币
        </div>
        <div class="message">
          <van-field
            v-model="message"
            type="textarea"
            border
            :placeholder="placeholder"
            :autosize="{ maxHeight: 200, minHeight: 200 }">
          </van-field>
        </div>
        <div class="footer">
          <div class="type">
            <van-radio-group v-model="messageType" class="type-radio-group" direction="horizontal">
              <van-radio v-for="item in messageTypeList" :key="item.value" :name="item.value" checked-color="#825621">{{item.name}}</van-radio>
            </van-radio-group>
          </div>
          <div class="btn">
            <van-button @click.stop="cancel" size="small">取消</van-button>
            <van-button @click.stop="confirm" size="small">确定</van-button>
          </div>
        </div>
      </div>

    </van-popup>
  </div>
</template>

<script>
    export default {
      name: "Message",
      props:{
        product:Object,
        default:null
      },
      data(){
        return{
          showPopup:true,
          message:'',
          messageType:'MESSAGE',
          messageTypeList:[{
            value:'MESSAGE',
            name:'留言'
          },{
            value:'PRIVATE',
            name:'私语'
          }],
        }
      },
      computed:{
        placeholder(){
          let result = '请输入您想说的（选填，填写内容后会发送一则留言）'

          if (this.messageType === 'PRIVATE'){
            result = '请输入您想说的（选填，填写内容后会发送一则私语）'
          }

          return result
        }
      },
      methods:{
        confirm(){
          this.$emit('confirm',{content:this.message,type:this.messageType})
        },
        cancel(){
          this.$emit('cancel')
        }
      }
    }
</script>

<style rel="stylesheet/less" lang="less" scoped>
  @import "~@/config/config.less";
  .message-popup{
    .message-wrapper{
      height: 100%;
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
      .product{
        padding: 12px 28px;
        border-bottom: 1px solid #eeeeee;
      }
      .message{
        flex-grow: 1;
        padding: 12px 12px;
      }
      .footer{
        display: flex;
        align-items: center;
        flex-shrink: 0;
        justify-content: flex-end;
        padding: 12px 12px;
        border-top: 1px solid #eeeeee;
        .type{
          margin-right: auto;
        }
        .van-button{
          color: white;
          background-color: @MAIN_THEME_COLOR;
          margin: 0px 8px;
        }
      }
    }
  }

</style>
