'use strict';
editorApp.controller('SidebarCtrl',
[
  '$scope',
  '$rootScope',
  '$timeout',
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
  $rootScope.selectedBlockName = '';
  $scope.basicBlocks = [];
  $scope.compositeBlocks = [];
  $scope.projectName = '';
  $scope.showDeleteButton = false ;
  $scope.showEditButton = false;
  $scope.projectId = ProjectService.getProjectId();
  ImportExportService.loadEmbeddableBlocks($scope.projectId);
  var clickable = true;
  var selectedBlockId;
  var getBlockType;
  var blkCopy = {};
  $scope.theProject = [];
  $scope.commonBasicBlocks = [];
  $scope.commonCompositeBlocks = [];
  $scope.marketBasicBlocks = [];
  $scope.marketCompositeBlocks = [];
  $scope.accountBasicBlocks = [];
  $scope.accountCompositeBlocks = [];
  $scope.searchBlock = {};
  $scope.blockTags = [];
  $scope.displayBlckId = false;      
  window.addEventListener('load', function(){
    ProjectService.getProject($scope.projectId);
  });
  var newTag = "";
  var taggingRecord = false;
  var startPosition = 0;
  var endPosition = 0;      
  $scope.$on('LOAD_PROJECT', function(){
    $scope.showDeleteButton = false;
    $scope.showEditButton = false;
    $scope.theProject = {};
    $scope.basicBlocks = [];
    $scope.compositeBlocks = [];
    $scope.theProject = ProjectService.getProjectData();
    $scope.projectName = $scope.theProject.name;
    _.each($scope.theProject.blocks, function(b){
      if (b.type === 'Composite') $scope.compositeBlocks.push(b);
      if (b.type === 'Basic') $scope.basicBlocks.push(b);
    })
    $scope.basicBlocks = _.sortBy($scope.basicBlocks, function(bb){ return bb.name.toLowerCase() });
    $scope.compositeBlocks = _.sortBy($scope.compositeBlocks, function(cb){ return cb.name.toLowerCase() });
    ImportExportService.getEmbeddableBlocks($scope.projectId);
  });
  $scope.$on('LOAD_EMBEDDABLE', function(){
    //TODO: this method is mustly duplicated, a better approach needed
    //it was urgnet so I didn't have time to figure a way to do it more efficiently
    if(ImportExportService.getEmbeddableBlocks().commonBlocks){
      _.each(ImportExportService.getEmbeddableBlocks().commonBlocks, function(b){
        if (b.type === 'Basic' && b.controlProjectId !== $scope.projectId) $scope.commonBasicBlocks.push(b);
        else if (b.type === 'Composite' && b.controlProjectId !== $scope.projectId) $scope.commonCompositeBlocks.push(b);
      })
    }
    //for an odd reason api returns null for marketplace blocks if empty while for the rest it just returns an empty array!
    if(ImportExportService.getEmbeddableBlocks().marketplaceBlocks || ImportExportService.getEmbeddableBlocks().marketplaceBlocks === null){
      _.each(ImportExportService.getEmbeddableBlocks().marketplaceBlocks, function(b){
        if (b.type === 'Basic' && b.controlProjectId !== $scope.projectId) $scope.marketBasicBlocks.push(b);
        else if (b.type === 'Composite' && b.controlProjectId !== $scope.projectId) $scope.marketCompositeBlocks.push(b);
      })
    }
    if(ImportExportService.getEmbeddableBlocks().accountCreatedBlocks){
      _.each(ImportExportService.getEmbeddableBlocks().accountCreatedBlocks, function(b){
        if (b.type === 'Basic' && b.controlProjectId !== $scope.projectId) $scope.accountBasicBlocks.push(b);
        else if (b.type === 'Composite' && b.controlProjectId !== $scope.projectId) $scope.accountCompositeBlocks.push(b);
      })
    }
  })
  $scope.$watch('basicBlocks', function(newVal, oldVal){
    if(newVal !== oldVal){
      $scope.commonBasicBlocks = checkLinkedBlocks(_.sortBy($scope.commonBasicBlocks, function(cbb){ return cbb.name.toLowerCase()}), $scope.basicBlocks);
      $scope.accountBasicBlocks = checkLinkedBlocks(_.sortBy($scope.accountBasicBlocks, function(cbb){ return cbb.name.toLowerCase()}), $scope.basicBlocks);
      $scope.marketBasicBlocks = checkLinkedBlocks(_.sortBy($scope.marketBasicBlocks, function(cbb){ return cbb.name.toLowerCase()}), $scope.basicBlocks);
    }
  })
  $scope.$watch('compositeBlocks', function(newVal, oldVal){
    if (newVal !== oldVal){
      $scope.commonCompositeBlocks = checkLinkedBlocks(_.sortBy($scope.commonCompositeBlocks, function(cbb){ return cbb.name.toLowerCase()}), $scope.compositeBlocks);
      $scope.accountCompositeBlocks = checkLinkedBlocks(_.sortBy($scope.accountCompositeBlocks, function(cbb){ return cbb.name.toLowerCase()}), $scope.compositeBlocks);
      $scope.marketCompositeBlocks = checkLinkedBlocks(_.sortBy($scope.marketCompositeBlocks, function(cbb){ return cbb.name.toLowerCase()}), $scope.compositeBlocks);
    }
  })
  var checkLinkedBlocks = function(nonPBlk, pBlk){
    _.each(pBlk, function(bb){
      _.each(nonPBlk, function(cbb){
        if (bb.id === cbb.id){
          nonPBlk = nonPBlk
            .filter(function (e) {
              return e.id !== bb.id;
            }
          );
        }
      })
    })
    return nonPBlk;
  }
  var showStateMachine = function(){
    $scope.$emit('SHOW_STATE_MACHINE');
  };
  var showCompositeView = function(){
    $scope.$emit('SHOW_COMPOSITE_VIEW');
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
    ProjectService.requestDeployKeys();
  }
  $scope.compileProject = function(){
    ProjectService.compileProject();
  }
  $scope.projectSetting = function (){
      ModalService.openModal('projectSetting');
  }
  $scope.showAlgorithm = function(){
    $scope.$emit('SHOW_ALGORITHM');
  }
  $scope.deleteBlock = function(blk){
    blkCopy = JSON.parse(JSON.stringify(blk));
    blkCopy.ngIndex = this.$index;
    if (this.$first && this.$last) blkCopy.changeType = true;
    AlertService.deleteBlockConfirm();
  }
  //FIXME: getBasic and getComposite are almost duplicated
  //TODO: combine them in one function
  var getBasic = function(obj){
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
  var getComposite = function(obj){
    if(typeof obj.blockId === 'undefined') selectedBlockId = obj.id;
    else selectedBlockId = obj.blockId;
    var bname = obj.text;
    if (typeof obj.text === 'undefined') bname = obj.name;
    CompositeBlockService.setBlockId(selectedBlockId);
    var bname = obj.text;
    if (typeof obj.text === 'undefined') bname = obj.name;
    ProjectService.setCurrentBlockName(bname);
    ProjectService.setCurrentBlockId(obj.id);
    $scope.$emit('BLOCK_CHANGED');
    var targetProject = obj.controlProjectId;
    CompositeBlockService.loadCompositeBlock(obj);
    showCompositeView();
  }
  var getStateMachine = function(obj){
    StateMachineService.setBlockId(selectedBlockId, obj);
    showStateMachine();
  }
  $scope.treeSelected = function(obj, alg){
    if (obj.controlProjectId !== $scope.projectId){
      $scope.$emit('DISABLE_BLOCK_EDIT');
    } else {
      $scope.$emit('ENABLE_BLOCK_EDIT');
    }
    if (typeof obj === 'undefined') return;
    if(!clickable) return;
    clickable = false;
    var selectedAlgorithmId;
    var getAlgorithm = function(){
      $scope.showAlgorithm();
      getBasic(obj);
      selectedAlgorithmId = alg.id
      BasicBlockService.setCurrentAlgorithm(selectedAlgorithmId);
      BasicBlockService.loadAlgorithm();
    };
    if(obj.type === 'Basic' && typeof alg === 'undefined'){
      getBasic(obj);
      $timeout(function(){
        getStateMachine(obj);
      }, 100);
      if($scope.projectId === obj.controlProjectId) ProjectService.setTopLevelBlock(selectedBlockId);
    }else if(obj.type === 'Composite' ){
      getBasic(obj);
      getComposite(obj);
      if ($scope.projectId === obj.controlProjectId) ProjectService.setTopLevelBlock(selectedBlockId);
    }else if(obj.type === 'Basic' && typeof alg !== 'undefined'){
      getAlgorithm();
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
    CompositeBlockService.setMovingBlock(parseInt(evt.target.id));
  }
  $scope.endDrag = function(evt){
    var posX = Math.round(evt.originalEvent.screenX - $('#composite-block').offset().left);
    var posY = Math.round(evt.originalEvent.screenY - ($('#composite-block').offset().top ));
    CompositeBlockService.setNewInstancePosition(posX+50, posY-150);
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
  $scope.copyBlock = function(block){
    ProjectService.setCurrentBlockName(block.name);
    ModalService.openModal('copyBlock');
  }
  $scope.openBlockDescription = function(block){
    ProjectService.setCurrentBlock(block);
    ModalService.openModal('blockDescription');
  }
  $scope.generalFilter = function (rowBlock) {
      if ($scope.searchBlock.name === undefined) return true;      
      if (rowBlock.name.toLowerCase().indexOf($scope.searchBlock.name.toLowerCase()) !== -1 || rowBlock.description.toLowerCase().indexOf($scope.searchBlock.name.toLowerCase()) !== -1 || rowBlock.tags.toLowerCase().indexOf($scope.searchBlock.name.toLowerCase()) !== -1 || rowBlock.id.toString().indexOf($scope.searchBlock.name) !== -1) {
          return true
      }else{
          return false;
      }
  }
  $scope.$on("SETTING", function(event, data){
      $scope.displayBlckId = data.BlockIdOn;
  });
}]);
