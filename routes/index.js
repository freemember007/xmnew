/**
 * 模块依赖.
 */
var mongoose = require('mongoose')
	, models = require('../models/models.js')
	, Deal = models.Deal;

mongoose.connect('mongodb://localhost/xmnew');



/*
 * deals路由.
 */
exports.index = function(req, res){
	var pageNum = parseInt((req.params.pageNum)||1);
	var newPageNum = (pageNum + 1).toString();
	Deal.find({}, null, {sort: [['_id', -1]], skip:(pageNum-1)*40, limit: 40}, function(err,deals){
		if (err) {
			return res.json({type: 'fail', data: err.message })
		}
		return res.render('main', {title: '', nextURL: '/page/' + newPageNum, data: deals })
	})
}

exports.deals = function(req, res){
	var pageNum = parseInt((req.params.pageNum)||1);
	var newPageNum = (pageNum + 1).toString();
	var nextURL = '/deals/' + req.params.type + '/' + req.params.name + '/page/' + newPageNum;
	var q = {};
	req.params.type == 'mall' ? q.mall = req.params.name : 
	req.params.type == 'catalog' ? q.catalog = req.params.name : 
	req.params.type == 'search' ? q.title = new RegExp(req.params.name, 'i') : 
	req.params.name == '国内购' ? q.currency = '￥' : q.currency = '$';
	Deal.find(q, null, {sort: [['_id', -1]], skip:(pageNum-1)*40, limit: 40}, function(err,deals){
		if (err) {
			return res.json({type: 'fail', data: err.message })
		}
		return res.render('main', {title: req.params.name + '-', nextURL: nextURL, data: deals })
	})
}

exports.detail = function(req, res){
	Deal.findById(req.params._id, function(err,deal){
		if (err) {
			return res.json({type: 'fail', data: err.message })
		}
		if(req.params.format){
			return res.json({type: 'success', data: deal})
		} else {
			return res.render('detail', {title: deal.title, data: deal })
		}
	})
}