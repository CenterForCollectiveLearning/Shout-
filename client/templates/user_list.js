// Helper functions
function has_current_trade_relationship(other_user_id) {
	var trades = Trades.find({"user_id": Meteor.userId(), "trades.other_user_id": other_user_id, "trades.this_trade_num":{$gt:0}}).fetch();
	var count = trades.length;	
	if (count===0) {
		return false;
	}
	return true;
}

function has_trades_left(other_user_id) {
	var trades = Trades.find({"user_id": Meteor.userId(), "trades.other_user_id": other_user_id, "trades.this_trade_num":{$gt:0}}).fetch();
	var count = trades.length;

	if (count===0) {
		return false;
	}

	// Look through the trade count to determine if current user has more trades 
	else {
		for (var i=0; i<trades.length; i++) {
			trade = trades[i];
			for (var j=0; j<trade.trades.length; j++) {
				specific_trade = trade.trades[i];
				if (specific_trade.other_user_id == other_user_id) {

					if (specific_trade.this_trade_num > 0) {
						return true;
					}
					return false;
				}
			}
		}
		return false;
	}	
}

// SESSION VARIABLES

// full_user_list: entire user list
// filtered_user_list: partial user list by search or click
// filtered_user_list_status: whether there has been a partial search or click
// selected_user_list_status: whether there is ONE user selected who logged-in user can trade with


Template.user_list.helpers({
	filtered_user_list_status: function() {
		return Session.get("filtered_user_list_status");
	},

	// return trades for logged-in user
	trader_list: function() {
		var trades = Trades.findOne({"user_id":Meteor.userId()});
		return trades;
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
			if (trades[i].this_trade_num>0) {
				return true;
			}
		}
		return false;
	},


	find_trade_with_user: function(other_user_id) {
		return Trades.findOne({"user_id": Meteor.userId(), "trades.other_user_id": other_user_id});
	},

	check_user_id_equality: function(first_user_id, second_user_id) {
		if (first_user_id===second_user_id) {
			return true;
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

	// Returns all users, or a filtered set if users are searched.
	filtered_traders: function() {
		return Session.get("filtered_traders");
	},
	filtered_non_traders: function() {
		return Session.get("filtered_non_traders");
	},

	// Get the lists of traders and non-traders from the (possibly filtered) user list
	// first element of returned value is the traders, 2nd is the non-traders
	user_list: function() {
		var users;
		if (Session.get("filtered_user_list_status")){
			users =  Session.get("filtered_user_list");
		}
		else {
			users =  Session.get("full_user_list");
		}
		var trading_users = []
		var non_trading_users = []
		for (var i=0; i<users.length; i+=1) {
			var user = users[i]
			if (has_current_trade_relationship(user._id)) {
				trading_users.push(user)
			}
			else {
				non_trading_users.push(user)
			}
		}
		Session.set("filtered_traders", trading_users);
		Session.set("filtered_non_traders", non_trading_users);
		return [trading_users, non_trading_users];
	},

	// Users who are already trading w/ logged-in user
	trading_users: function() {
		return Trades.find({"user_id": Meteor.userId()}, {"trades.other_user_id":1});
	},

	// Request button should be disabled if any pending trade request exists
	// between the two users. 
	is_requested: function(other_user_id) {
		var count_1 = Current_trade_requests.find({"user_id_from": Meteor.userId(), "user_id_to": other_user_id}).fetch().length;
		var count_2 = Current_trade_requests.find({"user_id_from": other_user_id, "user_id_to": Meteor.userId()}).fetch().length;
		if (count_1>0 || count_2>0) {
			return true;
		}
		return false;
	},

	// is_trading: function(other_user_id) {
	// 	return is_trading(other_user_id);
	// },

	bio: function(user_id) {
		var user_info = Meteor.users.find({"_id":user_id}).fetch();
		var bio = user_info && user_info[0].profile && user_info[0].profile.bio;
		return bio;
	},

	interests: function(user_id) {
		var user_info = Meteor.users.find({"_id":user_id}).fetch();
		var interests = user_info && user_info[0].profile && user_info[0].profile.interests;
		return interests;
	}

});

Template.user_list.events({
    'click .menuitem': function (event) {
        $('#dropdown-toggle').text(event.currentTarget.innerText);
    },

	'mouseenter .trading-user-panel': function(event, template) {
		if (!Session.get("selected_user_list_status") && has_trades_left(this._id)) {
			$(event.target).addClass("highlighted");
		}
	},

	'mouseleave .trading-user-panel': function(event, template) {
		if (!Session.get("selected_user_list_status")) {
			$(event.target).removeClass("highlighted");
		}
	},

	// User should only be able to click on a user they can complete the trade with.
	// TODO: If there is a selected tweet already, must check that the selected user
	// hasn't already retweeted that tweet. 
	'click .user-panel-body': function(event, template) {
		if (has_trades_left(this._id)) {
	    	Session.set("filtered_user_list", [this]);
			Session.set("filtered_user_list_status", true);
			Session.set("selected_trader_id", this._id);
    		Session.set("selected_user_list_status", true);
		}
	},

	'click #link_to_expand': function (event, template) {
		$(event.target.parentElement).addClass("active");
		$(event.target.parentElement).data("target").addClass("in");

	},

	'click .user-list-clear': function(event, template) {
		Session.set("filtered_user_list_status", false);
		Session.set("selected_user_list_status", false);
		event.stopPropagation();
	},

	'click .setUpTrade': function(event, template){
  		Session.set("proposing_trade_to", this._id);
	}

});

Template.user_list.onCreated(function() {
	// Populate the user list initially
	var users = Meteor.call("getOtherUsers", Meteor.userId(), function(err, result) {
		if (err) {
			console.log(err.reason);
			return;
		 }
		 Session.set("full_user_list", result);
		 Session.set("filtered_user_list", result);
		 Session.set("filtered_user_list_status", false);
		 Session.set("selected_user_list_status", false);

	});
});
