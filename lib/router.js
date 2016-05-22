// FlowRouter.route( '/signin', {
//   action: function() {
//     BlazeLayout.render( 'applicationLayout', { main: 'signin_page'}); 
//     },
//   name: 'signin' 
// });

FlowRouter.route( '/notifications', {
  triggersEnter: [function(context, redirect) {
    if (!Meteor.userId()) {
      redirect('/');
    }
  }],
  action: function() {
    Tracker.autorun(function() {
          BlazeLayout.render("applicationLayout", { main: 'notifications_page' });
    });
  }
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

FlowRouter.route('/login', {
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

FlowRouter.notFound = {
    action: function() {
        BlazeLayout.render("applicationLayout", { main: 'not_found_page' });
    }
};



