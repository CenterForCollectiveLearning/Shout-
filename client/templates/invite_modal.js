Template.invite_modal.events({

	'click #send-invite-btn': function() {
		$(".invite-error").hide();
		var twitter_handle;
		var message_text; 

		message_text = $("#invite-msg-text").val()
		twitter_handle = $("#invite-twitter-handle").val()

		if (message_text.length==0) {
			$(".message-error").show();
			$(".message-group").addClass("has-error");
			return;
		}

		if (twitter_handle.length==0) {
			$(".screen-name-error").show();
			$(".screen-name-group").addClass("has-error");
			return;
		}

		// Parse out the '@' from the twitter handle 
		if (twitter_handle.substring(0,1)=="@") {
			twitter_handle = twitter_handle.substring(1);
		}

		Meteor.call("sendDirectMessageInvite", twitter_handle, message_text, function(err, result) {
			if (err) {
				console.log(err);
				$(".invite-error").show();
				return
			}
			$(".invite-error").hide();
			$(".message-error").hide();
			$(".message-group").removeClass("has-error");
			$(".invite-success").show();
			$(".invite-success").fadeTo(2000, 500).slideUp(500, function(){
			    $(".invite-success").hide();
			});	
		});
	},

	'hidden.bs.modal #invite_modal': function() {
		// Reset the errors
		$(".message-error").hide();
		$(".message-group").removeClass("has-error");
		$(".screen-name-error").hide();
		$(".screen-name-group").removeClass("has-error");
		$(".invite-error").hide();

	}

});