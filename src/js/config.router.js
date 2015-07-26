'use strict';

/**
 * Config for the router
 */


angular.module('app')
  .service('urlService', function($rootScope, $http) {
    console.log('provide url');
  })
  .service('requestService', function($http, urlService) {
    var baseUrl = urlService.tileStreamLayerUrl;
    this.getLayers = function($scope) {
      var url = baseUrl + "Tileset";
      $http.get(url).
      success(function(data, status, headers, config) {
        $scope.layers = data;

      }).error(function() {
        $scope.layers = [];
      });
    };

    this.getMetaData = function($scope, layerName) {
      var url = baseUrl + "Tileset/" + layerName;
      $http.get(url).
      success(function(data, status, headers, config) {

        console.log(data);

      });
    };
  })


.service('layerManager', function() {

  var loadedLayers = [];

  this.addLayer = function(layerName, layer) {
    loadedLayers[layerName] = layer;
  }
  this.getLayer = function(layerName) {
    return loadedLayers[layerName];
  }
  this.size = function() {
    return loadedLayers.length;
  }
})


angular.module('app')
  .run(
    ['$rootScope', '$state', '$stateParams',
      function($rootScope, $state, $stateParams) {
        $rootScope.$state = $state;
        $rootScope.$stateParams = $stateParams;
      }
    ]
  )
  .config(
    ['$stateProvider', '$urlRouterProvider',
      function($stateProvider, $urlRouterProvider) {

        $urlRouterProvider
          .otherwise('/app/map/114/30/4'); //默认经纬度，高度
        $stateProvider
          .state('app', {
            abstract: true,
            url: '/app',
            templateUrl: 'tpl/app.html'
          })
          .state('app.map', {
            url: '/map/:lon/:lat/:zoom',
            templateUrl: 'tpl/map.html',
            reloadOnSearch: false,
            resolve: {
              deps: ['$ocLazyLoad',
                function($ocLazyLoad) {
                  return $ocLazyLoad.load('angularBootstrapNavTree').then(
                    function() {
                      return $ocLazyLoad.load('js/controllers/tree.js');
                    }
                  );
                }
              ]
            },
            controller: function($scope, $rootScope, $state, $stateParams, $urlMatcherFactory, $location) {


              var center = [],
                zoom;
              center.push(parseFloat($stateParams.lon));
              center.push(parseFloat($stateParams.lat));
              zoom = parseInt($stateParams.zoom);
              //默认的投影方式,将来写在配置文件中
              var defaultProj;
              $rootScope.defaultProj = defaultProj = "EPSG:4326";

              $rootScope.map = new ol.Map({
                target: 'map2d',
                layers: [
                  /*new ol.layer.Tile({
                    source: new ol.source.TileWMS({
                      url: 'http://demo.boundlessgeo.com/geoserver/wms',
                      params: {
                        'LAYERS': 'ne:NE1_HR_LC_SR_W_DR'
                      }
                    })
                  })*/
                  new ol.layer.Tile({
                    source: new ol.source.MapQuest({
                      layer: 'sat'
                    })
                  })

                ],
                view: new ol.View({
                  projection: defaultProj,
                  center: ol.proj.transform(center, 'EPSG:4326', defaultProj),
                  zoom: zoom
                })
              });

              //浏览器地址变化时，定位到相应地经纬度
              $scope.$on('$locationChangeSuccess', function(event) {
                var urlMatcher = $urlMatcherFactory.compile("/app/map/:lon/:lat/:zoom");
                var matched = urlMatcher.exec($location.url());
                var lon = parseFloat(matched.lon);
                var lat = parseFloat(matched.lat);
                var zoom = parseInt(matched.zoom);

                var view = $rootScope.map.getView();
                view.setCenter(ol.proj.transform([lon, lat], 'EPSG:4326', defaultProj));
                view.setZoom(zoom);

              });

            }
          })


      }
    ]
  );