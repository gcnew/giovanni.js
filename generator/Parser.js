function Parser(aParserFunction) {
	this.parse = aParserFunction;
}

Util.extend(Parser.prototype, {
	recognize: function(aSource) {
		try {
			return !!this.parse(aSource);
		} catch (ignored) {
			return false;
		}
	}
});
