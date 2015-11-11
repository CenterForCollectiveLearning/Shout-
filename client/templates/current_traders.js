Template.current_traders.helpers({
	trader_list: function() {
		var trades = Trades.findOne({"user_id":Meteor.userId()});
		return trades;
	},

	name_lookup: function(user_id) {
		var user = Meteor.users.findOne({"_id": user_id});
		if (user) {
			return user.profile.name;
		}
	},
	// See if specific trade has any more remaining to send 
	has_more_trades: function(trade_num) {
		if (trade_num > 0) {
			return true;
		}
		return false;
	},
	// See if user has any more to send to any user
	has_more_trades_aggregate: function(trades) {
		if (!Trades.findOne({"user_id":Meteor.userId()})) {
			return false;
		}
		for (var i=0; i<trades.length; i+=1) {
			console.log("in has more trades agg");
			console.log(trades[i].this_trade_num);
			if (trades[i].this_trade_num>0) {
				return true;
			}
		}
		return false;
	},

	specific_user: function(specific_user_id) {
		return Meteor.users.findOne({"_id":specific_user_id});
	},

	// Check if the tweet in question has already been retweeted by the trader
	already_retweeted: function(user_id) {
		var tweet_id = Session.get("selected-tweet-id");
		var res = Retweet_ids.find({"tweet_id" : tweet_id, "trader_ids":user_id.toString()}).count();
		if (res>0) {
			return true;
		}
		return false;
	},
});

Template.current_traders.events({
	'click .trade-button': function(e, template) {
		var tweet_id = Session.get("selected-tweet-id");
		var trader_id = this.other_user_id;
		console.log("Tweet id: " + tweet_id);
        console.log("user id posted: " + trader_id);
		Meteor.call("retweet", tweet_id, trader_id, Meteor.userId());
	}
});

