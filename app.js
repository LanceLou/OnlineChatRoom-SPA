var express = require('express')
var Controllers = require('./controllers')
var Cookie = require('cookie')
var async = require('async');
var session = require('express-session'),
	cookieParser = require('cookie-parser'),
    bodyParser = require('body-parser');
var ObjectId = require('mongoose').Schema.ObjectId

var app = express()
var port = process.env.PORT || 3000


// 用于将Session存入mongodb中
var MongoStore = require('connect-mongo')(session)
var sessionStore = new MongoStore({
  url: 'mongodb://localhost/technode'
})


// express 配置中间件
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(bodyParser.json());
app.use(cookieParser())
app.use(session({
  secret: 'technode', //加密签名
  cookie:{
    maxAge: 60 * 1000
  },
  ttl: 14 * 24 * 60 * 60,
  store: sessionStore
}))



app.use(express.static(__dirname + '/static'))

//默认导向index页面
// app.use(function (req, res) {
//   res.sendfile('./static/index.html')
// })

//---socket 连接代码块方面
var io = require('socket.io').listen(app.listen(port))

var SYSTEM = {
  name: 'technode机器人',
  avatarUrl: 'http://upload.wikimedia.org/wikipedia/commons/thumb/0/05/Robot_icon.svg/220px-Robot_icon.svg.png'
}

//---socketIO认证 
io.set('authorization', function(handshakeData, accept) {
  // 解析客户端的cookie字符串  取得session
  var cookies = Cookie.parse(handshakeData.headers.cookie)
  var connectSid = cookies['connect.sid']; //connect_sid即我们之前自定义的cookie键字段
  if (connectSid) {
    var connected = cookieParser.signedCookie(connectSid, 'technode'); //验证session的secret
    if (connected) {
      sessionStore.get(connected, function(error, session) {
        if (error) {
          accept(error.message, false)
        } else {
          handshakeData.headers.sessions = session
          if (session._userId) {
            accept(null, true)
          } else {
            accept('No login')
          }
        }
      })
    }
  } else {
    accept('No session')
  }
})


var messages = []
io.sockets.on('connection', function(socket) {
  _userId = socket.handshake.headers.sessions._userId
  Controllers.User.online(_userId, function(err, user) {
    if (err) {
      socket.emit('err', {
        mesg: err
      })
    } else {
      if (user._roomId) {
          socket.join(user._roomId)
          socket.to(user._roomId).broadcast.emit('users.join', user)
          socket.to(user._roomId).broadcast.emit('messages.add', {
            content: user.name + '进入了聊天室',
            creator: SYSTEM,
            createAt: new Date(),
            _id: ObjectId()
        })
      }
    }
  })
  socket.on('disconnect', function() {
    Controllers.User.offline(_userId, function(err, user) {
      if (err) {
        socket.emit('err', {
          mesg: err
        })
      } else {
        if (user && user._roomId) {
          socket.to(user._roomId).broadcast.emit('leaveRoom', user)
          socket.to(user._roomId).broadcast.emit('messageAdded', {
            content: user.name + '离开了聊天室',
            creator: SYSTEM,
            createAt: new Date(),
            _id: ObjectId()
          })
          Controllers.User.leaveRoom({user: user}, function() {})
        }
      }
    })
  });
  socket.on('getRoom', function() {
    async.parallel([
      function(done) {
        Controllers.User.getOnlineUsers(done)
      },
      function(done) {
        Controllers.Messages.read(done)
      }
    ],
    function(err, results) {
      if (err) {
        socket.emit('err', {
          msg: err
        })
      } else {
        socket.emit('roomData', {
          users: results[0],
          messages: results[1]
        })
      }
    });
  })
    
  // 
  socket.on('createMessage', function(message) {
    //这个回调函数参数message会被数据填充，对应的值为插入的值
    Controllers.Messages.create(message, function(err, message) {
      if (err) {
        socket.emit('err', {
          msg: err
        })
      } else {
        //广播给出发送方以外的其他房间内的人
        socket.in(message._roomId).broadcast.emit('messageAdded', message)

        //事件触发给发送方的socket监听
        socket.emit('messageAdded', message)
      }
    })
  })

  socket.on('createRoom', function (room) {
    //服务器里面有没有存message 的 content
    Controllers.Room.create(room, function (err, room) {
      if (err) {
        socket.emit('err', {msg: err})
      } else {
        io.sockets.emit('roomAdded', room)
      }
    })
  })

  socket.on('getAllRooms', function(data) {
    //如果带上了_roomId
    if (data && data._roomId) {
      Controllers.Room.getById(data._roomId, function(err, room) {
        if (err) {
          socket.emit('err', {
            msg: err
          })
        } else {
          socket.emit('roomData.' + data._roomId, room)
        }
      })
    } else {
      Controllers.Room.read(function(err, rooms) {
        if (err) {
          socket.emit('err', {
            msg: err
          })
        } else {
          socket.emit('roomsData', rooms)
        }
      })
    }
  })

  socket.on('joinRoom', function(join) {
    Controllers.User.joinRoom(join, function(err) {
      if (err) {
        socket.emit('err', {
          msg: err
        })
      } else {
        socket.join(join.room._id) //创建并加入一个socket房间, 注意这是socket房间，此房间非彼房间
        socket.emit('joinRoom.' + join.user._id, join)
        socket.to(join.room._id).broadcast.emit('messageAdded', {
          content: join.user.name + '进入了聊天室',
          creator: SYSTEM,
          createAt: new Date(),
          _id: ObjectId()
        })

        //仅仅向joined的房间brodcast了，而其它未加入房间的并没有
        socket.to(join.room._id).broadcast.emit('joinRoom', join)
      }
    })
  })

  socket.on('leaveRoom', function(leave) {
    Controllers.User.leaveRoom(leave, function(err) {
      if (err) {
        socket.emit('err', {
          msg: err
        })
      } else {
        socket.in(leave.room._id).broadcast.emit('messageAdded', {
          content: leave.user.name + '离开了聊天室',
          creator: SYSTEM,
          createAt: new Date(),
          _id: ObjectId()
        })
        socket.leave(leave.room._id)
        io.sockets.emit('leaveRoom', leave)
      }
    })
  })

})


//开始session socketIO服务
//---socket 连接代码块方面



console.log('TechNode is on port ' + port + '!')




app.get('/api/validate', function (req, res) {
  _userId = req.session._userId
  if (_userId) {
    Controllers.User.findUserById(_userId, function (err, user) {
      if (err) {
        res.json(401, {msg: err})
      } else {
        res.json(user)
      }
    })
  } else {
    res.status(401).json(null)
    // res.json(401, null)
  } 
})


// 在用户登录或者登出是修改用户的在线状态：
app.post('/api/login', function(req, res) {
  email = req.body.email
  if (email) {
    Controllers.User.findByEmailOrCreate(email, function(err, user) {
      if (err) {
        res.json(500, {
          msg: err
        })
      } else {
        req.session._userId = user._id
        Controllers.User.online(user._id, function (err, user) {
          if (err) {
            res.json(500, {
              msg: err
            })
          } else {
            res.json(user)
          }
        })
      }
    })
  } else {
    res.status(403).json(null)
  }

})

app.get('/api/logout', function(req, res) {
  req.session._userId = null;
  _userId = req.session._userId
  Controllers.User.offline(_userId, function (err, user) {
    if (err) {
      res.json(500, {
        msg: err
      })
    } else {
      delete req.session._userId
      res.json(200)
    }
  })
})