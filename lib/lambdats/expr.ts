import {BinaryOperator, Identifier, NumericConstant} from "./token";
import * as util from "util";


/* ************************************************************************** */
/* AST */
/* ************************************************************************** */

/* -------------------------------------------------------- */
/* Any binary (two-argument) expression. */
/* -------------------------------------------------------- */

export type BinaryExpr = {
    tag: "BINARY";
    operator: BinaryOperator;
    left: Expr;
    right: Expr;
};

export function mkBinaryExpr(left: Expr, operator: BinaryOperator, right: Expr): BinaryExpr {
    return {
        tag: "BINARY",
        operator: operator,
        left: left,
        right: right,
    };
}


/* -------------------------------------------------------- */
/* Ternary conditional expression. */
/* -------------------------------------------------------- */

export type ConditionalExpr = {
    tag: "CONDITIONAL";
    condExpr: Expr;
    thenExpr: Expr;
    elseExpr: Expr;
};

export function mkConditionalExpr(condExpr: Expr, thenExpr: Expr, elseExpr: Expr): ConditionalExpr {
    return {
        tag: "CONDITIONAL",
        condExpr: condExpr,
        thenExpr: thenExpr,
        elseExpr: elseExpr,
    };
}


/* -------------------------------------------------------- */
/* A function expression. (Not a call, just the function.) */
/* -------------------------------------------------------- */

export type FunctionExpr = {
    tag: "FUNCTION";
    parameter: string;
    body: Expr;
};

export function mkFunctionExpr(parameter: string, body: Expr): FunctionExpr {
    return {
        tag: "FUNCTION",
        parameter: parameter,
        body: body,
    };
}


/* -------------------------------------------------------- */
/* A function call expression. */
/* -------------------------------------------------------- */

export type CallExpr = {
    tag: "CALL";
    func: Expr;
    argument: Expr;
};

export function mkCallExpr(func: Expr, argument: Expr): CallExpr {
    return {
        tag: "CALL",
        func: func,
        argument: argument,
    };
}


/* -------------------------------------------------------- */
/* Local binding */
/* -------------------------------------------------------- */

export type LetExpr = {
    tag: "LET";  // let x = left in right
    name: string;
    left: Expr;
    right: Expr;
};

export function mkLetExpr(name: string, left: Expr, right: Expr): LetExpr {
    return {
        tag: "LET",
        name: name,
        left: left,
        right: right
    };
}


/* -------------------------------------------------------- */
/* Any expression. */
/* -------------------------------------------------------- */

export type Expr = 
    BinaryExpr
  | ConditionalExpr
  | FunctionExpr
  | CallExpr
  | Identifier
  | NumericConstant
  | LetExpr;


/* ************************************************************************** */
/* Utility */
/* ************************************************************************** */

/**
 * Returns the string representation of the expression, for debugging.
 */
export function exprToString(expr: Expr): string {
    switch (expr.tag) {
        case "IDENTIFIER":
            return expr.name;
        case "BINARY":
            return "(" + exprToString(expr.left) + expr.operator + exprToString(expr.right) + ")";
        case "CONDITIONAL":
            return "(" + exprToString(expr.condExpr) + "?" + exprToString(expr.thenExpr) + ":" + exprToString(expr.elseExpr) + ")";
        case "FUNCTION":
            return "(λ" + expr.parameter + "=>" + exprToString(expr.body) + ")";
        case "CALL":
            return exprToString(expr.func) + "(" + exprToString(expr.argument) + ")";
        case "NUMBER":
            return expr.value.toString();
        case "LET":
            return `let ${expr.name} = ${exprToString(expr.left)} in ${exprToString(expr.right)}`;
    }
}

export function cytoscapify(e: Expr): string {
    let count = 0;
    function fresh(prefix: string): string {
        count += 1;
        return prefix + count;
    }

    function createChild(lvl: number, x: number, y: number, parentId: string, e: Expr) {
        const node = go(lvl, x, y, e);
        const edgeId = fresh("edge");
        const edge = {
            "data": {
                "id": edgeId,
                "source": parentId,
                "target": node[0].data.id
            }
        };
        return {
            "node": node,
            "edge": edge
        };
    }

    function go(lvl: number, x: number, y: number, e: Expr): any {
        switch (e.tag) {
            case "IDENTIFIER": {
                return [{
                    "data": {
                        "id": fresh("identifier"),
                        "label": e.name
                    },
                    "position": {
                        "x": x,
                        "y": y
                    }
                }];
            }
            case "NUMBER": {
                return [{
                    "data": {
                        "id": fresh("number"),
                        "label": e.value
                    },
                    "position": {
                        "x": x,
                        "y": y
                    }
                }];
            }
            case "BINARY": {
                const nodeId = fresh("binary");
                const left = createChild(lvl + 1, x - 100 / lvl, y + 50, nodeId, e.left);
                const right = createChild(lvl + 1, x + 100 / lvl, y + 50, nodeId, e.right);
                
                return [{
                    "data": {
                        "id": nodeId,
                        "label": e.operator
                    },
                    "position": {
                        "x": x,
                        "y": y
                    }
                }, left.edge, right.edge].concat(left.node).concat(right.node);
            }
            case "CONDITIONAL": {
                const nodeId = fresh("conditional");
                const condExpr = createChild(lvl + 1, x - 150 / lvl, y + 50, nodeId, e.condExpr);
                const thenExpr = createChild(lvl + 1, x, y + 50, nodeId, e.thenExpr);
                const elseExpr = createChild(lvl + 1, x + 150 / lvl, y + 50, nodeId, e.elseExpr);
                
                return [{
                    "data": {
                        "id": nodeId,
                        "label": "if"
                    },
                    "position": {
                        "x": x,
                        "y": y
                    }
                }, condExpr.edge, thenExpr.edge, elseExpr.edge].concat(condExpr.node).concat(thenExpr.node).concat(elseExpr.node);
            }
            case "FUNCTION": {
                const nodeId = fresh("function");
                const body = createChild(lvl + 1, x, y + 50, nodeId, e.body);
                return [{
                    "data": {
                        "id": nodeId,
                        "label": `λ(${e.parameter})`
                    },
                    "position": {
                        "x": x,
                        "y": y
                    }
                }, body.edge].concat(body.node);
            }
            case "CALL": {
                const nodeId = fresh("call");
                const func = createChild(lvl + 1, x - 100 / lvl, y + 50, nodeId, e.func);
                const arg = createChild(lvl + 1, x + 100 / lvl, y + 50, nodeId, e.argument);
                
                return [{
                    "data": {
                        "id": nodeId,
                        "label": "call"
                    },
                    "position": {
                        "x": x,
                        "y": y
                    }
                }, func.edge, arg.edge].concat(func.node).concat(arg.node);
            }
            case "LET": {
                const nodeId = fresh("let");
                const left = createChild(lvl + 1, x - 100 / lvl, y + 50, nodeId, e.left);
                const right = createChild(lvl + 1, x + 100 / lvl, y + 50, nodeId, e.right);
                
                return [{
                    "data": {
                        "id": nodeId,
                        "label": `let(${e.name})`
                    },
                    "position": {
                        "x": x,
                        "y": y
                    }
                }, left.edge, right.edge].concat(left.node).concat(right.node);
            }
        }
    };
    
    return util.inspect(go(1, 0, 0, e));
};
