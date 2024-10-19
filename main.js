class Lexer {
  constructor(input) {
      this.input = input;
      this.position = 0;
      this.currentChar = this.input[this.position];
      this.indentStack = [0]; // 用于跟踪缩进级别的堆栈，初始为0
  }

  advance() {
      this.position++;
      this.currentChar = this.position < this.input.length ? this.input[this.position] : null;
  }

  peek() {
      let nextPosition = this.position + 1;
      return nextPosition < this.input.length ? this.input[nextPosition] : null;
  }

  error(msg) {
      throw new Error("Lexer error at position " + this.position + ": " + msg);
  }

  tokenize() {
      let tokens = [];
      while (this.currentChar !== null) {
          if (this.currentChar === '\n') {
              tokens.push({ type: 'NEWLINE', value: '\n' });
              this.advance();
              tokens = tokens.concat(this.handleIndentation());
          } else if (this.currentChar === ' ' || this.currentChar === '\t') {
              this.advance(); // Skip whitespace at beginning of lines
          } else if (this.currentChar === '/' && this.peek() === '/') {
              tokens.push(this.getSingleLineComment());
          } else if (this.currentChar === '/' && this.peek() === '*') {
              tokens.push(this.getMultiLineComment());
          } else if (this.currentChar === '"' || this.currentChar === "'") {
              tokens.push(this.getString());
          } else if (/\d/.test(this.currentChar)) {
              tokens.push(this.getInteger());
          } else if (/[a-zA-Z]/.test(this.currentChar)) {
              tokens.push(this.getIdentifierOrKeyword());
            } else if (this.currentChar === '(') {
              tokens.push({ type: 'LPAREN', value: '(' });
              this.advance();
          } else if (this.currentChar === ')') {
              tokens.push({ type: 'RPAREN', value: ')' });
              this.advance();
          } else if (this.currentChar === ',') {
              tokens.push({ type: 'COMMA', value: ',' });
              this.advance();
          } else if (this.currentChar === '=' || this.currentChar === '-') {
              tokens.push(this.getArrow());
          } else if ('+-*/^'.includes(this.currentChar)) {
              tokens.push(this.getOperator());
          } else if ('=!<'.includes(this.currentChar)) {
              tokens.push(this.getComparison());
          } else if (this.currentChar === '_') {
              tokens.push(this.getSubscript());
          } else {
              this.advance();
          }
      }
      tokens = tokens.concat(this.closeIndents()); // 关闭剩余的缩进
      return tokens;
  }

  handleIndentation() {
      let tokens = [];
      let numSpaces = 0;
      while (this.currentChar === ' ') {
          numSpaces++;
          this.advance();
      }
      
      const spacePerIndent = 4;
      const currentIndentLevel = numSpaces / spacePerIndent;
      const lastIndentLevel = this.indentStack[this.indentStack.length - 1];

      if (currentIndentLevel > lastIndentLevel) {
          this.indentStack.push(currentIndentLevel);
          tokens.push({ type: 'INDENT', value: currentIndentLevel });
      } else if (currentIndentLevel < lastIndentLevel) {
          while (currentIndentLevel < this.indentStack[this.indentStack.length - 1]) {
              this.indentStack.pop();
              tokens.push({ type: 'DEDENT', value: this.indentStack[this.indentStack.length - 1] });
          }
      }

      return tokens;
  }

  closeIndents() {
      let tokens = [];
      while (this.indentStack.length > 1) {
          this.indentStack.pop();
          tokens.push({ type: 'DEDENT', value: this.indentStack[this.indentStack.length - 1] });
      }
      return tokens;
  }

  getSingleLineComment() {
      let comment = '';
      this.advance(); // skip '/'
      this.advance(); // skip second '/'
      while (this.currentChar !== '\n' && this.currentChar !== null) {
          comment += this.currentChar;
          this.advance();
      }
      return { type: 'COMMENT', value: comment };
  }

  getMultiLineComment() {
      let comment = '';
      this.advance(); // skip '/'
      this.advance(); // skip '*'
      while (this.currentChar !== null && !(this.currentChar === '*' && this.peek() === '/')) {
          comment += this.currentChar;
          this.advance();
      }
      if (this.currentChar === '*' && this.peek() === '/') {
          this.advance(); // Skip the '*'
          this.advance(); // Skip the '/'
          return { type: 'COMMENT', value: comment };
      } else {
          this.error("Unterminated comment");
      }
  }

  getString() {
      let delimiter = this.currentChar;
      let result = '';
      this.advance(); // Skip the opening quote
      while (this.currentChar !== null && this.currentChar !== delimiter) {
          result += this.currentChar;
          this.advance();
      }
      if (this.currentChar === delimiter) {
          this.advance(); // Skip the closing quote
          return { type: 'STRING', value: result };
      } else {
          this.error("Unterminated string literal");
      }
  }

  getInteger() {
      let result = '';
      while (this.currentChar !== null && /\d/.test(this.currentChar)) {
          result += this.currentChar;
          this.advance();
      }
      return { type: 'INTEGER', value: parseInt(result) };
  }

  getIdentifierOrKeyword() {
      let result = '';
      while (this.currentChar !== null && /[a-zA-Z]/.test(this.currentChar)) {
          result += this.currentChar;
          this.advance();
      }
      if (['function', 'if', 'else', 'then', 'while', 'break', 'continue', 'return'].includes(result)) {
          return { type: 'KEYWORD', value: result };
      }
      return { type: 'IDENTIFIER', value: result };
  }

  getOperator() {
    const operators = {
        '+': 'PLUS',
        '-': 'MINUS',
        '*': 'MULTIPLY',
        '/': 'DIVIDE',
        '^': 'POWER'
    };
    const operatorValue = this.currentChar;
    this.advance();
    return { type: operators[operatorValue], value: operatorValue };
  }

  getComparison() {
      let result = this.currentChar;
      if (this.peek() === '=' || (result === '!' && this.peek() === '=')) {
          this.advance();
          result += this.currentChar;
      }
      this.advance();
      return { type: 'COMPARISON', value: result };
  }

  getSubscript() {
      this.advance(); // Skip the underscore
      let result = '';
      while (this.currentChar !== null && /[a-zA-Z0-9]/.test(this.currentChar)) {
          result += this.currentChar;
          this.advance();
      }
      return { type: 'SUBSCRIPT', value: result };
  }

  getArrow() {
      let result = this.currentChar;
      if (this.peek() === '>' || (result === '-' && this.peek() === '>')) {
          this.advance();
          result += this.currentChar;
      }
      this.advance();
      if (result === '=>' || result === '->') {
          return { type: 'ARROW', value: result };
      }
      return null;
  }
}

// Test code example
let code = `
function example(a, b)
    if a <= b then 
        return 'Hello, world!'

a_i => a_1 + b_i
`;

const lexer = new Lexer(code);
const tokens = lexer.tokenize();

let output = `$$
\\begin{align}
`;

for (let i = 0; i < tokens.length; i += 1) {
  let t = tokens[i]
  switch (t.type) {
    case 'NEWLINE':
      output += "\\\\\n& "; break;
    case 'INDENT':
      output += "\\qquad".repeat(t.value); break;
    case 'IDENTIFIER': {
      if (tokens[i + 1].type === 'LPAREN') {
        output += `\\mathrm{${t.value}}`;
      } else {
        output += `\\mathit{${t.value}}`;
        if (tokens[i + 1].type != 'SUBSCRIPT') {
          output += '\\space';
        }
      }
      break;
    }
    case 'KEYWORD':
      output += `\\mathbf{${t.value}}\\space `; break;
    case 'LPAREN': case 'COMMA': case 'RPAREN':
      output += t.value + " "; break;
    case 'SUBSCRIPT':
      output += `_{${t.value}}`; break;
    case 'ARROW': {
      if (t.value === '=>') output += '\\Rightarrow ';
      else if (t.value === '->') output += '\\rightarrow ';
      break;
    }
    case 'PLUS': case 'MINUS':
      output += t.value; break;
    case 'MULTIPLY':
      output += '\\times '; break;
    case 'DIVIDE':
      output += '\\div'; break;
    case 'STRING':
      output += `\\text{\`\`}\\:\\negthinspace\\mathtt{${t.value}}\\:\\negthinspace\\text{''}`; break;
    case 'COMPARISON': {
      switch (t.value) {
        case '<=': output += '\\leq'; break;
        case '>=': output += '\\geq'; break;
        case '!=': output += '\\neq'; break;
        case '=': output += ' = '; break;
      }
      break;
    }
    case 'COMMENT':
      output += `\\color{grey}{${t.value}}`; break;
  }
}

output += "\n\\end{align}\n$$";

console.log(output)
