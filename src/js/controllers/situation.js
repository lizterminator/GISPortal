angular.module('app')
  .controller('situationCtrl', ['$scope', '$rootScope', '$modal', '$aside','situationService','$popover',
    function($scope, $rootScope, $modal, $aside, situationService,$popover) {

      //situation
      var situationModal; //输入kml地址的模态框
      var rootEntities = []; //全部的entities
      var shownEntities = []; //显示的entities
      var situationAside = undefined; //侧边面板
      var SHOW_SITUATION_SIZE = 20;

      //$scope.situationUrl = "http://localhost:8082/KML/facilities/facilities.kml";
      $scope.situationUrl = $rootScope.appConfig.defaultSituationUrl; //"http://localhost:8082/simple.czml";
      $scope.loadSituation = function() {

        var url = angular.element('#situationUrl').val();

        $rootScope.viewer.dataSources.removeAll();

        var flag = url.slice(-7);
        var source;
        if (flag.indexOf('kml') >= 0) {
          source = new Cesium.KmlDataSource();
        } else if (flag.indexOf('czml') >= 0) {
          source = new Cesium.CzmlDataSource();
        } else if (flag.indexOf('json') >= 0) {
          source = new Cesium.GeoJsonDataSource();
        }

        $rootScope.viewer.dataSources.add(source.load(url)).then(function() {
          situationService.add(source);

          rootEntities = situationService.getEntities(0);
          $rootScope.shownEntities = situationService.getEntities(0, SHOW_SITUATION_SIZE);
          $scope.sSize = situationService.size();
        });

        situationModal.hide();
      };

      $scope.showSituationPanel = function() {

        if (situationModal) {
          situationModal.show();
        } else {
          situationModal = $modal({
            scope: $scope,
            template: 'tpl/situationSelectModal.html',
            show: true
          });
        }
      }

      $scope.removeSituation = function() {
        situationService.removeAll();
        $rootScope.viewer.dataSources.removeAll();
        $rootScope.shownEntities = [];
        rootEntities = [];
        $scope.sSize = 0;
      }

      $scope.show = function(){
        var myPopover = $popover(document.getElementById('xxx'), {title: 'My Title', content: 'My Content', trigger: 'manual'});
      }

      $scope.listSituation = function() {
        $scope.popover = {
          "title": "Title",
          "content": "Hello Popover<br />This is a multiline message!"
        };
        if (situationAside) {
          situationAside.show();
        } else {
          situationAside = $aside({
            scope: $scope,
            template: 'tpl/situationAside.html',
            show: true
          });
        }

      }
      $scope.entitySearch = function() {
        var keyword = angular.element('#entityKeyword').val().trim().toLowerCase();
        $rootScope.shownEntities = [];
        for (var i = 0, l = rootEntities.length; i < l; i++) {
          if (rootEntities[i].name.toLowerCase().indexOf(keyword) >= 0) {
            $rootScope.shownEntities.push(rootEntities[i]);
          }
          if ($rootScope.shownEntities.length === SHOW_SITUATION_SIZE) {
            break;
          }
        }
      }

      $scope.chooseEntity = function(index) {
        var entity = $rootScope.shownEntities[index];
        $rootScope.viewer.flyTo(entity);
        situationAside.hide();
        console.log(entity.description);
      }
    }
  ]);