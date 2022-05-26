import * as T from "./token";
import * as E from "./expr";
import * as immutable from "immutable";


/* ************************************************************************** */
/* Values based on closures */
/* ************************************************************************** */

/* -------------------------------------------------------- */
/* Number values */
/* -------------------------------------------------------- */

export type NumericalValue = {
    tag: "NUMERICAL_VALUE",    // A number has no more computation left to be run
    val: number,
};

export function mkNumericalValue(n: number): NumericalValue {
    return {
        tag: "NUMERICAL_VALUE",
        val: n 
    };
}

/* -------------------------------------------------------- */
/* Function Values */
/* -------------------------------------------------------- */

export type Environment = immutable.Map<string, Value>;

export type FunctionValue = {
    tag: "FUNCTION_VALUE",     // A function has no more computation left to be run.
    func: E.FunctionExpr,      // Of course, this function can be called in the future.
    env: Environment,          // Ignore for now
};

export function mkFunctionValue(e: E.FunctionExpr, env: Environment): FunctionValue {
    return { tag: "FUNCTION_VALUE", func: e, env: env };
}


/* -------------------------------------------------------- */
/* Any Value */
/* -------------------------------------------------------- */

export type Value =
    NumericalValue
  | FunctionValue;

export function valueToString(val: Value) {
    switch (val.tag) {
        case "NUMERICAL_VALUE": {
            return `${val.val}`;
        }
        case "FUNCTION_VALUE": {
            return `${E.exprToString(val.func)}`;
        }
    }
}


/* ************************************************************************** */
/* Interpreter Based on Closures */
/* ************************************************************************** */

export function interpretBinop(leftVal: Value, op: T.BinaryOperator, rightVal: Value): Value {
    if (leftVal.tag === "NUMERICAL_VALUE" && rightVal.tag === "NUMERICAL_VALUE") {
        switch (op) {
            case "+": {
                return mkNumericalValue(leftVal.val + rightVal.val);
            }
            case "-": {
                return mkNumericalValue(leftVal.val - rightVal.val);
            }
            case "*": {
                return mkNumericalValue(leftVal.val * rightVal.val);
            }
            case "/": {
                return mkNumericalValue(leftVal.val / rightVal.val);
            }
        }
    } else {
        throw Error(`Attempting ${leftVal} ${op} ${rightVal}`);
    }
}

export function openInterpret(env: Environment, e: E.Expr): Value {
    switch (e.tag) {
        case "NUMBER": {
            return mkNumericalValue(e.value);
        }
        case "BINARY": {                
            return interpretBinop(openInterpret(env, e.left), e.operator, openInterpret(env, e.right));
        }
        case "CONDITIONAL": {
            const condVal = openInterpret(env, e.condExpr);
            if (condVal.tag === "NUMERICAL_VALUE" && condVal.val !== 0) {
                return openInterpret(env, e.thenExpr);
            } else {
                return openInterpret(env, e.elseExpr);
            }
        }
        case "FUNCTION": { // New case 1
            // A function is already a value.
            // Question: What is a function value? (hint: first-class functions + state)
            return mkFunctionValue(e, env);
        }
        case "IDENTIFIER": { // New case 2
            // Lookup the variable in the environment.
            // Lexical scope reduces to dictionary lookup
            const v = env.get(e.name);
            if (v !== undefined) {
                return v;
            } else {
                throw Error(`Cannot find name ${e.name} in scope}`);
            }
        }
        case "CALL": { // New case 3
            // ((x) => x)(1)
            //
            // 1. Evaluate the left-hand-side.
            const funcVal = openInterpret(env, e.func);  // Evaluate to the closure ((x) => x)
            if (funcVal.tag === "FUNCTION_VALUE") {  // 2. Check that we have a function
                const argVal = openInterpret(env, e.argument);  // 3. Evaluate the argument, 1
                // 4. Evaluate the function body under an extended environment
                // 5. Question: is interp pure?
                // 6. Note that we use funcVal.env as opposed to env!
                return openInterpret(funcVal.env.set(funcVal.func.parameter, argVal), funcVal.func.body);
            } else {
                throw Error(`Cannot apply ${funcVal}.`);
            }
        }
        default: {
            throw Error("Shouldn't happen");
        }
    }
}

export function interpret(e: E.Expr): Value {
    // Start with empty environment, i.e., no variables in scope
    return openInterpret(immutable.Map<string, Value>(), e);
}
