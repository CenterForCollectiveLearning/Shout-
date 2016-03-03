FlowRouter.route( '/signin', {
  action: function() {
    BlazeLayout.render( 'applicationLayout', { main: 'signin_page'}); 
    },
  name: 'signin' 
});

FlowRouter.route( '/notifications', {
  action: function() {
    BlazeLayout.render( 'applicationLayout', { main: 'notifications_page'}); 
    },
  name: 'notifications' 
});


FlowRouter.route('/', {
    action: function(params) {
        Tracker.autorun(function() {
            if (!Meteor.userId()) {
              BlazeLayout.render("applicationLayout", { main: 'signin_page' });
            } else {
              BlazeLayout.render("applicationLayout", { main: 'home' });
            }
        });
      }
});

