
var lastDay; 

Template.history.helpers({
	events: function() {
		var events = Recent_activity.find({"user_id":Meteor.userId()},{sort:{"time":-1}});
		if (events) {
			Session.set("existsRecentHistory", true);
			console.log("Getting events: ");
			console.log(events.fetch());
			return events;
		}
		Session.set("existsRecentHistory", false);
	},

	isDirectShoutEvent: function(event) {
		if (event.type=="direct_shout") {
			return true
		}
		return false;
	},

	statusToString: function(event, type) {
		if (event.status == "accept") {
			if (event.type=="shout_req") {
				return "accepted your Shout! request";
			}
			else {
				return "accepted your trade request";
			}
		}
		else if (event.status=="accept_with_review") {
			return "accepted your trade request with review.";
		}
		else if (event.status=="accept_without_review") {
			return "accepted your trade request without review.";
		}
		else {
			if (event.type=="shout_req") {
				return "rejected your Shout! request";
			}
			else {
				return "rejected your trade request";
			}
		}
	},

	isShoutRequestEvent: function(event) {
		if (event.type=="shout_req") {
			return true
		}
		return false;
	},

	isTradeRequestEvent: function(event) {
		if (event.type=="trade_req") {
			return true
		}
		return false;
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
		this.subscribe('recent_activity');

	});
});

