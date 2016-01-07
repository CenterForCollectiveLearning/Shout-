// Helper functions
function hasCurrentTradeRelationship(other_user_id) {
//function has_current_trade_relationship(other_user_id) {
	var trades = Trades.find({"user_id": Meteor.userId(), "trades.other_user_id": other_user_id, "trades.this_trade_num":{$gt:0}}).fetch();
	var count = trades.length;	
	if (count===0) {
		return false;
	}
	return true;
};

function hasTradesLeft(other_user_id) {
	var trades = Trades.find({"user_id": Meteor.userId(), "trades.other_user_id": other_user_id, "trades.this_trade_num":{$gt:0}}).fetch();
	var count = trades.length;

	if (count===0) {
		return false;
	}

	// Look through the trade count to determine if current user has more trades 
	else {
		trade = trades[0];
		for (var j=0; j<trade.trades.length; j++) {
			specific_trade = trade.trades[j];
			if (specific_trade.other_user_id == other_user_id) {
				if (specific_trade.this_trade_num > 0) {
					return true;
				}
				return false;
			}
		}
	return false;
	}	
};

// Rewrite this - confusing
function isEligibleTrader(other_user_id) {
	if (Session.get("tweetListStatus")==="selected") {
		if (Session.get("userListStatus")==="selected" || hasTradesLeft(other_user_id)) {
			return true;
		}
		return false;
	}
	return true;
};

// SESSION VARIABLES

// full_user_list: entire user list
// filtered_user_list: partial user list by search or click
// filtered_user_list_status: whether there has been a partial search or click
// selected_user_list_status: whether there is ONE user selected who logged-in user can trade with


Template.relationships.helpers({

	isEligibleTrader: function(user_id) {
		return isEligibleTrader(user_id);
	},

	// TODO: Remove this duplicate code (also in recent_tweets)
	tweetListStatus: function() {
		return Session.get("tweetListStatus");
	},
	existsCurrentSelectedTweet: function() {
		return existsCurrentSelectedTweet();
	},

	userListStatus: function() {
		return Session.get("userListStatus");
	},
	existsCurrentSelectedUser: function() {
		return existsCurrentSelectedUser();
	},


	// return trades for logged-in user
	traderList: function() {
		var trades = Trades.findOne({"user_id":Meteor.userId()});
		return trades;
	},

	// See if specific trade has any more remaining to send 
	hasMoreTrades: function(trade_num) {
		if (trade_num > 0) {
			return true;
		}
		return false;
	},
	// See if user has any more to send to any user
	hasMoreTradesAggregate: function(trades) {
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


	findTradeWithUser: function(other_user_id) {
		return Trades.findOne({"user_id": Meteor.userId(), "trades.other_user_id": other_user_id});
	},

	checkUserIdEquality: function(first_user_id, second_user_id) {
		if (first_user_id===second_user_id) {
			return true;
		}
		return false;
	},

	specificUser: function(specific_user_id) {
		return Meteor.users.findOne({"_id":specific_user_id});
	},

	// Check if the tweet in question has already been retweeted by the trader
	alreadyRetweeted: function(user_id) {
		var tweet_id = Session.get("selected-tweet-id");
		var res = Retweet_ids.find({"tweet_id" : tweet_id, "trader_ids":user_id.toString()}).count();
		if (res>0) {
			return true;
		}
		return false;
	},

	// Returns all users, or a filtered set if users are searched.
	filteredTraders: function() {
		return Session.get("filtered_traders");
	},
	filteredNonTraders: function() {
		return Session.get("filtered_non_traders");
	},

	// Get the lists of traders and non-traders from the (possibly filtered) user list
	// first element of returned value is the traders, 2nd is the non-traders
	userList: function() {
		var users;
		if (Session.get("filteredUserListStatus")){
			users =  Session.get("filteredUserList");
		}
		else {
			users =  Session.get("fullUserList");
		}
		var trading_users = []
		var non_trading_users = []
		for (var i=0; i<users.length; i+=1) {
			var user = users[i]
			if (hasCurrentTradeRelationship(user._id)) {
				trading_users.push(user)
			}
			else {
				non_trading_users.push(user)
			}
		}
		Session.set("filteredTraders", trading_users);
		Session.set("filteredNonTraders", non_trading_users);

		if (trading_users.length <= 0) {
			Session.set("existCurrentTraders", false);
		}
		else {
			Session.set("existCurrentTraders", true);
		}
		return [trading_users, non_trading_users];
	},

	existCurrentTraders: function() {
		return Session.get("existCurrentTraders");
	},

	// Users who are already trading w/ logged-in user
	tradingUsers: function() {
		return Trades.find({"user_id": Meteor.userId()}, {"trades.other_user_id":1});
	},

	// Request button should be disabled if any pending trade request exists
	// between the two users. 
	isRequested: function(other_user_id) {
		var count_1 = Current_trade_requests.find({"user_id_from": Meteor.userId(), "user_id_to": other_user_id}).fetch().length;
		var count_2 = Current_trade_requests.find({"user_id_from": other_user_id, "user_id_to": Meteor.userId()}).fetch().length;
		if (count_1>0 || count_2>0) {
			return true;
		}
		return false;
	},
});

Template.relationships.events({

	'mouseenter .round-trader-panel': function(event, template) {
		if (isEligibleTrader(this._id) && Session.get("tweetListStatus")==="selected") {
			$(event.target).addClass("highlight");
			$(event.target).removeClass("no-highlight");
		}
},

	'mouseleave .round-trader-panel': function(event, template) {
		if (Session.get("userListStatus")!="selected") {
			$(event.target).addClass("no-highlight");
			$(event.target).removeClass("highlight");
		}
	},

	// User should only be able to click on a user they can complete the trade with.
	// TODO: If there is a selected tweet already, must check that the selected user
	// hasn't already retweeted that tweet. 
	'click .round-trader-panel': function(event, template) {
		if (Session.get("tweetListStatus")==="selected" && hasTradesLeft(this._id)) {
	    	Session.set("filteredUserList", [this]);
			Session.set("selectedTraderId", this._id);
    		Session.set("userListStatus", "selected");
		}
	},

	'click .user-list-clear': function(event, template) {
		Session.set("userListStatus", "full");
		$(".round-trader-panel").addClass("no-highlight");
		$(".round-trader-panel").removeClass("highlight");
		event.stopPropagation();
	},

	'click .setUpTrade': function(event, template){
  		Session.set("proposingTradeTo", this._id);
	},

	  // Get the last 5 tweets posted by the user
	  // Currently this is not working!
  'click .profile-link': function(event, template) {
  	var user_id = this._id;
      Meteor.call("getUserTimeline", user_id, function(error, result){
      if (error) {
        console.log(error.reason);
        return;
      }
      var most_recent_tweets = result.slice(0, 5);
      Session.set("otherUserTimeline", most_recent_tweets);
      
      $('#'+this._id).modal('show');
    });
  }

});

Template.relationships.onCreated(function() {
	// Populate the user list initially
	var users = Meteor.call("getAllUsersExceptLoggedInUser", Meteor.userId(), function(err, result) {
		if (err) {
			console.log(err.reason);
			return;
		 }

		 Session.set("fullUserList", result);
		 Session.set("userListStatus", "full");

	});
});
