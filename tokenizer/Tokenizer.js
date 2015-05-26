/*globals Diagnostics, Token, TokenType, SourcePosition, Util, ParsingException*/

// import Diagnostics
// import tokenizer/Token
// import tokenizer/TokenType
// import tokenizer/SourcePosition
// import util/Util
// import exception/ParsingException

function Tokenizer() {
	var self = this;

	construct.apply(this, arguments);

	var mSource;

	var mLine = 1;
	var mColumn = 0;
	var mIndex = 0;

	var mTokenLine;
	var mTokenColumn;
	var mTokenIndex;

	function construct(aSource) {
		mSource = aSource;
	}

	self.next = function() {
		if (!self.hasNext()) {
			throw error(Diagnostics.tokenenize_eof_reached);
		}

		tokenStart();
		return next0();
	};

	self.hasNext = function() {
		skipWhiteSpace();

		return !isAtEnd();
	};

	// Grammar Tokenizer

	self.hasNext = (function(super_hasNext) {
		return function() {
			while (super_hasNext()) {
				if (!(isCharAtOffset(0, '/') && isCharAtOffset(1, '/'))) {
					return true;
				}

				while (!isAtEnd() && nextChar() !== '\n') {
					// skip comments
				}
			}
		};
	})(self.hasNext);

	self.getChar = function() {
		if (isAtEnd()) {
			throw error(Diagnostics.tokenenize_eof_reached);
		}

		return nextChar();
	};

	self.ungetChar = function() {
		if (mIndex === 0) {
			throw error(Diagnostics.tokenize_illegal_ungetch);
		}

		--mIndex;
	};

	function next0() {
		var c = mSource[mIndex];

		switch (c) {
			case '[':
			case ']':
			case '(':
			case ')':
			case '{':
			case '}':
			case ';':
			case '|':
			case '?':
			case '+':
			case '*':
			case ':':
			case '@':
			case '.':
			case '#':
			case '%':
				nextChar();
				return new Token(TokenType.SYMBOL, tokenString(), tokenPosition());
			case '\'':
				return parseLiteral();
			default:
				break;
		}

		if (Tokenizer.isDigit(c)) {
			return parseNumber();
		}

		return parseIdentifier();
	}

	function parseIdentifier() {
		var firstChar = nextChar();

		if (!(Tokenizer.isLetter(firstChar) || (firstChar === '_'))) {
			throw error(Diagnostics.tokenize_invalid_identifier_char);
		}

		while (!isAtEnd() && Tokenizer.isIdentifierChar(mSource[mIndex])) {
			nextChar();
		}

		return new Token(TokenType.IDENTIFIER, tokenString(), tokenPosition());
	}

	function parseNumber() {
		do {
			nextChar();
		} while (!isAtEnd() && Tokenizer.isDigit(mSource[mIndex]));

		return new Token(TokenType.INT, tokenString(), tokenPosition());
	}

	function parseLiteral() {
		var stopChar = nextChar();

		var retval = '';
		var lastIndex = mIndex;
		do {
			if (isAtEnd()) {
				throw error('Unexpected EOF');
			}

			var c = nextChar();
			if (c === stopChar) {
				break;
			}

			if (c === '\\') {
				retval += mSource.substring(lastIndex, mIndex - 1);

				// if at end will fail on the next iteration
				if (!isAtEnd()) {
					lastIndex = mIndex;

					var nc = nextChar();
					if (nc !== '\\' && nc !== stopChar) {
						throw error(Diagnostics.tokenize_unexpected_escape);
					}
				}
			}
		} while (true);

		retval += mSource.substring(lastIndex, mIndex - 1);
		return new Token(TokenType.LITERAL, retval, tokenPosition());
	}

	// Grammar Tokenizer

	function skipWhiteSpace() {
		while (!isAtEnd() && Tokenizer.isWhiteSpace(mSource[mIndex])) {
			nextChar();
		}
	}

	function nextChar() {
		var retval = mSource[mIndex];

		++mIndex;
		++mColumn;

		if (retval === '\r') {
			if (mSource[mIndex] === '\n') {
				++mIndex;
			}

			retval = '\n';
		}

		if (retval === '\n') {
			++mLine;
			mColumn = 0;
		}

		return retval;
	}

	function isCharAtOffset(aOffset, aChar) {
		return mSource[mIndex + aOffset] === aChar;
	}

	function isAtEnd(aOffset) {
		return (mIndex + (aOffset || 0)) >= mSource.length;
	}

	/*
	function advance(aCount) {
		for (var i = 0; i < aCount; ++i) {
			nextChar();
		}
	}
	*/

	function tokenStart() {
		mTokenLine = mLine;
		mTokenColumn = mColumn;
		mTokenIndex = mIndex;
	}

	function tokenPosition() {
		return new SourcePosition(mTokenIndex, mIndex, mTokenLine, mTokenColumn);
	}

	function tokenString() {
		return mSource.substring(mTokenIndex, mIndex);
	}

	function msg(/*aMessage , ..aArgs */) {
		var message = Util.format.apply(null, arguments);

		return Util.format('{}:{} {}', mTokenLine, mTokenColumn, message);
	}

	function error(/*aMessage, ..aArgs*/) {
		return new ParsingException(msg.apply(null, arguments));
	}
}

Tokenizer.isDigit = function(aChar) {
	return (aChar >= '0') && (aChar <= '9');
};

Tokenizer.isLetter = function(aChar) {
	return ((aChar >= 'a') && (aChar <= 'z')) || ((aChar >= 'A') && (aChar <= 'Z'));
};

Tokenizer.isIdentifierChar = function(aChar) {
	return Tokenizer.isLetter(aChar) || Tokenizer.isDigit(aChar) || (aChar === '_');
};

Tokenizer.isWhiteSpace = function(aChar) {
	switch (aChar) {
		case ' ':
		case '\r':
		case '\n':
		case '\t':
		case '\f':
		case '\v':
			return true;
		default:
			return false;
	}
};
