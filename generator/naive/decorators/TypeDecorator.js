// import generator/naive/decorators/Decorator

function TypeDecorator(aType, aMatcher) {
	Decorator.call(this, aMatcher);

	this.type = aType;
}

TypeDecorator.prototype = Object.create(Decorator.prototype);

TypeDecorator.prototype.match = function(aState) {
	var sz = aState.stack.length;

	if (!this.matcher.match(aState)) {
		aState.stack.length = sz;

		return false;
	}

	var data = this.collect(aState.stack, aState.stack.length - sz);
	aState.stack.push(new Node(this.type, data.attributes, data.children));

	return true;
};
