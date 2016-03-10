Template.notifications_dropdown.helpers({
	has_requests: function() {
		num_trade_requests = Current_trade_requests.find({"user_id_to": Meteor.userId()}).count();
		num_shout_requests = Shout_requests.find({"retweeting_user":Meteor.userId()}).count();
		num_unseen_recent_activities = Recent_activity.find({"user_id":Meteor.userId(), "is_notification_receiver":true, "seen":false}).count();

		if ((num_trade_requests + num_shout_requests + num_unseen_recent_activities)>0) {
			return true;
		}
		return false;
	},

	num_requests: function() {
		num_trade_requests = Current_trade_requests.find({"user_id_to": Meteor.userId()}).count();
		num_shout_requests = Shout_requests.find({"retweeting_user":Meteor.userId()}).count();
		num_unseen_recent_activities = Recent_activity.find({"user_id":Meteor.userId(), "is_notification_receiver":true, "seen":false}).count();
		return num_trade_requests + num_shout_requests + num_unseen_recent_activities;
	},

	exists_recent_activity: function() {
		return exists_recent_activity();
	}
});

Template.notifications_dropdown.events({
	'hide.bs.dropdown': function(event) {
		// TODO: Mark all the current unseen notifications as seen. 
		Meteor.call("markRecentActivitiesAsSeen", function(err, result) {
		});
	}
});
