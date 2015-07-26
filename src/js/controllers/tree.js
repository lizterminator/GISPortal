app.controller('AbnTestController', function($scope,$rootScope, $timeout, $modal, $alert, GISService, recordService) {
  var tree, treedata_avm, treedata_geography;

  $scope.loadLayer = function(record) {
    GISService.loadLayer(record);
    record.loaded = true;
  }

  $scope.unloadLayer = function(record) {
    GISService.unloadLayer(record);
    record.loaded = false;
  }
  $scope.meta = function(record) {
    var metaData = $scope.metaData = record;
    $scope.metaDataJson = JSON.stringify(metaData, null, 2);
    var metaDataModal = $modal({
      scope: $scope,
      template: 'tpl/metaDataModal.html',
      show: true
    });
  }

  $scope.fly = function(bbox){
    var b = bbox.split(' ').map(Number);
    $rootScope.map.getView().fitExtent(b,$rootScope.map.getSize());
  }

  $scope.my_tree_handler = function(branch) {
    // console.log(branch);
    if (branch.data.type === "floader") {
      return;
    }

    //遍历得到节点的路径
    var get_parent = $scope.my_tree.get_parent_branch;
    var l;
    var b = angular.copy(branch);
    var dir = [];
    dir.unshift(b.label);
    while ((l = get_parent(b)) != null) {
      dir.unshift(l.label);
      b = l;
    }
    $scope.title = dir.join('  >  ');


    var opt = {
      url: branch.data.url,
      service: branch.data.service,
      version: branch.data.version || '1.0.0'
    };
    $scope.requestOK = false;

    var records = recordService.getRecords(opt.url);
    if (records) { //已经初始化过
      $scope.requestOK = true;
      $scope.records = records;
    } else { //第一次初始化
      $scope.myPromise = GISService.getCapabilities(opt).then(function(res, x) {
        $scope.requestOK = true;
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
        // console.log(json);
        //由于是异步的，所以initDatasets的第一个参数不能传opt
        $scope.records = recordService.initRecord({
          service: res.config.params['Service'] || res.config.params['service'] || res.config.params['SERVICE'],
          url: res.config.url
        }, json);

      }, function() {
        $scope.requestOK = false;
        $scope.records = [];
        $alert({
          content: '请求getCapabilities失败',
          type: 'danger'
        });
      });
    }

    var metaDataModal = $modal({
      scope: $scope,
      template: 'tpl/mapOperationModal.html',
      show: true
    });

  };


  treedata_avm = [{
    label: '庚图1',
    data: {
      type: "floader"
    },
    children: [{
      label: 'Vector',
      data: {
        type: "floader"
      },
      children: [{
        label: '1:100W',
        data: {
          type: "floader"
        },
        children: [{
          label: 'WMTS',
          data: {
            type: "leaf",
            service: "wmts",
            url: "http://t0.tianditu.com/vec_c/wmts"
          }
        }, {
          label: 'WMS',
          data: {
            type: "leaf",
            service: "wms",
            url: "https://programs.communications.gov.au/geoserver/ows"
          }
        }]
      }]
    }, {
      label: 'Raster',
      data: {
        type: "floader"
      },
      children: [{
        label: '1:50W',
        data: {
          type: "floader"
        },
        children: [{
          label: 'WFS',
          data: {
            type: "leaf",
            service: "wfs",
            url: "http://demo.opengeo.org/geoserver/wfs"
          }
        }, {
          label: 'WCS',
          data: {
            type: "leaf"
          }
        }]
      }]
    }]
  }];

  $scope.my_data = treedata_avm;
 
  $scope.my_tree = tree = {};

});