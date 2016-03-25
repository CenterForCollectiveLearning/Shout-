
function hasCurrentTradeRelationship(other_user_id) {
	var trades = Trades.find({"user_id": Meteor.userId(), "trades.other_user_id": other_user_id, "trades.this_trade_num":{$gte:0}}).fetch();
	var count = trades.length;	
	if (count===0) {
		return false;
	}
	return true;
};

Template.relationships.helpers({

	isEligibleTrader: function(user_id) {
		return isEligibleTrader(user_id);
	},

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

	// return trades for the logged-in user
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

	checkUserIdEquality: function(first_user_id, second_user_id) {
		if (first_user_id===second_user_id) {
			return true;
		}
		return false;
	},

	specificUser: function(specific_user_id) {
		return getSpecificUser(specific_user_id);
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
		if (!Session.equals("userListStatus","full")){
			users =  Session.get("filteredUserList");
		}
		else {
			users =  Session.get("fullUserList");
		}

		if (typeof users === 'undefined') {
			return;
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

		if (non_trading_users.length <= 0) {
			Session.set("existCurrentNonTradingUsers", false);
		}
		else {
			Session.set("existCurrentNonTradingUsers", true);
		}
		return [trading_users, non_trading_users];
	},

	existCurrentTraders: function() {
		return Session.get("existCurrentTraders");
	},

	existCurrentNonTradingUsers: function() {
		return Session.get("existCurrentNonTradingUsers");
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

	findTradeWithUser: function(other_user_id) {
		return Trades.findOne({"user_id": Meteor.userId(), "trades.other_user_id": other_user_id});
	},
});

Template.relationships.events({

	'mouseenter .round-trader-panel': function(event, template) {
		if (isEligibleTrader(this._id) && Session.equals("tweetListStatus","selected")) {
			$(event.currentTarget).addClass("highlight");
			$(event.currentTarget).removeClass("no-highlight");
		}
},

	'mouseleave .round-trader-panel': function(event, template) {
		if (!Session.equals("userListStatus", "selected")) {
			$(event.currentTarget).addClass("no-highlight");
			$(event.currentTarget).removeClass("highlight");
		}
	},

	'click .round-trader-panel': function(event, template) {
		if (!Session.equals("isInProfileModal",true)) {
			clickTraderAction(this);
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


  'click .profile-link': function(event, template) {
  	Session.set("isInProfileModal", true);
  	var user_id = this._id;
      Meteor.call("getUserTimeline", user_id, function(error, result){
      if (error) {
        console.log(error.reason);
        return;
      }
      var most_recent_tweets = result.slice(0, 3);
      Session.set("otherUserTimeline", most_recent_tweets);
      $('#'+this._id).modal('show');
      
    });
  },

  'click #relationship-search-submit': function(event) {
  	var search_terms = $("#relationship-search-input").val();
  	var users = Meteor.call("searchAllUsers", search_terms, Meteor.userId(), function(err, result) {
  		if (err) {
  			console.log(err.reason);
  			return;
  		}
  		Session.set("filteredUserList", result);
  		Session.set("userListStatus", "partial");

  		$(".round-trader-panel").addClass("no-highlight");
		$(".round-trader-panel").removeClass("highlight");
  	})
  },

  'keypress #relationship-search-input': function(event) {
	if (event.which==13) {
		$("#relationship-search-submit").click();
	}
  },

  'hidden.bs.modal .modal': function() {
  	Session.set("isInProfileModal", false);
  	Session.set("otherUserTimeline", undefined);
  },

  	'click #search-clear-users': function() {
		$("#relationship-search-input").val('');
		Session.set("userListStatus", "full");
	}

});

Template.relationships.onCreated(function() {

	// Populate the user list initially
	var users = Meteor.call("getAllUsersExceptLoggedInUser", function(err, result) {
		if (err) {
			console.log(err.reason);
			return;
		 }

		 Session.set("fullUserList", result);
		 Session.set("userListStatus", "full");

	});

});
