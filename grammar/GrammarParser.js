/*global Util, Tokenizer, TokenType, ParsingException*/
/*exported TokenType*/

// import util/Util
// import grammar/Node
// import tokenizer/Tokenizer
// import tokenizer/TokenType
// import exception/ParsingException

function GrammarParser(aSource) {
	var mToken;
	var mAttrs = {};
	var mExpectedAttrs = GrammarParser.RULE_ATTRIBUTES;

	var mTokenizer = new Tokenizer(aSource);

	this.parse = function() {
		advance();

		return parseGrammar();
	};

	function parseGrammar() {
		var rules = [];

		while (mTokenizer.hasNext()) {
			rules.push(parseRule());

			mExpectedAttrs = GrammarParser.RULE_ATTRIBUTES;
			consumeAttributes();

			consume(TokenType.SYMBOL, ';');
		}

		return new Node('Grammar', null, { rules: rules });
	}

	function parseRule() {
		var t = mToken;

		consume(TokenType.IDENTIFIER);

		mExpectedAttrs = GrammarParser.BODY_ATTRIBUTES;
		var attrs = consumeAttributes();

		consume(TokenType.SYMBOL, ':');
		var body = parseAlternation();

		return new Node('Rule', attrs.system, {
			name: t.value,
			body: body,
			attributes: attrs.user
		});
	}

	function parseAlternation() {
		var left = parseSequence();

		if (!expect(TokenType.SYMBOL, '|')) {
			return left;
		}

		consume(TokenType.SYMBOL, '|');

		var right = parseAlternation();
		return new Node('Alternation', null, {
			left: left,
			right: right
		});
	}

	function parseSequence() {
		var nodes = [];

		while (true) {
			if (expect(TokenType.SYMBOL, ';')) {
				break;
			}

			if (expect(TokenType.SYMBOL, '|')) {
				break;
			}

			if (expect(TokenType.SYMBOL, ')')) {
				break;
			}

			var node = parseRepetition();
			nodes.push(node);
		}

		// TODO: should we disallow attributes only sequences?
		/* if (!nodes.length) {
			parseRepetition(); // i.e. crash
			throw new Error('never');
		} */

		if (nodes.length == 1) {
			return nodes[0];
		}

		var attrs = consumeAttributes();
		return new Node('Sequence', attrs.system, {
			body: nodes,
			attributes: attrs.user
		});
	}

	function parseRepetition() {
		var left = parsePrimary();

		if (expect(TokenType.SYMBOL)) {
			switch (mToken.value) {
				case '*':
				case '+':
				case '?': {
					var retval = new Node('Repetition', null, {
						left: left,
						operator: mToken.value
					});

					advance();
					return retval;
				}
				default:
				break; // just fall through
			}
		}

		return left;
	}

	function parsePrimary() {
		if (expect(TokenType.LITERAL)) {
			var retval = new Node('Literal', null, {
				value: mToken.value
			});

			advance();
			return retval;
		}

		if (expect(TokenType.IDENTIFIER)) {
			var retval = new Node('Reference', null, {
				'value': mToken.value
			});

			advance();
			return retval;
		}

		if (expect(TokenType.SYMBOL, '[')) {
			return parseCharClass();
		}

		if (expect(TokenType.SYMBOL, '.')) {
			advance();
			return new Node('Any');
		}

		if (expect(TokenType.SYMBOL, '(')) {
			// save the accuumulated attributes
			var attrs = consumeAttributes();

			advance();

			var name = null;
			if (expect(TokenType.SYMBOL, '%')) {
				advance();
				name = mToken.value;
				consume(TokenType.IDENTIFIER);
			}

			var left = parseAlternation();

			// restore attributes
			restoreAttributes(attrs);

			consume(TokenType.SYMBOL, ')');
			if (name === null) {
				return left;
			}

			return new Node('NameDecorator', null, {
				name: name,
				left: left
			});
		}

		throw error('Invalid Primary token: {}', mToken);
	}

	function parseCharClass() {
		var invert = mTokenizer.getChar() === '^';
		if (!invert) {
			mTokenizer.ungetChar();
		}

		var chars = '';
		var ranges = [];

		while (true) {
			var c = mTokenizer.getChar();

			if (c === '\\') {
				chars += c;
				continue;
			}

			if (c === '-') {
				var start = chars.substr(-1);
				chars = chars.substring(0, chars.length - 1);

				var end = mTokenizer.getChar();
				if (!start.length || end === ']' || end === '-') {
					// TODO: better line/char info
					throw error('Invalid char range');
				}

				if (end === '\\') {
					end = mTokenizer.getChar();
				}

				if (end < start) {
					throw error('Invalid char range');
				}

				ranges.push(new Node('CharRange', null, {
					from: start,
					to: end
				}));

				continue;
			}

			if (c === ']') {
				advance();
				break;
			}

			chars += c;
		}

		if (!chars.length && !ranges.length) {
			throw error('Empty char class');
		}

		return new Node('CharClass', null, {
			invert: invert,
			chars: chars,
			ranges: ranges
		});
	}

	function advance0() {
		if (!mToken && !mTokenizer.hasNext()) {
			throw error('EOF reached');
		}

		if (!mTokenizer.hasNext()) {
			mToken = null;
		} else {
			mToken = mTokenizer.next();
		}
	}

	function advance() {
		advance0();

		if (expect(TokenType.SYMBOL, '#') || expect(TokenType.SYMBOL, '@')) {
			var system = mToken.value === '#';

			advance0();

			var name = mToken.value;
			if (system && !mExpectedAttrs[name]) {
				throw error('Invalid system attribute #{}', name);
			}

			consume(TokenType.IDENTIFIER);

			var idx = system ? 'system' : 'user';
			var obj = mAttrs[idx] || {};

			obj[name] = true;
			mAttrs[idx] = obj;
		}
	}

	function consumeAttributes() {
		var retval = mAttrs;
		
		mAttrs = {};
		return retval;
	}

	function restoreAttributes(aAttrs) {
		mAttrs = aAttrs;
	}

	function expect(aType, aValue) {
		return !!mToken
			&& (mToken.type === aType)
			&& (!aValue || mToken.value === aValue);
	}

	function consume(aType, aValue) {
		if (!expect(aType, aValue)) {
			throw error('Expected "{} {}" but found: {}', aType, aValue, mToken);
		}

		advance();
	}

	function msg(/* aMessage, ..aArgs*/) {
		var position = mToken ? mToken.position : '<end>';
		var message = Util.format.apply(null, arguments);

		return Util.format('{}: {}', position, message);
	}

	function error(/* aMessage, ..aArgs*/) {
		return new ParsingException(msg.apply(null, arguments));
	}
}

GrammarParser.parse = function(aSource) {
	return new GrammarParser(aSource).parse();
};

GrammarParser.RULE_ATTRIBUTES = Util.asSet([ 'start', 'nobox' ]);
GrammarParser.BODY_ATTRIBUTES = Util.asSet([ 'box', 'nobox' ]);
