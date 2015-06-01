// import generator/naive/matchers/TerminalMatcher

function CharClassMatcher(aInvert, aChars, aRanges) {
	TerminalMatcher.call(this);

	this.invert = aInvert;
	this.chars = aChars;
	this.ranges = aRanges;
}

CharClassMatcher.prototype = Object.create(TerminalMatcher.prototype);

CharClassMatcher.isInChars = function(aChar, aChars) {
	return aChars.indexOf(aChar) >= 0;
};

CharClassMatcher.isInRange = function(aChar, aRanges) {
	for (var i = 0; i < aRanges.length; ++i) {
		var range = aRanges[i];

		if (aChar >= range.getChild('from') && aChar <= range.getChild('to')) {
			return true;
		}
	}

	return false;
};

CharClassMatcher.prototype.match = function(aState) {
	if (aState.isAtEnd()) {
		return false;
	}

	var c = aState.source[aState.offset];
	var result = CharClassMatcher.isInChars(c, this.chars) ||
				 CharClassMatcher.isInRange(c, this.ranges);

	// !(invert ^ result) => !invert ^ result => (invert == result)
	if (this.invert === result) {
		return false;
	}

	++aState.offset;
	return true;
};

CharClassMatcher.prototype.toString = function() {
	var ranges = this.ranges.map(function(aRange) {
		return range.getChild('from') + '-' + range.getChild('to');
	}).join('');

	return '[CharClass "' + this.chars + ranges + '"]';
};
