//----------------- 变量与环境 -----------------//
var dealSites, count;
var util = require('util')
	, fs = require('fs')
	, _ = require('underscore')
	, needle = require('needle')
	, cheerio = require('cheerio')
	, FetchStream = require("fetch").FetchStream
	, async = require('async')
	, models = require('./models/models.js')
	, Deal = models.Deal;

//----------------- 载入配置文件 -----------------//
exports.start = function(){
	//var mongoose = require('mongoose');
	//mongoose.connection.close();
	//mongoose.connect('mongodb://localhost/taodou');
	count = 0;
	fs.readFile('./src/dealSites.json', function(err, data) {
		dealSites = JSON.parse(data);
		grabList(dealSites[count]);
	})
}

//---------------- 抓取dealList -----------------//
function grabList(dealSite){
	if (count >= dealSites.length) {return util.log('finished!!!')};
	var dealList = [];
	util.log('页面下载开始...' + dealSite.url);
	needle.get(dealSite.url, {timeout: 30000, follow: true, headers: {compressed : true, user_agent: 'Mozilla/5.0 (Windows NT 6.1; rv:12.0) Gecko/20100101 Firefox/12.0'}}, function(error, res, data){
		//util.log(data)
		if(error) util.log("Got error: " + error);
		util.log('页面下载完毕');
		var $ = cheerio.load(data);
		$(dealSite.list).each(function(i, elem){
			if(i>9){return}; //这样写避免嵌套
			// 取基本信息
			var deal = {
				title: $(this).find(dealSite.title).text() || '',
				alink: ($(this).find(dealSite.alink).attr('href') || '/').replace(/^\//, dealSite.url.replace(/\/[^\.]+?\.html?/,'')+'/'),
				blink: ($(this).find(dealSite.blink).attr('href') || '/').replace(/^\//, dealSite.url.replace(/\/[^\.]+?\.html?/,'')+'/'),
				simage: $(this).find(dealSite.simage).attr('data-src') || $(this).find(dealSite.simage).attr('data-original') || $(this).find(dealSite.simage).attr('original') || $(this).find(dealSite.simage).attr('src'),
				content: $(this).find(dealSite.content).text(), //兼容无详情页的情况
				source: dealSite.sitename
			};
			deal.mimage = deal.simage;
			deal.content = deal.content + "<p><img src='" + deal.mimage + "'/></p>";
			//deal.simage = deal.simage.replace(/\.jpg_n\d/,'');
			util.log('第' + i + '条是：' + deal.title);

			// 取价格和币种
			var regDollor = /(\d+\.?\d*)美[刀元]|(\d+\.?\d*)刀|\$\s*?(\d+\.?\d*)/;
			var regYuan = /(\d+\.?\d*)元|￥(\d+\.?\d*)|价格(\d+\.?\d*)/;
			if (deal.title.match(regDollor)){
				deal.currency = '$';
				deal.price = _.compact(deal.title.match(regDollor))[1];
			} else if (deal.title.match(regYuan)) {
				deal.currency = '￥';
				deal.price = _.compact(deal.title.match(regYuan))[1];
			}
			util.log('价格是：' + deal.currency + deal.price);

			// 取分类、商品名
			fs.readFile('./src/pnameDict.json', function(err, data) {//放在循环里是否会影响效率？
				var pnameDict = JSON.parse(data);
				_.each(pnameDict,function(vs, k, list){
					async.detect(vs, function(v, callback){
						callback(deal.title.indexOf(v) !== -1);
					}, function(result){
						if (result !== undefined) {
							deal.pname = result;
							deal.catalog = k.match(/\d\={6,}(.*?)\=/)[1];
							util.log('商品名是：' + deal.pname + '，分类是：' + deal.catalog);
						}	
					})
				})
			});

			// 取品牌
			fs.readFile('./src/brandDict.txt', function(err, data) {
				var brandDict = _.compact(data.toString().split('\n'));
				async.detect(brandDict, function(v, callback){
					callback(deal.title.indexOf(v) !== -1);
				}, function(result){
					if (result !== undefined) {
						deal.brand = result;
						util.log('品牌是：' + deal.brand);
					}	
				})	
			})	
			// 将结果存到数组
			dealList.push(deal);
		})
		util.log('下一步...')
		grabDetail(dealList, dealSite);	
	});	
}

//---------------- 抓取deal content -----------------//
function grabDetail(dealList, dealSite){
	var i = 1;
	var contentReg = /<(script|div|a|label)[\s\S]*?\1>|<input[\s\S]*?>|<p ?><\/p>|<p>&nbsp;<\/p>|<img[^>]*?180px.*?>|您可以用合作网站帐号登录:|建议：大家都去安装一个，商品历史价格一目了然，自己就能辨别真假降价。/g
	async.each(dealList, function(deal, callback) {
		needle.get(deal.alink, {timeout: 30000}, function(err, res, body){
			if(err) util.log(err);
			util.log('解析第' + i + '条：' + deal.alink ); //应该不是按顺序走的吧？
			var $ = cheerio.load(body);
			deal.content = ((($(dealSite.content).html()||'').match(/<img.*?>|<p.*?p>/g)||[]).join('')||'').replace(contentReg, '')||deal.content;
			deal.mimage = $(dealSite.content).find('img').first().attr('src')||deal.mimage;
			util.log('图片为：' + deal.mimage);
			util.log('内容为：' + deal.content.substr(0,100));
			i++;
			callback();
		});
	}, function(err) {
		if(err) { util.log(err) };
		filterData(dealList);
	})
}

//---------------- 解析真实购买地址 -----------------//
function filterData(dealList){
	async.each(dealList, function(deal, callback) {
		util.log(deal.blink);
		var fetch = new FetchStream(deal.blink, {timeout: 30000});
		fetch.on('error', function(err){
			util.log(err); // 貌似这样挺危险，那我想继续怎么办？
			saveDeal(dealList); //为避免多个callback错误, 此外不走callback
		});
		fetch.on('meta', function(meta){
			var finalUrl = meta.finalUrl;
			if (finalUrl.match(/s\.click\.taobao\.com/)){
				deal.blink = finalUrl; // 先赋个值再说
				var TU = finalUrl;
				var ET = unescape(TU).replace('http://s.click.taobao.com/t_js?tu=','');
				var fetchTB = new FetchStream(ET, {timeout: 30000, headers: {'Referer': TU}});
				fetchTB.on('meta', function(metaTB){
					deal.blink = metaTB.finalUrl;
					//util.log(deal.blink);
					trimURL();
				})
			}else if(finalUrl.match(/p\.yiqifa\.com|union\.dangdang\.com|c\.duomai\.com/)){
				deal.blink = finalUrl.match(/^http.*?(http.*?)$/)[1];
				//util.log(deal.blink);
				trimURL();
			}else{
				deal.blink = unescape(finalUrl);
				trimURL();
			}
			function trimURL(){
				fs.readFile('./src/siteURLs.json', function(err, data) {
					var siteURLs = JSON.parse(data);
					for (var k in siteURLs) {
						if (deal.blink.match(eval('/'+siteURLs[k].match+'/'))) {
							deal.mall = siteURLs[k].sitename;
							var urlReg = new RegExp(siteURLs[k].url);
							if (k === 'taobao' || k === 'tmall') {
								deal.blink = deal.blink.match(urlReg)[1] + deal.blink.match(urlReg)[2];
								util.log(deal.blink);
							} else {
								util.log(deal.blink);
								deal.blink = (deal.blink.match(urlReg)||[])[0]||deal.blink;
								util.log(deal.blink);
							}
							return;
						}	
					}
				})
			}
			callback();
		});
	}, function(err) {
		if(err) { util.log(err); }
		util.log('all update!');
		saveDeal(dealList);
	})
}

//---------------- 保存deal数据 -----------------//
function saveDeal(dealList){
	async.each(dealList, function(deal, callback) {
		var newDeal = new Deal(deal);
		newDeal.save(function(err){
			if (err) { util.log(err) };
			callback();
		})	
	}, function(err) {
		if(err) { util.log(err) };
		util.log('all saved!');
		count++;
		grabList(dealSites[count]);
	})
}