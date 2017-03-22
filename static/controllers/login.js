angular.module('techNodeApp').controller('LoginCtrl', function($scope, $http, $location) {
  $scope.login = function () {
    $http({
      url: '/api/login',
      method: 'POST',
      data: {
        email: $scope.email
      }
    }).then(function (response){
      // 此处后台response的数据有问题
      // success
      $scope.$emit('login', response.data)
      $location.path('/')
    },function (err){
      //error
      $location.path('/login')
    });
  }
})