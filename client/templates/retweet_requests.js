Template.retweet_requests.helpers({

	retweet_request_list: function() {
		return Retweet_requests.find({"user_id_to": Meteor.userId(), "status": "pending"}).fetch();
	},

	name_lookup: function(user_id) {
		return Meteor.users.findOne({"_id": user_id}).profile.name;
	}
});

Template.retweet_requests.events({

	'click .retweet-accept': function(e, template) {
		console.log("Retweet accept clicked");
		// Post the tweet
		Meteor.call("postRetweet", this.text, function(error, result) {
			if (error){
				console.log(error.reason);
				return;
			}

			// TODO: If successful, decrement the relevant trade counts.

		});

		Retweet_requests.update({"_id":this._id}, {$set:{"status": "accepted"}});

		// This update step should be in the callback
		console.log(this);
		Trades.update

	},

	'click .retweet-reject': function(e, template) {
		console.log("Retweet reject clicked");
		Retweet_requests.update({"_id":this._id}, {$set:{"status": "rejected"}});
	}
});