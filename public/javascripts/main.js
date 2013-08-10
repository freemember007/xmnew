$(document).ready(function(){

	// 无限翻页
	jQuery.ias({
		container: '#container',
		item: '.item',
		pagination: 'div#navigation',
		next: 'div#navigation a:first',
		loader: '<img src="/images/ajax-loader.gif"/>',
		trigger: '点击加载更多...'
	});

	// 搜索商品
	$('#searchSubmit').click(function() {
		location.assign('/deals/search/' + $('#searchText').val());
	});
	$('#searchText').focus(function() {
		$(document).keypress(function(e){
			if (e.keyCode === 13){
				location.assign('/deals/search/' + $('#searchText').val());
			}
		});
	});

	// 显示详情
	$('#content').delegate('.img-polaroid', 'click', function(e){
		var _id = $(this).attr('_id');
		e.preventDefault();
		$.get('/javascripts/templates/detail.html', function(res, status){
			var detailTemp = doT.template(res);
			$.get('/detail/' + _id + '/format', function(res, status){
				$('body').append(detailTemp(res));
				$('#modal-wrapper').css('height', $(document).height());
				$(document).keypress(close);
				$('#close').click(close);
				$('#modal-wrapper').click(close);
				function close(e){
					if (e.type === 'click' || e.keyCode === 27){
						$('#modal-wrapper, #detailContainer').fadeOut('fast', function(){$(this).remove()});
						e.preventDefault();
					}
				}
			})
		});
	})
});