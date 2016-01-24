Router.configure({
	layoutTemplate: 'SocialMain'
});

Router.route('/', function () {
	this.render('nav', {
		to:"nav"
	});
	this.render('content', {
		to:"content"
	});
});

Session.set('test', 0);

Router.route('/site/:_id', function () {
	
	
	
	this.render('nav', {
		to:"nav"
	});
	this.render('detail', {
		to:"content", 
		data:function(){
			Session.set('resourse_id', this.params._id);
			return Sites.findOne({_id:this.params._id});
		}
	});
});





Accounts.ui.config({
	passwordSignupFields: "USERNAME_AND_EMAIL"
});

// update count view
Template.detail.onRendered(function () {
	this.autorun(function (comp){
		if(Meteor.user()){
			var site = Sites.findOne({
				_id : Session.get('resourse_id')
			});
			c_view = site.c_view + 1;
			Sites.update(
			{
				_id : Session.get('resourse_id')
			},
			{
				$set: {c_view : c_view}
			});
			comp.stop();
		}
	});
});



Template.nav.helpers({
	isAuthorize : function(){
		if(Meteor.user()){
			return true;
		}else{
			return false;
		}
	}, 
	count_sites : function(){
		var count_sites = Sites.find().count();
		return (count_sites > 0)? count_sites : 0;
	}, 
	count_users : function(){
		var count_users = Meteor.users.find().count();
		return (count_users > 0)? count_users : 0;
	}
});

Template.nav.events({
	'click .fsearch' : function(e){
		$('#searchbox').addClass('searchbox_act');
	}
});

Template.content.helpers({
	isAuthorize : function(){
		if(Meteor.user()){
			return true;
		}else{
			return false;
		}
	}
});


Template.detail.helpers({
	isAuthorize : function(){
		if(Meteor.user()){
			return true;
		}else{
			return false;
		}
	}
});

metaParse = function (params, callback) {
	Meteor.call('metaParse', params, callback);
};

Session.set('result', '');

Session.set("siteExists", false);

Session.set("type_sort", 'rating');



Template.content.helpers({
	is_my : function(user_id){
		return (Meteor.user()._id == user_id)? true : false;
	},
	sites_last : function(){
		return Sites.find({} ,
				{
					sort: {createdOn : -1},
					limit: 4
				});
	},
	sites : function(){
		
		var sort_type = Session.get("type_sort");
		var sort;
		if(sort_type == 'rating'){
			sort = {c_rating : -1, createdOn : -1};
		}
		if(sort_type == 'viwes'){
			sort = {c_view : -1, createdOn : -1};
		}
		if(sort_type == 'comments'){
			sort = {c_comments : -1, createdOn : -1};
		}
		if(sort_type == 'date'){
			sort = {createdOn : -1};
		}

		
		return Sites.find({} ,
				{
					sort: sort
				});
	},
	exists_site_id : function(){
		return Session.get("existsSiteId");
	},
	siteExists: function(){
		return Session.get("siteExists");
	},
	count_likes: function(site_id){
		// reduce count of likes
		var likes;
		if(Ratings.find({site_id:site_id, rating:1}).count() > 0){
			likes = _.reduce(_.map(Ratings.find({site_id:site_id, rating:1}).fetch(), 
				function(doc) {
				  //map
				  return doc.rating
				}), 
				function(memo, num){ 
				  //reduce
				  return memo + num;
				}
			);
		}else{
			likes = 0;
		}
		return likes;
	},
	count_unlikes: function(site_id){
		// reduce count of unlikes
		var unlikes;
		if(Ratings.find({site_id:site_id, rating:-1}).count() > 0){
			unlikes = _.reduce(_.map(Ratings.find({site_id:site_id, rating:-1}).fetch(), 
				function(doc) {
				  //map
				  return -1*doc.rating
				}), 
				function(memo, num){ 
				  //reduce
				  return memo + num;
				}
			);
		}else{
			unlikes = 0;
		}
		return unlikes;
	},
	count_comments: function(site_id){
		var count = Comments.find({resource_id:site_id}).count();
		return (count > 0)? count : 0;
	},
	id_rating: function(site_id){
		var rating = Ratings.findOne({
			site_id : site_id,
			user_id : Meteor.user()._id
		});
		return (typeof rating == "undefined")? '' : rating._id;
	}
});

Template.content.events({
	'click .js-add-site-form' : function(e){
		$('#site_add_form').modal('show');
	},
	'click .js-close' : function(e){
		$('#url').val('');
	},
	'click .js-add-site' : function(e){
		$(e.currentTarget).text('Wait');
		var params 	= {};
		params.url 	= $('#url').val();
		params.title = true;
		params.meta = ['description', 'keywords', 'og:image', 'twitter:image', 'og:title', 'twitter:title'];
		metaParse(params, (err, res) => {
			if(err){
				Session.set('result', JSON.stringify(err, null, '  '));
			}else{
				// basic image
				res.image 		= (typeof res['meta']['og:image'] != "undefined")? res['meta']['og:image'] :
					(typeof res['meta']['twitter:image'] != "undefined")? res['meta']['twitter:image'] : '';
					
				// basic description
				res.description = (typeof res['meta']['description'] != "undefined")? res['meta']['description'] : '';
				
				// basic keywords
				res.keywords 	= (typeof res['meta']['keywords'] != "undefined")? res['meta']['keywords'] : '';
				delete res.meta;
				Session.set('result', JSON.stringify(res, null, '  '));
				
				
				var site = Sites.findOne({url:res.url});
				if(typeof site != "undefined"){
					Session.set("siteExists", true);
					Session.set("existsSiteId", site._id);
				}else{
					Sites.insert({
						url 		: res.url,
						image 		: res.image,
						tags 		: res.keywords,
						description : res.description,
						title 		: res.title,
						
						c_rating : 0,
						c_view 		: 0,
						c_comments 	: 0,
						
						createdOn 	: new Date(),
						createdBy 	: Meteor.user()._id
					});
					
					$('#url').val('');
					$('#site_add_form').modal('hide');
				}
				$(e.currentTarget).text('Add');
			}
		});
	},
	'click .js-like': function(e){

		var id_rating = $(e.currentTarget).data('rating');
		
		var like = Ratings.findOne({
			site_id : $(e.currentTarget).data('site'),
			user_id : Meteor.user()._id
		});

		if(typeof like == "undefined"){
			// was empty
			Ratings.insert({
				site_id 	: $(e.currentTarget).data('site'),
				user_id 	: Meteor.user()._id,
				rating		: 1,
				createdOn 	: new Date()
			});
	
		}else{
			// was unlike
			if(like.rating == -1){
				var update = (id_rating == '')? {site_id 	: $(e.currentTarget).data('site'),user_id 	: Meteor.user()._id} : {_id:id_rating};
				Ratings.update(
					update,
				{
					$set: {rating : 1}
				});
			
			}
		}
		
		//common
		var likes;
		if(Ratings.find({site_id:$(e.currentTarget).data('site'), rating:1}).count() > 0){
			likes = _.reduce(_.map(Ratings.find({site_id:$(e.currentTarget).data('site'), rating:1}).fetch(), 
				function(doc) {
				  //map
				  return doc.rating
				}), 
				function(memo, num){ 
				  //reduce
				  return memo + num;
				}
			);
		}else{
			likes = 0;
		}
		
		var unlikes;
		if(Ratings.find({site_id:$(e.currentTarget).data('site'), rating:-1}).count() > 0){
			unlikes = _.reduce(_.map(Ratings.find({site_id:$(e.currentTarget).data('site'), rating:-1}).fetch(), 
				function(doc) {
				  //map
				  return -1*doc.rating
				}), 
				function(memo, num){ 
				  //reduce
				  return memo + num;
				}
			);
		}else{
			unlikes = 0;
		}
		
		var common_rating = likes - unlikes;
	
		Sites.update(
		{
			_id : $(e.currentTarget).data('site')
		},
		{
			$set: {c_rating : common_rating}
		});
		
	},
	'click .js-unlike' : function(e){
		
		
		var id_rating = $(e.currentTarget).data('rating');
		var unlike = Ratings.findOne({
			site_id : $(e.currentTarget).data('site'),
			user_id : Meteor.user()._id
		});

		if(typeof unlike == "undefined"){
			// was empty
			Ratings.insert({
				site_id 	: $(e.currentTarget).data('site'),
				user_id 	: Meteor.user()._id,
				rating		: -1,
				createdOn 	: new Date()
			});
			
			
			
		}else{
			// was unlike
			if(unlike.rating == 1){
				var update = (id_rating == '')? {site_id 	: $(e.currentTarget).data('site'),user_id 	: Meteor.user()._id} : {_id:id_rating};
				Ratings.update(
					update,
				{
					$set: {rating : -1}
				});
				
				
				
			}
		}
		
		
		//common
		var likes;
		if(Ratings.find({site_id:$(e.currentTarget).data('site'), rating:1}).count() > 0){
			likes = _.reduce(_.map(Ratings.find({site_id:$(e.currentTarget).data('site'), rating:1}).fetch(), 
				function(doc) {
				  //map
				  return doc.rating
				}), 
				function(memo, num){ 
				  //reduce
				  return memo + num;
				}
			);
		}else{
			likes = 0;
		}
		
		var unlikes;
		if(Ratings.find({site_id:$(e.currentTarget).data('site'), rating:-1}).count() > 0){
			unlikes = _.reduce(_.map(Ratings.find({site_id:$(e.currentTarget).data('site'), rating:-1}).fetch(), 
				function(doc) {
				  //map
				  return -1*doc.rating
				}), 
				function(memo, num){ 
				  //reduce
				  return memo + num;
				}
			);
		}else{
			unlikes = 0;
		}
		
		var common_rating = likes - unlikes;

		Sites.update(
		{
			_id : $(e.currentTarget).data('site')
		},
		{
			$set: {c_rating : common_rating}
		});
		
	},
	'click .line_info button' : function(e){
		var type_sort = $(e.currentTarget).data('sort');
		$('.line_info button').removeClass('act');
		$(e.currentTarget).addClass('act');
		Session.set("type_sort", type_sort);
	},
	'focusout .js-search' : function(){
		$('#searchbox').removeClass('searchbox_act');
		$('.js-search').val('');
	},
	// search content
	'keyup .js-search': function(e){
		if (e.which == 13) {
			var search = $(e.currentTarget).val();
			var result = Sites.find(
			  { $text: { $search: search, $diacriticSensitive: true } }
			);
			console.log(result);
		}
	},
	'click .del_site': function(e){
		var id = $(e.currentTarget).data('id');
		Sites.remove(id);
	}
});

Template.detail.helpers({
	comments : function(){
		return Comments.find(
				{resource_id : Session.get('resourse_id')} ,
				{
					sort: {createdOn : 1}
				});
	},
	count_comments: function(site_id){
		var count = Comments.find({resource_id:site_id}).count();
		return (count > 0)? count : 0;
	},
	format_date: function(time){
		return format_time(time);
	},
	get_author_name : function(user_id){
		var user = Meteor.users.findOne({_id:user_id});
		return user.username;
	},
	similar_sites: function(){
		var sh = [
			{createdOn : 1},
			{createdOn : -1},
			{createdBy : 1},
			{createdBy : -1},
			{c_view : 1},
			{c_view : -1},
			{c_rating : 1},
			{c_rating : -1},
			{c_comments : 1},
			{c_comments : -1},
			{title : 1},
			{title : -1}
		];
		var s = shuffle(sh);
		console.log(s[0]);
		return Sites.find(
		{},
		{
			sort: s[0],
			limit: 4
		});
	},
	id_rating: function(site_id){
		var rating = Ratings.findOne({
			site_id : site_id,
			user_id : Meteor.user()._id
		});
		return (typeof rating == "undefined")? '' : rating._id;
	},
	count_likes: function(site_id){
		// reduce count of likes
		var likes;
		if(Ratings.find({site_id:site_id, rating:1}).count() > 0){
			likes = _.reduce(_.map(Ratings.find({site_id:site_id, rating:1}).fetch(), 
				function(doc) {
				  //map
				  return doc.rating
				}), 
				function(memo, num){ 
				  //reduce
				  return memo + num;
				}
			);
		}else{
			likes = 0;
		}
		return likes;
	},
	count_unlikes: function(site_id){
		// reduce count of unlikes
		var unlikes;
		if(Ratings.find({site_id:site_id, rating:-1}).count() > 0){
			unlikes = _.reduce(_.map(Ratings.find({site_id:site_id, rating:-1}).fetch(), 
				function(doc) {
				  //map
				  return -1*doc.rating
				}), 
				function(memo, num){ 
				  //reduce
				  return memo + num;
				}
			);
		}else{
			unlikes = 0;
		}
		return unlikes;
	},
	count_comments: function(site_id){
		var count = Comments.find({resource_id:site_id}).count();
		return (count > 0)? count : 0;
	}
});

function shuffle(o){
    for(var j, x, i = o.length; i; j = Math.floor(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
    return o;
}

function format_time(time){
	var options = {
		year: 'numeric',
		month: 'long',
		day: 'numeric',
		weekday: 'long',
		timezone: 'UTC',
		hour: 'numeric',
		minute: 'numeric',
		second: 'numeric'
	};
	return time.toLocaleString("en-US", options);
}

Template.detail.events({
	'click .js-add-comment' : function(e){
		var resource_id = $(e.currentTarget).data('urlid');
		var text 		= $('.js-comment').val();
		var check_text = text.replace(/\s{1,}/g, ' ');
		if(check_text.length > 1){
			Comments.insert({
				resource_id : resource_id,
				text		: text,
				reply 		: false,
				createdOn 	: new Date(),
				createdBy 	: Meteor.user()._id
			});
			
			var count_comments = Comments.find({resource_id : resource_id}).count();
			
			Sites.update(
			{
				_id : resource_id
			},
			{
				$set: {c_comments : count_comments}
			});
			$('.js-comment').val('');
		}
	},
	// search content
	'keyup .js-search': function(e){
		if (e.which == 13) {
			var search = $(e.currentTarget).val();
			var result = Sites.find(
			  { $text: { $search: search, $diacriticSensitive: true } }
			);
			console.log(result);
		}
	}
});