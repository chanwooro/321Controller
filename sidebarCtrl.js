'use strict';
editorApp.controller('SidebarCtrl',
[
  '$scope',
  '$rootScope',
  '$timeout',
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
  $scope.dropAllowed = false;
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
  $scope.displayBlckId = false;
  window.addEventListener('load', function(){
    ProjectService.getProject($scope.projectId);
  });
  $scope.$on('LOAD_PROJECT', function(){
    $scope.showDeleteButton = false;
    $scope.showEditButton = false;
    $scope.theProject = {};
    $scope.basicBlocks = [];
    $scope.compositeBlocks = [];
    $scope.theProject = ProjectService.getProjectData();
    $scope.projectName = $scope.theProject.name;
    setAccountSettings();
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
      $scope.commonBasicBlocks = [];
      $scope.commonCompositeBlocks = [];
      _.each(ImportExportService.getEmbeddableBlocks().commonBlocks, function(b){
        if(b.description) b.description = $sce.trustAsHtml(b.description);
        if (b.type === 'Basic' && b.controlProjectId !== $scope.projectId) $scope.commonBasicBlocks.push(b);
        else if (b.type === 'Composite' && b.controlProjectId !== $scope.projectId) $scope.commonCompositeBlocks.push(b);
      })
    }
    //for an odd reason api returns null for marketplace blocks if empty while for the rest it just returns an empty array!
    if(ImportExportService.getEmbeddableBlocks().marketplaceBlocks || ImportExportService.getEmbeddableBlocks().marketplaceBlocks === null){
      $scope.marketBasicBlocks = [];
      $scope.marketCompositeBlocks = [];
      _.each(ImportExportService.getEmbeddableBlocks().marketplaceBlocks, function(b){
        if(b.description) b.description = $sce.trustAsHtml(b.description);
        if (b.type === 'Basic' && b.controlProjectId !== $scope.projectId) $scope.marketBasicBlocks.push(b);
        else if (b.type === 'Composite' && b.controlProjectId !== $scope.projectId) $scope.marketCompositeBlocks.push(b);
      })
    }
    if(ImportExportService.getEmbeddableBlocks().accountCreatedBlocks){
      $scope.accountBasicBlocks = [];
      $scope.accountCompositeBlocks = [];
      _.each(ImportExportService.getEmbeddableBlocks().accountCreatedBlocks, function(b){
        if(b.description) b.description = $sce.trustAsHtml(b.description);
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
    var movingBlock = {
      id: parseInt(evt.target.id),
      name: ''
    }
    var allBlocks = [].concat(ImportExportService.getEmbeddableBlocks().accountCreatedBlocks, ImportExportService.getEmbeddableBlocks().commonBlocks, ImportExportService.getEmbeddableBlocks().marketplaceBlocks);
    _.each(allBlocks, function(b){
      if (b.id === movingBlock.id){
        movingBlock.name = b.name;
        return;
      }
    })
    CompositeBlockService.setMovingBlock({ id: movingBlock.id,  name: movingBlock.name });
  }
  $scope.endDrag = function(evt){
    if(!$scope.dropAllowed) return;
    var pos = CompositeBlockService.getDragOverPosition();
    CompositeBlockService.setNewInstancePosition(pos.x-50 , pos.y-50);
  }
  $scope.copyBlock = function(block){
    ProjectService.setCopyingBlock(block);
    ModalService.openModal('copyBlock');
  }
  $scope.openBlockDescription = function(block){
    ProjectService.setCurrentBlock(block);
    ModalService.openModal('blockDescription');
  }
  $scope.generalFilter = function (rowBlock) {
      if ($scope.searchBlock.name === undefined) return true;      
      if (rowBlock.name.toLowerCase().indexOf($scope.searchBlock.name.toLowerCase()) !== -1 || $sce.valueOf(rowBlock.description).toLowerCase().indexOf($scope.searchBlock.name.toLowerCase()) !== -1 || rowBlock.tags.toLowerCase().indexOf($scope.searchBlock.name.toLowerCase()) !== -1 || rowBlock.id.toString().indexOf($scope.searchBlock.name) !== -1) {
          return true
      }else{
          return false;
      }
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
  $scope.$on("SETTING", function(){
      setAccountSettings();
  });
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
      checkForDescription(currentSetting);
  }
  $scope.$on('DROP_TRUE', function(){
    $scope.dropAllowed = true;
  })
  $scope.$on('DROP_FALSE', function(){
    $scope.dropAllowed = false;
  })
}]);
