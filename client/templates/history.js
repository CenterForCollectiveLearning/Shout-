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

});