// A deliberately small Typst-maths tokenizer. It produces spans for the
// syntax-highlighted layer that sits underneath the real textarea, so the
// editor keeps native caret, selection, IME and undo behaviour.

const GREEK = new Set(
  `alpha beta gamma delta epsilon zeta eta theta iota kappa lambda mu nu xi
   omicron pi rho sigma tau upsilon phi chi psi omega Gamma Delta Theta Lambda
   Xi Pi Sigma Upsilon Phi Psi Omega`.split(/\s+/),
);

const FUNCTIONS = new Set(
  `sqrt root frac abs norm floor ceil round sum product integral lim sin cos
   tan cot sec csc arcsin arccos arctan sinh cosh tanh log ln exp min max sup
   inf det dim ker mod vec mat cases binom cal bb frak sans serif mono bold
   italic upright op display inline text attach underbrace overbrace overline
   underline cancel highlight strike lr mid`.split(/\s+/),
);

const SYMBOLS = new Set(
  `oo infinity and or not in to forall exists emptyset therefore because prime
   dots dot times div partial nabla grad dif`.split(/\s+/),
);

const MULTI_CHAR_OPERATORS = [
  "->>",
  "-->",
  "->",
  "<-",
  "=>",
  "<=",
  ">=",
  "!=",
  ":=",
  "==",
  "...",
  "..",
  "&&",
  "||",
];

function isUpper(code) {
  return code >= 65 && code <= 90;
}

function isLower(code) {
  return code >= 97 && code <= 122;
}

function isAlpha(code) {
  return isUpper(code) || isLower(code);
}

function isDigit(code) {
  return code >= 48 && code <= 57;
}

function isAlphaNumeric(code) {
  return isAlpha(code) || isDigit(code);
}

function wordKind(word) {
  if (GREEK.has(word)) return "greek";
  if (FUNCTIONS.has(word)) return "func";
  if (SYMBOLS.has(word)) return "symbol";
  return null;
}

/**
 * Walk the source once, producing `[start, end, kind]` spans that cover every
 * character. Each `read…` method advances `index` past exactly one token.
 */
class Tokenizer {
  constructor(source) {
    this.source = source;
    this.index = 0;
    this.spans = [];
  }

  tokenize() {
    while (this.index < this.source.length) this.readToken();
    return this.spans;
  }

  push(start, end, kind) {
    this.spans.push([start, end, kind]);
  }

  current() {
    return this.source[this.index];
  }

  codeAt(index = this.index) {
    return this.source.charCodeAt(index);
  }

  readToken() {
    const start = this.index;

    // Comment: `// ...` up to (but not including) the newline.
    if (this.current() === "/" && this.source[this.index + 1] === "/") {
      this.readComment(start);
      return;
    }

    // String literal, with backslash escapes.
    if (this.current() === '"') {
      this.readString(start);
      return;
    }

    // Code: `#name`, `#(...)`, `#{...}`.
    if (this.current() === "#") {
      this.readCode(start);
      return;
    }

    // Number, including a fractional part.
    if (isDigit(this.codeAt())) {
      this.readNumber(start);
      return;
    }

    // Identifier, possibly dotted (`arrow.r`, `integral.double`).
    if (isAlpha(this.codeAt())) {
      this.readIdentifier(start);
      return;
    }

    // Multi-character operators.
    if (this.readOperator(start)) return;

    // Single character.
    this.readCharacter(start);
  }

  readComment(start) {
    while (this.index < this.source.length && this.current() !== "\n") {
      this.index += 1;
    }
    this.push(start, this.index, "comment");
  }

  readString(start) {
    this.index += 1;
    while (this.index < this.source.length) {
      if (this.current() === "\\") {
        this.index += 2;
      } else if (this.current() === '"') {
        this.index += 1;
        break;
      } else {
        this.index += 1;
      }
    }
    this.index = Math.min(this.index, this.source.length);
    this.push(start, this.index, "str");
  }

  readCode(start) {
    this.index += 1;
    if (
      this.index < this.source.length &&
      (isAlpha(this.codeAt()) || this.current() === "_")
    ) {
      while (
        this.index < this.source.length &&
        (isAlphaNumeric(this.codeAt()) || "._-".includes(this.current()))
      ) {
        this.index += 1;
      }
    } else if (
      this.index < this.source.length &&
      (this.current() === "(" || this.current() === "{")
    ) {
      this.index += 1;
    }
    this.push(start, this.index, "code");
  }

  readNumber(start) {
    while (this.index < this.source.length && isDigit(this.codeAt())) {
      this.index += 1;
    }
    if (
      this.index + 1 < this.source.length &&
      this.current() === "." &&
      isDigit(this.codeAt(this.index + 1))
    ) {
      this.index += 1;
      while (this.index < this.source.length && isDigit(this.codeAt())) {
        this.index += 1;
      }
    }
    this.push(start, this.index, "number");
  }

  readIdentifier(start) {
    while (this.index < this.source.length && isAlphaNumeric(this.codeAt())) {
      this.index += 1;
    }
    while (
      this.index + 1 < this.source.length &&
      this.current() === "." &&
      isAlpha(this.codeAt(this.index + 1))
    ) {
      this.index += 1;
      while (this.index < this.source.length && isAlphaNumeric(this.codeAt())) {
        this.index += 1;
      }
    }

    const word = this.source.slice(start, this.index);
    const kind =
      wordKind(word) ??
      (word.includes(".") || (this.current() === "(" && word.length > 1)
        ? "func"
        : "text");
    this.push(start, this.index, kind);
  }

  readOperator(start) {
    const operator = MULTI_CHAR_OPERATORS.find((op) =>
      this.source.startsWith(op, this.index),
    );
    if (!operator) return false;

    this.index += operator.length;
    this.push(start, this.index, "op");
    return true;
  }

  readCharacter(start) {
    const character = this.current();
    let kind = "text";
    if ("+-*/=<>".includes(character) || character === "&") {
      kind = "op";
    } else if (character === "^" || character === "_") {
      kind = "attach";
    } else if ("()[]{}|".includes(character)) {
      kind = "bracket";
    } else if (character === "\\" || character === "$") {
      kind = "delim";
    }

    const codePoint = this.source.codePointAt(this.index);
    this.index += codePoint > 0xffff ? 2 : 1;
    this.push(start, this.index, kind);
  }
}

/** Split `source` into `[start, end, kind]` spans covering every character. */
export function tokenize(source) {
  return new Tokenizer(source).tokenize();
}

/** Rebuild the `<code>` layer with one coloured span per token. */
export function renderHighlight(codeElement, source) {
  const fragment = document.createDocumentFragment();

  for (const [start, end, kind] of tokenize(source)) {
    const span = document.createElement("span");
    span.className = `k-${kind}`;
    span.textContent = source.slice(start, end);
    fragment.appendChild(span);
  }

  // A trailing newline gives the empty last line its height, and keeps the
  // highlighted layer scrollable in step with the textarea.
  fragment.appendChild(document.createTextNode("\n"));
  codeElement.replaceChildren(fragment);
}
