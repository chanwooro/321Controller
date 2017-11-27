editorApp.controller('RightbarCtrl', ['$scope', 'BasicBlockService', function($scope, BasicBlockService){
    $scope.helpIcon = true;
    $scope.$on('RELOAD_BLOCK', function(){
       $scope.blockType = BasicBlockService.getBasicBlock().type;
    });
}]);
