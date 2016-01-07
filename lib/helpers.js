// Contains helper functions for templates

existsCurrentSelectedTweet = function() {
	if (Session.get("tweetListStatus")==="selected") {
		return true;
	}
	return false;
};

existsCurrentSelectedUser = function () {
	if (Session.get("userListStatus")==="selected") {
		return true;
	}
	return false;
};

dateConverter = function(date) {
	return moment(date).format("dddd, MMM Do YYYY, h:mm a");
}
