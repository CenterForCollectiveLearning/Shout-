Template.recent_tweets.helpers ({

	existsCurrentSelectedTweet: function() {
		return existsCurrentSelectedTweet();
	},

	tweetList: function() {
		var state = Session.get("tweetListStatus");
		if (state=="full") {
			return Session.get("fullTweetList");
		}
		else {
			return Session.get("filteredTweetList")
		}
	},

	tweetListStatus: function() {
		return Session.get("tweetListStatus");
	},

	dateConverter: function(date) {
		return dateConverter(date);
	},

});

Template.recent_tweets.events({
	// Functions to get highlighting working correctly
	'mouseenter inner-tweet-panel': function(event) {
		event.stopPropagation();
	},
	'mouseleave inner-tweet-panel': function(event) {
		event.stopPropagation();
	},

	'mouseenter .home-tweet-panel': function(event, template) {
		if (!existsCurrentSelectedTweet()) {
			$(event.target).addClass("highlight");
			$(event.target).removeClass("no-highlight");
		}
	},

	'mouseleave .home-tweet-panel': function(event, template) {
		if (!existsCurrentSelectedTweet()) {
			$(event.target).removeClass("highlight");
			$(event.target).addClass("no-highlight");
		}
	},

	'click .home-tweet-panel': function(event, template) {
		// Reset timeline to only that tweet
		timeline_arr = [this];
		Session.set("filteredTweetList", timeline_arr);
		Session.set("tweetListStatus", "selected");
		Session.set("selectedTweetId", this.id_str);
	},

	'click .tweet-clear': function(event, template) {
		Session.set("tweetListStatus", "full");
		event.stopPropagation();
	}

});


Template.recent_tweets.onCreated(function() {
	Meteor.call("getUserTimeline", Meteor.userId(), function(error, result){
	if (error) {
		console.log("Error getting user timeline");
		console.log(error.reason);
		return;
	}
	Session.set("fullTweetList", result);
	Session.set("tweetListStatus", "full");

	//??
	Session.set("panels_ready", false);
});
});