class Lexer {
  constructor(input) {
      this.input = input;
      this.position = 0;
      this.currentChar = this.input[this.position];
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
          if (this.currentChar.trim() === '') {
              this.advance();
          } else if (this.currentChar === '/' && this.peek() === '/') {
              this.skipSingleLineComment();
          } else if (this.currentChar === '/' && this.peek() === '*') {
              this.skipMultiLineComment();
          } else if (this.currentChar === '"' || this.currentChar === "'") {
              tokens.push(this.getString());
          } else if (/\d/.test(this.currentChar)) {
              tokens.push(this.getInteger());
          } else if (/[a-zA-Z]/.test(this.currentChar)) {
              tokens.push(this.getIdentifierOrKeyword());
          } else {
              this.advance();
          }
      }
      return tokens;
  }

  skipSingleLineComment() {
      while (this.currentChar !== '\n' && this.currentChar !== null) {
          this.advance();
      }
      this.advance(); // Skip the newline character
  }

  skipMultiLineComment() {
      this.advance(); // Skip the initial '*'
      this.advance();
      while (this.currentChar !== null && !(this.currentChar === '*' && this.peek() === '/')) {
          this.advance();
      }
      if (this.currentChar === '*' && this.peek() === '/') {
          this.advance(); // Skip the '*'
          this.advance(); // Skip the '/'
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
      if (['function', 'while', 'break', 'continue'].includes(result)) {
          return { type: 'KEYWORD', value: result };
      }
      return { type: 'IDENTIFIER', value: result };
  }
}



// Test code example
let code = `
function test(a_1, B_n, add_2)
  return a_1 + B_n + add_2

add_1 = 1
B_n = 2
result -> test(add_1, B_n, 3)
result => add_1a a^2

while a != b then
  a = a + 1
  if a >= 10 then break
  if a % 2 != 0 then continue
`;

const lexer = new Lexer(code);
const tokens = lexer.tokenize();
console.log(tokens);
