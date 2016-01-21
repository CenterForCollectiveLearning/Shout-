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
			if (!alreadyRetweeted(other_user_id)) {
				return true;
			}
			return false;
		}
		return false;
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

has_current_trade_relationship = function(other_user_id) {
  var trades = Trades.find({"user_id": Meteor.userId(), "trades.other_user_id": other_user_id, "trades.this_trade_num":{$gt:0}}).fetch();
  var count = trades.length;  
  if (count===0) {
    return false;
  }
  return true;
}
