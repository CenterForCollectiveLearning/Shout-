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

	// TODO: figure out how to store embedded tweet so don't have to query Twitter every time
	insert_embedded_tweet: function(id_str){
		$("#"+id_str).parent().parent().hide();
		if (!$("#"+id_str).hasClass("tweet_embedded")) {
			$("#"+id_str).empty();
			twttr.ready(function(twttr) {
				//console.log(document.getElementById(id_str).html());
				var element = document.getElementById(id_str);
				console.log("element: " + element)
				style = {align: 'center'};
				twttr.widgets.createTweet(id_str, element, style)
			     .then(function(el) {
					 //$("#"+id_str).addClass("tweet_embedded");

					 var iframeHtmlInner = $("#"+id_str).children()[0].contentWindow.document.body.innerHTML
					 var iframeHtmlOuter = $("#"+id_str).html();
					 Session.set(String(id_str)+"_iframeHtmlInner", iframeHtmlInner);
					 Session.set(String(id_str)+"_iframeHtmlOuter", iframeHtmlOuter);
					 $("#"+id_str).parent().parent().show();
				});	
			});

		}
		else {
			var iframeHtml = String(id_str)+"_iframeHtmlOuter";
			var innerIframeHtml = String(id_str)+"_iframeHtmlInner"; 
			$("#"+id_str).html(Session.get(iframeHtml));
			$("#"+id_str).children()[0].contentWindow.document.write(Session.get(innerIframeHtml));
		}
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
		event.stopPropagation();
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
		Session.set("panels_ready", false);
	});
//};
});


