//ogc service

angular.module('app')
	.service('GISService', ['$http', '$alert', '$modal', '$rootScope', function($http, $alert, $modal, $rootScope) {

		$rootScope.loadedLayers = [];
		var map = $rootScope.map;

		$rootScope.configLayer = function(config) {
			console.log(config);
			var metaDataModal = $modal({
				scope: $rootScope,
				template: 'tpl/metaDataModal.html',
				show: true
			});
		}

		$rootScope.toggleLayer = function(config, index) {
			var layer = getLayerByRecord(config);
			if (!layer) return;

			layer.setVisible(!layer.getVisible());
			$rootScope.loadedLayers[index].visible = !$rootScope.loadedLayers[index].visible;
		}

		var getLayerByRecord = function(record) {
			var layers = map.getLayers();
			// console.log(layers);
			for (var i = 0, l = layers.getLength(); i < l; i++) {
				var r = layers.item(i).record;
				if (!r) continue;
				if (r['url'] === record['url'] && r['layer'] === record['layer']) {
					return layers.item(i);
				}
			}
			return null;
		}

		//getcapabilities请求 返回一个promise
		this.getCapabilities = function(options) {
			var url = options.url,
				service = options.service,
				version = options.version || '1.0.0';
			//var me = this;
			return $http({
				url: url,
				method: 'GET',
				params: {
					Service: service,
					Version: version,
					Request: 'GetCapabilities'
				}
			});
		}

		//请求元数据
		this.getMeta = function() {

		}

		this.loadLayer = function(config) {
			if (getLayerByRecord(config)) {
				$alert({
					content: "该图层已加载过",
					type: 'danger'
				});
				return;
			}
			var service = config.service;
			if (service === 'wmts') {
				this.loadWmtsLayer(config);
				$rootScope.loadedLayers.unshift(config);
				// loadedLayers['']
			} else if (service === 'wms') {
				this.loadWmsLayer(config);
				$rootScope.loadedLayers.unshift(config);
			} else if (service === "wfs") {
				this.loadWfsLayer(config);
				$rootScope.loadedLayers.unshift(config);
			}
		}

		this.unloadLayer = function(config) {
			var layer = getLayerByRecord(config);
			console.log(layer)
			if (!layer) {
				$alert({
					content: "该图层还未加载过",
					type: 'danger'
				});
				return;
			}
			this.removeLayer(layer);

			//从rootScope中删除
			for (var i = 0; i < $rootScope.loadedLayers.length; i++) {
				var r = $rootScope.loadedLayers[i];
				if (!r) continue;
				if (r['url'] === config['url'] && r['layer'] === config['layer']) {
					$rootScope.loadedLayers.splice(i, 1);
				}
			};
		}

		this.loadWfsLayer = function() {
			// format used to parse WFS GetFeature responses
			var geojsonFormat = new ol.format.GeoJSON();

			var vectorSource = new ol.source.Vector({
				loader: function(extent, resolution, projection) {
					var url = 'http://demo.boundlessgeo.com/geoserver/wfs?service=WFS&' +
						'version=1.1.0&request=GetFeature&typename=osm:water_areas&' +
						'outputFormat=text/javascript&format_options=callback:loadFeatures' +
						'&srsname=EPSG:3857&bbox=' + extent.join(',') + ',EPSG:3857';
					// use jsonp: false to prevent jQuery from adding the "callback"
					// parameter to the URL
					$.ajax({
						url: url,
						dataType: 'jsonp',
						jsonp: false
					});
				},
				strategy: ol.loadingstrategy.tile(ol.tilegrid.createXYZ({
					maxZoom: 19
				}))
			});


			/**
			 * JSONP WFS callback function.
			 * @param {Object} response The response object.
			 */
			window.loadFeatures = function(response) {
				vectorSource.addFeatures(geojsonFormat.readFeatures(response));
			};

			var vector = new ol.layer.Vector({
				source: vectorSource,
				style: new ol.style.Style({
					stroke: new ol.style.Stroke({
						color: 'rgba(0, 0, 255, 1.0)',
						width: 2
					})
				})
			});

			this.addLayer(vector);
			//this.setCenter(ol.proj.transformExtent([-75.923853, 45.428736],"EPSG:4326","EPSG:3857"));
			this.setZoom(11);


		}

		this.loadWmsLayer = function(config) {
			var url = config.url;
			var layer = config.layer;

			var wms = new ol.layer.Tile({
				//extent: [-180,-90,180,90],
				extent: [96.799393, -43.598214999057824, 153.63925700000001, -9.2159219997013],
				source: new ol.source.TileWMS({
					url: url,
					params: {
						'LAYERS': layer,
						'TILED': true,
						'FORMAT': 'image/png'
					}
				})

			});

			wms.record = config;
			this.addLayer(wms);
		}
		this.loadWmtsLayer = function(config) {
			var url = config.url,
				matrixSet = config.matrixSet,
				layer = config.layer,
				projection = config.SRS,
				format = config.format;
			var tmp = this.getResolutionsAndMatrixIds(projection);
			var resolutions = tmp.resolutions;
			var matrixIds = tmp.matrixIds;
			var projectionExtent = tmp.projectionExtent;
			var layer2D = new ol.layer.Tile({
				name: matrixSet,
				extent: projectionExtent, //此范围以外的部分不会加载
				source: new ol.source.WMTS({

					url: url,
					layer: layer,
					matrixSet: matrixSet,
					format: format,
					style: 'default',
					projection: projection,
					tileGrid: new ol.tilegrid.WMTS({
						origin: ol.extent.getTopLeft(projectionExtent),
						resolutions: resolutions,
						matrixIds: matrixIds
					})
				})

			});

			//额外增加一个属性以便用来卸载
			layer2D.record = config;

			this.addLayer(layer2D);

			this.loadLayerToCesium(config);
		}

		this.addLayer = function(layer) {
			map.addLayer(layer);
			console.log(map.getLayers().getLength());
		}
		this.removeLayer = function(layer) {
			map.removeLayer(layer);
		}
		this.setCenter = function(center) {
			map.getView().setCenter(center);
		}
		this.setZoom = function(zoom) {
			map.getView().setZoom(zoom);
		}
		this.getResolutionsAndMatrixIds = function(proj_code) {
			var projection = ol.proj.get(proj_code);
			var projectionExtent = projection.getExtent();
			var size = ol.extent.getWidth(projectionExtent) / 256;
			var maxZoom = 12;
			var resolutions = new Array(maxZoom);
			var matrixIds = new Array(maxZoom);
			for (var z = 0; z < maxZoom; ++z) {
				if (proj_code === 'EPSG:4326') {
					resolutions[z] = size / Math.pow(2, z); //lijie
					matrixIds[z] = z;
				} else if (proj_code == 'EPSG:3857') {
					resolutions[z] = size / Math.pow(2, z);
					matrixIds[z] = z;
				}
			}
			return {
				resolutions: resolutions,
				matrixIds: matrixIds,
				projectionExtent: projectionExtent
			};
		}
	}]);