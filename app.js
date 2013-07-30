/**
 * Module dependencies.
 */

var express = require('express'),
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
	//partialCache : false,
	load: function(path) {
		return fs.readFileSync(__dirname + '/views' + path)
	}
})

// Configuration

app.configure(function() {
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
	app.use(require('stylus').middleware({
		src: __dirname + '/public'
	}));
	app.use(app.router);
	app.use(express.static(__dirname + '/public'));
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

app.get('/', routes.index);

app.listen(3000, function() {
	console.log("Express server listening on port %d in %s mode", 3000, app.settings.env);
});