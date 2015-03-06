var Matchers = (function() {
	var MATCHER_TRUE = terminal(function() {
		return true;
	});

	function isInRange(aChar, aRanges) {
		for (var i = 0; i < aRanges.length; ++i) {
			var range = aRanges[i];

			if (aChar >= range.from && aChar <= range.to) {
				return true;
			}
		}

		return false;
	}

	function isInChars(aChar, aChars) {
		return aChars.indexOf(aChar) >= 0;
	}

	return {
		matcher: function(aMatcher) {
			return {
				match: aMatcher
			};
		},

		terminal: function(aMatcher) {
			return {
				terminal: true,
				match: aMatcher
			};
		},

		chain: function(aMatcher) {
			return {
				next: MATCHER_TRUE,
				match: aMatcher
			};
		},

		alternation: function(aFirst, aSecond) {
			return Matchers.chain(function(aState) {
				var offset = aState.offset;

				if (aFirst.match(aState)) {
					if (this.next.match(aState)) {
						return true;
					}

					aState.offset = offset;
				}

				if (aSecond.match(aState)) {
					if (this.next.match(aState)) {
						return true;
					}

					aState.offset = offset;
				}

				return false;
			});
		},

		any: function() {
			return Matchers.terminal(function(aState) {
				if (aState.isAtEnd()) {
					return false;
				}

				++aState.offset;
				return true;
			});
		},

		charClass: function(aInvert, aChars, aRanges) {
			return Matchers.terminal(function(aState) {
				if (aState.isAtEnd()) {
					return false;
				}

				var c = aState.source[aState.offset];
				var result = isInChars(c, aChars) || isInRange(c, aRanges);

				// !(invert ^ result) => !invert ^ result => (invert == result)
				if (aInvert === result) {
					return false;
				}

				++aState.offset;
				return true;
			});
		},

		literal: function(aLiteral) {
			return Matchers.terminal(function(aState) {
				if (aState.source.indexOf(aLiteral, aState.offset) < 0) {
					return false;
				}

				++aState.offset;
				return true;
			});
		},

		repetition: function(aMin, aMax, aMatcher) {
			return Matchers.chain(function(aState) {
				var matches = 0;
				var maxMatches = aMax;
				var offset = aState.offset;

				while (true) {
					if (matches === maxMatches) {
						if (this.next.match(aState)) {
							return true;
						}

						--maxMatches;
						if (maxMatches < aMin) {
							aState.offset = offset;
							return false;
						}

						aState.offset = offset;
						matches = 0;
						continue;
					}

					if (aMatcher.match(aState)) {
						++matches;
					} else {
						if (matches < aMin) {
							aState.offset = offset;
							return false;
						}

						maxMatches = matches;
					}
				}
			});
		},

		reference: function() {
			return {
				reference: null,

				match: function(aState) {
					return this.reference.match(aState);
				}
			};
		},

		sequence: function(aFirst, aSecond) {
			return Matchers.matcher(function(aState) {
				var offset = aState.offset;

				if (!(aFirst.match(aState) && aSecond.match(aState))) {
					aState.offset = offset;
					return false;
				}

				return true;
			});
		}
	};
})();
