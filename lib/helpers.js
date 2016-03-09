// Contains helper functions for templates

getSpecificUser = function(specific_user_id) {
	return Meteor.users.findOne({"_id":specific_user_id});
};

nameLookup = function(user_id) {
	var user = Meteor.users.findOne({"_id": user_id});
	if (user) {
		return user.profile.name;
	}
}

isLoggedInUser =  function(user_id) {
	if (user_id===Meteor.userId()) {
		return true;
	}
	return false;
};

existsCurrentSelectedTweet = function() {
	if (Session.get("tweetListStatus")==="selected") {
		return true;
	}
	return false;
};

existsCurrentSelectedUser = function () {
	if (Session.get("userListStatus")==="selected") {
		return true;
	}
	return false;
};

dateConverter = function(timestamp) {
	return moment(timestamp).format("dddd, MMM Do YYYY, h:mm a");
};

getDate = function(timestamp) {
	return moment(timestamp).format("dddd, MMM Do YYYY");
};

getTime = function(timestamp) {
	return moment(timestamp).format("h:mm a");
};

clickTraderAction = function(user_obj) {
	if (Session.get("tweetListStatus")==="selected" && hasTradesLeft(user_obj._id)) {
		if (isEligibleTrader(user_obj._id)) {
	    	Session.set("filteredUserList", [user_obj]);
			Session.set("selectedTraderId", user_obj._id);
			Session.set("userListStatus", "selected");
		}
	}
};

hasTradesLeft = function(other_user_id) {
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

isEligibleTrader = function(other_user_id) {
	if (Session.get("tweetListStatus")==="selected") {
		if (Session.get("userListStatus")==="selected" || hasTradesLeft(other_user_id)) {
			if (!alreadyRetweeted(other_user_id) && !existsCurrentShoutRequestWithSelectedTweet(other_user_id)) {
				return true;
			}
			return false; // Already retweeted that tweet
		}
		return false; // No trades left with that user
	}
	return true;
};

// Check if the tweet in question has already been retweeted by the trader
// TODO: Clear the selected tweet var after transaction completion
alreadyRetweeted = function(user_id) {
	var tweet_id = Session.get("selectedTweetId");
	var res = Retweet_ids.find({"tweet_id":tweet_id, "trader_ids":user_id.toString()}).count();
	if (res>0) {
		return true;
	}
	return false;
};

// If a Shout! request exists with that current user and tweet, shouldn't allow another
// request to go through on the same tweet. 
existsCurrentShoutRequestWithSelectedTweet = function(user_id) {
	var tweet_id = Session.get("selectedTweetId");
	var res = Shout_requests.find({"tweet_id":tweet_id, "retweeting_user":user_id}).count();
	if (res>0) {
		return true;
	}
	return false;
}

existsOutgoingPendingTradeRequest = function(other_user_id) {
	var existing_outgoing_req = Current_trade_requests.find({"user_id_from": Meteor.userId(), "user_id_to": other_user_id})
	if (existing_outgoing_req.count()===0) {
		return false;
	}
	return true;
};
existsIncomingPendingTradeRequest = function(other_user_id) {
	var existing_incoming_req = Current_trade_requests.find({"user_id_from": other_user_id, "user_id_to": Meteor.userId()})
	if (existing_incoming_req.count()===0) {
		return false;
	}
	return true;
};

has_current_trade_relationship = function(other_user_id) {
  var trades = Trades.find({"user_id": Meteor.userId(), "trades.other_user_id": other_user_id, "trades.this_trade_num":{$gt:0}}).fetch();
  var count = trades.length;  
  if (count===0) {
    return false;
  }
  return true;
};

exists_recent_activity = function() {
	console.log("in exists_recent_activity");
	console.log(Post_history.findOne());
	console.log(Post_history.find({"user_id":Meteor.userId()}).fetch());
	console.log("After fetch");
	if (Post_history.find({"user_id":Meteor.userId()}).count() > 0) {
		return true;
	}
	return false;
}
