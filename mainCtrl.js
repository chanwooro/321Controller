'use strict';

angular.module('editorApp').controller('MainCtrl',
[ '$scope',
  '$rootScope',
  '$http',
  '$timeout',
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
      $scope.currentBlockName = '';
      $scope.progressValue = 0;
      $scope.refreshCode = false;
      $scope.blockEdit = false;
      $scope.showTestBench = false;
      $scope.helpIcon = true;
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
        ProjectService.setTopLevelBlock(blockId);
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
      $scope.$on('RELOAD_BLOCK', function(){
        $scope.internals = BasicBlockService.getInternals();
      });
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
        BasicBlockService.updateCurrentAlgorithm($scope.algorithmName, $scope.algorithmDescription, $scope.algorithmText);
      };
      var showAlgorithm = function(){
        $scope.smWelcome = false;
        $scope.stateView = false;
        $scope.algView = true;
        $scope.compositeView = false;
        var currentAlgorithm = BasicBlockService.getCurrentAlgorithm();
        $scope.algorithmName = currentAlgorithm.name;
        $scope.algorithmDescription = currentAlgorithm.comment;
        $scope.algorithmText = currentAlgorithm.text;
        $scope.refreshCode = !$scope.refreshCode;
      };
      var showStateMachine = function(){
        $scope.smWelcome = false;
        $scope.stateView = true;
        $scope.algView = false;
        $scope.compositeView = false;
        StateMachineService.loadStateMachine();
      };
      var showCompositeView = function(){
        $scope.smWelcome = false;
        $scope.stateView = false;
        $scope.algView = false;
        $scope.compositeView = true;
      };
      $scope.contextmenuOptions = ContextmenuService.getContextmenuItems();
      $scope.deployBlock = function(){
        ProjectService.requestDeployKeys();
      };
      $scope.compileProject = function(){
        ProjectService.compileProject();
      };
      $scope.$on('SHOW_STATE_MACHINE', function(){
        showStateMachine();
      });
      $scope.$on('SHOW_COMPOSITE_VIEW', function(){
        showCompositeView();
      });
      $scope.editCurrentBlock = function(){
        ModalService.openModal('editBasicBlock');
      };
      $scope.$on('DEFAULT_VIEW', function(){
        $scope.stateView = false;
        $scope.compositeView = false;
        $scope.currentBlockName = ''
      });
    }
  ]
);
