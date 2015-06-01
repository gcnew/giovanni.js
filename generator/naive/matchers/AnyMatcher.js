// import generator/naive/matchers/TerminalMatcher

function AnyMatcher() {
	TerminalMatcher.call(this);
}

AnyMatcher.prototype = Object.create(TerminalMatcher.prototype);

AnyMatcher.prototype.match = function(aState) {
	if (aState.isAtEnd()) {
		return false;
	}

	++aState.offset;
	return true;
};

AnyMatcher.prototype.toString = function() {
	return '[Any *]';
};
