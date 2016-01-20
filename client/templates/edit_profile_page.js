Template.edit_profile_page.helpers({
	bio: function() {
		Meteor.user();
		var bio = Meteor.user() && Meteor.user().profile && Meteor.user().profile.bio;
		return bio;
	},

	interests: function() {
		var bio = Meteor.user() && Meteor.user().profile && Meteor.user().profile.interests;
		return interests;
	}
});

Template.edit_profile_page.events({
	'click #save-edited-profile': function(event, template) {
		var edited_bio = template.find('#bio').value;
		var edited_interests = template.find('#interests').value;
		var user_id = Meteor.userId();
		Meteor.call("updateProfile", user_id, edited_bio, edited_interests, function(err, result) {
			if (err) {
				console.log(err.reason);
				return;
			}
			$("#edit-success-alert").show();
		});
	},

	'click #cancel-edits': function(event, template) {
		FlowRouter.go('/profile');
	}
});

 Template.edit_profile_page.rendered =function(){
	var engine = new Bloodhound({
	  local: [{value: 'red'}, {value: 'blue'}, {value: 'green'} , {value: 'yellow'}, {value: 'violet'}, {value: 'brown'}, {value: 'purple'}, {value: 'black'}, {value: 'white'}],
	  datumTokenizer: function(d) {
	    return Bloodhound.tokenizers.whitespace(d.value);
	  },
	  queryTokenizer: Bloodhound.tokenizers.whitespace
	});

	engine.initialize();

	$('.tokenfield-typeahead').tokenfield({
	  typeahead: [null, { source: engine.ttAdapter() }]
	});
  };

  Template.edit_profile_page.onCreated(function() {

  	  	this.autorun(() => {
		this.subscribe('userData');
	});
	$("#edit-success-alert").hide();

});