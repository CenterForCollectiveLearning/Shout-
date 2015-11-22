Template.recent_tweets.helpers({
	timeline: function() {
		// console.log("timeline");
		// console.log(Session.get("timeline"));
		if (Session.get("partial_timeline_status")) {
			return Session.get("partial_timeline");
		}
		//Session.set("partialTimeline", false);
		return Session.get("timeline");
	},

	partial_timeline_status: function() {
		return Session.get("partial_timeline_status");
	},

	insert_embedded_tweet: function(id_str){
		//if (!$("#"+id_str).hasClass("tweet_embedded")) {
			$("#"+id_str).empty();
			twttr.ready(function(twttr) {
				element = document.getElementById(id_str);
				style = {align: 'center'};
				twttr.widgets.createTweet(id_str, element, style)
			     .then(function(el) {
					 $("#"+id_str).addClass("tweet_embedded");
					 Session.set(id_str+"_html", $("#"+id_str).html());
				});	
			})
		//}
		// else {
		// 	$("#"+id_str).html(Session.get(id_str+"_html"));
		// }
	}
});

Template.recent_tweets.events({
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
		Session.set("selected_tweet_id", this.id_str);
	},

	'click .tweet-clear': function(event, template) {
		Session.set("partial_timeline_status", false);
		event.stopPropogation();
	}

});

Template.recent_tweets.onCreated(function() {
//if (Session.get("user_data_ready")) {
		Meteor.call("getUserTimeline", function(error, result){
		if (error) {
			console.log(error.reason);
			return;
		}
		Session.set("timeline", result);
		Session.set("partial_timeline_status", false);
		// twttr.ready(function(twttr) {
		// 	result.forEach(function(tweet) {
		// 		var id = tweet.id_str;
		// 		element = document.getElementById('timeline');
		// 		style = {align: 'center'};
		// 		twttr.widgets.createTweet(id, element, style)
		// 	     .then(function(el) {
		// 			 console.log("@ev's Tweet has been displayed.")
		// 		});

		// 	});
		// })
	});
//};
});


