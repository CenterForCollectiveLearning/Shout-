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

// New layouts
FlowRouter.route( '/home/new', {
  action: function() {
    BlazeLayout.render( 'applicationLayout', { main: 'home_new'}); 
    },
  name: 'home_new' 
});

FlowRouter.route( '/signin', {
  action: function() {
    BlazeLayout.render( 'applicationLayout', { main: 'signin_page_new'}); 
    },
  name: 'signin_new' 
});

