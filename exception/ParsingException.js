// import util/Util

function ParsingException(aMessage) {
	this.message = aMessage;
}

Util.extend(ParsingException.prototype, {
	toString: function() {
		return this.constructor.name + ': ' + this.message;
	}
});
