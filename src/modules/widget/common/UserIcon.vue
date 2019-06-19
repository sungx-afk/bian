<template>
	<div class="fbui-user-icon" :title="filterTitle" :style="{'width':filterWidth,'height':filterHeight,'line-height':filterHeight}">
		<template v-if="user">
			<div :class="{'u_icon':true,'sex_2':(user.sex == 2),'sex_1':(user.sex == 1),'has_ico':(user.ico?true:false)}">
				<template v-if="user.ico">
					<img :src="user.ico" />
				</template>
				<template v-else>
					{{filterName}}
				</template>
			</div>
		</template>
		<template v-else>
			<template v-if="creatorName">
				<div class="u_icon sex_2">{{filterName}}</div>
			</template>
			<template v-else>
				<div class="u_icon sex_2">未</div>
			</template>
		</template>
	</div>
</template>
<script>
	export default {
		props:['user','creatorName','size'],
		computed:{
			filterName(){
				var result = "未";
				var name = "";
				if(this.user){
					name = this.user.nick_name;
				}else{
					if(this.creatorName){
						name = this.creatorName;
					}
				}
				if(name){
					if(/[\u4E00-\u9FA5\uF900-\uFA2D]/.test(name)){//有中文
						result = name.substr(name.length-1,name.length);
					}else{//纯英文
						result = name.substr(0,1);
					}
				}
				return result;
			},
			filterWidth(){
				var width = '40px';
				if(this.size){
					width = this.size + 'px';
				}
				return width;
			},
			filterHeight(){
				var height = '40px';
				if(this.size){
					height = this.size + 'px';
				}
				return height;
			},
			filterTitle(){
				if(this.user && this.user.nick_name){
					return this.user.nick_name
				}else{
					if(this.creatorName){
						return this.creatorName;
					}else{
						return '';
					}
				}
			}
		}
	}
</script>
<style scoped lang="less">
	.fbui-user-icon{
		.u_icon{
			width: 100%;
			height: 100%;
			border-radius: 50%;
			background: #92ea85;
		    font-size: 14px;
		    color: #fff;
		    text-align: center;
		    img{
		    	width: 100%;
		    	height: 100%;
		    	border-radius: 50%;
		    	vertical-align: top;
		    }
		    &.sex_2{
		    	background: #92ea85;
		    }
		    &.sex_1{
		    	background: #ff8d8d;
		    }
        &.has_ico{
          background: #fff;
        }
		}
	}
</style>




