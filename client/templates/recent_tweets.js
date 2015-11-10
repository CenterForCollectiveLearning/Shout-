Meteor.call("getUserTimeline", function(error, result){
	if (error) {
		console.log(error.reason);
		return;
	}
	Session.set("timeline", result);
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

Template.recent_tweets.helpers({
	timeline: function() {
		return Session.get("timeline");
	},
});

Template.recent_tweets.events({
	// TODO: Set selected tweet ID on page load. 
	'change #tweet-select':function(event, template) {
		var tweet_id = template.find("#tweet-select :selected").id;
		console.log("set tweet id to: " + tweet_id);
		Session.set("selected-tweet-id", tweet_id);
	}
});

Template.recent_tweets.rendered = function() {
    if(!this._rendered) {
      this._rendered = true;
      var tweet_id = $('#tweet-select').find(":selected").attr('id');
      console.log("set tweet id to: " + tweet_id);
	  Session.set("selected-tweet-id", tweet_id);
    }
};
