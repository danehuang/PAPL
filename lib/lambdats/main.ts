import {getTokens} from "./lexer";
import {parse} from "./parser";
import {interpret} from "./substInterp";
import {exprToString} from "./expr";

const yCombinator = "(λf => (λx => λy => f(x(x))(y)) (λa => λb => f(a(a))(b)))";
const addTwo = "(λa => λb => a + b)(5)(6)";
const factorial = "(λfact => λn => n ? n*fact(n - 1) : 1)";
const fullFactorial = yCombinator + factorial + "(5)"

function tokenTest() {
    for (const token of getTokens(addTwo)) {
        console.log(token);
    }
}

function parseTest() {
    try {
        const input = fullFactorial;
        console.log("Input: " + input);
        const expr = parse(input);
        console.log(JSON.stringify(expr, null, 4));
        console.log(exprToString(expr));
        console.log(exprToString(interpret(expr)));
    } catch (e: any) {
        console.log(e.message);
    }
}

parseTest();
