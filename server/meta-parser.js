metaParse = function(params){
	var html;
	var res 	= {};
	var errors 	= [];
	res.url 	=  params.url;
	
	if(params.url.substr(0, 4) === 'http'){
		try{
			var result = HTTP.call('GET', params.url, {params: {'vary': 'Accept-Encoding'}});
			if(result.statusCode !== 200){
				errors.push('Something wrong. Status code: '+result.statusCode);
			}
			html = result.content;
		}catch(e){
			errors.push(JSON.stringify(e, null, '  '));
		}
	}else{
		errors.push('Invalid url');
	}

	if(errors.length > 0){
		res.error = errors.join(', ');
	}else{
		// title
		if(params.title){
			re = /<title>([\s\S]*)<\/title>/gmi;
			if ((m = re.exec(html)) !== null) {
				res.title =  m[1];
			}
		}
		
		//meta tags
		if(params.meta != false){
			var re 	= /<meta.*(?:name|property)=['"](.*?)['"].*?(?:content|value)=['"]([\s\S]*?)['"].*>/gmi;
			var prepare = {};
			var desc;
			while((m = re.exec(html)) !== null){
				if(params.meta.indexOf(m[1]) > -1){
					var search = m[1];
				}else{
					var sep = m[1].indexOf(':');
					search 	= (sep != -1)? m[1].substr(0, sep) : m[1]
				}
				if(params.meta.indexOf(search) > -1){
					if(params.meta.indexOf(m[1]) > -1){
						prepare[search] = m[2];
					}else{
						if(sep != -1){
								desc = m[1].split(':');
								prepare[search+':'+desc[1]] = m[2];
						}else{
							prepare[search] = m[2];
						}
					}
				}
			}
			res.meta = prepare;
		}
		
		// links
		if(params.a){
			var tag_a = [];
			var re = /<a.+?\s*href\s*=\s*["\']?([^"\'\s>]+)["\']?/gmi;
			while ((m = re.exec(html)) !== null) {
				tag_a.push(m[1]);
			}
			res.a = {
				'count' : tag_a.length,
				'data'	: tag_a
			}
		}

		// images
		if(params.img){
			var tag_img = [];
			var re = /<img.+?\s*src\s*=\s*["\']?([^"\'\s>]+)["\']?/gmi;
			while ((m = re.exec(html)) !== null) {
				tag_img.push(m[1]);
			}
			res.img = {
				'count' : tag_img.length,
				'data'	: tag_img
			}
		}
	}
	return res;
};

Meteor.methods({
	metaParse: function (params){
		return metaParse(params);
	}
});