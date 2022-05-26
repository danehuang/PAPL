import * as T from "./token";
import * as E from "./expr";


export function transpile(e: E.Expr): E.Expr {
    switch (e.tag) {
        case "LET": {
            // We don't have "LET" in LambdaTS
            // We translate let x = left in right into
            //              (λx => right)(left)
            return E.mkCallExpr(E.mkFunctionExpr(e.name, transpile(e.right)), transpile(e.left));
        }
            
        // All of theses cases are not interesting
        case "NUMBER": {
            return T.mkNumericConstant(e.value);
        }
        case "BINARY": {                
            return E.mkBinaryExpr(transpile(e.left), e.operator, transpile(e.right));
        }
        case "CONDITIONAL": {
            return E.mkConditionalExpr(transpile(e.condExpr), transpile(e.thenExpr), transpile(e.elseExpr));
        }
        case "FUNCTION": { 
            return E.mkFunctionExpr(e.parameter, transpile(e.body));
        }
        case "IDENTIFIER": {
            return T.mkIdentifier(e.name);
        }
        case "CALL": {
            return E.mkCallExpr(transpile(e.func), transpile(e.argument));
        }
        default: {
            throw Error("Shouldn't happen");
        }
    }
}
