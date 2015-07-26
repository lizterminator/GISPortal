// config

var app =  
angular.module('app')
  .config(
    [        '$controllerProvider', '$compileProvider', '$filterProvider', '$provide',
    function ($controllerProvider,   $compileProvider,   $filterProvider,   $provide) {
        
        // lazy controller, directive and service
        app.controller = $controllerProvider.register;
        app.directive  = $compileProvider.directive;
        app.filter     = $filterProvider.register;
        app.factory    = $provide.factory;
        app.service    = $provide.service;
        app.constant   = $provide.constant;
        app.value      = $provide.value;
    }
  ])
  .config(function($asideProvider) {
      angular.extend($asideProvider.defaults, {
        container: 'body',
        html: true
      });
  })
  .config(function($alertProvider) {
    angular.extend($alertProvider.defaults, {
      animation: 'am-fade-and-slide-top',
      placement: 'top-right',
      type: 'info',
      duration: 4
    });
  })
  .config(function ($httpProvider) {
    $httpProvider.interceptors.push('xmlHttpInterceptor');
  })
  .value('cgBusyDefaults',{
    message:'正在加载,请稍等...',
    backdrop: true,
    delay: 300,
    minDuration: 900
  });