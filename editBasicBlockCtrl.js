editorApp.controller('editBasicBlockCtrl',
['$scope',
 '$sce',
 '$uibModalInstance',
 'ngTableParams',
 'BasicBlockService',
 'ProjectService',
 'LibrariesService',
 'BlockLogosService',
 'ImportExportService',
 'toastr',
 'AlertService',
 '$timeout',
 function(
   $scope,
   $sce,
   $uibModalInstance,
   ngTableParams,
   BasicBlockService,
   ProjectService,
   LibrariesService,
   BlockLogosService,
   ImportExportService,
   toastr,
   AlertService,
   $timeout
 ){
 var imageFiles;
 $scope.loadedBlock = BasicBlockService.getBasicBlock();
 $scope.loadedBlockCopy = $.extend(true, {}, $scope.loadedBlock); //Deep copy ;)
 $scope.showAlg = { edit: false, delete: false, confirms: false };
 $scope.showInput = {edit: false, delete: false, confirms: false };
 $scope.showOutput = {edit: false, delete: false, confirms: false};
 $scope.showInt = {edit: false, delete: false, confirms: false};
 $scope.showLib = {edit: false, delete: false, confirms: false};
 $scope.showNameChange = false;
 $scope.newAlgRequest = {}
 $scope.selectedLibrary = {};
 $scope.basicBlockName = '';
 $scope.showEditName = false;
 $scope.types = ['UNSIGNED', 'INT', 'FLOAT', 'DOUBLE', 'BOOLEAN', 'STRING', 'ANY'];
 $scope.buffers = [0,1,2,3,4,5,6,7,8,9];
 $scope.mode = 'NONE';
 $scope.showSave = false;
 $scope.blockColor = '';
 $scope.hasImage = false;
 $scope.tags = [];
 $scope.baseBlockLogoUrl = window.location.protocol + '//' + window.location.host + '/api/' + "block/logo/";
 $scope.blockLogoUrl = $scope.baseBlockLogoUrl + $scope.loadedBlock.id;
 $scope.linkedLibraries = [];
 $scope.startupCode = {
   value: $scope.loadedBlock.startupCode
 }
 $scope.objDCopy = {}
 var tagsDCopy;
 $scope.tagLists = {};
 var taggingRecord = false;
 var plainText = ''
 $scope.noteSetting = {
     height: 300,
     focus: true,
     disableDragAndDrop: false,
     toolbar: [
       ['style', ['bold', 'italic', 'underline', 'superscript']],
       ['textsize', ['fontsize']],
       ['fontface', ['fontname']],
       ['headline', ['style']],
       ['fontclr', ['color']],
       ['edit',['undo','redo']],
       ['alignment', ['ul', 'ol', 'paragraph', 'lineheight']],
       ['insert', ['link', 'picture', 'video']],  
       ['help', ['help']]
     ]
 }
 var placeHolder = 'img/BlockImagePlaceHolder.png';
 $scope.blockImage = placeHolder; //grabs the file from image upload directive!
 LibrariesService.loadEmbeddableLibraries();
 $scope.$on('EMBEDDABLE_LIBS_LOADED', function(){
   $scope.embeddableLibraries = LibrariesService.getEmbeddableLibraries();
 })
 var currentBlockInfo = { name:'', description: '', tags: ''};
 $scope.$on('RELOAD_BLOCK', function(){
   $scope.tags = [];
   $scope.linkedLibrares = [];
   $scope.loadedBlock = BasicBlockService.getBasicBlock();
   $scope.blockLogoUrl = $scope.baseBlockLogoUrl + $scope.loadedBlock.id;
   $scope.basicBlockName = [{
       name: $scope.loadedBlock.name,
       description: $scope.loadedBlock.description,
       tags: $scope.loadedBlock.tags
   }];
   $scope.blckDescription = $sce.trustAsHtml($scope.basicBlockName[0].description);
   $scope.showEditName = true;
   $scope.tagLists = $scope.loadedBlock.tags.split(',');
   _.every($scope.tagLists, function(data){
      if($scope.tagLists.length === 1 && $scope.tagLists[0] === '') return;
      var theTag = {text: data}
      return $scope.tags.push(theTag);
   });
   _.each($scope.loadedBlock.libraries, function(l){
     var link = {id: l.id};
     $scope.linkedLibraries.push(link);
   })
 });
 if($scope.loadedBlock.blockImageId === 0 || $scope.loadedBlock.blockImageId === undefined ) $scope.hasImage = false;
 else $scope.hasImage = true;
 //Editable
 $scope.tableEdit = new ngTableParams({
     page: 1,            // show first page
     count: 10           // count per page
 }, {
     total: $scope.loadedBlock.inputs
 });
 $scope.editorOptions = {
   lineWrapping : true,
   lineNumbers: false,
   theme: 'eclipse',
   mode: 'clike'
 };
 $scope.hideSave = function(){
   $scope.showSave = false;
 }
 $scope.refreshCode = true ;
 $scope.refreshTheCode = function(){
   $scope.showSave = true;
   $scope.refreshCode = !$scope.refreshCode;
 }
 // ---- algorithms -----
 $scope.addAllgorithm = function(){
   $scope.mode = 'ADD_ALG';
   var newAlg = {
     comment: '',
     id: 0,
     name: '',
     text: ';'
   }
   if($scope.loadedBlock.algorithms === undefined || $scope.loadedBlock.algorithms === null){
     $scope.loadedBlock.algorithms = []
     $scope.loadedBlock.algorithms.push(newAlg);
   }else{
     $scope.loadedBlock.algorithms.push(newAlg);
   }
   $scope.showAlg.delete = false;
   $scope.showAlg.confirms = true;
   _.last($scope.loadedBlock.algorithms).$edit = true;
 }
 $scope.removeAlgorithm = function(){
   $scope.mode = 'REMOVE_ALG';
   $scope.showAlg.delete = true;
   $scope.showAlg.edit = false;
   $scope.showAlg.confirms = true;
 }
 $scope.deleteAlgorithm = function(alg){
   BasicBlockService.setCurrentAlgorithm(alg);
   BasicBlockService.deleteAlgorithm(alg);
 }
 $scope.editAlgorithm = function(){
   $scope.mode = 'EDIT_ALG';
   $scope.showAlg.delete = false;
   $scope.showAlg.confirms = true;
 }
 $scope.saveAlgChanges = function(algorithm){
   if(!hasChanged(algorithm)){
     return;
   }
   var currentAlg = $scope.loadedBlock.algorithms[this.$index];
   var newAlgRequest = {
     name: $scope.loadedBlock.algorithms[this.$index].name,
     comment: $scope.loadedBlock.algorithms[this.$index].comment,
     text: ';'
   }
   if($scope.mode === "ADD_ALG"){
     if (!validate('algorithm', currentAlg)){
         $scope.loadedBlock.algorithms.splice(this.$index);
     }else{
       BasicBlockService.setNewAlgorithm(newAlgRequest);
       BasicBlockService.createAlgorithm();
     }
   }
   if($scope.mode === "EDIT_ALG"){
     if(!validate('algorithm', currentAlg)){
       //Do nothing!
     }else{
       var calg = $scope.loadedBlock.algorithms[this.$index];
       BasicBlockService.setCurrentAlgorithm(calg.id);
       BasicBlockService.updateCurrentAlgorithm(calg.name, calg.comment, calg.text);
     }
   }
   $scope.showAlg.delete = false;
   $scope.showAlg.edit = false;
   $scope.showAlg.confirms = false;
 }
 $scope.ignoreAlgChanges = function(){
   $scope.mode = 'NONE'
   $scope.showAlg.delete = false;
   $scope.showAlg.edit = false;
   $scope.showAlg.confirms = false;
   _.each($scope.loadedBlock.algorithms, function(alg){
     if(alg.$edit) alg.$edit = false;
   });
     BasicBlockService.reloadBlock(ProjectService.getProjectId(), ProjectService.getCurrentBlockId());
 }
 // ---- inputs ----
 $scope.addInput = function(){
   $scope.mode = 'ADD_INPUT';
   var newInput = {
     name: '',
     type: 'UNSIGNED',
     initialValue: '0',
     buffered: '0',
     input: true
   }
   if($scope.loadedBlock.inputs === undefined){
     $scope.loadedBlock.inputs = [];
     $scope.loadedBlock.inputs.push(newInput);
   }else{
     $scope.loadedBlock.inputs.push(newInput);
   }
   $scope.showInput.delete = false;
   $scope.showInput.confirms = true;
   _.last($scope.loadedBlock.inputs).$edit = true;
 }
 $scope.removeInput = function(){
   $scope.mode = 'REMOVE_INPUT';
   $scope.showInput.delete = true;
   $scope.showInput.edit = false;
   $scope.showInput.confirms = true;
 }
 $scope.deleteInput = function(input){
   BasicBlockService.deletePort(input);
 }
 $scope.editInput = function(){
   $scope.mode = 'EDIT_INPUT';
   $scope.showInput.edit= true;
   $scope.showInput.delete = false;
   $scope.showInput.confirms = true;
 }
 $scope.saveInputChanges = function(input){
   if(!hasChanged(input)){
     return;
   }
   var newInput = {
     input: true,
     name: $scope.loadedBlock.inputs[this.$index].name,
     type: $scope.loadedBlock.inputs[this.$index].type,
     initialValue: $scope.loadedBlock.inputs[this.$index].initialValue,
     buffered: parseInt($scope.loadedBlock.inputs[this.$index].buffered)
   }
   if($scope.mode === 'ADD_INPUT'){
     if(!validate('input', newInput)){
       $scope.loadedBlock.inputs.splice(this.$index);
     }else{
       BasicBlockService.createPort(newInput);
     }
   }else if($scope.mode === 'EDIT_INPUT'){
     if(!validate('input', newInput)){
       //Do nothing!
       BasicBlockService.reloadBlock(ProjectService.getProjectId(), ProjectService.getCurrentBlockId());
     }else{
       BasicBlockService.updatePort(newInput,  $scope.loadedBlock.inputs[this.$index].id, $scope.objDCopy.name);
     }
   }
   $scope.showInput.delete = false;
   $scope.showInput.edit = false;
   $scope.showInput.confirms = false;
 }
 $scope.ignoreInputChanges = function(){
   $scope.showInput.delete = false;
   $scope.showInput.edit = false;
   $scope.showInput.confirms = false;
   _.each($scope.loadedBlock.inputs, function(ins){
     if(ins.$edit) ins.$edit = false;
   });
   $scope.mode = "NONE";
   BasicBlockService.reloadBlock(ProjectService.getProjectId(), ProjectService.getCurrentBlockId());
 }
 // ---- outputs ----
 $scope.addOutput = function(){
   $scope.mode = 'ADD_OUTPUT';
   var newOutput = {
     name: '',
     type: 'UNSIGNED',
     initialValue: '0',
     buffered: '0',
     input: false
   }
   if($scope.loadedBlock.outputs === undefined){
     $scope.loadedBlock.outputs = [];
     $scope.loadedBlock.outputs.push(newOutput);
   }else{
     $scope.loadedBlock.outputs.push(newOutput);
   }
   $scope.showOutput.delete = false;
   $scope.showOutput.confirms = true;
   _.last($scope.loadedBlock.outputs).$edit = true;
 }
 $scope.removeOutput = function(){
   $scope.mode = 'REMOVE_OUTPUT'
   $scope.showOutput.delete = true;
   $scope.showOutput.edit = false;
   $scope.showOutput.confirms = true;
 }
 $scope.deleteInput = function(output){
   BasicBlockService.deletePort(output);
 }
 $scope.editOutput = function(){
   $scope.mode = 'EDIT_OUTPUT';
   $scope.showOutput.edit= true;
   $scope.showOutput.delete = false;
   $scope.showOutput.confirms = true;
 }
 $scope.saveOutputChanges = function(output){
   if(!hasChanged(output)){
     return;
   }
   var newOutput = {
     input: false,
     name: $scope.loadedBlock.outputs[this.$index].name,
     type: $scope.loadedBlock.outputs[this.$index].type,
     initialValue: $scope.loadedBlock.outputs[this.$index].initialValue,
     buffered: parseInt($scope.loadedBlock.outputs[this.$index].buffered)
   }
   if($scope.mode === 'ADD_OUTPUT'){
     if(!validate('output', newOutput)){
       $scope.loadedBlock.outputs.splice(this.$index);
     }else{
       BasicBlockService.createPort(newOutput);
     }
   }else if($scope.mode === 'EDIT_OUTPUT'){
     if(!validate('output', newOutput)){
       BasicBlockService.reloadBlock(ProjectService.getProjectId(), ProjectService.getCurrentBlockId());
       //Do nothing!
     }else{
       BasicBlockService.updatePort(newOutput,  $scope.loadedBlock.outputs[this.$index].id, $scope.objDCopy.name);
     }
   }
   $scope.showOutput.delete = false;
   $scope.showOutput.edit = false;
   $scope.showOutput.confirms = false;
 }
 $scope.ingnoreOutputChanges = function(){
   $scope.showOutput.delete = false;
   $scope.showOutput.edit = false;
   $scope.showOutput.confirms = false;
   _.each($scope.loadedBlock.outputs, function(outs){
     if(outs.$edit) outs.$edit = false;
   });
   $scope.mode = "NONE";
   BasicBlockService.reloadBlock(ProjectService.getProjectId(), ProjectService.getCurrentBlockId());
 }
 // ---- internals ----
 $scope.addInternal = function(){
   $scope.mode = 'ADD_INTERNAL';
   var newInternal = {
     name: '',
     value: '',
     type: 'UNSIGNED'
   }
   if($scope.loadedBlock.internal === undefined || $scope.loadedBlock.internal === null){
     $scope.loadedBlock.internal = [];
     $scope.loadedBlock.internal.push(newInternal);
   }else{
     $scope.loadedBlock.internal.push(newInternal);
   }
   $scope.showInt.delete = false;
   $scope.showInt.confirms = true;
   _.last($scope.loadedBlock.internal).$edit = true;
 }
 $scope.removeInternal = function(){
   $scope.mode = 'REMOVE_INTERNAL';
   $scope.showInt.delete = true;
   $scope.showInt.edit = false;
   $scope.showInt.confirms = true;
 }
 $scope.deleteInternal = function(internal){
   BasicBlockService.deleteInternal(internal);
 }
 $scope.editInternal = function(){
   $scope.mode = 'EDIT_INTERNAL';
   $scope.showInt.edit= true;
   $scope.showInt.delete = false;
   $scope.showInt.confirms = true;
 }
 $scope.saveIntChanges = function(internal){
   if (!hasChanged(internal)){
     return;
   }
   var newInternal = {
     name: $scope.loadedBlock.internal[this.$index].name,
     value: $scope.loadedBlock.internal[this.$index].value,
     type: $scope.loadedBlock.internal[this.$index].type
   }
   if($scope.mode === 'ADD_INTERNAL'){
     if(!validate('internal', newInternal)){
       $scope.loadedBlock.internal.splice(this.$index);
     }else{
     BasicBlockService.createInternal(newInternal);
     }
   }else if($scope.mode === 'EDIT_INTERNAL'){
     if(!validate('internal', newInternal)){
       //Do nothing!
     }else{
       BasicBlockService.updateInternal(newInternal, $scope.loadedBlock.internal[this.$index].id, $scope.objDCopy.name);
     }
   }
   $scope.showInt.delete = false;
   $scope.showInt.edit = false;
   $scope.showInt.confirms = false;
 }
 $scope.ignoreIntChanges = function(){
   $scope.showInt.delete = false;
   $scope.showInt.edit = false;
   $scope.showInt.confirms = false;
   _.each($scope.loadedBlock.internal, function(int){
     if(int.$edit) int.$edit = false;
   });
   $scope.mode = 'NONE';
   BasicBlockService.reloadBlock(ProjectService.getProjectId(), ProjectService.getCurrentBlockId());
 }
 // ---- libraries ----
 $scope.addLibrary = function(){
   var bufferLib = {};
   if (typeof $scope.selectedLibrary.id === 'undefined'){
     toastr.error('Please select a library', 'Error!');
     return false;
   }else{
     if(_.some($scope.linkedLibraries, { 'id': $scope.selectedLibrary.id })){
       toastr.error('The selected library has already been added to the blok', 'Error!');
     }else{
       $scope.linkedLibraries.push({ 'id': $scope.selectedLibrary.id });
       LibrariesService.updateLinks($scope.linkedLibraries);
     }
   }
 }
 $scope.setSelectedLib = function(lib){
   $scope.selectedLibrary = lib;
 }
 $scope.removeLibrary = function(lib){
   $scope.linkedLibraries = $scope.linkedLibraries.filter(function(el){
     return el.id !== lib.id;
   });
   LibrariesService.updateLinks($scope.linkedLibraries);
 }
 // ---- the rest ----
 $scope.closeModal = function() {
   BasicBlockService.loadBlockView();  
   $uibModalInstance.close();
 }
 $scope.ignoreDetailChanges = function(){
   $scope.showNameChange = false;
   $scope.basicBlockName[0].$edit = false;
   $scope.basicBlockName[0].name = currentBlockInfo.name;
   $scope.basicBlockName[0].description = currentBlockInfo.description;
   $scope.tags = tagsDCopy;
 }
 $scope.showIgnoreBotton = function(obj){
   $scope.dCopyCurrent(obj);
   tagsDCopy = JSON.parse(JSON.stringify($scope.tags))
   $scope.showNameChange = true;
   currentBlockInfo.name = $scope.basicBlockName[0].name
   currentBlockInfo.description = $scope.basicBlockName[0].description
 }
 $scope.saveDetailChanges = function(){
   $scope.basicBlockName[0].tags = _.pluck($scope.tags, 'text').join();
   if ($scope.objDCopy.name === $scope.basicBlockName[0].name && $scope.objDCopy.description === $scope.basicBlockName[0].description && $scope.objDCopy.tags === $scope.basicBlockName[0].tags) return;
   if ($scope.basicBlockName[0].name === ''){
     toastr.error('Block name cannot be empty', 'Error!');
     $scope.basicBlockName[0].name = currentBlockInfo.name;
     $scope.basicBlockName[0].description = currentBlockInfo.description;
     $scope.tags = tagsDCopy;
   }else{
     BasicBlockService.setName($scope.basicBlockName[0]);
     $scope.showNameChange = false;
   }
 }
 $scope.getImageFile = function($files){
     imageFiles = $files;
 }
 $scope.uploadImageFile = function(){
     if (typeof imageFiles === 'undefined') return;
     BlockLogosService.uploadLogoFile(imageFiles);
 }
 $scope.saveStartupCode = function(){
   BasicBlockService.changeStartupCode($scope.startupCode.value, $scope.basicBlockName[0].name);
 }
 $scope.colorChange = function(color){
   BasicBlockService.changeColor(color);
   $scope.blockColor = color;
 }
 $scope.saveBlockColor = function(){
   BasicBlockService.updateColor($scope.blockColor);
 }
 $scope.updateLogo = function(logo){
   BasicBlockService.updateLogo(logo);
 }
 $scope.cancelColorImage = function(){
   BasicBlockService.cancelColorImage();
   //FIXME: the color picker don't go back to the default image. find a way to fix this!
   $scope.loadedBlock.color = $scope.loadedBlockCopy.color;
   if($scope.loadedBlock.blockImageId === 0 || $scope.loadedBlock.blockImageId === undefined ){
     $scope.blockImage = placeHolder;
     $scope.hasImage = false;
   }else{
     $scope.hasImage = true;
   }
 }
 $scope.loadPreview = function(){
   BasicBlockService.resetCells();
   if ($('#basic-block-preview > svg').length >= 1 ) return;
   BasicBlockService.loadBasicPaperPreview();
 }
 $scope.exportBlock = function(){
   var exportArr = [];
   exportArr.push(ProjectService.getCurrentBlockId());
   ImportExportService.exportBlocks(ProjectService.getProjectId(), exportArr);
 }
 $scope.deleteBlock = function (){
     AlertService.deleteBlockConfirm();
     $scope.$on('RELOAD_PROJECT', function(){
         $uibModalInstance.close();
     });
 }
 var validate = function(type, obj){
   if(obj.name === ''){
     toastr.error('The ' + type + ' name cannot be empty', 'Error!');
     $scope.mode = 'NONE';
     return false;
   }else{
     return true;
   }
 }
 $scope.dCopyCurrent = function(obj){
   $scope.objDCopy = JSON.parse(JSON.stringify(obj));
   obj.$edit = true;
 }
 var hasChanged = function(obj){
   obj.$edit = false;
   var o1 = JSON.parse(JSON.stringify(obj));
   var o2 = JSON.parse(JSON.stringify($scope.objDCopy));
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
 $scope.tagSelector = function($e){
   var selection = document.getSelection();
   var triggerText = selection.anchorNode.nodeValue;
   if(triggerText === null || triggerText === '') triggerText = '';
   if(!taggingRecord && triggerText.indexOf('#') !== -1 && ($e.which === 15 || $e.which === 51)) taggingRecord = true;
   if(taggingRecord && ($e.which === 32 || $e.which === 9 || $e.which === 13)){
     if($e.which === 32) plainText = triggerText;
     var tagsArray = plainText.split(' ')
     _.each(tagsArray, function(tag){
       tag = tag.trim();
       if(tag === '#' || tag === undefined || tag ==='##'){
         //Do nothing;
       }else if(tag[0] === "#" && !_.some($scope.tags, function(value){return value.text === tag.slice(1)})){
         $scope.tags.push({text:tag.slice(1)})
         $timeout(function(){return $scope.tags},250);
       }
     })
     taggingRecord = false;
   }else{
     plainText = selection.anchorNode.nodeValue;
   }
 }
 function quitModal(evt){ //Can do different in ModalService
     if(evt.keyCode === 27) BasicBlockService.loadBlockView();
 }
 var $doc = angular.element(document);
 $doc.on('keydown', quitModal);
}]);
