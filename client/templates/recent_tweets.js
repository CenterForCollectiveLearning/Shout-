Template.recent_tweets.helpers({
	timeline: function() {
		console.log("timeline");
		console.log(Session.get("timeline"));
		if (Session.get("partial_timeline_status")) {
			return Session.get("partial_timeline");
		}
		//Session.set("partialTimeline", false);
		return Session.get("timeline");
	},

	partial_timeline_status: function() {
		return Session.get("partial_timeline_status");
	}
});

Template.recent_tweets.events({
	// TODO: Set selected tweet ID on page load. 
	'change #tweet-select':function(event, template) {
		var tweet_id = template.find("#tweet-select :selected").id;
		Session.set("selected-tweet-id", tweet_id);
	},

	'mouseenter .tweet-panel-body': function(event, template) {
		$(event.target).addClass("highlighted");
	},

	'mouseleave .tweet-panel-body': function(event, template) {
		$(event.target).removeClass("highlighted");
	},

	'click .tweet-panel-body': function(event, template) {
		// Reset timeline to only that tweet
		timeline_arr = [this];
		Session.set("partial_timeline", timeline_arr);
		Session.set("partial_timeline_status", true);
	},

	'click .tweet-clear': function(event, template) {
		Session.set("partial_timeline_status", false);
		event.stopPropogation();
	}

});

Template.recent_tweets.onCreated(function() {
if (Session.get("user_data_ready")) {
		Meteor.call("getUserTimeline", function(error, result){
		if (error) {
			console.log(error.reason);
			return;
		}
			Session.set("timeline", result);
			// THIS IS TOO HACKY, MUST CHANGE.
		  	Session.set("selected-tweet-id", Session.get("timeline")[0].id_str);
		// Logic below for populated embedded tweet dropdown

		// for (var i=0; i<result.length; i+=1) {
		// 	var tweet_id = result[i].id_str;
		// 	twttr.widgets.createTweet(
		// 	  tweet_id,
		// 	  document.getElementById("first"),
		// 	  {
		// 	    align: 'left'
		// 	  })
		// 	  .then(function (el) {
		// 	    console.log("@ev's Tweet has been displayed.")
		// 	  });
		// }
	});
};
});


