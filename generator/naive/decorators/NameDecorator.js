// import generator/naive/decorators/Decorator

function NameDecorator(aName, aMatcher) {
	Decorator.call(this, aMatcher);

	this.name = aName;
}

NameDecorator.prototype = Object.create(Decorator.prototype);

NameDecorator.prototype.match = function(aState) {
	var offset = aState.offset;
	var sz = aState.stack.length;

	if (!this.matcher.match(aState)) {
		return false;
	}

	var value;
	if (this.matcher.isTerminal()) {
		value = aState.source.substring(offset, aState.offset);
	} else {
		value = aState.stack.pop();
	}

	Util.assert(aState.stack.length === sz);

	aState.stack.push({
		type: 'child',
		name: this.name,
		value: value
	});

	return true;
};
