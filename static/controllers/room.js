angular.module('techNodeApp').controller('RoomCtrl', function($scope, socket) {

  socket.on('roomData', function (room) {
    console.log(room);
    $scope.room = room
  })
  
  // 本地产生的时间本地捕获处理，快速响应, 先将消息绘制上去
  socket.on('messageAdded', function (message) {
    $scope.room.messages.push(message)
    console.log($scope.room.messages);
  })
  //用户上线，添加显示列表
  socket.on('online', function (user) {
    $scope.room.users.push(user)
  })
  //游湖下线，删除显示列表对应项
  socket.on('offline', function (user) {
    _userId = user._id
    $scope.room.users = $scope.room.users.filter(function (user) {
      return user._id != _userId
    })
  })
  socket.emit('getRoom')
})