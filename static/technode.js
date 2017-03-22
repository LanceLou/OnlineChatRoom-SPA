angular.module('techNodeApp', ['ngRoute', 'angularMoment']).
run(function ($window, $rootScope, $http, $location) {
  $window.moment.lang('zh-cn')
  $http({
    url: '/api/validate',
    method: 'GET'
  }).then(function (response){
  	$rootScope.me = response.data
    $location.path('/')
  },function (err){
  	$location.path('/login')
  });
  $rootScope.logout = function() {
    $http({
      url: '/api/logout',
      method: 'GET'
    }).then(function (response){
  	  $rootScope.me = null
      $location.path('/login')
    },function (err){
  	  // 
    });
  }
  $rootScope.$on('login', function (evt, me) {
    console.log(me);
    $rootScope.me = me
  })
})