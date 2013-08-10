/**
 * Module dependencies.
 */

var express = require('express'),
	util = require('util'),
	routes = require('./routes'),
	fs = require('fs');
var app = module.exports = express();

/**
 * 使用doT模板
 */

//var engines = require('consolidate'); //express3变更了register方法，故用此。
//var dot = require('dot');
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
grab.start();
var cronJob = require('cron').CronJob;
var job = new cronJob({
	cronTime: '00 */15 * * * *',
	onTick: function(){util.log('job start...'); grab.start()},
	start: false, //立即开始，但基本上要碰运气。先手动开始吧。。。
	timeZone: 'Asia/Chongqing'
});
job.start();

// Configuration

app.configure(function() {
	app.use(express.compress());
	app.use(require('stylus').middleware({
		src: __dirname + '/public'
	}));
	app.use(express.static(__dirname + '/public'));
	app.set('views', __dirname + '/views');
	app.set('view engine', 'html' ); // 也可用dot后缀名，但那样就无语法高亮了
 	app.engine('html', doT.__express );
	//app.set("view options", { layout: false }); //貌似在自定义模板下无效
	app.use(express.bodyParser());
	app.use(express.methodOverride());
	app.use(express.cookieParser());
	app.use(express.session({
		secret: 'your secret here'
	}));
	app.use(express.logger('dev'));
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
	app.set('view cache', true);
});

// Routes
// app.param('name',function(req,res,next,name){
// 	if(name=='$'){
// 		req.params.name = '海外购';
// 		next();
// 	}
// })
app.get('/(page)?/:pageNum?', routes.index);
app.get('/deals/:type?/:name?/(page)?/:pageNum?', routes.deals);
app.get('/detail/:_id/:format?', routes.detail);

app.listen(3000, function() {
	console.log("Express server listening on port %d in %s mode", 3000, app.settings.env);
});