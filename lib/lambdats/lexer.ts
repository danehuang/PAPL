import {Token} from "./token";

const CODE_POINT_ZERO = "0".codePointAt(0) as number;
const CODE_POINT_NINE = "9".codePointAt(0) as number;

/**
 * If "ch" is a digit, return its value. Otherwise return undefined.
 */
function getDigit(ch: string): number | undefined {
    const code = ch.codePointAt(0);
    if (code === undefined || code < CODE_POINT_ZERO || code > CODE_POINT_NINE) {
        return undefined;
    } else {
        return code - CODE_POINT_ZERO;
    }
}

/**
 * Return whether "ch" is a letter (A-Z in either case).
 */
function isLetter(ch: string): boolean {
    return ch.match(/^[A-Za-z]/) !== null;
}

/**
 * Generate tokens from the input file.
 */
export function* getTokens(input: string): Generator<Token> {
    let i = 0;

    while (i < input.length) {
        const ch = input[i];
        if (ch === " ") {
            // Skip whitespace.
            i += 1;
        } else if (ch === "+" || ch === "-" || ch === "*" || ch === "/" ||
            ch === "(" || ch === ")" || ch === "?" || ch === ":" || ch === "λ") {

            yield ch;
            i += 1;
        } else if (ch === "=" && i + 1 < input.length && input[i + 1] === ">") {
            yield "=>";
            i += 2;
        } else if (ch === "=") {
            yield ch;
            i += 1;
        } else if (getDigit(ch) !== undefined) {
            let value = 0;
            while (i < input.length) {
                const digitValue = getDigit(input[i]);
                if (digitValue === undefined) {
                    break;
                } else {
                    value = value*10 + digitValue;
                    i += 1;
                }
            }

            yield {
                tag: "NUMBER",
                value: value,
            };
        } else if (isLetter(ch)) {
            let name = "";
            while (i < input.length && isLetter(input[i])) {
                name += input[i];
                i += 1;
            }
            yield {
                tag: "IDENTIFIER",
                name: name,
            };
        } else {
            yield {
                tag: "ERROR",
                ch: ch,
            }
            // End lexing.
            break;
        }
    }
}
