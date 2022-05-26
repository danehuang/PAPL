import * as T from "./token";
import * as E from "./expr";


/* ************************************************************************** */
/* Values */
/* ************************************************************************** */

export type Value =
    T.NumericConstant
  | E.FunctionExpr


/* ************************************************************************** */
/* Substitution */
/* ************************************************************************** */

export function substitute(orig: E.Expr, x: string, other: E.Expr): E.Expr {
    switch (orig.tag) {
        case "NUMBER": {
            return T.mkNumericConstant(orig.value);
        }
        case "BINARY": {                
            return E.mkBinaryExpr(substitute(orig.left, x, other),
                                  orig.operator,
                                  substitute(orig.right, x, other));
        }
        case "CONDITIONAL": {
            return E.mkConditionalExpr(substitute(orig.condExpr, x, other),
                                       substitute(orig.thenExpr, x, other),
                                       substitute(orig.elseExpr, x, other));
        }
        case "FUNCTION": { 
            return orig.parameter === x ? orig : E.mkFunctionExpr(orig.parameter, substitute(orig.body, x, other));
        }
        case "IDENTIFIER": {
            return orig.name === x ? other : orig;
        }
        case "CALL": {
            return E.mkCallExpr(substitute(orig.func, x, other),
                                substitute(orig.argument, x, other));
        }
        default: {
            throw Error("Shouldn't happen");
        }
    }
}


/* ************************************************************************** */
/* Interpreter */
/* ************************************************************************** */

export function interpretBinop(leftVal: Value, op: T.BinaryOperator, rightVal: Value): Value {
    if (leftVal.tag === "NUMBER" && rightVal.tag === "NUMBER") {
        switch (op) {
            case "+": {
                return T.mkNumericConstant(leftVal.value + rightVal.value);
            }
            case "-": {
                return T.mkNumericConstant(leftVal.value - rightVal.value);
            }
            case "*": {
                return T.mkNumericConstant(leftVal.value * rightVal.value);
            }
            case "/": {
                return T.mkNumericConstant(leftVal.value / rightVal.value);
            }
        }
    } else {
        throw Error(`Attempting ${leftVal} ${op} ${rightVal}`);
    }
}

export function interpret(e: E.Expr): Value {
    switch (e.tag) {
        case "NUMBER": {
            return T.mkNumericConstant(e.value);
        }
        case "BINARY": {                
            return interpretBinop(interpret(e.left), e.operator, interpret(e.right));
        }
        case "CONDITIONAL": {
            const condVal = interpret(e.condExpr);
            if (condVal.tag === "NUMBER" && condVal.value !== 0) {
                return interpret(e.thenExpr);
            } else {
                return interpret(e.elseExpr);
            }
        }
        case "FUNCTION": { // New case 1, a function is already a value.
            return E.mkFunctionExpr(e.parameter, e.body);
        }
        case "IDENTIFIER": { // New case 2, all variables should have already been substituted away
            throw Error(`Cannot find name ${e.name} in scope}`);
        }
        case "CALL": { // New case 3
            const func = interpret(e.func);
            if (func.tag === "FUNCTION") {
                const arg = interpret(e.argument);
                return interpret(substitute(func.body, func.parameter, arg));
            } else {
                throw Error(`Cannot apply ${func} to ${e.argument}`);
            }
        }

        default: {
            throw Error("Shouldn't happen");
        }
    }
}
