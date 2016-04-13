
var getTweetFromServer = function(tweet_id) {
		Meteor.call("getTweet", tweet_id.toString(), function(err, result) {
			if (err) {
				console.log(err);
			}
			Session.set("tweet_"+tweet_id.toString(), result);
			return result;
		});
};

Template.single_tweet.helpers({
	getTweet: function(tweet_id) {
		getTweetFromServer(tweet_id);
		return Session.get("tweet_"+tweet_id.toString());
	},

	dateConverter: function(date) {
		return dateConverter(date);
	},

	getSpecificUser: function(original_poster_id) {
		return getSpecificUser(original_poster_id);
	},
});

Template.single_tweet.events({
	// Accept the shout! --> Trigger the retweet

	// TODO: Shouldn't clear the Shout! request unless the retweet sends successfully. 
	'click .shout-accept': function() {
		Meteor.call("sendRetweet", this.tweet_id, this.retweeting_user, this.original_poster_id, false, function(err, result) {
			if (err){
				console.log("error sending retweet");
				console.log(err.reason);
			}
		});
		Meteor.call('clearShoutRequest', this.tweet_id, this.retweeting_user, this.original_poster_id, function(err, result) {
			if (err) {
				console.log("error clearing the Shout! request");
				console.log(err.reason);
			}
		});
	},

	// Reject the shout! Increment the trade count
	'click .shout-reject': function() {
		Meteor.call("incrementTradeCounts", this.retweeting_user, this.original_poster_id, function(err, result) {
			if (err) {
				console.log("error incrementing trade counts");
				console.log(err.reason)
			}
		});
		Meteor.call("addShoutRequestToActivity", this.original_poster, this.retweeting_user, this.tweet_id, "reject", function(err, result) {
			if (err) {
				console.log("Error adding the Shout! request to Recent Activity");
				console.log(err.reason);
			}
		})
		Meteor.call('clearShoutRequest', this.tweet_id, this.retweeting_user, this.original_poster_id, function(err, result) {
			if (err) {
				console.log("error clearing the Shout! request");
				console.log(err.reason);
			}
		});
	}
})

Template.single_tweet.onCreated(function() {
  	this.autorun(() => {
		this.subscribe('tweets');
		this.subscribe('allUsers');
	});
});
