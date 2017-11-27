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
        $scope.close = function(){
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
			BasicBlockService.createInternal(internal);

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
		var initialName = CompositeBlockService.getMovingBlock().name;
		var sameNames = 0;
		var allSimilarNames = [];
		var numberArray = [];
		$scope.formName = '';
		$scope.initialState = false;
		$scope.isInit = false;
		$scope.blockName = '';
		if(requestType === 'State'){
			$scope.type = 'State';
			$scope.initialState = true;
		}
		if(requestType === 'Instance'){
			$scope.type = 'Instance';
			$scope.initialState = false;
			var cells = CompositeBlockService.getCells();
			_.each(cells, function(c){
				if(c.isLink() || c.get('iota-type') !== 'NetworkBlockInstance') return;
				if(c.attr('.label/text').substring(0,15) === 'NewInstanceOf ('){
					if(c.attr('.label/text').substring(15, 16 + initialName.length -1) === initialName)
					allSimilarNames.push(c.attr('.label/text'));
					sameNames ++;
				}
			})
			$scope.formName = 'NewInstanceOf (' + CompositeBlockService.getMovingBlock().name + ')';
			_.each(allSimilarNames, function(sn){
				var tempVal = parseInt(sn.substring($scope.formName.length + 1).split(')')[0]);
				numberArray.push(tempVal);
			})
			if (numberArray){
				for(var i = 0; i < 99; i++){
					if (numberArray.indexOf(i) === -1) { 
						$scope.formName += '(' + (i).toString() + ')';
						break;
					}
				}
			}
		}
		$scope.ok = function(){
			if(requestType === 'State'){
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
		$scope.deployDisabled = true;
		$scope.keys = ProjectService.getDeployKeys();
		$scope.blockName = ProjectService.getCurrentBlock().name;
		$scope.$watch('theKey', function(newVal, oldVal){
			if(newVal) $scope.deployDisabled = false;
		})
		$scope.ok = function(){
			ProjectService.deployBlock($scope.theKey);
			$uibModalInstance.close('closing modal');
		}
		$scope.cancel = function(){
			$uibModalInstance.dismiss('cancel');
		};
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
		$scope.blockName = ProjectService.getCopyingBlock().name + ' (copy)';
		$scope.copy = function(){
			BlockService.copyBlock($scope.blockName, ProjectService.getCopyingBlock());
			$uibModalInstance.close('closing modal');
		}
		$scope.cancel = function(){
			$uibModalInstance.dismiss('cancel');
		}
	}])
	.controller('blockDescriptionCtrl', ['$scope', '$uibModalInstance', 'ProjectService', function($scope, $uibModalInstance, ProjectService){
		$scope.blockName = ProjectService.getCurrentBlock().name;
		$scope.blockDescription = ProjectService.getCurrentBlock().description;
		$scope.closeModal = function(){
			$uibModalInstance.dismiss('dismiss');
		}
	}])
    .controller('projectSettingCtrl', ['$scope', '$rootScope', '$uibModalInstance', 'ProjectService', function($scope, $rootScope, $uibModalInstance, ProjectService){
        $scope.setting = {
			blockIdOn: false,
			tooltipOn: false, 
			descriptionOn: false,
		}
		var currentSetting = ProjectService.getAccountSetting();
        if(!currentSetting){
			//Do nothing!
        }else{
            currentSetting = JSON.parse(currentSetting);
			_.each(Object.keys(currentSetting), function(o){
				_.each(Object.keys($scope.setting), function(s){
					if (o === s){
						$scope.setting[s] = currentSetting[o];
						return;
					}else if(currentSetting[s] === undefined){
						currentSetting[s] = false;
						return;
					}
				})

			})
        }
		$scope.showWarning = function(){
			if ($scope.setting.descriptionOn && !currentSetting.descriptionOn) $scope.pageReloadWarning = true;
			else $scope.pageReloadWarning = false;
		}
        $scope.save = function(){
			if(_.isEqual(currentSetting, $scope.setting)){
				$uibModalInstance.dismiss('dismiss');
				return;
			}else{
				$scope.setting = JSON.stringify($scope.setting)
				ProjectService.setNewAccountSetting($scope.setting);
				$uibModalInstance.dismiss('dismiss');
			}
        }
 		$scope.cancel = function(){
 			 $uibModalInstance.dismiss('dismiss');
 		}
 	}])
    .controller('editPortFormCtrl', ['$scope','$uibModalInstance','BasicBlockService', 'toastr', function($scope, $uibModalInstance, BasicBlockService, toastr){
        $scope.type = BasicBlockService.getPortType();
        $scope.currentBlock = BasicBlockService.getBasicBlock();
        $scope.types = ['UNSIGNED', 'INT', 'FLOAT', 'DOUBLE', 'BOOLEAN', 'STRING', 'ANY'];
        $scope.buffers = [0,1,2,3,4,5,6,7,8,9];
        var index;
        if ($scope.type === 'Output'){
            $scope.ports = $scope.currentBlock.outputs;
            $scope.isInput = false;
        }else{            
            $scope.ports = $scope.currentBlock.inputs; 
            $scope.isInput = true;
        }
        $scope.dCopyCurrent = function (port, curIndex){
            for(var i = 0; i < $scope.ports.length; i++){
                $scope.ports[i].$edit = false;
            }
            index = curIndex;
            port.$edit = true;
            $scope.dCopyPort = JSON.parse(JSON.stringify(port))
        }        
        $scope.closeModal = function (){
            if(typeof index !== 'undefined'){
                $scope.ports[index] = $scope.dCopyPort;
                $scope.ports[index].$edit = false;
            }
            $uibModalInstance.close('Closing Modal!');
        }
        $scope.savePortChanges = function (port){
            if(!hasChanged(port)) return;
            if($scope.type === 'Output'){
                var newPort = {
                    input: $scope.isInput,
                    name: $scope.currentBlock.outputs[this.$index].name,
                    type: $scope.currentBlock.outputs[this.$index].type,
                    initialValue: $scope.currentBlock.outputs[this.$index].initialValue,
                    buffered: parseInt($scope.currentBlock.outputs[this.$index].buffered)
                }
                if (!(validation(newPort))){
                BasicBlockService.reloadBlock(ProjectService.getProjectId(), ProjectService.getCurrentBlockId());
                }else{
                    BasicBlockService.updatePort(newPort,  $scope.currentBlock.outputs[this.$index].id, $scope.dCopyPort.name);
                }
            }else{
                var newPort = {
                    input: $scope.isInput,
                    name: $scope.currentBlock.inputs[this.$index].name,
                    type: $scope.currentBlock.inputs[this.$index].type,
                    initialValue: $scope.currentBlock.inputs[this.$index].initialValue,
                    buffered: parseInt($scope.currentBlock.inputs[this.$index].buffered)
                }
                if (!(validation(newPort))){
                    BasicBlockService.reloadBlock(ProjectService.getProjectId(), ProjectService.getCurrentBlockId());
                }else{
                    BasicBlockService.updatePort(newPort,  $scope.currentBlock.inputs[this.$index].id, $scope.dCopyPort.name);
                }
            }
            port.$edit = false;
        }
        var validation = function (port){
            if(port.name === '' || typeof port.name === 'undefined'){
				toastr.error('The port name cannot be empty.', 'Error!');
				return false;
			}else{
                return true;
            }
        }
        var hasChanged = function(port){
            port.$edit = false;
            var o1 = JSON.parse(JSON.stringify(port));
            var o2 = JSON.parse(JSON.stringify($scope.dCopyPort));
            delete o1.$edit;
            delete o2.$edit;
            var arr1 = [];  
            var arr2 = [];
            var convertToArray = function(thisObj, thisArray){
              for (var key in thisObj){
                if(typeof thisObj[key] !== 'string'){
                  thisObj[key] = thisObj[key].toString();
                }
                thisArray.push(thisObj[key]);
              }
            }
            convertToArray(o1, arr1);
            convertToArray(o2, arr2);
            if(_.isEqual(arr1, arr2)){
              return false;
            }else{
              return true;
            }
        }
    }])
