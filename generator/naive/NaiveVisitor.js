/*global Util, ParsingException, Parser, MatcherState, Decorators, Matchers*/
/*exported TokenType*/

// import util/Util
// import exception/ParsingException
// import generator/Parser
// import generator/naive/MatcherState

// import generator/naive/matchers/AlternationMatcher
// import generator/naive/matchers/AnyMatcher
// import generator/naive/matchers/SequenceMatcher
// import generator/naive/matchers/RepetitionMatcher
// import generator/naive/matchers/LiteralMatcher
// import generator/naive/matchers/ReferenceMatcher
// import generator/naive/matchers/CharClassMatcher

// import generator/naive/decorators/TypeDecorator
// import generator/naive/decorators/NameDecorator
// import generator/naive/decorators/AttributesDecorator

function NaiveVisitor() {
	this.start = null;
	this.rules = {};
	this.stack = [];
	this.references = [];
}

Util.extend(NaiveVisitor.prototype, {
	getParser: function(aRuleName) {
		var start = this.rules[aRuleName || this.start];

		if (!start) {
			throw this.error('Rule "{}" not found', aRuleName);
		}

		return new Parser(function(aSource) {
			var state = new MatcherState(aSource);

			if (!start.match(state)) {
				throw new ParsingException('Parsing failed');
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
		}, this);

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
			rule = new AttributesDecorator(attrs, rule);
		}

		if (!aNode.getAttribute('nobox')) {
			rule = new TypeDecorator(name, rule);
		}

		this.rules[name] = rule;
	},

	leaveAlternation: function() {
		var second = this.stack.pop();

		this.stack.push(new AlternationMatcher(this.stack.pop(), second));
	},

	leaveSequence: function(aNode) {
		var nodes = aNode.getChild('body');

		var node = this.stack.pop();
		for (var i = nodes.length - 1; i > 0; --i) {
			var first = this.stack.pop();

			if (first.next) {
				// if chain
				first.next = node;
				node = first;
			} else {
				node = new SequenceMatcher(first, node);
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

		Util.assertf(bounds, 'Unexpected operator: {}', operator);

		this.stack.push(new RepetitionMatcher(
			bounds.min,
			bounds.max,
			this.stack.pop()
		));
	},

	visitLiteral: function(aNode) {
		this.stack.push(new LiteralMatcher(aNode.getChild('value')));
	},

	visitAny: function() {
		this.stack.push(new AnyMatcher());
	},

	visitReference: function(aNode) {
		var ref = new ReferenceMatcher();

		this.stack.push(ref);
		this.references.push({
			name: aNode.getChild('value'),
			matcher: ref
		});
	},

	visitCharClass: function(aNode) {
		this.stack.push(new CharClassMatcher(
			aNode.getChild('invert'),
			aNode.getChild('chars'),
			aNode.getChild('ranges')
		));
	},

	leaveNameDecorator: function(aNode) {
		this.stack.push(new NameDecorator(
			aNode.getChild('name'),
			this.stack.pop()
		));
	},

	error: function() {
		var msg = Util.format.apply(null, arguments);

		return new ParsingException(msg);
	}
});
