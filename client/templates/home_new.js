Template.home_new.helpers({
	trade_ready: function() {
		if (Session.get("partial_timeline_status") && Session.get("selected_user_list_status")) {
			return true;
		}
		return false;
	}
});

Template.home_new.events({
	'click #trade-button': function(event, template){
		var selected_tweet_id = Session.get("selected_tweet_id");
		var selected_trader_id =  Session.get("selected_trader_id");
		Meteor.call("retweet", selected_tweet_id, selected_trader_id, Meteor.userId());

		// Reset the tweet list and the trader list
		Session.set("filtered_user_list_status", false);
		Session.set("partial_timeline_status", false);
		Session.set("selected_user_list_status", false);
	}
});