angular.module('techNodeApp').controller('LoginCtrl', function($scope, $http, $location) {
  $scope.login = function () {
    $http({
      url: '/api/login',
      method: 'POST',
      data: {
        email: $scope.email
      }
    }).then(function (user) {
      $scope.$emit('login', user.data)
      $location.path('/rooms')
    },function (err) {
      $location.path('/login')
    });
  }
})