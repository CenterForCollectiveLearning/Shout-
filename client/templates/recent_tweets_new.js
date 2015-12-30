Template.recent_tweets_new.helpers ({
	timeline: function() {
		return Session.get("timeline");
	},

	date_converter: function(date) {
		return moment(date).format("dddd, MMM Do YYYY, h:mm a");
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
		// Session.set("partial_timeline_status", false);
		// Session.set("panels_ready", false);
	});
//};
});