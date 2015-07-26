angular.module('app')
  .controller('viewCtrl', ['$scope', '$rootScope',
    function($scope, $rootScope) {
      var ol3d = undefined;
      $rootScope.singleView = true;
      $rootScope.doubleViews = false;

      $scope.toggle23D = function() {
        if (!ol3d) {
          ol3d = new olcs.OLCesium({
            map: $rootScope.map,
            target: 'map3d'
          });
        }
        ol3d.setEnabled(!ol3d.getEnabled());
      }

      //单视图、双视图转换
      $scope.toggleViews = function() {
        // $scope.toggle23D();
        if (!ol3d) {
          ol3d = new olcs.OLCesium({
            map: $rootScope.map,
            target: 'map3d'
          });
          ol3d.setEnabled(true);

        } else {
          ol3d.setEnabled(!ol3d.getEnabled());
        }
        $rootScope.singleView = !$rootScope.singleView;
        $rootScope.doubleViews = !$rootScope.doubleViews;
        $rootScope.map.updateSize();
      }
      $scope.horizontal = function() {

      }

      $scope.vertical = function() {

      }
    }
  ])
  .controller('projCtrl', ['$scope', '$rootScope', '$alert',
    function($scope, $rootScope, $alert) {

      $scope.proj = $rootScope.defaultProj;


      $scope.view4326 = function() {
        if ($scope.proj === "EPSG:4326")
          return;
        $scope.proj = "EPSG:4326";

        setView($scope.proj);
      }

      $scope.view3857 = function() {
        if ($scope.proj === "EPSG:3857")
          return;
        $scope.proj = "EPSG:3857";
        setView($scope.proj);
      }

      function setView(proj) {
        var center = $rootScope.map.getView().getCenter();
        var oldProj = $rootScope.map.getView().getProjection();
        var zoom = $rootScope.map.getView().getZoom();

        $rootScope.map.setView(new ol.View({
          projection: proj,
          center: ol.proj.transform(center, oldProj, proj),
          zoom: zoom
        }));
      }
    }
  ])
  .controller('downloadCtrl', ['$scope', '$rootScope', '$alert',
    function($scope, $rootScope, $alert) {

      $scope.downloadMap = function(e){
        console.log(e);
        $rootScope.map.once('postcompose', function(event) {
          var canvas = event.context.canvas;
          // console.log('once');
          e.target.href = canvas.toDataURL('image/png');
        });
        $rootScope.map.renderSync();
      };
      
    }
  ])
;