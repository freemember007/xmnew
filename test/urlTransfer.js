var util = require('util')
	, fs = require('fs')
	, FetchStream = require("fetch").FetchStream;

var deal = {};

deal.blink = 'http://zhi.zhe800.com/to/jump/deal/24982';

var fetch = new FetchStream(deal.blink, {timeout: 30000});
fetch.on('error', function(err){
	util.log(err); // 貌似这样挺危险，那我想继续怎么办？
});
fetch.on('meta', function(meta){
	var finalUrl = meta.finalUrl;
	if (meta.finalUrl.match(/s\.click\.taobao\.com/)){

		deal.blink = meta.finalUrl; // 先赋个值再说
		util.log(deal.blink);
		var TU = meta.finalUrl;
		var ET = unescape(meta.finalUrl).replace('http://s.click.taobao.com/t_js?tu=','');
		var fetchTB = new FetchStream(ET, {timeout: 30000, headers: {'Referer': TU}});
		fetchTB.on('meta', function(meta){
			deal.blink = meta.finalUrl;
			trimURL();
		})
	}else if(finalUrl.match(/p\.yiqifa\.com|union\.dangdang\.com/)){
		deal.blink = finalUrl.match(/^http.*?(http.*?)$/)[1];
		util.log(deal.blink);
		trimURL();
	}else{
		deal.blink = unescape(meta.finalUrl);
		util.log(deal.blink);
		trimURL();
	}
	function trimURL(){
		fs.readFile('../src/siteURLs.json', function(err, data) {
			var siteURLs = JSON.parse(data);
			for (var k in siteURLs) {
				if (deal.blink.match(eval('/'+siteURLs[k].match+'/'))) {
					deal.mall = siteURLs[k].sitename;
					util.log(deal.mall);
					var urlReg = new RegExp(siteURLs[k].url);
					if (k === 'taobao' || k === 'tmall') {
						deal.blink = deal.blink.match(urlReg)[1] + deal.blink.match(urlReg)[2];
						util.log(deal.blink);
					} else {
						deal.blink = (deal.blink.match(urlReg)||[])[0]||deal.blink;
						util.log(deal.blink);
					}
					return;
				}	
			}
		})
	}
	
});