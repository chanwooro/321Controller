'use strict';

angular.module('editorApp').controller('MainCtrl',
[ '$scope',
  '$rootScope',
  '$http',
  '$timeout',
  '$mixpanel',
  'ProjectService',
  'StateMachineService',
  'ModalService',
  'ContextmenuService',
  'BasicBlockService',
  'BlockService',
  'CompositeBlockService',
  'WebsocketService',
  function(
    $scope,
    $rootScope,
    $http,
    $timeout,
    $mixpanel,
    ProjectService,
    StateMachineService,
    ModalService,
    ContextmenuService,
    BasicBlockService,
    BlockService,
    CompositeBlockService,
    WebsocketService
    ){
      $scope.emptyProject = false;
      $scope.curentBlockName = '';
      $scope.mainView = true;
      $scope.smView = true;
      $scope.algView = false; //Do I even need this shit?
      $scope.stateView = false;
      $scope.welcome = true;
      $scope.smWelcome = true;
      $scope.targetId = '';
      $scope.messageOfTheDay = 'To begin, right click in the navbar to make a new block.'
      $scope.algorithmName = '';
      $scope.algorithmDescription = '';
      $scope.algorithmText = '';
      $scope.progressValue = 0;
      $scope.refreshCode = false;
      $scope.blockEdit = false;
      $scope.showTestBench = false;
      $scope.tabList = [];
      $scope.selectedTabId = -1;
      //Tab variables
      $scope.tabWidth = $('#mainTab').width();
      $scope.tWidth = 160;
      var defaultTabNumber = parseInt($scope.tabWidth/160);
      ProjectService.loadAccountSetting();
      $scope.$on("LOAD_USER", function(){
        var currentUser = ProjectService.getCurrentUser();
        $mixpanel.identify(currentUser.id);
        $mixpanel.people.set({
           "$username": currentUser.username,
           "$last_login": new Date(),
           "$first_name": currentUser.firtName,
           "$last_name": currentUser.familyName,
           "$name": currentUser.firtName + " " + currentUser.familyName
        });
      });
      $mixpanel.track("Editor Page Loaded", {"Page Name": "Editor Page"});
      $scope.$on('BLOCK_CHANGED', function(){
        $scope.currentBlockName = ProjectService.getCurrentBlockName();
        $scope.currentBlockId = ProjectService.getCurrentBlockId();
        if(!$scope.showTestBench){
          //you need to set this to true for testing
          //I've set it to false so that after merge with editor it won't showup on staging and production
          //since this is still in progress...
          $scope.showTestBench = false;
        }
      })
      var loadingBar = document.getElementById('loading-bar');
      if(loadingBar !== undefined && loadingBar !== null){
        loadingBar.style.zIndex = -1;
        $scope.$on('START_LOADING', function(){
          $scope.progressValue = 0;
          loadingBar.style.zIndex = 10;
          if($scope.maxProgress === 0)
          loadingBar.style.zIndex = -1;
        });
        $scope.$on('BLOCK_LOADED', function(){
          $scope.progressValue++;
          if($scope.progressValue === $scope.maxProgress){
            $timeout(function(){
              $scope.progressValue = 0;
              loadingBar.style.zIndex = -1;
            }, 1000);
          }
        });
      }
      $scope.$on('GET_CONDITION', function(){
        ModalService.openModal('editTransition');
      });
      // TODO: make jstree to always load the block 1 on relead.
      var blockId;
      var projectId = ProjectService.getProjectId();
      var algorithmId = 0;
      var currentAlgorithm = {};
      // TODO: the project and block Id will be passed by the system
      // TODO: all the services must get the project ID from the same place
      // Try to remove the duplicated functions.
      $scope.$on('OPEN_DEPLOY', function(){
        // TODO: find a way to execute these two function asynchronously!
        ProjectService.setDeployBlock(blockId);
        ModalService.openModal('deploy');
      })
      $scope.deployProject = function(){
        ProjectService.requestDeployKeys();
      }
      BlockService.getProjectId(projectId);
      //TODO: create a editor service and controller.
      $scope.editorOptions = {
        lineWrapping : true,
        lineNumbers: true,
        theme: 'eclipse',
        mode: 'clike'
      };
      $scope.$on('DISABLE_BLOCK_EDIT', function(){
        $scope.editorOptions.readOnly = true;
        $("#algName").prop('disabled', true);
        $("#algDescription").prop('disabled', true);
        $scope.blockEdit = false;
      })
      $scope.$on('ENABLE_BLOCK_EDIT', function(){
        $scope.editorOptions.readOnly = false;
        $("#algName").prop('disabled', false);
        $("#algDescription").prop('disabled', false);
        $scope.blockEdit = true;
      })
      $scope.internals = BasicBlockService.getInternals();
      $scope.algLists = BasicBlockService.getAlgorithms();
      $scope.$on('RELOAD_BLOCK', function(){
        $scope.internals = BasicBlockService.getInternals();
        $scope.algLists = BasicBlockService.getAlgorithms();
        blckModify('update');
        //Check whether currentDeleted algorithm exists in alg lists in RSP but exists in main editor tab
      });
      $scope.$on('DELETE_BLOCK', function(){
         blckModify('delete');
      });
      var blckModify = function(state){
        var dCopyChangedBlock = JSON.parse(JSON.stringify(BasicBlockService.getBasicBlock()))
        var changedIndex = _.findIndex($scope.tabList, function(algs){ return algs.type !== 'algorithm' && algs.id === dCopyChangedBlock.id;
        });
        if(changedIndex !== -1 && $scope.tabList[changedIndex].name !== dCopyChangedBlock.name && state === 'update'){
            $scope.tabList[changedIndex].name = dCopyChangedBlock.name;
            $scope.currentBlockName = dCopyChangedBlock.name;
            _.each($scope.tabList, function(tab){
                if(tab.type === 'algorithm' && tab.blockId === $scope.tabList[changedIndex].id) tab.blockName = $scope.tabList[changedIndex].name;       
            });
        }else if(changedIndex !== -1 && state === 'delete'){
            $scope.tabList.splice(changedIndex, 1);
            var tabLength = $scope.tabList.length;
            var i = 0;
            if(tabLength <= 0 ){
                $scope.$broadcast('DEFAULT_VIEW');
                return;
            }
            while(i < tabLength){
                if($scope.tabList[i].type === 'algorithm' && $scope.tabList[i].blockId === dCopyChangedBlock.id){
                    $scope.tabList.splice(i,1);
                    tabLength--;
                }else{
                    i++;
                }
            }
            $scope.changeTab(0, 'FORCE_CHANGE');
            resizeTab();
        }
      }
      $scope.$on("UPDATE_ALG", function(){
        var updatedAlgIndex = _.findIndex($scope.tabList, function(algs){ return algs.type === 'algorithm' && algs.id === BasicBlockService.getCurrentAlgorithm().id && algs.blockId === $scope.currentBlockId
        });
        $scope.tabList[updatedAlgIndex].comment = BasicBlockService.getCurrentAlgorithm().comment;
        $scope.tabList[updatedAlgIndex].name = BasicBlockService.getCurrentAlgorithm().name;
        $scope.tabList[updatedAlgIndex].text = BasicBlockService.getCurrentAlgorithm().text;
      });
      $scope.$on('RESIZE_TAB', function(){
        $scope.tabWidth = $('#mainTab').width()
        defaultTabNumber = parseInt($scope.tabWidth/160)
        resizeTab();
        $scope.$apply();//I need sort out this digesting change. or maybe more like chrome (in performance)
      });
      var resizeTab = function(){
          if(defaultTabNumber >= $scope.tabList.length){
              $scope.tWidth = 160;
          }else if(defaultTabNumber < $scope.tabList.length){
              var newTabSize = parseInt($scope.tabWidth/$scope.tabList.length);
              $scope.tWidth = newTabSize;
          }
      }
      $scope.hideWelcome = function(){
      	if($scope.welcome)
          $scope.welcome = !$scope.welcome;
      };
      $scope.hideSmWelcome = function(){
        if($scope.smWelcome && !$scope.stateView && !$scope.algView){
          $scope.smWelcome = false;
          $scope.stateView = true;
        }
      };
      $scope.$on('GOTO_ALGORITHM', function () {
        showAlgorithm();
      });
      // FIXME: I don't know why the BlockService can't listen to the freaking broadcast!
      $scope.$on('CREATE_BLOCK', function(){
        ModalService.openModal('newBlock');
      });
      $scope.saveAlgorithm = function(){
        BasicBlockService.setBlockId($scope.currentBlockId);
        BasicBlockService.updateCurrentAlgorithm($scope.algorithmName, $scope.algorithmDescription, $scope.algorithmText);
      };
      //needs account id for block distinguish
      var showAlgorithm = function(){
        $scope.mainView = false;
        $scope.smWelcome = false;
        $scope.algView = true;
        algorithmTabAdder(BasicBlockService.getCurrentAlgorithm());
      };
      $scope.changeTab = function(index, trig){
        if($scope.selectedTabId === index && !trig) return;
        $rootScope.defaultTab[0].active = true;  
        $scope.selectedTabId = index;
        if($scope.tabList[index].type === 'Basic'){
            $scope.blockType = 'Basic';
            $scope.mainView = true;
            $scope.stateView = true;
            $scope.algView = false;
            $scope.compositeView = false;
            if($scope.currentBlockId !== $scope.tabList[index].id){ //Prevent reloading block switch tab from alg to block (related block)
                $scope.currentBlockId = $scope.tabList[index].id;
                $scope.currentBlockName = $scope.tabList[index].name;
                BasicBlockService.reloadBlock($scope.tabList[index].controlProjectId, $scope.tabList[index].id)
            }
            StateMachineService.setBlockId($scope.tabList[index].id, $scope.tabList[index]);
            StateMachineService.loadStateMachine();
        }else if($scope.tabList[index].type === 'Composite'){
            $scope.blockType = 'Composite'
            $scope.currentBlockId = $scope.tabList[index].id;
            $scope.currentBlockName = $scope.tabList[index].name;
            BasicBlockService.reloadBlock($scope.tabList[index].controlProjectId, $scope.tabList[index].id)
            $timeout(function(){
                CompositeBlockService.setBlockId($scope.tabList[index].id);
                CompositeBlockService.loadCompositeBlock($scope.tabList[index]);
                showCompositeView();
            },100)
        }else{
            $scope.blockType = 'Basic';
            $scope.algView = true;
            $scope.mainView = false;
            if($scope.currentBlockId !== $scope.tabList[index].blockId){
                $scope.currentBlockId = $scope.tabList[index].blockId;
                $scope.currentBlockName = $scope.tabList[index].blockName;
                BasicBlockService.reloadBlock($scope.tabList[index].controlProjectId, $scope.tabList[index].blockId);
            }
            $scope.algorithmName = $scope.tabList[index].name;
            $scope.algorithmDescription = $scope.tabList[index].comment;
            $scope.algorithmText = $scope.tabList[index].text;
            $scope.refreshCode = !$scope.refreshCode;           
            BasicBlockService.setCurrentAlgorithm($scope.tabList[index].id);
        }
      }
      $scope.removeTab = function(tab){
          $scope.tabList.splice(tab,1)
          if($scope.tabList.length <= 0){
              $scope.$broadcast('DEFAULT_VIEW');
              return;
          }
          //Select Next Tab after delete
          if ($scope.selectedTabId === 0 && tab === 0){
              $scope.changeTab(0, 'FORCE_CHANGE');
          }else if (tab > $scope.selectedTabId){
              $scope.changeTab($scope.selectedTabId);
          }else{
              $scope.changeTab($scope.selectedTabId-1);
          }
          $timeout(function(){
              resizeTab();
          }, 250)
      }
      var showStateMachine = function(){
        $scope.smWelcome = false;
        $scope.mainView = true;
        $scope.stateView = true;
        $scope.algView = false;
        $scope.compositeView = false;
      };
      var showCompositeView = function(){
        $scope.smWelcome = false;
        $scope.stateView = false;
        $scope.algView = false;
        $scope.compositeView = true;
        $scope.mainView = true;
        var svg = document.getElementById('composite-block').querySelector('svg');
        // Create an SVGPoint for future math
        var pt = svg.createSVGPoint();
        // Get point in global SVG space
        var loc = {};
        var cursorPoint = function(evt){
        pt.x = evt.clientX; 
        pt.y = evt.clientY;
          return pt.matrixTransform(svg.getScreenCTM().inverse());
        }
        svg.removeEventListener('dragover', false);
        svg.addEventListener('dragover', function(evt){
          loc = cursorPoint(evt);
          CompositeBlockService.setDragOverPosition(loc);
        },false);
      };
      var tabAdder = function(blckObj){
        var targetBlock = blckObj;
        if(blckObj.name === undefined) targetBlock = BasicBlockService.getBasicBlock()
        var existingIndex = _.findIndex($scope.tabList, function(block){ return block.id === targetBlock.id && block.type !== 'algorithm'});
        if(existingIndex !== -1){
          $scope.changeTab(existingIndex)
          return;
        }
        if(targetBlock.type === 'Basic') {
            $scope.blockType = 'Basic';
            StateMachineService.loadStateMachine();
        }else{
            $scope.blockType = 'Composite';
            CompositeBlockService.loadCompositeBlock(targetBlock);
        }
        $scope.tabList.push(targetBlock);
        $scope.selectedTabId = $scope.tabList.length-1;
        $scope.currentBlockId = targetBlock.id
        resizeTab();
      };
      var algorithmTabAdder = function (algObj){
        var targetAlg = algObj;
        var parentBlock = BasicBlockService.getBasicBlock();
        var existingIndex = _.findIndex($scope.tabList, function(block){ return block.blockId === parentBlock.id &&  block.id === targetAlg.id});
        if(existingIndex !== -1){
          $scope.changeTab(existingIndex)
          return;
        }
        var algIndexRSP = _.findIndex($scope.algLists, function(algs){return algs.id === targetAlg.id;});
        var extraData = {
            blockId: $scope.currentBlockId,
            blockName: $scope.currentBlockName,
            controlProjectId: ProjectService.getProjectId() //Not 100% sure.
        }
        $scope.tabList.push(angular.extend($scope.algLists[algIndexRSP], extraData));
        var newTabIndex = $scope.tabList.length - 1;
        $scope.selectedTabId = newTabIndex;
        $scope.algorithmName = $scope.tabList[newTabIndex].name;
        $scope.algorithmDescription = $scope.tabList[newTabIndex].comment;
        $scope.algorithmText = $scope.tabList[newTabIndex].text;
        $scope.refreshCode = !$scope.refreshCode;
        resizeTab();  
      }    
      $scope.contextmenuOptions = ContextmenuService.getContextmenuItems();
      $scope.deployBlock = function(){
        ProjectService.requestDeployKeys();
      };
      $scope.compileProject = function(){
        ProjectService.compileProject();
      };
      $scope.$on('SHOW_STATE_MACHINE', function(event, blck){
        tabAdder(blck);
        showStateMachine();
      });
      $scope.$on('SHOW_COMPOSITE_VIEW', function(event, blck){
        tabAdder(blck)
        showCompositeView();
      });
      $scope.editCurrentBlock = function(){
        ModalService.openModal('editBasicBlock');
      };
      $scope.$on('DEFAULT_VIEW', function(){
        $scope.stateView = false;
        $scope.compositeView = false;
        $scope.algView = false;
        $scope.mainView = true;
        $scope.currentBlockName = ''
      });
    }
  ]
);
