FlowRouter.route( '/', {
  action: function() {
  	BlazeLayout.render( 'applicationLayout', { main: 'home'}); 
    },
  name: 'home' 
});

FlowRouter.route( '/profile', {
  action: function() {
    BlazeLayout.render( 'applicationLayout', { main: 'profile'});
  },
  name: 'profile' 
});

FlowRouter.route( '/profile/edit', {
  action: function() {
    BlazeLayout.render( 'applicationLayout', { main: 'edit_profile_page'});
  },
  name: 'editProfile' 
});
