angular.module('app')
  .controller('terrainCtrl', ['$scope', '$rootScope',
    function($scope, $rootScope) {

      //高程
      $scope.terrains = [{
        name: '默认',
        used: true
      }, {
        name: 'STK Terrain',
        used: false
      }, {
        name: 'Grid Local',
        used: false
      }, {
        name: 'Grid AGI Server',
        used: false
      }];

      var usedType = 0;

      $scope.toggleTerrain = function(index) {
        if (usedType != index) {
          $scope.terrains[usedType].used = false;
          $scope.terrains[index].used = true;
          usedType = index;

          if (index == 1) {
            $rootScope.viewer.scene.terrainProvider = new Cesium.CesiumTerrainProvider({
              url: '//assets.agi.com/stk-terrain/world'
            });
          } else if (index == 2) {
            $rootScope.viewer.scene.terrainProvider = new Cesium.CesiumTerrainProvider({
              // url : '//cesiumjs.org/tilesets/terrain/smallterrain'
              url: 'http://localhost:8090/SmallTerrain'
            });
          } else if (index == 3) {
            $rootScope.viewer.scene.terrainProvider = new Cesium.CesiumTerrainProvider({
              url: '//cesiumjs.org/tilesets/terrain/smallterrain'
                // url : 'http://localhost:8090/SmallTerrain'
            });
          } else if (index == 0) {
            $rootScope.viewer.scene.terrainProvider = new Cesium.EllipsoidTerrainProvider();
          }

        }
      }
    }
  ]);