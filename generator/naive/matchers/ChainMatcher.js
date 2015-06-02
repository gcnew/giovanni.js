// import generator/naive/matchers/Matcher
// import generator/naive/matchers/TerminalMatcher

function ChainMatcher() {
	Matcher.call(this);
}

ChainMatcher.prototype = Object.create(Matcher.prototype);

ChainMatcher.prototype.next = TerminalMatcher.MATCHER_TRUE;
