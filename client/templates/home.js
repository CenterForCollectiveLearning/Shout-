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

});

Template.home.events({
	'click #trade-button': function(event){
		var selected_tweet_id = Session.get("selectedTweetId");
		var selected_trader_id =  Session.get("selectedTraderId");
		Meteor.call("sendRetweet", selected_tweet_id, selected_trader_id, Meteor.userId());

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

Meteor.startup(function() {
	console.log("In meteor.startup");
	Meteor.call("updateUserTimeline", function(err, result) {
		if (err) {
			console.log(err.reason);
			return;
		}
	})
})