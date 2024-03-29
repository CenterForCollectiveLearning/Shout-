function compareRetweetCounts(tweet1, tweet2) {
  if (tweet1.retweet_count < tweet2.retweet_count)
    return 1;
  else if (tweet1.retweet_count > tweet2.retweet_count)
    return -1;
  else
    return 0;
}

function compareFavoriteCounts(tweet1, tweet2) {
  if (tweet1.favorite_count < tweet2.favorite_count)
    return 1;
  else if (tweet1.favorite_count > tweet2.favorite_count)
    return -1;
  else
    return 0;
}

// Duplicate! 
function getTweetList() {
	if (Session.equals("tweetListStatus", "full")) {
		return Session.get("fullTweetList");
	}
	else {
		return Session.get("filteredTweetList");
	}
}

function sortTweets(sort_type) {
	var tweetList = getTweetList();
	if (sort_type==="latest") {
		tweetList = Session.get("fullTweetListByDate");
	}
	else if (sort_type==="retweets") {
		tweetList.sort(compareRetweetCounts);
	}
	else {
		tweetList.sort(compareFavoriteCounts);
	}

	if (Session.equals("tweetListStatus", "full")) {
		Session.set("fullTweetList", tweetList);
	}
	else {
		Session.set("filteredTweetList", tweetList);
	}
}

Template.recent_tweets.helpers ({

	existsCurrentSelectedTweet: function() {
		return existsCurrentSelectedTweet();
	},

	tweetList: function() {
		if (Session.equals("tweetListStatus","full")) {
			return Session.get("fullTweetList");
		}
		else {
			return Session.get("filteredTweetList");
		}
	},

	tweetListStatus: function() {
		return Session.get("tweetListStatus");
	},

	dateConverter: function(date) {
		return dateConverter(date);
	},

	hasNoTweets: function() {
		if (Session.get("fullTweetList").length===0) {
			return true;
		}
		return false;
	}

});

Template.recent_tweets.events({

	'click #quick-tweet-button': function() {
		$("#quick_tweet_modal").modal('show');
	},

	// Functions to get highlighting working correctly
	'mouseenter inner-tweet-panel': function(event) {
		event.stopPropagation();
	},
	'mouseleave inner-tweet-panel': function(event) {
		event.stopPropagation();
	},

	'mouseenter .home-tweet-panel': function(event, template) {
		if (!existsCurrentSelectedTweet()) {
			$(event.currentTarget).addClass("highlight");
			$(event.currentTarget).removeClass("no-highlight");
		}
	},

	'mouseleave .home-tweet-panel': function(event, template) {
		if (!existsCurrentSelectedTweet()) {
			$(event.currentTarget).removeClass("highlight");
			$(event.currentTarget).addClass("no-highlight");

		}
	},

	'click .home-tweet-panel': function(event, template) {
		// Reset timeline to only that tweet
		timeline_arr = [this];
		Session.set("filteredTweetList", timeline_arr);
		Session.set("tweetListStatus", "selected");
		Session.set("selectedTweetId", this.id_str);
		$(event.currentTarget).addClass("highlight");
	},

	'click .tweet-clear': function(event, template) {
		Session.set("tweetListStatus", "full");
		$(".home-tweet-panel").removeClass("highlight");
		$(".home-tweet-panel").addClass("no-highlight");
		event.stopPropagation();
	},

	'click #search-tweets': function(event, template) {
		var search_terms = $("#tweet-search-input").val();
		if (search_terms.length===0) {
			Session.set("tweetListStatus", "full");
			return;
		}

		var username = Meteor.user().services.twitter.screenName;
		Meteor.call("searchTweets", search_terms, function(error, result) {
			if (error) {
				console.log("Error getting searched user timeline");
				console.log(error.reason);
				return;
			}
			Session.set("tweetListStatus", "partial");
			Session.set("filteredTweetList", result);
		});

	},

	'keypress #tweet-search-input': function(event) {
		if (event.which==13) {
			$("#search-tweets").click();
		}
	},

	'click #sort-latest': function() {
		sortTweets("latest");
	},

	'click #sort-retweets': function() {
		sortTweets("retweets");
	},

	'click #sort-favorites': function() {
		sortTweets("favorites");
	},

	'click #search-clear-tweets': function() {
		$("#tweet-search-input").val('');
		Session.set("tweetListStatus", "full");
	},

	'click #reload-tweets-button': function() {
		Meteor.call("updateUserTimeline", Meteor.userId(), function(error, result) {
			if (error) {
				console.log("Error reloading user timeline");
				console.log(error.reason);
				return;
			}
			loadUserTimeline();
		})
	}
});

Template.recent_tweets.onCreated(function() {
 	Session.set("timeline_ready", false);

 //  	this.autorun(() => {
	// 	this.subscribe('userData');
	// });
	loadUserTimeline();
});