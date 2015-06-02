// import generator/naive/matchers/ChainMatcher

function RepetitionMatcher(aMin, aMax, aMatcher) {
	ChainMatcher.call(this);

	this.min = aMin;
	this.max = aMax;
	this.matcher = aMatcher;
}

RepetitionMatcher.prototype = Object.create(ChainMatcher.prototype);

RepetitionMatcher.prototype.match = function(aState) {
	var matches = 0;
	var maxMatches = this.max;
	var offset = aState.offset;

	while (true) {
		if (matches === maxMatches) {
			if (this.next.match(aState)) {
				return true;
			}

			--maxMatches;
			if (maxMatches < this.min) {
				aState.offset = offset;
				return false;
			}

			aState.offset = offset;
			matches = 0;
			continue;
		}

		if (this.matcher.match(aState)) {
			++matches;
		} else {
			if (matches < this.min) {
				aState.offset = offset;
				return false;
			}

			maxMatches = matches;
		}
	}
};

RepetitionMatcher.prototype.isTerminal = function() {
	return this.matcher.isTerminal();
};

RepetitionMatcher.prototype.toString = function() {
	return '[Repetition ' + this.min + '~' + this.max +
		'\n\tmatcher: ' + indent(this.matcher) + '\n' +
	']';
};
