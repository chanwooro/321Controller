'use strict';
// TODO: there must be a way for simplifying this!
angular.module('editorApp')
	.controller('NewAlgorithmFormCtrl', ['$scope', '$uibModalInstance', 'BasicBlockService', function($scope, $uibModalInstance, BasicBlockService){
		$scope.algorithmName = '';
		$scope.algorithmDescription = '';
		var newAlgorithm = {};
		$scope.ok = function(){
			newAlgorithm = {
				name: $scope.algorithmName,
				comment: $scope.algorithmDescription,
				text: ';'
			}
			BasicBlockService.setNewAlgorithm(newAlgorithm);
			BasicBlockService.createAlgorithm();
    	$scope.algorithmName = '';
    	$scope.algorithmDescription = '';
			$uibModalInstance.close('closing modal');
		}
	}])
	.controller('EditGuardFormCtrl', ['$scope', '$uibModalInstance', function($scope, $uibModalInstance){
		$scope.guardName = 'true';
		$scope.ok = function(){
			$uibModalInstance.close('closing modal');
		};
		$scope.cancel = function(){
			$uibModalInstance.dismiss('cancel');
		};
	}])
	.controller('NewBlockFormCtrl',['$scope','$uibModalInstance', 'BlockService', 'toastr', function($scope, $uibModalInstance, BlockService, toastr){
		$scope.blockName = '';
		$scope.blockTypes = BlockService.getBlockTypes();
		var blockData = {};
		$scope.ok = function () {
			blockData = {
				name: $scope.blockName,
				type: $scope.selectedType
			}
			if(blockData.name === '' || typeof blockData.name === 'undefined'){
				toastr.error('Block name is required to create a block', 'Error!');
				return;
			}else if(typeof blockData.type === 'undefined'){
				toastr.error('Please select correct block type', 'Error!');
				return;
			}
			BlockService.setNewBlockData(blockData);
			BlockService.createNewBlock();
	    	$scope.blockName = '';
	    	$scope.selectedType = '';
	    	$uibModalInstance.close('closing modal');
	  	};
		$scope.cancel = function () {
			$uibModalInstance.dismiss('cancel');
		};
	}])
	.controller('NewInputOutputFormCtrl', ['$scope', '$uibModalInstance', 'ModalService', 'BasicBlockService', 'toastr', function($scope, $uibModalInstance, ModalService, BasicBlockService, toastr){
		$scope.portType = BasicBlockService.getPortType();
		var newPort = {};
		$scope.types = ['UNSIGNED', 'INT', 'FLOAT', 'DOUBLE', 'BOOLEAN', 'STRING', 'ANY'];
		$scope.selectedType = $scope.types[0];
		$scope.name;
		$scope.buffers = [0,1,2,3,4,5,6,7,8,9];
		$scope.selectedBuffer = $scope.buffers[0].toString();
		var buffer = parseInt($scope.selectedBuffer);
		$scope.ok = function(){
        newPort = {
				name: $scope.name,
				type: $scope.selectedType,
				initialValue: '0',
				buffered: buffer
			}
			if($scope.portType === 'Input')
				newPort.input = true;
			if($scope.portType === 'Output')
				newPort.input = false;
			if($scope.name === '' || typeof $scope.name === 'undefined'){
				toastr.error('The block name cannot be empty.', 'Error!');
				$uibModalInstance.close();
				return;
			}
			BasicBlockService.createPort(newPort);
			$uibModalInstance.close();
		}
	}])
	.controller('DeletePortFormCtrl', ['$scope','$uibModalInstance','BasicBlockService', function($scope, $uibModalInstance, BasicBlockService){
		$scope.portType = BasicBlockService.getPortType();
		$scope.selectedPorts = [];
		$scope.selectedInternals = [];
		$scope.showPorts = false;
		$scope.showInternals = false;
		// TODO: this is a very dirty way of doing this. find a cleaner sloution
		if ($scope.portType === 'Input' || $scope.portType === 'Output'){
			$scope.showPorts = true;
			$scope.showInternals = false;
		}
		if ($scope.portType === 'Internal'){
			$scope.showPorts = false;
			$scope.showInternals = true;
		}
		if ($scope.portType === 'Input')
			$scope.ports = BasicBlockService.getInputPorts();
		if ($scope.portType === 'Output')
			$scope.ports = BasicBlockService.getOutputPorts();
		if ($scope.portType === 'Internal')
			$scope.internals = BasicBlockService.getInternals();
		$scope.ok = function(){
			if($scope.showPorts){
				$("input:checkbox[name=portName]:checked").each(function(){
	    			$scope.selectedPorts.push($(this).val());
				});
				BasicBlockService.setSelectedPorts($scope.selectedPorts);
				BasicBlockService.deletePort();
			};
			if($scope.showInternals){
				$("input:checkbox[name=internalName]:checked").each(function(){
	    			$scope.selectedInternals.push($(this).val());
				});
				BasicBlockService.setSelectedInternals($scope.selectedInternals);
				BasicBlockService.deleteInternal();
			};
			$uibModalInstance.close('Closing Modal!');
		}
	}])
	.controller('NewInternalFormCtrl', ['$scope', '$uibModalInstance', 'BasicBlockService', function($scope, $uibModalInstance, BasicBlockService){
		$scope.name = '';
		$scope.value = '';
		$scope.types = ['UNSIGNED', 'INT', 'FLOAT', 'DOUBLE', 'BOOLEAN', 'STRING', 'ANY'];
		var internal = {
			name: '',
			value: '',
			type: ''
		}
		$scope.selectedType = $scope.types[0];
		$scope.ok = function(){

			internal = {
				name: $scope.name,
				value: $scope.value,
				type: $scope.selectedType
			}
			// TODO: can combine these two. Is it a good practice?
			BasicBlockService.setNewInternal(internal);
			BasicBlockService.createInternal();

			$uibModalInstance.close('Closing Modal!');
		}
		$scope.cancel = function(){
			$uibModalInstance.dismiss('cancel');
		}
	}])
	.controller('EditInternalFormCtrl', ['$scope', '$uibModalInstance', 'InternalsService', function($scope, $uibModalInstance, InternalsService){
		$scope.name = '';
		$scope.types = ['UNSIGNED', 'INT', 'FLOAT', 'DOUBLE', 'BOOLEAN', 'STRING', 'ANY'];
		$scope.selectedType = $scope.types[0];
		$scope.ok = function(){
			$uibModalInstance.close('Closing Modal!');
		}
		$scope.cancel = function(){
			$uibModalInstance.dismiss('cancel');
		}
	}])
	.controller('NewStateFormCtrl', ['$scope', '$uibModalInstance', 'StateMachineService', 'CompositeBlockService', 'ModalService', function($scope, $uibModalInstance, StateMachineService, CompositeBlockService, ModalService){
		var requestType = ModalService.getType();
		$scope.formName = '';
		$scope.initialState = false;
		$scope.isInit = false;
		if(requestType === 'Instance'){
			$scope.type = 'Instance';
			$scope.initialState = false;
		}
		if(requestType === 'State'){
			$scope.type = 'State';
			$scope.initialState = true;
		}
		$scope.ok = function(){
			if(requestType === 'State'){
				console.log($scope.isInit);
				StateMachineService.setNewStateInfo($scope.formName, $scope.isInit);
				StateMachineService.createNewState();
			}
			if (requestType === 'Instance'){
				CompositeBlockService.setNewInstanceName($scope.formName);
				CompositeBlockService.createNewBlockInstance();
			}
			$uibModalInstance.close('closing modal');
	    	$scope.formName = '';
		}
	}])
	.controller('EditStateFormCtrl', ['$scope', '$uibModalInstance', 'StateMachineService', function($scope, $uibModalInstance, StateMachineService){
		$scope.state = StateMachineService.getStateInfo();
		$scope.ok = function(){
			StateMachineService.setStateInfo($scope.state.name, $scope.state.isInitial);
			$uibModalInstance.close('closing modal');
	    	$scope.state.name = '';
	    	$scope.state.isInitial = false;
		}
	}])
	.controller('EditBlockNameFormCtrl', ['BasicBlockService', '$scope', '$uibModalInstance', function(BasicBlockService, $scope, $uibModalInstance){
		//TODO: get block name from block service
		$scope.blockName = BasicBlockService.getName();
		$scope.ok = function(){
			BasicBlockService.setName($scope.blockName);
			$scope.blockName = '';
			$uibModalInstance.close('closing modal');
			//TODO: run blockname change in Block service
		}
	}])
	.controller('AlgorithmsFormCtrl', ['$scope', '$timeout', '$uibModalInstance', 'BasicBlockService', 'StateMachineService', function($scope, $timeout, $uibModalInstance, BasicBlockService, StateMachineService){
		$scope.algorithms = [];
		$scope.addingAlgorithms = [];
		$scope.existingAlgorithms = [];
		$scope.deletingAlgorithms = [];
		$scope.existingAlgorithms = StateMachineService.getExistingAlgorithms();
		$scope.algorithms = BasicBlockService.getAlgorithms();
		for (var i in $scope.algorithms){
			$scope.algorithms[i].checked = false;
		}
		for (var i in $scope.algorithms){
			_.each($scope.existingAlgorithms, function(e){
				if($scope.algorithms[i].id === e){
					$scope.algorithms[i].checked = true;
				}
			});
		};
		$scope.ok = function(){
			$("input:checkbox[name=algorithmName]").each(function(){
				if($(this).prop('checked')){
		    		$scope.addingAlgorithms.push(parseInt($(this).val()));
				}else{
					$scope.deletingAlgorithms.push(parseInt($(this).val()));
				}
			});
			StateMachineService.setSelectedAlgorithms($scope.addingAlgorithms, $scope.deletingAlgorithms);
			$uibModalInstance.close('closing modal');
		}
	}])
	.controller('ConfirmFormCtrl', ['$rootScope', '$scope', '$uibModalInstance', 'ContextmenuService', function($rootScope, $scope, $uibModalInstance, ContextmenuService){
		$scope.ok = function(){
			var message =  ContextmenuService.getBroadcastAttr();
			$rootScope.$broadcast(message);
			$uibModalInstance.close('closing modal');
		}
		$scope.cancel = function(){
			$uibModalInstance.dismiss('cancel');
		}
	}])
	.controller('EditTransitionFormCtrl', ['StateMachineService', '$scope', '$uibModalInstance', function(StateMachineService, $scope, $uibModalInstance){
		$scope.transitionCondition = '';
		$scope.transitionCondition = StateMachineService.getCondition();
		$scope.ok = function(){
			StateMachineService.setCondition($scope.transitionCondition);
			$scope.transitionCondition = '';
			$uibModalInstance.close('closing modal');
		}
	}])
	.controller('DeployFormCtrl', ['$scope', '$uibModalInstance', 'ProjectService', function($scope, $uibModalInstance, ProjectService){
		$scope.keys = ProjectService.getDeployKeys();
		$scope.ok = function(){
			ProjectService.deployBlock($scope.theKey);
			$uibModalInstance.close('closing modal');
		}
		$scope.cancel = function(){
			$uibModalInstance.dismiss('cancel');
		};
	}])
	.controller('NewConstantFormCtrl', ['$scope', '$uibModalInstance', 'ProjectService', 'CompositeBlockService', function($scope, $uibModalInstance, ProjectService, CompositeBlockService){
		$scope.constantValue = '';
		$scope.ok = function(){
			CompositeBlockService.setCurrentConstantName($scope.constantValue);
			$uibModalInstance.close('closing modal');
		}
		$scope.cancel = function(){
			CompositeBlockService.deleteLink();
			$uibModalInstance.dismiss('cancel');
		}
	}])
	.controller('exportBlocksModalCtrl',  ['$scope', '$uibModalInstance', 'ImportExportService', 'ProjectService', function($scope, $uibModalInstance, ImportExportService, ProjectService){
		$scope.theProject
		$scope.bbs = [];
		$scope.cbs = [];
		$scope.theProject = ProjectService.getProjectData();
		_.each($scope.theProject.blocks, function(b){
			if (b.type === 'Composite') $scope.cbs.push(b);
			if (b.type === 'Basic') $scope.bbs.push(b);
		})
		$scope.bbs = _.sortBy($scope.bbs, function(bb){ return bb.name });
		$scope.cbs = _.sortBy($scope.cbs, function(cb){ return cb.name });
		$scope.selectedBlocks = [];
		$scope.ok = function(){
			$("input:checkbox[name=blockName]:checked").each(function(){
					$scope.selectedBlocks.push(parseInt($(this).val()));
			});
			if ($scope.selectedBlocks.length > 0 ) ImportExportService.exportBlocks(ProjectService.getProjectId(), $scope.selectedBlocks);
			$uibModalInstance.close('closing modal');
		}
		$scope.cancel = function(){
			$uibModalInstance.dismiss('cancel');
		}
	}])
	.controller('CopyBlockCtrl', ['$scope', '$uibModalInstance', 'ProjectService', 'BlockService', function($scope,  $uibModalInstance, ProjectService, BlockService){
		$scope.blockName = ProjectService.getCurrentBlockName()
		$scope.copy = function(){
			BlockService.copyBlock($scope.blockName, ProjectService.getCurrentBlockId());
			$uibModalInstance.close('closing modal');
		}
		$scope.cancel = function(){
			$uibModalInstance.dismiss('cancel');
		}
	}])
	.controller('blockDescriptionCtrl', ['$scope', '$uibModalInstance', 'ProjectService', '$sce', function($scope, $uibModalInstance, ProjectService, $sce){
		$scope.blockName = ProjectService.getCurrentBlock().name;
		$scope.blockDescription = $sce.trustAsHtml(ProjectService.getCurrentBlock().description);
		$scope.closeModal = function(){
			$uibModalInstance.dismiss('dismiss');
		}
	}])
    .controller('projectSettingCtrl', ['$scope', '$rootScope', '$uibModalInstance', 'ProjectService', function($scope, $rootScope, $uibModalInstance, ProjectService){
        $scope.showBlockId = false;
        $scope.showTooltip = false;
        $scope.save = function(){
            var data = { BlockIdOn: $scope.showBlockId, tooltipOn: $scope.showTooltip};
            $rootScope.$broadcast("SETTING", data);
            $uibModalInstance.dismiss('dismiss');
        }
		$scope.cancel = function(){
			$uibModalInstance.dismiss('dismiss');
		}
	}])
