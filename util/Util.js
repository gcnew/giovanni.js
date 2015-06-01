/*exported Util*/

var Util = new function() {
	var self = this;

	self.asMap = function(aArray, aFunction) {
		var retval = {};

		aArray.forEach(function(aValue) {
			retval[aValue] = aFunction(aValue);
		});

		return retval;
	};

	self.asSet = function(aArray) {
		return self.asMap(aArray, function() {
			return true;
		});
	};

	self.asIdMap = function(aArray) {
		return self.asMap(aArray, function(aValue) {
			return aValue;
		});
	};

	self.extend = function(aObject /*, ..args */) {
		var args = self.slice(arguments);

		args.forEach(function(aValue) {
			// skip null/undefined/falsy
			if (!aValue) {
				return;
			}

			for (var k in aValue) {
				aObject[k] = aValue[k];
			}
		});

		return aObject;
	};

	self.noop = function() {
	};

	self.asStatic = Function.prototype.bind.bind(Function.prototype.call);

	self.slice = Array.slice || self.asStatic(Array.prototype.slice);

	self.format = function(aFormat) {
		var index = 0;
		var args = self.slice(arguments, 1);

		return aFormat.replace(/\{(\d*)\}/g, function(_, aIndex) {
			return args[aIndex ? (aIndex | 0) : index++];
		});
	};

	self.assert = function(aCondition, aMessage) {
		if (!aCondition) {
			throw new Error(aMessage);
		}
	};

	self.assertf = function(aCondition) {
		if (!aCondition) {
			self.assert(false, self.format.apply(null, arguments));
		}
	};

	self.never = function(aMessage) {
		self.assert(false, aMessage);
	};
};

// 	function indent(aObject) {
//		return aObject.toString().replace(/\r?\n/g, '$&\t');
//	}
