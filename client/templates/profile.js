  Template.profile.onCreated(function() {

  	  	this.autorun(() => {
		this.subscribe('userData');
	});
});