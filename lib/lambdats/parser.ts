
import {Expr} from "./expr";
import {getTokens} from "./lexer";
import {Token} from "./token";

/**
 * Converts a generated stream of tokens into one that can be peeked ahead.
 */
class TokenStream {
    public readonly stream: Generator<Token>;
    public token: Token | undefined;

    constructor(stream: Generator<Token>) {
        this.stream = stream;
        this.token = this.getNext();
    }

    /**
     * Fetch the next token. Does not update the "token" field.
     */
    private getNext(): Token | undefined {
        const next = this.stream.next();
        return next.done ? undefined : next.value;
    }

    /**
     * Peeks at the next token. Does not advance the stream.
     */
    public peek(): Token | undefined {
        return this.token;
    }

    /**
     * Gets the next token and advances the stream.
     */
    public next(): Token | undefined {
        const oldToken = this.token;
        this.token = this.getNext();
        return oldToken;
    }
}

/**
 * Parse the input string, returning the AST.
 */
export function parse(input: string): Expr {
    const lexer = new TokenStream(getTokens(input));
    return parseExpr(lexer);
}

/**
 * Parse a full expression from the stream.
 * @param lexer
 */
function parseExpr(lexer: TokenStream): Expr {
    return parseLet(lexer);
}

function parseLet(lexer: TokenStream): Expr {
    const token = lexer.peek();

    if (typeof token === "object" && token.tag === "IDENTIFIER" && token.name === "let") {
        lexer.next();
        const name = lexer.next();
        if (typeof name === "object" && name.tag === "IDENTIFIER") {
            const eq = lexer.peek();
            if (eq === "=") {
                lexer.next();
                const left = parseLet(lexer);

                const token2 = lexer.peek();
                if (typeof token2 === "object" && token2.tag === "IDENTIFIER" && token2.name === "in") {
                    lexer.next();
                    const right = parseLet(lexer);
                    return {
                        tag: "LET",
                        name: name.name,
                        left: left,
                        right: right
                    };
                } else {
                    throw Error(`Expected in but found ${token2}`);
                }
            } else {
                throw Error(`Expected = but found ${eq}`);
            }
        } else {
            throw Error(`Expected identifier but found ${name}`);
        }
    } else {
        return parseFunction(lexer);
    }
}

/**
 * Parse a function definition:
 *
 *     λx => e
 */
function parseFunction(lexer: TokenStream): Expr {
    const token = lexer.peek();

    if (token === "λ") {
        lexer.next();
        const parameter = lexer.next();
        if (typeof parameter === "object" && parameter.tag === "IDENTIFIER") {
            if (lexer.next() !== "=>") {
                throw new Error("Missing arrow");
            }

            const body = parseExpr(lexer);

            return {
                tag: "FUNCTION",
                parameter: parameter.name,
                body: body,
            };
        } else {
            throw new Error("Parameter must be an identifier: " + parameter);
        }
    } else {
        return parseConditional(lexer);
    }
}

/**
 * Parse a ternary conditional expression:
 *
 *     e ? e : e
 *
 * The "then" clause is used if the "conditional" clause is non-zero. Otherwise the "else" clause is used.
 */
function parseConditional(lexer: TokenStream): Expr {
    const condExpr = parseSum(lexer);

    if (lexer.peek() === "?") {
        lexer.next();

        const thenExpr = parseExpr(lexer);

        if (lexer.next() !== ":") {
            throw new Error("Colon not found in conditional");
        }

        const elseExpr = parseExpr(lexer);

        return {
            tag: "CONDITIONAL",
            condExpr: condExpr,
            thenExpr: thenExpr,
            elseExpr: elseExpr,
        };
    }

    return condExpr;
}

/**
 * Parse a sum expression:
 *
 *     e + e
 *     e - e
 */
function parseSum(lexer: TokenStream): Expr {
    let left = parseProduct(lexer);

    // Sums are left-associative, we can't recurse on the right. Just keep getting more
    // sum expressions and grouping them on the left.
    while (true) {
        const token = lexer.peek();
        if (token === "+" || token === "-") {
            lexer.next();
            const right = parseProduct(lexer);
            left = {
                tag: "BINARY",
                operator: token,
                left: left,
                right: right,
            };
        } else {
            break;
        }
    }

    return left;
}

/**
 * Parse a product expression:
 *
 *     e * e
 *     e / e
 *
 * The division is truncated toward zero.
 */
function parseProduct(lexer: TokenStream): Expr {
    let left = parseCall(lexer);

    // Products are left-associative, we can't recurse on the right. Just keep getting more
    // product expressions and grouping them on the left.
    while (true) {
        const token = lexer.peek();
        if (token === "*" || token === "/") {
            lexer.next();
            const right = parseCall(lexer);
            left = {
                tag: "BINARY",
                operator: token,
                left: left,
                right: right,
            };
        } else {
            break;
        }
    }

    return left;
}

/**
 * Parse a function call:
 *
 *     e(e)
 */
function parseCall(lexer: TokenStream): Expr {
    let func = parseAtom(lexer);

    // Calls are left-associative, we can't recurse on the right. Just keep getting more
    // call expressions and grouping them on the left.
    while (true) {
        if (lexer.peek() === "(") {
            lexer.next();
            const argument = parseExpr(lexer);
            if (lexer.next() !== ")") {
                throw new Error("Missing close parenthesis");
            }

            func = {
                tag: "CALL",
                func: func,
                argument: argument,
            };
        } else {
            break;
        }
    }

    return func;
}

/**
 * Parse an atom:
 *
 *     n
 *     x
 *     (e)
 */
function parseAtom(lexer: TokenStream): Expr {
    const token = lexer.peek();
    if (typeof token === "object") {
        if (token.tag === "NUMBER") {
            lexer.next();
            return token;
        }
        if (token.tag === "IDENTIFIER") {
            lexer.next();
            return token;
        }
    }

    if (token === "(") {
        lexer.next();
        const expr = parseExpr(lexer);
        if (lexer.next() !== ")") {
            throw new Error("Missing close parenthesis");
        }

        return expr;
    }

    throw new Error("Can't parse token: " + JSON.stringify(token));
}
