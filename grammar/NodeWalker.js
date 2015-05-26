/*globals Util*/
// import util/Util
// import grammar/Node

function NodeWalker(aVisitor) {
	this.cache = {};

	this.visitor = aVisitor;
}

NodeWalker.traverse = function(aNode, aVisitor) {
	new NodeWalker(aVisitor).traverse(aNode);

	return aVisitor;
};

NodeWalker.prototype.traverse = function(aNode) {
	var handles = this.handles(aNode.type);

	handles.visit.call(this.visitor, aNode);
	for (var key in aNode.children) {
		var child = aNode.children[key];

		if (Array.isArray(child)) {
			child.forEach(this.traverse, this);
			continue;
		}

		if (child instanceof Node) {
			this.traverse(child);
			continue;
		}
	}

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
