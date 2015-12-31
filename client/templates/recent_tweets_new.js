Template.recent_tweets_new.helpers ({
	timeline: function() {
		if (Session.get("partial_timeline_status")) {
			return Session.get("partial_timeline");
		}
		return Session.get("timeline");
	},
	partial_timeline_status: function() {
		return Session.get("partial_timeline_status");
	},

	date_converter: function(date) {
		return moment(date).format("dddd, MMM Do YYYY, h:mm a");
	}
});

Template.recent_tweets_new.events({

	'mouseenter inner-tweet-panel': function(event) {
		event.stopPropagation();
	},
	'mouseleave inner-tweet-panel': function(event) {
		event.stopPropagation();
	},

	'mouseenter .home-tweet-panel': function(event, template) {
		if (!Session.get("partial_timeline_status")) {
			$(event.target).addClass("highlight");
			$(event.target).removeClass("no-highlight");
		}
		
	},

	'mouseleave .home-tweet-panel': function(event, template) {
		if (!Session.get("partial_timeline_status")) {
			$(event.target).removeClass("highlight");
			$(event.target).addClass("no-highlight");
		}
	},

	'click .home-tweet-panel': function(event, template) {
		// Reset timeline to only that tweet
		timeline_arr = [this];
		Session.set("partial_timeline", timeline_arr);
		Session.set("partial_timeline_status", true);
		Session.set("selected_tweet_id", this.id_str);
	},

	'click .tweet-clear': function(event, template) {
		Session.set("partial_timeline_status", false);
		event.stopPropagation();
	}

});


Template.recent_tweets_new.onCreated(function() {
//if (Session.get("user_data_ready")) {
		Meteor.call("getUserTimeline", Meteor.userId(), function(error, result){
		if (error) {
			console.log("Error getting user timeline");
			console.log(error.reason);
			return;
		}
		Session.set("timeline", result);
		Session.set("partial_timeline_status", false);
		Session.set("panels_ready", false);
	});
//};
});