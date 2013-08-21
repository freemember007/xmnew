/**
 * 模块依赖.
 */
var mongoose = require('mongoose')
	, models = require('../models/models.js')
	, Deal = models.Deal
	, _ = require('underscore')
	, moment = require('moment');
// if(SUBDOMAIN=='xmnew'){
	// mongoose.connect('mongodb://nodejitsu_freemem:olvvc1o4807e7hl9esrmu8rj3l@ds027718.mongolab.com:27718/nodejitsu_freemem_nodejitsudb8759265400');
// }else{
	mongoose.connect('mongodb://localhost/xmnew');
// }

moment.lang('zh-cn');


/*
 * deals路由.
 */
exports.index = function(req, res){
	console.log('start route...');
	var pageNum = parseInt((req.params.pageNum)||1);
	var newPageNum = (pageNum + 1).toString();
	Deal.find({}, null, {sort: [['_id', -1]], skip:(pageNum-1)*40, limit: 40}, function(err,deals){
		console.log('query mongodb...');
		if (err) {
			return res.json({type: 'fail', data: err.message })
		}
		_.map(deals, function(deal){
			deal.moment = moment(new Date( parseInt(deal._id.toString().substring( 0, 8 ), 16 ) * 1000 )).fromNow()
		})
		if(req.get('format') === 'json'){ //format为xhr请求头自定义属性
			Deal.count({_id: {$gt: req.get('lastID')}}, function(err, count){
				console.log('有%d条新数据！' ,count);
				return res.json({type: 'success', data: deals, count: count})
			});
		} else {
			return res.render('main', {title: '', keywords:'值得买, 限时抢购, 促销活动, 海淘, 优惠券, 超值, 优惠', description:'聚合最权威最丰富的值得买信息，包括淘宝值得买频道、网易惠惠网、一淘优惠购、折800值得买、爱图购、爱乐活良品等数十多个网站和博客。', nextURL: '/page/' + newPageNum, data: deals })
		}
	})
}

exports.deals = function(req, res){
	console.log('start route...');
	var pageNum = parseInt((req.params.pageNum)||1);
	var newPageNum = (pageNum + 1).toString();
	var nextURL = '/deals/' + req.params.type + '/' + req.params.name + '/page/' + newPageNum;
	var q = {};
	req.params.type == 'mall' ? q.mall = req.params.name : 
	req.params.type == 'catalog' ? q.catalog = req.params.name : 
	req.params.type == 'search' ? q.title = new RegExp(req.params.name, 'i') : 
	req.params.name == '国内购' ? q.currency = '￥' : q.currency = '$';
	Deal.find(q, null, {sort: [['_id', -1]], skip:(pageNum-1)*40, limit: 40}, function(err,deals){
		console.log('query mongodb...');
		if (err) {
			return res.json({type: 'fail', data: err.message })
		}
		_.map(deals, function(deal){
			deal.moment = moment(new Date( parseInt(deal._id.toString().substring( 0, 8 ), 16 ) * 1000 )).fromNow()
		})
		return res.render('main', {title: req.params.name + '-', keywords: req.params.name+',值得买, 限时抢购, 促销活动, 海淘, 优惠券, 超值, 优惠', description:'聚合最权威最丰富的' + req.params.name + '值得买信息，包括淘宝值得买频道、网易惠惠网、一淘优惠购、折800值得买、爱图购、爱乐活良品等数十多个网站和博客。', nextURL: nextURL, data: deals }) //可在hash表里加模板缓存cache: true, 
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
			return res.render('detail', {title: deal.title, keywords: (deal.brand + deal.pname + deal.model + ', 值得买').replace(/undefined/g, ''), description: deal.content.replace(/<[^>]*>/g,'').substring(0, 70), data: deal })
		}
	})
}