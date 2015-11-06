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

	return result;
});

Template.post_list.helpers({
	timeline: function() {
		return Session.get("timeline");
	},

	trader_list: function() {
		return Trades.find({"user_id":Meteor.userId()}).fetch();
	},

	name_lookup: function(user_id) {
		var user = Meteor.users.findOne({"_id": user_id});
		if (user) {
			return user.profile.name;
		}
	}
});


Template.post_list.events({
	'click .trade-button': function(e, template) {
		var tweet_id = template.find("#tweet-select :selected").id;
		var trader_id = template.find("#trader-select :selected").value;
		Meteor.call("retweet", tweet_id, trader_id);
	}
});
