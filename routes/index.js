/**
 * 模块依赖.
 */
var mongoose = require('mongoose')
	, models = require('../models')
	, Deal = models.Deal
	, crypto = require('crypto');

mongoose.connect('mongodb://localhost/xmnew');



/*
 * deals路由.
 */
exports.index = function(req, res){
	Deal.find({}, null, {sort: [['_id', -1]], limit: 50}, function(err,deals){
		if (err) {
			console.log(err);
			return res.json({type: 'fail', data: err.message })
		}
		return res.render('index', {type: 'success', data: deals })
	})
}

