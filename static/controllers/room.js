angular.module('techNodeApp').controller('RoomCtrl', function($scope, $routeParams, socket) {
  socket.emit('getAllRooms', {
    // 获取root参数
    _roomId: $routeParams._roomId
  })
  socket.on('roomData.' + $routeParams._roomId, function(room) {
    $scope.room = room
  })
  socket.on('messageAdded', function(message) {
    $scope.room.messages.push(message)
  })
  socket.on('joinRoom', function (join) {
    $scope.room.users.push(join.user)
  })

  //用户离开页面处理, 路由被改变
  $scope.$on('$routeChangeStart', function() {
    socket.emit('leaveRoom', {
      user: $scope.me,
      room: $scope.room
    })
  })

  socket.on('leaveRoom', function(leave) {
    _userId = leave.user._id
    $scope.room.users = $scope.room.users.filter(function(user) {
      return user._id != _userId
    })
  })
})