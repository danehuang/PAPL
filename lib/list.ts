import * as util from "util";


/* ************************************************************************** */
/* Data-Type */
/* ************************************************************************** */

export type List<T> =
    {
        tag: "NIL"
    } 
|   {
        tag: "CONS", 
        contents: T,
        rest: List<T>
    };

export function mkNil<T>(): List<T> {
    return {
        tag: "NIL"
    };
}

export function mkCons<T>(x: T, ls: List<T>): List<T> {
    return {
        tag: "CONS",
        contents: x,
        rest: ls
    };
}


/* ************************************************************************** */
/* Example lists */
/* ************************************************************************** */

export const ls0 = mkNil();
export const ls1 = mkCons(1, mkNil());
export const ls2 = mkCons(2, ls1);
export const ls3 = mkCons(3, ls2);
export const ls4 = mkCons(4, ls3);
export const ls5 = mkCons(5, ls4);



/* ************************************************************************** */
/* List Functions */
/* ************************************************************************** */

export function head<T>(ls: List<T>): T {
    switch (ls.tag) {
        case "NIL": {
            throw Error("Empty list ...");
        }
        case "CONS": {
            return ls.contents;
        }
    }
}

export function tail<T>(ls: List<T>): List<T> {
    switch (ls.tag) {
        case "NIL": {
            throw Error("Empty list ...");
        }
        case "CONS": {
            return ls.rest;
        }
    }
}

export function length<T>(ls: List<T>): number {
    switch (ls.tag) {
        case "NIL": {
            return 0;
        }
        case "CONS": {
            return 1 + length(ls.rest);
        }
    }
}

export function listToString<T>(ls: List<T>): string {
    switch (ls.tag) {
        case "NIL": {
            return "()";
        }
        case "CONS": {
            return "(" + ls.contents + " " + listToString(ls.rest) + ")";
        }
    }
}

export function emit<T>(ls: List<T>): string {
    switch (ls.tag) {
        case "NIL": {
            return "mkNil()";
        }
        case "CONS": {
            return `mkCons(${ls.contents}, ${emit(ls.rest)})`;
        }
    }
}

export function append<T>(ls1: List<T>, ls2: List<T>): List<T> {
    switch (ls1.tag) {
        case "NIL": {
            return ls2;
        }
        case "CONS": {
            return mkCons(ls1.contents, append(ls1.rest, ls2));
        }
    }
}

export function map<T, U>(f: (elem: T) => U, ls: List<T>): List<U> {
    switch(ls.tag) {
        case "NIL": {
            return mkNil();
        }
        case "CONS": {
            return mkCons(f(ls.contents), map(f, ls.rest));
        }
    }
}

export function filter<T>(f: (elem: T) => boolean, ls: List<T>): List<T> {
    switch(ls.tag) {
        case "NIL": {
            return mkNil();
        }
        case "CONS": {
            if (f(ls.contents)) {
                return mkCons(ls.contents, filter(f, ls.rest));
            } else {
                return filter(f, ls.rest);
            }   
        }
    }
}

export function reduce<T, U>(f: (elem: T, acc: U) => U, initial: U, ls: List<T>): U {
    switch (ls.tag) {
        case "NIL": {
            return initial;
        }
        case "CONS": {
            return f(ls.contents, reduce(f, initial, ls.rest));
        }
    }
}

export function reverse<T>(ls: List<T>): List<T> {
    function go<T>(orig: List<T>, acc: List<T>): List<T> {
        switch (orig.tag) {
            case "NIL": {
                return acc;
            }
            case "CONS": {
                return go(orig.rest, mkCons(orig.contents, acc));
            }
        }
    }

    return go(ls, mkNil());
}

export function foldl<T, U>(f: (elem: T, acc: U) => U, acc: U, ls: List<T>): U {
    switch (ls.tag) {
        case "NIL": {
            return acc;
        }
        case "CONS": {
            return f(ls.contents, reduce(f, acc, ls.rest));
        }
    }
}

export function foldr<T, U>(f: (elem: T, acc: U) => U, acc: U, ls: List<T>): U {
    switch (ls.tag) {
        case "NIL": {
            return acc;
        }
        case "CONS": {
            return f(ls.contents, foldr(f, acc, ls.rest));
        }
    }
}


/* ************************************************************************** */
/* Utility */
/* ************************************************************************** */

export function arrToList<T>(xs: T[]): List<T> {
    if (xs.length == 0) {
        return mkNil();
    } else {
        return mkCons(xs[0], arrToList(xs.slice(1)));
    }
}

export function cytoscapify<T>(ls: List<T>): string {
    let count = 0;
    function fresh(prefix: string): string {
        count += 1;
        return prefix + count;
    }

    function go<T>(ls: List<T>): any {
        switch (ls.tag) {
            case "NIL": {
                return [
                    {
                        "data": {
                            "id": fresh("nil")
                        }
                    }
                ];
            }
            case "CONS": {
                const rest = go(ls.rest);
                const nodeId = fresh("cons");
                const edgeId = fresh("edge");
                const edge = { 
                    "data": { 
                        "id": edgeId,
                        "source": nodeId,
                        "target": rest[0].data.id 
                    }
                };
                return [
                    {
                        "data": {
                            "id": nodeId,
                            "label": ls.contents
                        } 
                    },
                    edge
                ].concat(rest);
            }
        }
    };
    
    return util.inspect(go(ls));
};
