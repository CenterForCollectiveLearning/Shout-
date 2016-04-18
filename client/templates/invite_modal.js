Template.invite_modal.events({

	'click #send-invite-btn': function() {
		var twitter_handle;
		var message_text; 

		message_text = $("#invite-msg-text").val()
		twitter_handle = $("#invite-twitter-handle").val()

		if (message_text.length==0) {
			$(".message-error").show();
			$(".message-group").addClass("has-error");
			return;

		}

		Meteor.call("sendDirectMessageInvite", twitter_handle, message_text, function(err, result) {
			if (err) {
				console.log(err);
			}
			$(".message-error").hide();
			$(".message-group").removeClass("has-error");
			$("#invite-success").show();
			$("#invite-success").fadeTo(2000, 500).slideUp(500, function(){
			    $("#invite-success").hide();
			});	
		});
	},

});