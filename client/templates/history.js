
var lastDay; 

Template.history.helpers({
	retweetEvents: function() {
		var events = Post_history.find({"user_id":Meteor.userId()});
		if (events) {
			Session.set("existsRecentHistory", true)
			return Post_history.find({"user_id":Meteor.userId()});
		}
		Session.set("existsRecentHistory", false);
	},
	existsRecentHistory: function() {
		return Session.get("existsRecentHistory");
	},

	isLoggedInUser: function(user_id) {
		return isLoggedInUser(user_id);
	},

	getSpecificUser: function(user_id) {
		return getSpecificUser(user_id);
	},

	getDate: function(timestamp) {
		return getDate(timestamp);
	},

	getTime: function(timestamp) {
		return getTime(timestamp);
	},

	isNewDay: function(timestamp) {
		var date = getDate(timestamp);
		if (date !== lastDay) {
			lastDay = date;
			return true;
		}
		return false;
	}

});