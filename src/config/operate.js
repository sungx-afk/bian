export default class Operate {
  constructor(task, userId, isProjectManager = false, isDataManager = false, isApprovalSuper = false, isCreatorSuper = false, isManagerSuper = false) {
    if(task){
      this.task = task;

      this.isControlTask = task && task.project_is_control == 1?true:false;

      this.userId = userId;
      this.isProjectManager = isProjectManager;
      this.isDataManager = isDataManager;

      this.isApprovalSuper = isApprovalSuper;
      this.isCreatorSuper = isCreatorSuper;
      this.isManagerSuper = isManagerSuper;

      this.isManager = this.computed().isManager();
      this.isCreator = this.computed().isCreator();
      this.isPartner = this.computed().isPartner();
      this.isApproval = this.computed().isApproval();
      this.isManagerNotExistApproval = this.computed().isManagerNotExistApproval();
      this.isCreatorNotExistApproval = this.computed().isCreatorNotExistApproval();
      this.isManagerExistApprovalNoApprovalNoApprovalSuper = this.computed().isManagerExistApprovalNoApprovalNoApprovalSuper();
      this.isManagerNoCreatorNoCreatorSuperNoApproval = this.computed().isManagerNoCreatorNoCreatorSuperNoApproval();

      this.rule = this.ruleJson();

      this.submit = this.compare(this.rule.submit) && !this.isProjectManager;    //提交任务条件
      this.finish = this.compare(this.rule.finish);    //完成任务条件
      this.cancel = this.compare(this.rule.cancel);    //取消任务条件
      this.postpone = this.compare(this.rule.postpone);//搁置任务条件
      this.restart = this.compare(this.rule.restart);  //重启任务条件
      this.delete = this.compare(this.rule.delete) && (this.task.delete === 0 || this.task.delete === 4); //删除任务条件
      this.passed = this.compare(this.rule.passed);    //审核通过任务条件
      this.rejected = this.compare(this.rule.rejected);//审核驳回任务条件
      this.retract = this.compare(this.rule.retract); //撤回任务条件
      this.run = this.compare(this.rule.run); //开始任务条件

      this.manager = this.compare(this.rule.manager) && !this.task.clone_from;    //修改任务负责人
      this.approval = this.compare(this.rule.approval) && !this.task.clone_from;  //修改任务审核人
      this.partner =  true;                              //修改任务抄送人
      this.start = this.compare(this.rule.start) && !this.task.clone_from;        //修改任务开始时间
      this.end = this.compare(this.rule.end) && !this.task.clone_from;            //修改任务结束时间
      this.priority = this.compare(this.rule.priority) && !this.task.clone_from;  //修改任务优先级

      this.progress = this.compare(this.rule.progress);  //修改任务进展百分百

      this.detail = this.compare(this.rule.detail) && !this.task.clone_from;      //修改任务内容
      // this.project = this.compare(this.rule.project) && !this.task.project_id;    //归入项目
      this.project = this.compare(this.rule.project);    //归入项目
      this.tag = this.compare(this.rule.tag);            //添加标签
      this.classify = this.compare(this.rule.classify);  //指定分类
      this.planHour = this.compare(this.rule.planHour) && !this.task.clone_from;  //设置任务计划工时
      this.realHour = this.compare(this.rule.realHour) && !this.task.clone_from;  //设置任务实际工时

      this.version = this.compare(this.rule.version);    //设置任务版本
      this.module = this.compare(this.rule.module);      //设置任务模块
      this.sprint = this.compare(this.rule.sprint);      //设置任务迭代
      this.stage = this.compare(this.rule.stage);        //设置任务阶段
      this.point = this.compare(this.rule.point);        //设置任务点数
      this.type = this.compare(this.rule.type);          //设置任务类型
      this.milestone = this.compare(this.rule.milestone);//设置任务里程碑



      this.repairSprint = this.compare(this.rule.repairSprint);//设置修复的迭代
      this.repairVersion = this.compare(this.rule.repairVersion);//设置修复的版本
      this.customTypeBug = this.compare(this.rule.customTypeBug);//设置自定义缺陷类型
      this.customTypeStory = this.compare(this.rule.customTypeStory);//设置自定义需求类型
      this.customPlat = this.compare(this.rule.customPlat);//设置自定义缺陷平台
      this.customSource = this.compare(this.rule.customSource);//设置自定义需求来源
      this.customProbably = this.compare(this.rule.customProbably);//设置自定义缺陷概率







      this.parent = this.compare(this.rule.parent);      //设置任务父任务

      this.addItem = this.compare(this.rule.addItem);                             //添加任务子项
      //子项操作 不属于任务操作 此处只判断子项中是否包含当前用户的子项 如果有 则允许当前用户去操作
      this.item = this.canOperateItem()     //操作子项任务子项

      this.cycle = this.compare(this.rule.cycle);; //设置任务重复周期
      this.share = this.compare(this.rule.share);         //设置能否分享

      this.isProcApproval = this.computed().isProcApproval();

      this.complete = this.compare(this.rule.complete) && this.isProcApproval && (this.task.proc  && this.task.proc.post && this.task.proc.post.proc_status != 1);           //设置审批流程操作
      this.proc = this.compare(this.rule.proc) && (this.task.proc && this.task.proc.post && (!this.task.proc.post.steps || this.task.proc.post.proc_status != 1));            //设置审批流程操作

      //this.score = this.compare(this.rule.score) && this.task.score == 0 && !this.isManager;  //打分
      this.score = this.compare(this.rule.score);

      this.submitOnly = this.compare(this.rule.submitOnly); //提交审核


    }
  }
  //TODO：停止重复周期
  ruleJson(){
    return {
      submit: { //提交任务条件
        role: ['manager_no_creator_no_creator_super'],
        status: ['WAITING', 'RUNNING']
      },
      finish: { //完成任务条件
        role: ['creator', 'project_manager','creator_super','manager_not_exist_approval'],
        status: ['WAITING', 'RUNNING']
      },
      cancel: { //取消任务条件
        role: ['manager', 'creator', 'project_manager', 'creator_super', 'manager_super','approval','approval_super'],
        status: ['WAITING', 'RUNNING', 'WAITING_AGREE']
      },
      postpone: { //搁置任务条件
        role: ['manager', 'creator', 'project_manager', 'creator_super', 'manager_super','approval','approval_super'],
        status: ['WAITING', 'RUNNING', 'WAITING_AGREE']
      },
      restart: { //重启任务条件
        role: ['manager', 'creator', 'project_manager', 'creator_super', 'manager_super'],
        status: ['FINISH', 'FINISH_DELAY', 'CANCEL', 'POST_PONE']
      },
      delete: { //删除任务条件
        // role: ['manager_not_exist_approval', 'creator', 'approval', 'project_manager', 'data_manager', 'approval_super', 'creator_super'],
        role: [ 'creator', 'project_manager', 'creator_super'],
        control_role: [ 'project_manager'],
        validate_control:true,
        status: []
      },
      passed: { //审核通过任务条件
        role: ['approval', 'creator', 'project_manager', 'approval_super','creator_super'],
        status: ['WAITING_AGREE']
      },
      rejected: { //审核驳回任务条件
        role: ['approval', 'creator', 'project_manager', 'approval_super','creator_super'],
        status: ['WAITING_AGREE']
      },
      retract: { //撤回任务条件
        role: ['manager'],
        status: ['WAITING_AGREE']
      },
      run: { //开始任务条件
        role: ['manager', 'manager_super'],
        status: ['WAITING']
      },
      manager: { //修改任务负责人
        role: ['manager', 'creator', 'project_manager', 'creator_super', 'manager_super'],
        control_role: [ 'project_manager'],
        validate_control:true,
        status: ['WAITING', 'RUNNING', 'CANCEL', 'POST_PONE']
      },
      approval: { //修改任务审核人
        // role: ['creator', 'approval', 'project_manager', 'approval_super', 'creator_super'],
        role: ['manager', 'creator', 'project_manager', 'creator_super', 'manager_super'],
        control_role: [ 'project_manager'],
        validate_control:true,
        status: ['WAITING', 'RUNNING', 'CANCEL', 'POST_PONE']
      },
      start: { //修改任务开始时间
        // role: ['creator', 'approval', 'project_manager', 'approval_super', 'creator_super','manager_not_exist_approval'],
        role: ['manager', 'creator', 'project_manager', 'creator_super', 'manager_super'],
        control_role: [ 'project_manager'],
        validate_control:true,
        status: ['WAITING', 'RUNNING', 'CANCEL', 'POST_PONE']
      },
      end: { //修改任务结束时间
        // role: ['creator', 'approval', 'project_manager', 'approval_super', 'creator_super','manager_not_exist_approval'],
        role: ['manager', 'creator', 'project_manager', 'creator_super', 'manager_super'],
        control_role: [ 'project_manager'],
        validate_control:true,
        status: ['WAITING', 'RUNNING', 'CANCEL', 'POST_PONE']
      },
      priority: { //修改任务优先级
        role: ['manager', 'creator', 'project_manager', 'creator_super', 'manager_super'],
        control_role: [ 'project_manager'],
        validate_control:true,
        status: ['WAITING', 'RUNNING', 'CANCEL', 'POST_PONE']
      },
      progress: { //修改任务进展百分百
        role: ['manager', 'manager_super'],
        status: ['RUNNING']
      },
      detail: { //修改任务内容
        role: ['manager', 'creator', 'project_manager', 'creator_super', 'manager_super'],
        control_role:  [ 'project_manager'],
        validate_control:true,
        status: ['WAITING', 'RUNNING', 'CANCEL', 'POST_PONE']
      },
      project: { //归入项目
        role: ['manager', 'creator', 'project_manager', 'creator_super', 'manager_super'],
        control_role:  [ 'project_manager'],
        validate_control:true,
        status: []
      },
      tag: { //添加标签
        role: ['manager', 'creator', 'project_manager', 'creator_super', 'manager_super'],
        control_role: [ 'project_manager'],
        validate_control:true,
        status: []
      },
      classify: { //指定分类
        role: ['manager', 'creator', 'project_manager', 'creator_super', 'manager_super'],
        control_role:  [ 'project_manager'],
        validate_control:true,
        status: []
      },
      planHour: { //设置任务计划工时
        role: ['manager', 'creator', 'project_manager', 'creator_super', 'manager_super'],
        control_role:  [ 'project_manager'],
        validate_control:true,
        status: []
      },
      realHour: { //设置任务实际工时
        role: ['manager', 'creator', 'project_manager', 'creator_super', 'manager_super'],
        control_role: [ 'project_manager'],
        validate_control:true,
        status: []
      },
      share: {
        role: ['manager', 'creator', 'project_manager', 'creator_super', 'manager_super'],
        status: []
      },
      //项目需求任务
      version: { //设置任务版本
        role: ['manager', 'creator', 'project_manager', 'creator_super', 'manager_super'],
        status: []
      },
      module: { //设置任务模块
        role: ['manager', 'creator', 'project_manager', 'creator_super', 'manager_super'],
        status: []
      },
      sprint: { //设置任务迭代
        role: ['manager', 'creator', 'project_manager', 'creator_super', 'manager_super'],
        status: []
      },
      stage: { //设置任务阶段
        role: ['manager', 'creator', 'project_manager', 'creator_super', 'manager_super'],
        status: []
      },
      point: { //设置任务点数
        role: ['manager', 'creator', 'project_manager', 'creator_super', 'manager_super'],
        status: []
      },
      type: { //设置任务类型
        role: ['manager', 'creator', 'project_manager', 'creator_super', 'manager_super'],
        status: []
      },
      milestone: { //设置任务里程碑
        role: ['manager', 'creator', 'project_manager', 'creator_super', 'manager_super'],
        status: []
      },

      repairSprint: { //设置修复的迭代
        role: ['manager', 'creator', 'project_manager', 'creator_super', 'manager_super'],
        status: []
      },
      repairVersion: { //设置修复的版本
        role: ['manager', 'creator', 'project_manager', 'creator_super', 'manager_super'],
        status: []
      },
      customTypeBug: { //设置自定义缺陷类型
        role: ['manager', 'creator', 'project_manager', 'creator_super', 'manager_super'],
        status: []
      },
      customTypeStory: { //设置自定义需求类型
        role: ['manager', 'creator', 'project_manager', 'creator_super', 'manager_super'],
        status: []
      },
      customPlat: { //设置自定义缺陷平台
        role: ['manager', 'creator', 'project_manager', 'creator_super', 'manager_super'],
        status: []
      },
      customSource: { //设置自定义需求来源
        role: ['manager', 'creator', 'project_manager', 'creator_super', 'manager_super'],
        status: []
      },
      customProbably: { //设置自定义缺陷概率
        role: ['manager', 'creator', 'project_manager', 'creator_super', 'manager_super'],
        status: []
      },



      parent: { //设置任务父任务
        role: ['manager', 'creator', 'project_manager', 'creator_super', 'manager_super'],
        status: []
      },
      //添加子项
      addItem: {
        role: ['manager', 'creator', 'project_manager', 'creator_super', 'manager_super'],
        control_role:  [ 'project_manager'],
        validate_control:true,
        status: ['WAITING', 'RUNNING', 'CANCEL', 'POST_PONE']
      },

      //审核流程
      complete: {
        role: [],
        status: ['FINISH', 'FINISH_DELAY']
      },
      proc: {
        role: ['manager', 'creator', 'project_manager', 'creator_super', 'manager_super'],
        status: []
      },
      //评分
      score: {
        // role: ['creator_not_exist_approval', 'approval'],
        role:[],
        status: ['FINISH', 'FINISH_DELAY']
      },
      cycle: { //设置重复周期
        role: ['manager', 'creator', 'project_manager', 'creator_super', 'manager_super'],
        control_role:  [ 'project_manager'],
        validate_control:true,
        status: ['WAITING', 'RUNNING', 'CANCEL', 'POST_PONE']
      },
      submitOnly: { //提交审核
        role: ['manager', 'creator', 'project_manager', 'creator_super', 'manager_super'],
        status: ['WAITING','RUNNING']
      },



    }
  }

  computed(){
    const _this = this;
    return {
      isManager(){
        return  !!_this.task.rel.manager && _this.task.rel.manager.some(item => item.uuid == _this.userId);
      },
      isCreator(){
        return !!_this.task.rel.creator &&  _this.task.rel.creator.some(item => item.uuid == _this.userId);
      },
      isPartner(){
        return !!_this.task.rel.partner && _this.task.rel.partner.some(item => item.uuid == _this.userId);
      },
      isApproval(){
        /*兼容子项为审核人的情况*/
        let isItemApproval = false;
        if(_this.task.item && _this.task.item.length){
          let item = _this.task.item.filter(a => a.type != 0);
          item.forEach(b => {
            if(b.manager && b.manager.uuid == _this.userId){
              isItemApproval = true;
            }
          })
        }
        return !!_this.task.rel.approval && _this.task.rel.approval.some(item => item.uuid == _this.userId) || isItemApproval;
      },
      isManagerNotExistApproval(){
        var existApproval = false;
        if(_this.task.rel.approval && _this.task.rel.approval.length){
          existApproval = true;
        }
        let item = _this.task.item.filter(a => a.type != 0);
        if(item.length > 0){
          existApproval = true;
        }
        return this.isManager() && !existApproval;
      },
      isCreatorNotExistApproval(){
        return this.isCreator() && !_this.task.rel.approval;
      },
      isManagerExistApprovalNoApprovalNoApprovalSuper(){
        return this.isManager() && !!_this.task.rel.approval && !this.isApproval() && !_this.isApprovalSuper;
      },
      isProcApproval(){
        return !!_this.task.proc &&  !!_this.task.proc.post && !!_this.task.proc.post.steps && _this.task.proc.post.steps.some(item => item.item[0].is_current == 1 && item.item[0].user_id == _this.userId);
      },
      isManagerNoCreatorNoCreatorSuperNoApproval(){
        var existApproval = false;
        if(_this.task.rel.approval && _this.task.rel.approval.length){
          existApproval = true;
        }
        let item = _this.task.item.filter(a => a.type != 0);
        if(item.length > 0){
          existApproval = true;
        }
        return this.isManager() && !!_this.task.rel.creator && !this.isCreator() && !_this.isCreatorSuper && !existApproval;
      },
    }
  }

  roleKey(key){
    key = key.toLowerCase();
    const reg = /\b(\w)|\_(\w)/g; //  \b判断边界\s判断空格
    //const reg = /^\S/g;
    return key.replace(reg, m => {
      return m.replace(/\_/g, '').toUpperCase();
    });
  }

  compare(rule){
    if(rule.validate_control){
      if(this.isControlTask){
        return this.roleCompare(rule.control_role) && this.statusCompare(rule.status);
      }else{
        return this.roleCompare(rule.role) && this.statusCompare(rule.status);
      }
    }else{
      return this.roleCompare(rule.role) && this.statusCompare(rule.status);
    }

  }

  roleCompare(role){
    return role.length == 0 || role.some(item => !!this[`is${ this.roleKey(item) }`]);
  }

  statusCompare(status){
    return status.length == 0 || (status.indexOf(this.task.status) >= 0);
  }

  canOperateItem(){
    if (this.task.status === 'FINISH' || this.task.status === 'FINISH_DELAY'){
      return false
    }
    if (!this.task.item || this.task.item.length === 0){
      return false
    }
    let items = this.task.item.filter(item=> item.type === 0)

    return items.length > 0 && this.compare(this.rule.milestone) || items.some(item => item.manager && item.manager.uuid == this.userId)
  }
}
