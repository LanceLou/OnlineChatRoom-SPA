var mongoose = require('mongoose')
var Schema = mongoose.Schema,
	ObjectId = Schema.ObjectId;

var User = new Schema({
  email: String,
  name: String,
  avatarUrl: String,
  online: Boolean,
  _roomId: ObjectId
});

module.exports = User