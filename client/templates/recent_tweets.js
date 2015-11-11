Template.recent_tweets.helpers({
	timeline: function() {
		console.log(Session.get("timeline"));
		return Session.get("timeline");
	},
});

Template.recent_tweets.events({
	// TODO: Set selected tweet ID on page load. 
	'change #tweet-select':function(event, template) {
		var tweet_id = template.find("#tweet-select :selected").id;
		Session.set("selected-tweet-id", tweet_id);
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


