Sites 		= new Mongo.Collection('sites');
Comments 	= new Mongo.Collection('comments');
Ratings 	= new Mongo.Collection('ratings');
Sites.allow({
	insert: function(userId, doc){
		if(Meteor.user()){
			return true;
		}else{
			return false;
		}
	},
	remove: function(userId, doc){
		if(Meteor.user()){
			if(userId != doc.createdBy){
				return false;
			}else{
				return true;
			}
		}else{
			return false;
		}
	},
	update: function(userId, doc){
		if(Meteor.user()){
			return true;
		}else{
			return false;
		}
	}
});

Comments.allow({
	insert: function(userId, doc){
		if(Meteor.user()){
			return true;
		}else{
			return false;
		}
	},
	remove: function(userId, doc){
		if(Meteor.user()){
			return true;
		}else{
			return false;
		}
	},
	update: function(userId, doc){
		if(Meteor.user()){
			return true;
		}else{
			return false;
		}
	}
});

Ratings.allow({
	insert: function(userId, doc){
		if(Meteor.user()){
			return true;
		}else{
			return false;
		}
	},
	remove: function(userId, doc){
		if(Meteor.user()){
			return true;
		}else{
			return false;
		}
	},
	update: function(userId, doc){
		if(Meteor.user()){
			return true;
		}else{
			return false;
		}
	}
});