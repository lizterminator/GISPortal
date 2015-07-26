angular.module('app')
  .controller('gridCtrl', ['$scope','$rootScope',
    function( $scope,$rootScope) {

    	//网格
      $scope.showGridTip = "显示瓦片网格";
      var gridShowed = false;
      var grid;
      $scope.toggleGrid = function(){
        if(!gridShowed){
          $scope.showGridTip = "隐藏瓦片网格";
          grid = new Cesium.ImageryLayer(new Cesium.TileCoordinatesImageryProvider());
          $rootScope.imageryLayers.add(grid);
        }else{
          $scope.showGridTip = "显示瓦片网格";
          $rootScope.imageryLayers.remove(grid);
        }

        gridShowed = !gridShowed;
      }
                      
    }]);