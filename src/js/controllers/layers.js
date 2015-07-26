angular.module('app')
  .controller('layersCtrl', ['$scope', '$rootScope', 'GISService', "$modal", '$aside', '$http', '$alert',
    function($scope, $rootScope, GISService, $modal, $aside, $http, $alert) {

      var layersAside = undefined; //侧边面板

      $scope.showLayersPanel = function() {

        if (layersAside) {
          layersAside.show();
        } else {
          init();
          layersAside = $aside({
            scope: $scope,
            placement: 'left',
            keyboard: true,
            backdrop: false,
            animate: 'am-slide-left',
            template: 'tpl/layersAside.html',
            show: true
          });
        }

      }

      var requestOpts = [{
        service: 'wmts',
        description: '天地图服务vec_c',
        version: '',
        url: 'http://t0.tianditu.com/vec_c/wmts'
          // url: 'http://192.168.3.133:8080/ows'
      }, {
        service: 'wmts',
        description: '天地图服务img_c',
        version: '',
        url: 'http://t0.tianditu.com/img_c/wmts'
      }, {
        service: 'wmts',
        description: '自己的wmts',
        version: '',
        url: '../data/wmts.xml'
      }, , {
        service: 'wms',
        description: '測試wms',
        version: '',
        url: 'https://programs.communications.gov.au/geoserver/ows'
      }];

      var parser_wmts = new ol.format.WMTSCapabilities();

      var init = function() {
        for (var i in requestOpts) {
          var opt = requestOpts[i];
          $scope.myPromise = GISService.getCapabilities(opt).then(function(res, x) {

            $alert({
              content: '请求getCapabilities成功'
            });

            var json = undefined;

            if (typeof(res.data) == 'string') {
              json = new X2JS().xml_str2json(res.data);
            } else if (typeof(res.data) == 'object') {
              json = res.data;
            }

            //去除最外层的标签包裹
            for (var i in json) {
              json = json[i];
            }
            //由于是异步的，所以initDatasets的第一个参数不能传opt
            initDatasets({
              service: res.config.params['Service'] || res.config.params['service'] || res.config.params['SERVICE'],
              url: res.config.url
            }, json);
          }, function() {
            $alert({
              content: 'GetCapabilities请求失败,请检查网络设置后刷新页面',
              type: 'danger'
            });
          });
        }
      }

      var initDatasets = function(opt, capa) {
        var s = opt.service.toLowerCase();
        var layers, layer, i, l;
        var record = {};
        if (s === 'wmts') {
          //这里默认每个wmts只有一个layer,若有多个需要重写
          layers = capa.Contents.Layer;
          var TileMatrixSet = capa.Contents.TileMatrixSet;
          if (layers.length) {
            for (i = 0; i < layers.length; i++) {
              var r = initWmts(opt, layers[i], TileMatrixSet);
              loadedRecords.push(r);
            };
          } else {
            layer = layers;
            var r = initWmts(opt, layer, TileMatrixSet);
            loadedRecords.push(r);
          }
        } else if (s === 'wms') {
          console.log(capa);
          layers = capa.Capability.Layer.Layer;
          // console.log('wms: ', layers);
          if (layers.length) {
            for (var i = 0; i < layers.length; i++) {
              if (layers[i]._queryable === '1') {
                var r = initWms(opt, layers[i]);
                loadedRecords.push(r);
              }
            };
          } else {
            layer = layers;
            if (layer._queryable === '1') {
              var r = initWms(opt, layer);
              loadedRecords.push(r);
            }
          }
        } else if (s === 'wfs') {

        } else if (s === 'wcs') {

        } else {
          $alert({
            content: '没有' + s + '类型',
            type: 'danger'
          });
          return;
        }


      }

      var initWmts = function(opt, layer, TileMatrixSet) {
        var record = {};

        record.url = opt.url;
        record.service = 'wmts';
        record.layer = layer['Identifier'].toString(); //Identifier.toString();
        record.title = layer["Title"].toString();
        record.format = layer["Format"].toString();
        record.type = layer["Abstract"].toString();
        record.style = layer.Style["Identifier"].toString();

        record.visible = true;

        record.matrixSet = layer.TileMatrixSetLink["TileMatrixSet"].toString();
        var crs = TileMatrixSet["SupportedCRS"].toString();
        if (crs.indexOf('4326') > 0) {
          record.SRS = 'EPSG:4326';
        } else if (crs.indexOf('3857') > 0) {
          record.SRS = 'EPSG:3857';
        } else {
          record.SRS = 'EPSG:4326'; //defalult
        }

        $scope.datasets[0]['classes'][0]['data'].push(record);
        return record;
      }

      var initWms = function(opt, layer) {
        var record = {};
        record.service = 'wms';
        record.url = opt.url;

        record.layer = layer["Name"].toString();
        record.title = layer["Title"].toString();
        record.type = 'wms';
        record.SRS = layer["SRS"] || layer["CRS"];
        record.visible = true;

        var bbox = layer['LatLonBoundingBox'];
        record.bbox = bbox._minx + ' ' + bbox._miny + ' ' + bbox._maxx + ' ' + bbox._maxy;
        $scope.datasets[0]['classes'][0]['data'].push(record);

        return record;
      }

      var datasets = {
        frame: 0,
        product: 1,
        theme: 2,
        web: 3
      }

      $scope.datasets = [{
        "title": '框架',
        "type": 'frame',
        "classes": [{
          "type": 'f_ort_img',
          "title": '正射影像数据',
          "data": []
        }, {
          "type": 'f_vec_ter',
          "title": '矢量地形数据',
          "data": []
        }, {
          "type": 'f_dig_ele',
          "title": '数字高程数据',
          "data": []
        }, {
          "type": 'f_gra_mag',
          "title": '重力磁力数据',
          "data": []
        }, {
          "type": 'f_mea_con',
          "title": '测量控制点数据',
          "data": []
        }],
      }, {
        "title": '产品',
        "type": 'product',
        "classes": [{
          "type": 'p_dem',
          "title": 'DEM瓦片',
          "data": []
        }, {
          "type": 'p_img',
          "title": '影像瓦片',
          "data": []
        }, {
          "type": 'p_sh',
          "title": '晕渲瓦片',
          "data": []
        }, {
          "type": 'p_dig',
          "title": '电子地图瓦片',
          "data": []
        }, {
          "type": 'p_vec',
          "title": '矢量数据瓦片',
          "data": []
        }]
      }, {
        "title": '专题',
        "type": 'theme',
        "classes": []
      }, {
        "title": '网络',
        "type": 'web',
        "classes": []
      }, {
        "title": '搜索',
        "type": 'search',
        "classes": [{
          "type": 'search',
          "title": '结果',
          "data": []
        }]
      }];

      $scope.datasets.activeTab = "框架";


      // $scope.panels.activePanel = 0;


      $scope.loadLayer = function(config) {
        GISService.loadLayer(JSON.parse(config.valueOf()));
      }

      $scope.unloadLayer = function(config) {
        var record = JSON.parse(config.valueOf());
        GISService.unloadLayer(record);
      }
      $scope.meta = function(config) {
        var metaData = $scope.metaData = JSON.parse(config.valueOf());
        $scope.metaDataJson = JSON.stringify(metaData, null, 2);
        var metaDataModal = $modal({
          scope: $scope,
          template: 'tpl/metaDataModal.html',
          show: true
        });
      }

      var loadedRecords = [];
      $scope.keyword = '';
      $scope.datasetSearch = function(value) {
        var keyword = angular.element('#keyword').val().trim().toLowerCase();
        console.log(keyword);
        $scope.datasets.activeTab = "搜索";
        $scope.datasets[4]['classes'][0]['data'] = [];
        for (var i = 0, l = loadedRecords.length; i < l; i++) {
          if (loadedRecords[i].layer.toLowerCase().indexOf(keyword) >= 0) {
            $scope.datasets[4]['classes'][0]['data'].push(loadedRecords[i]);
            // $rootScope.shownRecords.push(loadedRecords[i]);
          }
          // if ($rootScope.shownRecords.length === SHOW_SITUATION_SIZE) {
          //   break;
          // }
        }
      }
    }
  ]);