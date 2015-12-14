Template.nav.events({

	'click #logo': function(event, target) {
		// Let's reset all the stuff the user selected
		Session.set("filtered_user_list_status", false);
		Session.set("selected_user_list_status", false);
		Session.set("partial_timeline_status", false);
	}
});