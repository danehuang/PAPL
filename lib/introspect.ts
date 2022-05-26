import ts, { idText, isExpressionStatement, SyntaxKind } from "typescript";
import * as util from "util";
import { Map } from 'immutable'; 


/* ************************************************************************** */
/* Call-Stack Tracing 2 */
/* ************************************************************************** */

export interface CallStackTrace {
    func: Function,
    stack: [string, number, any][]
};

const _traceFunction3 = (f: Function,
                         transformer: <T extends ts.Node>(context: ts.TransformationContext) => (rootNode: T) => T,
                         exports? /* for Jupyter */, 
                         verbose=false) => {
    // Function --> string --> ts.SourceFile --> string (instrumented)
    const source = f.toString();
    const sourceFile: ts.SourceFile = ts.createSourceFile('foobar.ts', source, ts.ScriptTarget.ES2015, true, ts.ScriptKind.TS);
    const result: ts.TransformationResult<ts.SourceFile> = ts.transform<ts.SourceFile>(sourceFile, [transformer]);
    const transformedSourceFile: ts.SourceFile = result.transformed[0];
    const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed });
    const transformedString = printer.printFile(transformedSourceFile);
    if (verbose) {
        console.log(transformedString);
    }

    const instrumentTemplate = `
    return (exports) => {
        let stack = [];
        let count = 0;
        let lvl = 0

        const csc600_RecordEnter = (params: [string, any][]): void => {
            stack.push(["CALL", lvl, params]);
            //for (let param of params) {
            //    const [name, val] = param;
            //    stack.push(["CALL", lvl, param]);
            //}
            lvl += 2;
        };

        const csc600_RecordExit = (x) => {
            lvl -= 2;
            stack.push(["RET", lvl, x]);
            return x;
        };
    
        return {func: ${transformedString}), stack: stack};
    }
    `
    return Function(`${ts.transpile(instrumentTemplate)}`)()(exports);
};


export function traceCallStack(f: Function, exports? /* for Jupyter */, verbose=false): CallStackTrace {
    function traceParam(param: ts.ParameterDeclaration): ts.ArrayLiteralExpression {
        const paramStr = ts.factory.createStringLiteral(param.name.getText());
        const paramName = ts.factory.createIdentifier(param.name.getText());
        return ts.factory.createArrayLiteralExpression([paramStr, paramName]);
    }

    // The transformation
    const transformer = <T extends ts.Node>(context: ts.TransformationContext) => (rootNode: T) => {
        function visit(node: ts.Node): ts.Node {
            switch (node.kind) {
                case ts.SyntaxKind.ArrowFunction: {
                    const arr = node as ts.ArrowFunction;
                    const body2 = ts.visitEachChild(arr.body, visit, context);
                    const params = ts.factory.createArrayLiteralExpression(arr.parameters.map(traceParam));
                    const functionName = ts.factory.createIdentifier("csc600_RecordEnter");
                    const instrumented = ts.factory.createCallExpression(functionName, undefined, [params])
                    const tuple = ts.factory.createArrayLiteralExpression([body2 as ts.Expression].concat(params).concat(instrumented));
                    const body3 = ts.factory.createElementAccessExpression(tuple, 0);
                    return ts.factory.createArrowFunction(arr.modifiers, arr.typeParameters, arr.parameters, arr.type, arr.equalsGreaterThanToken, body3);
                }
                case ts.SyntaxKind.FunctionDeclaration: {
                    const func = node as ts.FunctionDeclaration;
                    const body2 = ts.visitEachChild(func.body, visit, context);
                    const params = ts.factory.createArrayLiteralExpression(func.parameters.map(traceParam));
                    const functionName = ts.factory.createIdentifier("csc600_RecordEnter");
                    const prelude: ts.Statement[] = [ts.factory.createExpressionStatement(ts.factory.createCallExpression(functionName, undefined, [params]))];
                    const body3 = ts.factory.createBlock(prelude.concat(body2.statements), true);
                    // const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed });
                    return ts.factory.createFunctionDeclaration(func.decorators, func.modifiers, func.asteriskToken, func.name, func.typeParameters, func.parameters, func.type, body3);
                }
                case ts.SyntaxKind.ReturnStatement: {
                    const ret = node as ts.ReturnStatement;
                    if (ret.expression) {
                        const functionName = ts.factory.createIdentifier("csc600_RecordExit");
                        const instrumented = ts.factory.createCallExpression(functionName, undefined, [ts.visitEachChild(ret.expression, visit, context)]);
                        return ts.factory.createReturnStatement(instrumented);
                    } else {
                        return ts.visitEachChild(node, visit, context);
                    }
                }
                default: {
                    return ts.visitEachChild(node, visit, context);
                }
            }
        };
        return ts.visitNode(rootNode, visit);
    };
    
    return _traceFunction3(f, transformer, exports, verbose);
}

export function cytoscapifyCallStack(stk: [string, number, any][]) {
    let count = 0;
    function fresh(prefix: string): string {
        count += 1;
        return prefix + count;
    }
    
    let acc = [];
    for (let i = 0; i < stk.length; i++) {
        const x = stk[i];
        acc.push({ data: {id: i, label: `${x[0]}[${i}](${JSON.stringify(x[2])})`}});
        const lvl = x[1];
        if (x[0] == "CALL") {
            for (let j = i - 1; j >= 0; j--) {
                if (stk[j][1] == lvl - 2) {
                    acc.push({ data: {id: fresh("edge"), source: j, target: i}});
                    break;
                }
            }
        } else if (x[0] == "RET") {
            if (stk[i-1][0] == "CALL" && stk[i-1][1] == lvl) {
                acc.push({ data: {id: fresh("edge"), source: i-1, target: i}});
            } else {
                for (let j = i - 1; j >= 0; j--) {
                    if (stk[j][0] == "CALL" && stk[j][1] == lvl) {
                        break;
                    } else if (stk[j][0] == "RET" && stk[j][1] - 2 == lvl) {
                        acc.push({ data: {id: fresh("edge"), source: j, target: i}});
                    }
                }
            }
        }
    }
    
    return util.inspect(acc);
}


/* ************************************************************************** */
/* Call-Stack Tracing */
/* ************************************************************************** */

export interface CallStackTrace {
    func: Function,
    trace: { [id: string]: any },
    refId: WeakMap<object, number>
};

const _traceFunction = (f: Function,
                        transformer: <T extends ts.Node>(context: ts.TransformationContext) => (rootNode: T) => T,
                        exports? /* for Jupyter */, 
                        verbose=false) => {
    // Function --> string --> ts.SourceFile --> string (instrumented)
    const source = f.toString();
    const sourceFile: ts.SourceFile = ts.createSourceFile('foobar.ts', source, ts.ScriptTarget.ES2015, true, ts.ScriptKind.TS);
    const result: ts.TransformationResult<ts.SourceFile> = ts.transform<ts.SourceFile>(sourceFile, [transformer]);
    const transformedSourceFile: ts.SourceFile = result.transformed[0];
    const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed });
    const transformedString = printer.printFile(transformedSourceFile);
    if (verbose) {
        console.log(transformedString);
    }

    const instrumentTemplate = `
    return (exports) => {
        let trace: { [id: string]: any } = {};
        let count = 0;
        let lvl = 0

        const csc600_RecordEnter = (x) => {
            lvl += 2;
        };

        const csc600_RecordParam = (name, x) => {
            const id = "t" + count;
            console.log(" ".repeat(lvl) + "Argument[" + id + "]: " + name + " ->", x);
            trace[id] = [lvl, x];
            count += 1;
            return x;
        };

        const csc600_RecordExit = (x) => {
            lvl -= 2;
            const id = "t" + count;
            console.log(" ".repeat(lvl) + "Return[" + id + "]: ", x);
            trace[id] = [lvl, x];
            count += 1;
            return x;
        };

        const csc600_RecordValue = (x) => {
            const id = "t" + count;
            console.log("Creating: ", id, x);
            trace[id] = ["value", x];
            count += 1;
            return x;
        };

        
        let refId = new WeakMap;
        let objectCount: number = 0;
        const objectId = (object) => {
          if (!refId.has(object)) {
            refId.set(object,++objectCount);
          }
          return refId.get(object);
        };

        const csc600_RecordReference = (x) => {
            const id = "t" + count;
            const id2 = objectId(x);
            console.log("Creating: ", id, id2, x);
            trace[id] = ["reference", id2, x];
            count += 1;
            return x;
        };

        const csc600_Record = (x) => {
            const id = "t" + count;
            console.log("Encountering: ", id, x);
            trace[id] = x;
            count += 1;
            return x;
        };
    
        return {func: ${transformedString}), trace: trace, refId: refId};
    }
    `
    return Function(`${ts.transpile(instrumentTemplate)}`)()(exports);
};

export function traceCall(f: Function, exports? /* for Jupyter */, verbose=false): CallStackTrace {
    function traceEnter() {
        const functionName = ts.factory.createIdentifier("csc600_RecordEnter");
        const instrumented = ts.factory.createCallExpression(functionName, undefined, []);
        return instrumented;
    }

    function traceArrParam(param: ts.ParameterDeclaration) {
        const functionName = ts.factory.createIdentifier("csc600_RecordParam");
        const paramStr = ts.factory.createStringLiteral(param.name.getText());
        const paramName = ts.factory.createIdentifier(param.name.getText());
        const instrumented = ts.factory.createCallExpression(functionName, undefined, [paramStr, paramName]);
        return instrumented;
    }

    function traceFunParam(param: ts.ParameterDeclaration) {
        const functionName = ts.factory.createIdentifier("csc600_RecordParam");
        const paramStr = ts.factory.createStringLiteral(param.name.getText());
        const paramName = ts.factory.createIdentifier(param.name.getText());
        const instrumented = ts.factory.createCallExpression(functionName, undefined, [paramStr, paramName]);
        return ts.factory.createExpressionStatement(instrumented);
    }

    // The transformation
    const transformer = <T extends ts.Node>(context: ts.TransformationContext) => (rootNode: T) => {
        function visit(node: ts.Node): ts.Node {
            switch (node.kind) {
                case ts.SyntaxKind.ArrowFunction: {
                    const arr = node as ts.ArrowFunction;
                    const body2 = ts.visitEachChild(arr.body, visit, context);
                    const params: ts.Expression[] = arr.parameters.map(traceArrParam);
                    const tuple = ts.factory.createArrayLiteralExpression([body2 as ts.Expression].concat(params).concat(traceEnter()));
                    const body3 = ts.factory.createElementAccessExpression(tuple, 0);
                    return ts.factory.createArrowFunction(arr.modifiers, arr.typeParameters, arr.parameters, arr.type, arr.equalsGreaterThanToken, body3);
                }
                case ts.SyntaxKind.FunctionDeclaration: {
                    const func = node as ts.FunctionDeclaration;
                    const body2 = ts.visitEachChild(func.body, visit, context);
                    const prelude: ts.Statement[] = func.parameters.map(traceFunParam).concat([ts.factory.createExpressionStatement(traceEnter())]);
                    const body3 = ts.factory.createBlock(prelude.concat(body2.statements), true);
                    const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed });
                    return ts.factory.createFunctionDeclaration(func.decorators, func.modifiers, func.asteriskToken, func.name, func.typeParameters, func.parameters, func.type, body3);
                }
                case ts.SyntaxKind.ReturnStatement: {
                    const ret = node as ts.ReturnStatement;
                    if (ret.expression) {
                        const functionName = ts.factory.createIdentifier("csc600_RecordExit");
                        const instrumented = ts.factory.createCallExpression(functionName, undefined, [ts.visitEachChild(ret.expression, visit, context)]);
                        return ts.factory.createReturnStatement(instrumented);
                    } else {
                        return ts.visitEachChild(node, visit, context);
                    }
                }
                default: {
                    return ts.visitEachChild(node, visit, context);
                }
            }
        };
        return ts.visitNode(rootNode, visit);
    };
    
    return _traceFunction(f, transformer, exports, verbose);
}


/* ************************************************************************** */
/* Memory Tracing */
/* ************************************************************************** */

export interface MemoryTrace {
    func: Function,                    // Instrumented function
    memory: Map<string, any>[],        // Keeps timeline of memory
    refId: WeakMap<object, number>     // Maps objects to integers
};

const _traceMemory = (f: Function,
                      transformer: <T extends ts.Node>(context: ts.TransformationContext) => (rootNode: T) => T,
                      exports? /* for Jupyter */, 
                      verbose=false) => {
    // Function --> string --> ts.SourceFile --> string (instrumented)
    const source = f.toString();
    const sourceFile: ts.SourceFile = ts.createSourceFile('foobar.ts', source, ts.ScriptTarget.ES2015, true, ts.ScriptKind.TS);
    const result: ts.TransformationResult<ts.SourceFile> = ts.transform<ts.SourceFile>(sourceFile, [transformer]);
    const transformedSourceFile: ts.SourceFile = result.transformed[0];
    const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed });
    const transformedString = printer.printFile(transformedSourceFile);
    if (verbose) {
        console.log(transformedString);
    }

    const instrumentTemplate = `
    return (exports, Map) => {
        let trace: Map<string, any>[] = [];
        
        let refId = new WeakMap;
        let objectCount: number = 0;
        const objectId = (object) => {
          if (object === null) {
            return "null";
          } else {
            if (!refId.has(object)) {
              refId.set(object,++objectCount);
            }
            return refId.get(object);
            }
        };
        
        const csc600_RecordValue = (x, v) => {
            if (trace.length > 0) {
                trace.push(trace[trace.length - 1].set(x, ["val", v]));
            } else {
                trace.push(Map().set(x, ["val", v]));
            }
            return v;
        }
        
        const csc600_RecordReference = (x, v) => {
            if (trace.length > 0) {
                trace.push(trace[trace.length - 1].set(x, ["ref", objectId(v), v]));
            } else {
                trace.push(Map().set(x, ["ref", objectId(v), v]));
            }
            return v;
        }
    
        return {func: ${transformedString}), memory: trace, refId: refId};
    }
    `
    return Function(`${ts.transpile(instrumentTemplate)}`)()(exports, Map);
};

export function traceMemory(f: Function, exports? /* for Jupyter */, verbose=false): MemoryTrace {
    function traceValRef(visit: (node: ts.Node) => ts.Node, context: ts.TransformationContext, x: ts.StringLiteral, node: ts.Expression) {
        switch (node.kind) {
            case ts.SyntaxKind.NullKeyword: {
                const functionName = ts.factory.createIdentifier("csc600_RecordReference");
                return ts.factory.createCallExpression(functionName, /*typeArgs*/ undefined, [x, node]);
            }
            case ts.SyntaxKind.Identifier: {
                const ident = node as ts.Identifier;
                const functionName = ts.factory.createIdentifier("csc600_RecordValue");
                return ts.factory.createCallExpression(functionName, /*typeArgs*/ undefined, [x, ident]);
            }
            case ts.SyntaxKind.NumericLiteral: {
                const num = node as ts.NumericLiteral;
                const functionName = ts.factory.createIdentifier("csc600_RecordValue");
                return ts.factory.createCallExpression(functionName, /*typeArgs*/ undefined, [x, num]);
            }
            case ts.SyntaxKind.StringLiteral: {
                const str = node as ts.StringLiteral;
                const functionName = ts.factory.createIdentifier("csc600_RecordValue");
                return ts.factory.createCallExpression(functionName, /*typeArgs*/ undefined, [x, str]);
            }
            case ts.SyntaxKind.ArrayLiteralExpression: {
                const arrLit = node as ts.ArrayLiteralExpression;
                const functionName = ts.factory.createIdentifier("csc600_RecordReference");
                const instArrLit = ts.factory.createArrayLiteralExpression(arrLit.elements.map((elem) => ts.visitEachChild(elem, visit, context)), false);
                return ts.factory.createCallExpression(functionName, /*typeArgs*/ undefined, [x, instArrLit]);
            }
            case ts.SyntaxKind.ObjectLiteralExpression: {
                const objLit = node as ts.ObjectLiteralExpression;
                const f = (objLitElem: ts.ObjectLiteralElementLike) => {
                    const propAssign = objLitElem as ts.PropertyAssignment;
                    return ts.factory.createPropertyAssignment(propAssign.name, ts.visitEachChild(propAssign.initializer, visit, context));
                };
                const functionName = ts.factory.createIdentifier("csc600_RecordReference");
                const instObjLit = ts.factory.createObjectLiteralExpression(objLit.properties.map(f), false);
                return ts.factory.createCallExpression(functionName, /*typeArgs*/ undefined, [x, instObjLit]); 
            }
            case ts.SyntaxKind.BinaryExpression: {
                // TODO(deh): Should only do this really for a subset of binary expressions.
                const binExp = node as ts.BinaryExpression;
                const functionName = ts.factory.createIdentifier("csc600_RecordValue");
                return ts.factory.createCallExpression(functionName, /*typeArgs*/ undefined, [x, binExp]);
            }
            default: {
                return ts.visitEachChild(node, visit, context);
            }
        }
    }

    // The transformation
    const transformer = <T extends ts.Node>(context: ts.TransformationContext) => (rootNode: T) => {
        const visit = (node: ts.Node): ts.Node => {
            switch (node.kind) {
                case ts.SyntaxKind.ExpressionStatement: {
                    const expStmt = node as ts.ExpressionStatement;
                    switch (expStmt.expression.kind) {
                        case ts.SyntaxKind.BinaryExpression: {
                            const binExp = expStmt.expression as ts.BinaryExpression;
                            const tok = binExp.operatorToken as ts.Token<ts.BinaryOperator>;
                            switch (tok.kind) {
                                case ts.SyntaxKind.EqualsToken: {
                                    switch (binExp.left.kind) {
                                        case ts.SyntaxKind.Identifier: {
                                            const x = binExp.left as ts.Identifier;
                                            const id = ts.factory.createStringLiteral(x.getText());
                                            return ts.factory.createBinaryExpression(ts.visitEachChild(binExp.left, visit, context),
                                                                                     binExp.operatorToken,
                                                                                     traceValRef(visit, context, id, binExp.right));
                                        }
                                        default: {
                                            return ts.factory.createBinaryExpression(ts.visitEachChild(binExp.left, visit, context),
                                                                                     binExp.operatorToken,
                                                                                     ts.visitEachChild(binExp.right, visit, context));
                                        }
                                    }
                                }
                                default: {
                                    return ts.visitEachChild(expStmt, visit, context);
                                }
                            }
                        }
                        default: {
                            return ts.visitEachChild(expStmt, visit, context);
                        }
                    }
                }
                case ts.SyntaxKind.VariableStatement: {
                    const varStmt = node as ts.VariableStatement;
                    const varDecls = varStmt.declarationList as ts.VariableDeclarationList;
                    const f = (varDecl: ts.VariableDeclaration) => {
                        const id = ts.factory.createStringLiteral(varDecl.name.getText());
                        return ts.factory.createVariableDeclaration(varDecl.name, varDecl.exclamationToken, varDecl.type, traceValRef(visit, context, id, varDecl.initializer));
                    };
                    // TODO(deh): why are the modifiers messed up?
                    return ts.factory.createVariableStatement(varStmt.modifiers, ts.factory.createVariableDeclarationList(varDecls.declarations.map(f)));
                }
                default: {
                    return ts.visitEachChild(node, visit, context);
                }
            }
        };
        return ts.visitNode(rootNode, visit);
    };
    
    return _traceMemory(f, transformer, exports, verbose);
};

export function cytoscapifyMemTrace(valRefTrace: Map<string, any>, refToLoc: WeakMap<object, number>): string {
    let count = 0;
    function fresh(prefix: string): string {
        count += 1;
        return prefix + count;
    }

    function reifyArr(arr: any[]) {
        if (arr === null) {
            return "null";
        } else {
            return `[${arr.map((x) => {
                if (x === null) {
                    return "location(null)";
                } else if (refToLoc.has(x)) {
                    return "location(" + refToLoc.get(x) + ")";
                } else {
                    return util.inspect(x);
                }
            }).join(", ")}]`;
        }
    }

    const nullId = fresh("null");
    const undefinedId = fresh("undefined");

    let acc = [];
    acc.push({ data: {id: nullId, label: "location(null)"}});
    acc.push({ data: {id: undefinedId, label: "undefined"}});
    for (let [key, value] of valRefTrace) {
        const kind = value[0]
          if (kind == "val") {
              const varId = fresh("var");
              acc.push({ data: {id: varId, label: "variable(" + key + ")"}});
              if (value[1] === undefined) {
                  const varToVal = fresh("edge");
                  acc.push({ data: {id: varToVal, source: varId, target: undefinedId}});
              } else {
                  const valId = fresh("val");
                  acc.push({ data: {id: valId, label: util.inspect(value[1])}});
                  const varToVal = fresh("edge");
                  acc.push({ data: {id: varToVal, source: varId, target: valId}});
              }
          } else if (kind == "ref") {
              const varId = fresh("var");
              acc.push({ data: {id: varId, label: "variable(" + key + ")"}});
              if (value[2] === null) {
                  const varToVal = fresh("edge");
                  acc.push({ data: {id: varToVal, source: varId, target: nullId}});
              } else {
                  const refId = fresh("ref");
                  acc.push({ data: {id: refId, label: "location(" + value[1] + ")"}});
                  const objId = fresh("obj");
                  acc.push({ data: {id: objId, label: reifyArr(value[2])}});
                  const edgeId = fresh("edge");
                  acc.push({ data: {id: edgeId, source: refId, target: objId}});
                  const varToVal = fresh("edge");
                  acc.push({ data: {id: varToVal, source: varId, target: refId}});
              }
          }
    }    

    return util.inspect(acc);
}
