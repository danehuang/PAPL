
export type BinaryOperator = "+" | "-" | "*" | "/";

export type Symbol =  | "(" | ")" | "=>" | "?" | ":" | "λ" | "let" | "in" | "=";

export type Identifier = {
    tag: "IDENTIFIER";
    name: string;
};

export function mkIdentifier(name: string): Identifier {
    return {
        tag: "IDENTIFIER",
        name: name,
    };
}

export type NumericConstant = {
    tag: "NUMBER";
    value: number;
}

export function mkNumericConstant(value: number): NumericConstant {
    return {
        tag: "NUMBER",
        value: value,
    };
}


export type Error = {
    tag: "ERROR";
    ch: string;
}

export type Token = Identifier | BinaryOperator | Symbol | NumericConstant | Error;
