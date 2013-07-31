var mongoose = require('mongoose');

var Schema = mongoose.Schema;

// Define Deal schema
var _Deal = new Schema({
	title: {type:String, index: true, required: true, unique:true},
	alink: String,
	blink: String,
	simage:  {type:String, required: true},
	mimage: String,
	content: String,
	mall: String,
	catelog: String,
	brand: String,
	pname: String,
	model: String,
	currency: String,
	price: {type:String, required: true},
	promote: String,
	source: String
});

// export them
exports.Deal = mongoose.model('Deal', _Deal);

