var util = require('util')
	, _ = require('underscore')
	, needle = require('needle')
	, cheerio = require('cheerio');

var deal = {};

deal.alink = 'http://cu.taobao.com/detail.htm?spm=a1z0w.6632781.350710725.1.qfxZLc&c1_id=2803&id=2625046';

needle.get(deal.alink, {timeout: 30000}, function(err, res, body){
	if(err) util.log(err);
	var $ = cheerio.load(body);
	deal.content = ($('div.info.J_TopicInfo').html().match(/<p.*?p>|<img.*?>/g)||'').join('').replace(/<a.*?a>|<script[\s\S]*?script>/g, '');
	deal.mimage = $('div.info.J_TopicInfo').find('p a').first().attr('href')||'';
	util.log('图片为：' + deal.mimage);
	util.log('内容为：' + deal.content);
});
