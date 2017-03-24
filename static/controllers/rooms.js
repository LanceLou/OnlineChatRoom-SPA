angular.module('techNodeApp').controller('RoomsCtrl', function($scope, $location, socket) {
  socket.emit('getAllRooms')
  socket.on('roomsData', function (rooms) {
    $scope.rooms = $scope._rooms = rooms
  })
  $scope.searchRoom = function () {
    if ($scope.searchKey) {
      $scope.rooms = $scope._rooms.filter(function (room) {
        return room.name.indexOf($scope.searchKey) > -1
      })
    } else {
      $scope.rooms = $scope._rooms
    }

  }
  $scope.createRoom = function () {
    socket.emit('createRoom', {
      name: $scope.searchKey
    })
  }
  socket.on('roomAdded', function (room) {
    $scope._rooms.push(room)
    $scope.searchRoom()
  })

  //进入房间界面响应
  $scope.enterRoom = function (room) {
    socket.emit('joinRoom', {
      user: $scope.me,
      room: room
    })
  }

  //进入房间服务端socket响应
  socket.on('joinRoom.' + $scope.me._id, function (join) {
    $location.path('/rooms/' + join.room._id)
  })

  //其他用户进入房间服务端响应
  socket.on('joinRoom', function (join) {
    $scope.rooms.forEach(function (room) {
      if (room._id == join.room._id) {
        room.users.push(join.user)
      }
    })
  })

})