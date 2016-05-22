Template.quick_tweet_modal.helpers({
	numCharsRemaining: function() {
		return 140 - Session.get("numChars");
	},

	numCharsNotInRange: function() {
		num = 140 - Session.get("numChars") 
		return !(num >= 0 && num < 140);
	}
});

Template.quick_tweet_modal.events({
	'click #tweet-button': function() {
		tweet_text = $("#tweet-text").val();
		// ADD error handling here. 

		Meteor.call("tweet", tweet_text);

		Meteor.call("updateUserTimeline", Meteor.userId(), function(error, result) {
			if (error) {
				console.log("Error reloading user timeline");
				console.log(error.reason);
				return;
			}
			loadUserTimeline();
		})
		$('.modal').modal('hide');
	},

	'hidden.bs.modal #quick_tweet_modal': function() {
		$("#tweet-text").val("");
		Session.set("numChars", 0);	
	},

	'keyup #tweet-text': function() {
		Session.set("numChars", $("#tweet-text").val().length)
	}

});

Template.quick_tweet_modal.onCreated(function() {
	Session.set("numChars", 0);
});