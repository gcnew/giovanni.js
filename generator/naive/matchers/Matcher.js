function Matcher() {
}

Matcher.prototype.match = function() {
	throw new Error('Unimplemented');
};

Matcher.prototype.toString = function() {
	var retval = '';

	for (var k in this) {
		retval += k + ': ' + this[k] + '\n';
	}

	return retval;
};
