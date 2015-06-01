// import generator/naive/matchers/Matcher

function TerminalMatcher() {
	Matcher.call(this);
}

TerminalMatcher.prototype = Object.create(Matcher.prototype);
TerminalMatcher.prototype.terminal = true;

TerminalMatcher.MATCHER_TRUE = (function() {
	var retval = new TerminalMatcher();

	retval.match = function() {
		return true;
	};
	
	return retval;
})();
