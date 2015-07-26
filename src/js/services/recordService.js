//record service

angular.module('app')
	.service('recordService', ['$http', '$alert', '$modal', '$rootScope', function($http, $alert, $modal, $rootScope) {

		var loadedRecords = {};

		this.getRecords = function(url) {
			var re = [];
			for (var r in loadedRecords) {
				if (r.indexOf(url) >= 0) {
					re.push(loadedRecords[r]);
				}
			}
			return re.length > 0 ? re : null;
			// return loadedRecords[key];
		}

		this.initRecord = function(opt, capa) {
			var s = opt.service.toLowerCase();
			var layers, layer, i, l;
			var record = {};
			var records = [];
			if (s === 'wmts') {
				//这里默认每个wmts只有一个layer,若有多个需要重写
				layers = capa.Contents.Layer;
				var TileMatrixSet = capa.Contents.TileMatrixSet;
				if (layers.length) {
					for (i = 0; i < layers.length; i++) {
						record = initWmts(opt, layers[i], TileMatrixSet);
						loadedRecords[opt.url + record.layer] = record;
					};
				} else {
					layer = layers;
					record = initWmts(opt, layer, TileMatrixSet);
					loadedRecords[opt.url + record.layer] = record;
				}
			} else if (s === 'wms') {
				// console.log(capa);
				layers = capa.Capability.Layer.Layer;
				// console.log('wms: ', layers);
				if (layers.length) {
					for (var i = 0; i < layers.length; i++) {
						if (layers[i]._queryable === '1') {
							record = initWms(opt, layers[i]);
							loadedRecords[opt.url + record.layer] = record;
						}
					};
				} else {
					layer = layers;
					if (layer._queryable === '1') {
						record = initWms(opt, layer);
						loadedRecords[opt.url + record.layer] = record;
					}
				}
			} else if (s === 'wfs') {
				layers = capa.FeatureTypeList.FeatureType;
				if (layers.length) {
					for (i = 0, l = layers.length; i < l; i += 1) {
						record = initWfs(opt, layers[i]);
						loadedRecords[opt.url + record.layer] = record;
					}
				} else {
					layer = layers;
					record = initWfs(opt, layer);
					loadedRecords[opt.url + record.layer] = record;
				}
			} else if (s === 'wcs') {

			} else {
				$alert({
					content: '没有' + s + '类型',
					type: 'danger'
				});
				return;
			}

			return this.getRecords(opt.url);

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

			var lc = layer["BoundingBox"]["LowerCorner"].toString();
			var uc = layer["BoundingBox"]["UpperCorner"].toString();
			record.bbox = lc + " " + uc;
			record.visible = true;
			record.loaded = false;

			record.matrixSet = layer.TileMatrixSetLink["TileMatrixSet"].toString();
			var crs = TileMatrixSet["SupportedCRS"].toString();
			record.SRS = g_SRS(crs);

			return record;
		}

		var initWms = function(opt, layer) {
			var record = {};
			record.service = 'wms';
			record.url = opt.url;

			record.layer = layer["Name"].toString();
			record.title = layer["Title"].toString();
			record.type = 'wms';
			record.SRS = g_SRS(layer["SRS"] || layer["CRS"]);
			record.visible = true;
			record.loaded = false;

			var bbox = layer['LatLonBoundingBox'];
			record.bbox = bbox._minx + ' ' + bbox._miny + ' ' + bbox._maxx + ' ' + bbox._maxy;

			return record;
		}

		var initWfs = function(opt, layer) {
			var record = {};
			record.service = 'wfs';
			record.url = opt.url;

			record.layer = layer["Name"];
			record.title = layer["Title"];
			record.type = "wfs";
			record.SRS = g_SRS(layer["SRS"]);
			record.visible = true;
			record.loaded = false;
			var bbox = layer['LatLongBoundingBox'];
			record.bbox = bbox._minx + ' ' + bbox._miny + ' ' + bbox._maxx + ' ' + bbox._maxy;

			return record;
		}


		//生成投影，目前只支持4326 和 3857
		var g_SRS = function(s){
			if (s.indexOf('4326') > 0) {
				return 'EPSG:4326';
			} else if (s.indexOf('3857') > 0) {
				return 'EPSG:3857';
			} else {
				return 'EPSG:4326'; //defalult
			}
		}
	}]);