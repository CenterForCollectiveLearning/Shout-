Template.current_traders.helpers({
	trader_list: function() {
		console.log("Calling trader list");
		var trades2 = Trades.findOne({"user_id":Meteor.userId()});
		console.log(trades2);
		return trades2;
	},

	name_lookup: function(user_id) {
		var user = Meteor.users.findOne({"_id": user_id});
		if (user) {
			return user.profile.name;
		}
	},

	has_more_trades: function(trade_num) {
		if (trade_num > 0) {
			return true;
		}
		return false;
	},
	specific_user: function(specific_user_id) {
		return Meteor.users.findOne({"_id":specific_user_id});
	},
});

Template.current_traders.events({
	'click .trade-button': function(e, template) {
		var tweet_id = Session.get("selected-tweet-id");
		var trader_id = this.other_user_id;
		console.log("tweet id: " + tweet_id + ", trader id: " + trader_id);
		Meteor.call("retweet", tweet_id, trader_id, Meteor.userId());
	}
});

