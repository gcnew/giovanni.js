function NaiveVisitor() {
	this.start = null;
	this.rules = {};
	this.stack = [];
	this.references = [];
}

Util.extend(NaiveVisitor.prototype, {
	getParser: function(aRuleName) {
		var rule = this.rules[aRuleName || this.start];

		if (!rule) {
			throw this.error('Rule "{}" not found', aRuleName);
		}

		return new Parser(function(aSource) {
			var state = new MatcherState(aSource);

			if (!mStart.match(state)) {
				throw this.error('Parsing failed');
			}

			Util.assert(state.stack.length === 1);
			return state.stack.pop();
		});
	},

	leaveGrammar: function() {
		Util.assert(this.stack.length === 0);

		if (!this.start){
			throw this.error('No starting rule found');
		}

		this.references.forEach(function(aRef) {
			var rule = this.rules[aRef.name];

			if (!rule) {
				throw this.error('Missing rule definition: {}', aRef.name);
			}

			aRef.matcher.reference = rule;
		});

		this.references = null;
	},

	leaveRule: function(aNode) {
		var name = aNode.getChild('name');

		if (this.rules[name]) {
			throw this.error('Multiple rules found with the same name: {}', name);
		}

		if (aNode.getAttribute('start')) {
			if (this.start) {
				throw this.error('Multiple start rules found: {}, {}', this.start, name);
			}

			this.start = name;
		}

		var rule = this.stack.pop();
		var attrs = aNode.getChild('attributes');

		if (attrs) {
			rule = Decorators.attributes(attrs, rule);
		}

		if (!aNode.getAttribute('nobox')) {
			rule = Decorators.type(name, rule);
		}

		this.rules[name] = rule;
	},

	leaveAlternation: function() {
		var second = this.stack.pop();

		this.stack.push(Matchers.alternation(this.stack.pop(), second));
	},

	leaveSequence: function(aNode) {
		var nodes = aNode.getChild('body');

		var node = this.stack.pop();
		for (var i = nodes.length - 1; i > 0; --i) {
			var first = this.stack.pop();

			if (first.next) {
				// if chain
				first.next = second;
				node = first;
			} else {
				node = Matchers.sequence(first, node);
			}
		}

		this.stack.push(node);
	},

	leaveRepetition: function(aNode) {
		var operator = aNode.getChild('operator');
		var bounds = {
			'*': { min: 0, max: -1 },
			'+': { min: 1, max: -1 },
			'?': { min: 0, max:  1 }
		}[operator];

		Util.assert(bounds, 'Unexpected operator: ' + operator);

		this.stack.push(Matchers.repetition(
			bounds.min,
			bounds.max,
			this.stack.pop()
		));
	},

	visitLiteral: function(aNode) {
		this.stack.push(Matchers.literal(aNode.getChild('value')));
	},

	visitAny: function() {
		this.stack.push(Matchers.any());
	},

	visitReference: function(aNode) {
		var ref = Matchers.reference();

		this.stack.push(ref);
		this.references.push({
			name: aNode.getChild('value'),
			matcher: ref
		});
	},

	visitCharClass: function(aNode) {
		this.stack.push(Matchers.charClass(
			aNode.getChild('invert'),
			aNode.getChild('chars'),
			aNode.getChild('ranges')
		));
	},

	leaveNameDecorator: function(aNode) {
		this.stack.push(Decorator.name(
			aNode.getChild('name'),
			this.stack.pop()
		));
	},

	error: function() {
		var msg = Util.format.apply(null, arguments);

		return new ParsingException(msg);
	}
});
