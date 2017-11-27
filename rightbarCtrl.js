'use strict';
editorApp.controller('RightbarCtrl',
[
  '$scope',
  '$rootScope',
  '$timeout',
  'toastr',
  '$sce',
  'ProjectService',
  'urls',
  'BlockService',
  'BasicBlockService',
  'CompositeBlockService',
  'StateMachineService',
  'ModalService',
  'AlertService',
  'ImportExportService',
  function(
    $scope,
    $rootScope,
    $timeout,
    toastr,
    $sce,
    ProjectService,
    urls,
    BlockService,
    BasicBlockService,
    CompositeBlockService,
    StateMachineService,
    ModalService,
    AlertService,
    ImportExportService
  ){
  $rootScope.defaultTab = [{active:true}];        
  $rootScope.selectedBlockName = '';
  $scope.basicBlocks = [];
  $scope.compositeBlocks = [];
  $scope.projectName = '';
  $scope.showDeleteButton = false ;
  $scope.showEditButton = false;
  $scope.projectId = ProjectService.getProjectId();
  var clickable = true;
  var selectedBlockId;
  var getBlockType;
  var blkCopy = {};
  $scope.theProject = [];
  $scope.searchBlock = {};
  $scope.displayBlckId = false;
  $scope.dropAllowed = false;
  window.addEventListener('load', function(){
    ProjectService.getProject($scope.projectId);
  });     
  var trusted = {};
  $scope.$on('LOAD_PROJECT', function(){
    if(typeof BasicBlockService.getProjectId() === 'undefined') BasicBlockService.getProjectId($scope.projectId);
    $scope.showDeleteButton = false;
    $scope.showEditButton = false;
    $scope.theProject = {};
    $scope.basicBlocks = [];
    $scope.compositeBlocks = [];
    $scope.theProject = ProjectService.getProjectData();
    $scope.projectName = $scope.theProject.name;
    setAccountSettings();
    _.each($scope.theProject.blocks, function(b){
      if(b.description) b.description = $sce.trustAsHtml(b.description);
      if (b.type === 'Composite') $scope.compositeBlocks.push(b);
      if (b.type === 'Basic') $scope.basicBlocks.push(b);
    })
    $scope.basicBlocks = _.sortBy($scope.basicBlocks, function(bb){ return bb.name.toLowerCase() });
    $scope.compositeBlocks = _.sortBy($scope.compositeBlocks, function(cb){ return cb.name.toLowerCase() });
    ImportExportService.getEmbeddableBlocks($scope.projectId);
  });
  var showStateMachine = function(blk){
    $scope.$emit('SHOW_STATE_MACHINE', blk);
  };
  var showCompositeView = function(blk){
    $scope.$emit('SHOW_COMPOSITE_VIEW', blk);
  };
  $scope.addNewBlock = function(){
    ModalService.openModal('newBlock');
  }
  $scope.manageLibraries = function(){
    ModalService.openModal('manageLibraries');
  }
  $scope.removeBlock = function(){
    $scope.showDeleteButton = true;
    $scope.showEditButton = false;
  }
  $scope.editBlock = function(){
    $scope.showDeleteButton = false;
    $scope.showEditButton = true;
  }
  $scope.deployProject = function(){
    if(!ProjectService.getCurrentBlock()){
      toastr.error('A block must be selected before deploying the project', 'Error!');
      return;
    }
    ProjectService.requestDeployKeys();
  }
  $scope.compileProject = function(){
    ProjectService.compileProject();
  }
  $scope.deleteBlock = function(blk){
    blkCopy = JSON.parse(JSON.stringify(blk));
    blkCopy.ngIndex = this.$index;
    if (this.$first && this.$last) blkCopy.changeType = true;
    AlertService.deleteBlockConfirm();
  }
  //FIXME: getBasic and getComposite are almost duplicated
  //TODO: combine them in one function
  var getBlock = function(obj){
    if(typeof obj.blockId === 'undefined') selectedBlockId = obj.id;
    else selectedBlockId = obj.blockId;
    var bname = obj.text;
    if (typeof obj.text === 'undefined') bname = obj.name;
    ProjectService.setCurrentBlockName(bname);
    ProjectService.setCurrentBlockId(selectedBlockId);
    $scope.$emit('BLOCK_CHANGED');
    BlockService.getCurrntBlockId(selectedBlockId);
    var targetProject = obj.controlProjectId;
    if (typeof targetProject === 'undefined') targetProject = $scope.projectId;
    BasicBlockService.reloadBlock(targetProject, selectedBlockId);
  }
  var getStateMachine = function(obj){
    StateMachineService.setBlockId(selectedBlockId, obj);
    showStateMachine(obj);
  }
  var getCompositeView = function(obj){
    CompositeBlockService.setBlockId(selectedBlockId);
    showCompositeView(obj);
  }
  $scope.getAlgorithm = function(alg){
    BasicBlockService.setCurrentAlgorithm(alg.id);
    BasicBlockService.loadAlgorithm();
  };
  $scope.treeSelected = function(obj, alg){
    ProjectService.setCurrentBlock(obj);
    $rootScope.defaultTab[0].active = true;
    if (obj.controlProjectId !== $scope.projectId){
      $scope.$emit('DISABLE_BLOCK_EDIT');
    } else {
      $scope.$emit('ENABLE_BLOCK_EDIT');
    }
    if (typeof obj === 'undefined') return;
    if(!clickable) return;
    clickable = false;
    if(obj.type === 'Basic' && typeof alg === 'undefined'){
      getBlock(obj);
      $timeout(function(){
        getStateMachine(obj);
      }, 100);
      if($scope.projectId === obj.controlProjectId) ProjectService.setTopLevelBlock(selectedBlockId);
    }else if(obj.type === 'Composite' ){
      getBlock(obj);
      $timeout(function(){
        getCompositeView(obj)
      }, 100);
      if ($scope.projectId === obj.controlProjectId) ProjectService.setTopLevelBlock(selectedBlockId);
    }else{
      //Do nothing!
    };
    $timeout(function () {
      clickable = true;
    }, 1000);
  };
  $rootScope.$on('BLOCK_CREATED', function(){
    var TheNewBlock = BlockService.getNewBlock();
    var tempBlockIdSt = 'block_' + TheNewBlock.id.toString();
    var newBlockObj = {
      id: tempBlockIdSt,
      type: TheNewBlock.type,
      text: TheNewBlock.name,
      blockId: TheNewBlock.id,
      $$hashKey: ''
    }
    $scope.treeSelected(newBlockObj);
  })
  $scope.openModal = function(modalType){
    $scope.showEditButton = false;
    ModalService.openModal(modalType);
  }
  $scope.importBlocks = function(){
    ModalService.openModal('importBlocks');
  }
  $scope.exportBlocks = function(){
    ModalService.openModal('exportBlocks');
  }
  $scope.startDrag = function(evt){
    var draggedBlock = {
      id: parseInt(evt.target.id),
      name: ''
    }
    _.each(ProjectService.getProjectData().blocks, function(b){
      if (draggedBlock.id === b.id) draggedBlock.name = b.name;
    });
    CompositeBlockService.setMovingBlock({ id: draggedBlock.id, name: draggedBlock.name });

  }
  $scope.endDrag = function(evt){
    if(!$scope.dropAllowed) return;
    var pos = CompositeBlockService.getDragOverPosition();
    CompositeBlockService.setNewInstancePosition(pos.x-50 , pos.y-50);
  }
  $scope.$on('BLOCK_DELETED', function(){
    var nextBlock;
    var nextIndex = function(){
      if (blkCopy.ngIndex <= 0) return blkCopy.ngIndex + 1;
      else return blkCopy.ngIndex - 1;
    }
    if (blkCopy.changeType){
      if (blkCopy.type === 'Basic') nextBlock = $scope.compositeBlocks[0];
      else nextBlock = $scope.basicBlocks[0];
    }else{
      if(blkCopy.type === 'Basic') nextBlock = $scope.basicBlocks[nextIndex()];
      else nextBlock = $scope.compositeBlocks[nextIndex()];
    }
    blkCopy = {};
    if(typeof nextBlock === 'undefined'){
      $scope.$emit('DEFAULT_VIEW');
      return;
    }
    $scope.treeSelected(nextBlock);
  });
  $scope.generalFilter = function (rowBlock) {
      if ($scope.searchBlock.name === undefined) return true;      
      if (rowBlock.name.toLowerCase().indexOf($scope.searchBlock.name.toLowerCase()) !== -1 || $sce.valueOf(rowBlock.description).toLowerCase().indexOf($scope.searchBlock.name.toLowerCase()) !== -1 || rowBlock.tags.toLowerCase().indexOf($scope.searchBlock.name.toLowerCase()) !== -1 || rowBlock.id.toString().indexOf($scope.searchBlock.name) !== -1) {
          return true
      }else{
          return false;
      }
  }
  $scope.projectSetting = function (){
       ModalService.openModal('projectSetting');
  }
  $scope.openBlockDescription = function(block){
    ProjectService.setCurrentBlock(block);
    ModalService.openModal('blockDescription');
  }
  $scope.$on("SETTING", function(){
      setAccountSettings();
  });
  $scope.getPopInfo = function(blck){
      var htmlInfo = '<p style="display:inline;">ID: &nbsp<div style="display:inline; font-weight:900;">'+blck.id+'</div></p><p style="display:inline;">NAME: &nbsp<div style="display:inline; font-weight:900;">'+blck.name+'</div></p>'
      return trusted[htmlInfo] || (trusted[htmlInfo] = $sce.trustAsHtml(htmlInfo));
  }
  var setAccountSettings = function (){
      var currentSetting = ProjectService.getAccountSetting();
      if(currentSetting){
          try{
              currentSetting = JSON.parse(currentSetting);
          }catch(err){
              currentSetting = {
                  blockIdOn: false,
                  tooltipOn: false,
                  descriptionOn: true
              }
          }
      }else{
          currentSetting = {
              blockIdOn: false,
              tooltipOn: false,
              descriptionOn: true
          }
      }
      $scope.displayBlckId = currentSetting.blockIdOn;
      checkForDescription(currentSetting)
  }
  var checkForDescription = function(setting){
    if (!setting.descriptionOn){
      var allDescriptions = $('div').find('[uib-popover-html]');
      _.each(allDescriptions, function(d){
        var cnt = $(d).contents();
        $(d).replaceWith(cnt);
      })
    }else if(setting.descriptionOn){
      var allBlocks = $('.has-popover');
      _.each(allBlocks, function(b){
        var inners = $(b).contents();
        $(b).empty();
        $(b).append('<div uib-popover-html="bb.description" popover-trigger="mouseenter" popover-placement="right" popover-append-to-body="true"></div>');
        $(b).first().append(inners);
      })
    }
  }
  $scope.$on('DROP_TRUE', function(){
    $scope.dropAllowed = true;
  });
  $scope.$on('DROP_FALSE', function(){
    $scope.dropAllowed = false;
  });
}]);
