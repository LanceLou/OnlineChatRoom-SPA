var db = require('../models')

exports.create = function(message, callback) {
  var dbmessage = new db.Message()
  dbmessage.content = message.content
  dbmessage.creator = message.creator
  dbmessage._roomId = message._roomId
  dbmessage.save(callback)
}
exports.read = function(callback) {
  db.Message.find({
  }, null, {
    sort: {
      'createAt': -1
    },
    limit: 20
  }, callback)
}