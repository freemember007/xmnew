/**
 * Module dependencies.
 */

var express = require('express'),
	util = require('util'),
	routes = require('./routes'),
	fs = require('fs');
	//connect_cache = require('connect-cache');//动态文件的服务端缓存，还没搞懂，见：http://www.bishen.org/content/35579925757
var app = module.exports = express();

//动态文件的客户端缓存，意义不大
// var CacheControl = require("express-cache-control"),
// 	cache = new CacheControl().middleware;

/**
 * 使用doT模板
 */

var doT = require('express-dot');
doT.setGlobals({
	partialCache: true, //生产模式下应设为true
	load: function(path) {
		return fs.readFileSync(__dirname + '/views' + path)
	}
})

/**
 * 抓取任务
 */
var grab = require('./grab.js');
//grab.start();
var cronJob = require('cron').CronJob;
var job = new cronJob({
	cronTime: '00 */10 * * * *',
	onTick: function(){util.log('job start...'); grab.start()},
	start: false, //立即开始，但基本上要碰运气。先手动开始吧。。。
	timeZone: 'Asia/Chongqing'
});
job.start();

// Configuration

app.configure(function() {
	app.use(express.compress());
	//app.use(express.cache()) // 此写法无效
	app.set('views', __dirname + '/views');
	app.set('view engine', 'html' ); // 也可用dot后缀名，但那样就无语法高亮了
 	app.engine('html', doT.__express );
 	app.use(require('stylus').middleware({src: __dirname + '/public'}));
	app.use(express.static(__dirname + '/public', {maxAge: 8640000}));//静态文件的客户端缓存，时间一天
	//app.set("view options", { layout: false }); //貌似在自定义模板下无效
	app.use(express.bodyParser());
	app.use(express.methodOverride());
	app.use(express.cookieParser());
	app.use(express.session({
		secret: 'your secret here'
	}));
	app.use(express.logger('dev'));
	//app.use(connect_cache({rules: [{regex: /deals\/.*/, ttl: 600000}], loopback: 'localhost:3000'})); //生成的cache目录是做什么的？动态缓存？加app.use?
	app.use(app.router);
});

app.configure('development', function() {
	app.use(express.errorHandler({
		dumpExceptions: true,
		showStack: true
	}));
});

app.configure('production', function() {
	app.use(express.errorHandler());
	app.set('view cache', true); //在生产模式下需开启，不过貌似开发环境也被开启了？
});

//app.set('env','production')

// Routes

app.get('/(page)?/:pageNum?', routes.index);
//app.get('/deals/:type?/:name?/(page)?/:pageNum?', cache("hours", 3), routes.deals);//动态文件的客户端缓存
app.get('/deals/:type?/:name?/(page)?/:pageNum?', routes.deals);
app.get('/detail/:_id/:format?', routes.detail);

app.listen(3000, function() {
	console.log("Express server listening on port %d in %s mode", 3000, app.settings.env);
});