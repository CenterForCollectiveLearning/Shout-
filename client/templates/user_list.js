function is_trading(other_user_id) {
	var count = Trades.find({"user_id": Meteor.userId(), "trades.other_user_id": other_user_id}).fetch().length;
	if (count===0) {
		return false;
	}
	return true;
}

Template.user_list.helpers({
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
			if (trades[i].this_trade_num>0) {
				return true;
			}
		}
		return false;
	},


	find_trade_with_user: function(other_user_id) {
		console.log(Trades.findOne({"user_id": Meteor.userId(), "trades.other_user_id": other_user_id}));
		return Trades.findOne({"user_id": Meteor.userId(), "trades.other_user_id": other_user_id})
	},

	check_user_id_equality: function(first_user_id, second_user_id) {
		console.log("Checking equality");
		if (first_user_id===second_user_id) {
			return true;
		}
		console.log("returning false");
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
	user_list: function() {
		// Assign the filtered users to these separate lists (for ordering)
		var users =  Session.get("filtered_user_list");
		var trading_users = []
		var non_trading_users = []
		for (var i=0; i<users.length; i+=1) {
			var user = users[i]
			if (is_trading(user._id)) {
				trading_users.push(user)
			}
			else {
				non_trading_users.push(user)
			}
		}
		Session.set("filtered_traders", trading_users);
		Session.set("filtered_non_traders", non_trading_users);
		
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

	is_trading: function(other_user_id) {
		return is_trading(other_user_id);
	},

});

Template.user_list.events({
    'click .menuitem': function (event) {
        $('#dropdown-toggle').text(event.currentTarget.innerText);
    },

    // On search submit, update the user list accordingly.
    'click #search-submit': function(event) {
    	var search_terms = $("#search-terms").val();
    	var searched_users = Meteor.call("searchUsers", search_terms, Meteor.userId(), function(err, result) {
    		if (err) {
    			console.log(err.reason);
    			return;
    		}
    		Session.set("filtered_user_list", result);
    	})
    },
    'keydown #search-terms': function(event) {
    	if(event.which === 13){
        	$("#search-submit").click();
    	}
    },

    'click .trade-button': function(e, template) {
		var tweet_id = Session.get("selected-tweet-id");
		var trader_id = this.other_user_id;
		console.log("Tweet id: " + tweet_id);
        console.log("user id posted: " + trader_id);
		Meteor.call("retweet", tweet_id, trader_id, Meteor.userId());
	}
});

Template.user_list.onCreated(function() {
		var users = Meteor.call("getOtherUsers", Meteor.userId(), function(err, result) {
			if (err) {
				console.log(err.reason);
				return;
			 }
			 console.log("created user list");
			 Session.set("filtered_user_list", result);
		});
	});
