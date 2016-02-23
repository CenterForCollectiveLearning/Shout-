// See if a retweet triggered through the other user id's account can be
// sent directly, or requires further approval. 
function checkIfRetweetNeedsReview(other_user_id) {
	var trades = Trades.find({"user_id": Meteor.userId(), "trades.other_user_id": other_user_id}).fetch();
	trade = trades[0];
	for (var j=0; j<trade.trades.length; j++) {
		specific_trade = trade.trades[j];
		if (specific_trade.other_user_id == other_user_id) {
			if (specific_trade.with_review==true) {
				return true;
			}
			return false;
		}
	}

}

Template.home.helpers({
	tradeReady: function() {
		if (Session.get("userListStatus")==="selected" && Session.get("tweetListStatus")==="selected"){
			return true;
		}
		return false;
	},

	userLoggedIn: function() {
		if (Meteor.user()) {
			Session.set("userLoggedIn", true);
		}
		else {
			Session.set("userLoggedIn", false);

		}

		console.log(Session.get("userLoggedIn"));
		return Session.get("userLoggedIn");
	},

	getRetweetingTrader: function() {
		var selected_trader_id =  Session.get("selectedTraderId");
		if (selected_trader_id) {
			var trader_screen_name = getSpecificUser(selected_trader_id).services.twitter.screenName; 
			return trader_screen_name;
		}
	},

	existsCurrentSelectedTweet: function() {
		return existsCurrentSelectedTweet();
	},

	existsCurrentSelectedUser: function() {
		return existsCurrentSelectedUser();
	},

	existCurrentTraders: function() {
		return Session.get("existCurrentTraders");
	},

	// Now use this in the UI
	tradeNeedsReview: function() {
		var selected_trader_id =  Session.get("selectedTraderId");
		return checkIfRetweetNeedsReview(selected_trader_id);
	}

});



Template.home.events({
	'click #trade-button': function(event){
		var selected_tweet_id = Session.get("selectedTweetId");
		var selected_trader_id =  Session.get("selectedTraderId");

		// Figure out whether the tweet should be triggered directly, or sent for approval.
		if (checkIfRetweetNeedsReview(selected_trader_id)) {
			// Create a new Shout! request
			Meteor.call("createNewShoutRequest", selected_tweet_id, selected_trader_id, function(err, result) {
				if (err) {
					console.log(err.reason);
					return;
				}
			});
		}
		else {
			// Directly trigger retweet
			// Uncomment below line
			Meteor.call("sendRetweet", selected_tweet_id, selected_trader_id, Meteor.userId(), true);
		}

		Session.set("userListStatus", "full");
		Session.set("tweetListStatus", "full");
		$(".round-trader-panel").addClass("no-highlight");
		$(".round-trader-panel").removeClass("highlight");
	},

	'click #reset-button': function(event) {
		Session.set("userListStatus", "full");
		Session.set("tweetListStatus", "full");
		$(".round-trader-panel").addClass("no-highlight");
		$(".round-trader-panel").removeClass("highlight");
	}
});

Accounts.onLogin(function() {
	Meteor.call("updateUserTimeline", Meteor.userId(), function(err, result) {
		if (err) {
			console.log(err.reason);
			return;
		}
	});
	Meteor.call("updateUserFollowersAndFriends", Meteor.userId(), function(err, result) {
		if (err) {
			console.log(err.reason);
			return;
		}
	})
});

Template.home.onCreated(function() {

	  this.autorun(() => {
    	this.subscribe('trades');
  	  });

});

