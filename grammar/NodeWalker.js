/*globals Util*/

// import util/Util

function NodeWalker(aVisitor) {
	this.cache = {};

	this.visitor = aVisitor;
}

NodeWalker.traverse = function(aNode, aVisitor) {
	new NodeWalker(aVisitor).traverse(aNode);

	return aVisitor;
};

NodeWalker.prototype.visitChild = function(aChild) {
	if (aChild.length) {
		aChild.forEach(this.traverse, this);
	} else {
		this.traverse(aChild);
	}
};

NodeWalker.prototype.traverse = function(aNode) {
	var handles = this.handles(aNode.type);

	handles.visit.call(this.visitor, aNode);
	aNode.children.forEach(this.visitChild, this);

	handles.leave.call(this.visitor, aNode);
};

NodeWalker.prototype.handles = function(aType) {
	var handles = this.cache[aType];

	if (!handles) {
		handles = {
			visit: this.visitor['visit' + aType] || this.visitor['visit'] || Util.noop,
			leave: this.visitor['leave' + aType] || this.visitor['leave'] || Util.noop
		};

		this.cache[aType] = handles;
	}

	return handles;
};
