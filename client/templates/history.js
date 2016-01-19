
var lastDay; 

Template.history.helpers({
	retweetEvents: function() {
		var events = Post_history.find({"user_id":Meteor.userId()},{sort:{"time":-1}});
		if (events) {
			Session.set("existsRecentHistory", true);
			return events;
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

Template.history.onCreated(function() {
  	this.autorun(() => {
		this.subscribe('allUsers');
		this.subscribe('post_history');

	});
});

