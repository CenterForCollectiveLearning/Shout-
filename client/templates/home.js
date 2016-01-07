Template.home.helpers({
	tradeReady: function() {
		if (Session.get("userListStatus")==="selected" && Session.get("tweetListStatus")==="selected"){
			return true;
		}
		return false;
	}
});

Template.home.events({
	'click #trade-button': function(event, template){
		var selected_tweet_id = Session.get("selectedTweetId");
		var selected_trader_id =  Session.get("selectedTraderId");
		Meteor.call("sendRetweet", selected_tweet_id, selected_trader_id, Meteor.userId());

		Session.set("userListStatus", "full");
		Session.set("tweetListStatus", "full");
	}
});