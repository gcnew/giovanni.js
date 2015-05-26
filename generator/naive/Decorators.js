/*globals Util, Matchers*/
/*exported Decorators*/

// import util/Util
// import grammar/Node
// import generator/naive/Matchers

var Decorators = (function() {

	function collect(aStack, aCount) {
		var children = {};
		var attributes = {};

		for (var i = aCount; i > 0; --i) {
			var val = aStack.pop();

			// TODO: children should be array
			if (val instanceof Node) {
				children[val.type] = val;
			}

			if (val.type === 'child') {
				children[val.name] = val.value;	
				continue;
			}

			if (val.type === 'attributes') {
				Util.extend(attributes, val.value);
				continue;
			}

			Util.never();
		}

		return {
			children: children,
			attributes: attributes
		};
	}

	return {
		name: function(aName, aMatcher) {
			return Matchers.matcher(function(aState) {
				var offset = aState.offset;
				var sz = aState.stack.length;

				if (!aMatcher.match(aState)) {
					return false;
				}

				var value;
				if (aMatcher.terminal) {
					value = aState.source.substring(offset, aState.offset);
				} else {
					value = aState.stack.pop();
				}

				Util.assert(aState.stack.length === sz);

				aState.stack.push({
					type: 'child',
					name: aName,
					value: value
				});

				return true;
			});
		},

		type: function(aType, aMatcher) {
			return Matchers.matcher(function(aState) {
				var sz = aState.stack.length;

				if (!aMatcher.match(aState)) {
					aState.stack.length = sz;

					return false;
				}

				var data = collect(aState.stack, aState.stack.length - sz);
				aState.stack.push(new Node(aType, data.attributes, data.children));

				return true;
			});
		},

		attributes: function(aAttributes, aMatcher) {
			return Matchers.matcher(function(aState) {
				var sz = aState.stack.length;

				if (!aMatcher.match(aState)) {
					aState.stack.length = sz;

					return false;
				}

				aState.stack.push({
					type: 'attributes',
					value: aAttributes
				});

				return true;
			});
		}
	};
})();
