<template>
  <div class="story-container">
    <template v-if="noData">
      <no-data></no-data>
    </template>
    <template v-else>
      <van-list class="story-list"
        v-model="loading"
        :finished="finished"
        :finished-text="finishedText"
        @load="onLoadMoreData">
        <van-cell
          v-for="item in list"
          :key="item.id">
          <div class="item-wrapper" @click="goStoryDetail(item)">
            <div class="item-top">
              <div class="name">{{item.name}}</div>
              <div class="operate-wrapper" v-if="canOperate(item)" @click.stop="goMoreMenu(item)">
                <i class="iconfont icon-gengduo"></i>
              </div>
            </div>
            <div class="item-bottom">
              <!-- <img class="avatar" :src="item.creator && item.creator.avatarUrl || '~@/modules/images/default_header.png'" /> -->
              <div class="creator">{{item.creator && item.creator.name}}</div>
              <div class="create-date">{{ item.createDate | timeAgo }}</div>
            </div>
          </div>
        </van-cell>
      </van-list>
    </template>
    <div class="add-btn" @click.stop="goNewStory">
      <img class="add-image" src="~@/modules/images/float_add_btn.png"/>
    </div>
    <van-popup
      v-model="isShowMoreMenu"
      close-on-popstate>
      <div v-for="menu in menuList" :key="menu.id" @click="moreMenuPressed(menu)" class="menu">{{menu.name}}</div>
    </van-popup>
  </div>
</template>

<script>
 const LIMIT = 20 
 import constant from '@/config/constant'

import {mapGetters, mapActions} from 'vuex';
import {Link} from '@/config/utils'

import NewStory from '@/modules/widget/new-story'

import NoData from '@/modules/widget/space/NoData'

export default {
  name: 'Story',
  components: {
    NoData
  },
  props: {},
  data () {
    return {
      list:[],
      total:0,
      loading:false,
      finished:false,
      noData:false,
      menuList:[],
      isShowMoreMenu:false,
      currentItem:null
    }
  },
  computed: {
    ...mapGetters({
      user: 'userStore/user',
      space:'spaceStore/spaceDetail'
    }),
    finishedText(){
      let result = ''

      if (this.list.length < 20){
        result = ''
      }else {
        result = '没有更多数据了'
      }

      return result
    },
    isSpaceCreator() {
      let result = false
      let currentUserId = this.user.id
      if (this.space && currentUserId === this.space.creatorId) {
        result = true
      }
      return result
    },
  },
  watch: {},
  methods: {
    getDataList(start = 0){
      let that = this
      let limit = LIMIT

      let params = {
        start,
        limit,
        type:'LIFE_EXPERIENCE'
      }

      $API.space.getSpaceStoryList(that.space.id,params,rsp=>{
          this.loading = false
          if (start === 0){
            this.total = rsp.total
            this.list = rsp.result
          }else{
            this.list = this.list.concat(rsp.result)
          }
          that.noData = false
          if (that.list.length === 0){
            that.noData = true
            that.finished = true
          }else if(that.list.length >= this.total){
            that.finished = true
          }
        },error=>{
          that.loading = false
          that.finished = true
        })
    },
    onLoadMoreData(){
      if (this.space && !this.finished){
        let start = this.list.length
        this.getDataList(start)
      }
    },
    goStoryDetail(item){
      Link(`/space/story/${item.id}`)
    },
    goNewStory(){
      NewStory({
        spaceId:this.space.id,
        callback:data=>{
          this.getDataList()
        }
      })
    },
    canDeleteStory(item){
      return this.isSpaceCreator || item.creatorId == this.user.id
    },
    canOperate(item){
      return this.canDeleteStory(item)
    },
    goMoreMenu(item){
      this.menuList = []
      if (this.canDeleteStory(item)){
        this.menuList.push({
          id:'delete',
          name:'删除文章'
        })
      }
      this.currentItem = item
      this.isShowMoreMenu = true
    },
    moreMenuPressed(menu){
      this.isShowMoreMenu = false
      switch (menu.id) {
        case 'delete':
          this.deleteStory()
          break
      }
    },
    deleteStory(){
      let that = this
      this.$dialog.confirm({
        message: `确认删除该文章吗?`
      }).then(() => {
        $API.space.deleteSpaceStory({sid:this.space.id,cid:this.currentItem.id},rsp=>{
          that.getDataList()
        })
      }).catch(() => {

      })
    },
    refreshList(){
      this.getDataList()
    },
    registerEvent(){
      eventHub.$on(constant.EVENT_SPACE_STORY_DELETED,this.refreshList)
    },
  },
  created () {
    this.registerEvent()
  },
  mounted () {
  },
  beforeDestroy(){
    eventHub.$off(constant.EVENT_SPACE_STORY_DELETED,this.refreshList)
  }
}
</script>

<style rel="stylesheet/less" lang="less" scoped>
  @import "~@/config/config.less";
  .story-container{
    .story-list{
      .item-wrapper{
        .item-top{
          display: flex;
          align-items: center;
          height: 25px;
          .name{
            font-size: 14px;
            font-weight: bold;
            width: 0;
            flex-grow: 1;
            margin-right: 12px;
            overflow: hidden;
            white-space: nowrap;
            text-overflow: ellipsis;
          }
          .operate-wrapper{
            margin-left: auto;
          }
        }
        .item-bottom{
          display: flex;
          align-items: center;
          height: 24px;
          .avatar{
            width:35px;
            height:35px;
            border-radius:17px;
            flex-shrink:0;
          }
          .creator{
            font-size: 12px;
            color:@FONT_FOUR_COLOR;
            margin-right: 8px;
          }
          .create-date{
            font-size: 12px;
            color:@FONT_FOUR_COLOR;
          }
        }
      }
    }
    .add-btn {
      position: fixed;
      bottom: 60px;
      right: 20px;

      .add-image {
        width: 50px;
        height: 50px;
      }

      &.x-bottom {
        bottom: 90px;
      }
    }
  }
</style>
