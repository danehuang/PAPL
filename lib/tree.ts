import * as util from "util";
import { List, mkNil, mkCons, append } from "./list";

/* ************************************************************************** */
/* Data-Type */
/* ************************************************************************** */

export type Tree<T> = 
    {
        tag: "LEAF"
    }
|   { 
        tag: "NODE", 
        contents: T,
        left: Tree<T>,
        right: Tree<T>
    };

export function mkLeaf<T>(): Tree<T> {
    return {
        tag: "LEAF"
    };
}

export function mkNode<T>(x: T, left: Tree<T>, right: Tree<T>): Tree<T> {
    return {
        tag: "NODE",
        contents: x,
        left: left,
        right: right
    };
}

export function mkLeafNode<T>(x: T): Tree<T> {
    return mkNode(x, mkLeaf(), mkLeaf());
}


/* ************************************************************************** */
/* Tree Examples */
/* ************************************************************************** */

export const t0 = mkLeaf();
export const t1 = mkLeafNode(1);
export const t2 = mkNode(2, t1, mkLeaf());
export const t3 = mkNode(3, t1, mkLeafNode(2));
export const t4 = mkNode(4, t3, t2);


/* ************************************************************************** */
/* Tree Functions */
/* ************************************************************************** */

export function height<T>(t: Tree<T>): number {
    switch (t.tag) {
        case "LEAF": {
            return 0;
        }
        case "NODE": {
            return 1 + Math.max(height(t.left), height(t.right));
        }
    }
}


export function treeToString<T>(t: Tree<T>): string {
    switch (t.tag) {
        case "LEAF": {
            return "()";
        }
        case "NODE": {
            return "(" + t.contents + " " + treeToString(t.left) + " " + treeToString(t.right) + ")";
        }
            
    }
}

export function emit<T>(t: Tree<T>): string {
    switch (t.tag) {
        case "LEAF": {
            return "mkLeaf()";
        }
        case "NODE": {
            return `mkNode(${t.contents}, ${emit(t.left)}, ${emit(t.right)})`
        }
    }
}

export function appendRightMost<T>(t1: Tree<T>, t2: Tree<T>): Tree<T> {
    /* NOTE: for comparison with list append. */
    switch (t1.tag) {
        case "LEAF": {
            return t2;
        }
        case "NODE": {
            return mkNode(t1.contents, t1.left, appendRightMost(t1.right, t2));
        }
    }
}

export function map<T, U>(f: (elem: T) => U, t: Tree<T>): Tree<U> {
    switch (t.tag) {
        case "LEAF": {
            return mkLeaf();
        }
        case "NODE": {
            return mkNode(f(t.contents), map(f, t.left), map(f, t.right));
        }
    }
}

export function strangeFilter<T>(predicate: (elem: T) => boolean, t: Tree<T>): Tree<T> {
    /* NOTE: for comparison with list filter. */
    switch (t.tag) {
        case "LEAF": {
            return mkLeaf();
        }
        case "NODE": {
            if (predicate(t.contents)) {
                return mkNode(t.contents, strangeFilter(predicate, t.left), strangeFilter(predicate, t.right));
            } else {
                /* Non-unique choices. */
                const left = strangeFilter(predicate, t.left);
                switch (left.tag) {
                    case "LEAF": {
                        return strangeFilter(predicate, t.right);
                    }
                    case "NODE": {
                        return appendRightMost(left, strangeFilter(predicate, t.right));
                    }
                }
            }
        }
    }
}

export function filter<T>(predicate: (elem: T) => boolean, t: Tree<T>): List<T> {
    switch (t.tag) {
        case "LEAF": {
            return mkNil();
        }
        case "NODE": {
            if (predicate(t.contents)) {
                return append(mkCons(t.contents, filter(predicate, t.left)), filter(predicate, t.right));
            } else {
                return append(filter(predicate, t.left), filter(predicate, t.right));
            }
        }
    }
}

export function reduce<T, U>(f: (elem: T, acc: U) => U, initial: U, t: Tree<T>): U {
    switch (t.tag) {
        case "LEAF": {
            return initial;
        }
        case "NODE": {
            // Question: Is this the only way to write this function?
            // Question: What is the effect of order-of-evaluation?
            return reduce(f, f(t.contents, reduce(f, initial, t.left)), t.right);
        }
    }
}

export function prefix<T>(t: Tree<T>): List<T> {
    switch (t.tag) {
        case "LEAF": {
            return mkNil();
        }
        case "NODE": {
            return mkCons(t.contents, append(prefix(t.left), prefix(t.right)));
        }
    }
}

export function infix<T>(t: Tree<T>): List<T> {
    switch (t.tag) {
        case "LEAF": {
            return mkNil();
        }
        case "NODE": {
            return append(infix(t.left), mkCons(t.contents, infix(t.right)));
        }
    }
}

export function postfix<T>(t: Tree<T>): List<T> {
    switch (t.tag) {
        case "LEAF": {
            return mkNil();
        }
        case "NODE": {
            // Question: What is the time-complexity?
            // Challenge: Can we write this function faster?
            return append(append(prefix(t.left), prefix(t.right)), mkCons(t.contents, mkNil()));
        }
    }
}


/* ************************************************************************** */
/* Utility */
/* ************************************************************************** */

export function cytoscapify<T>(t: Tree<T>): string {
    let count = 0;
    function fresh(prefix: string): string {
        count += 1;
        return prefix + count;
    }

    function go<T>(lvl: number, x: number, y: number, t: Tree<T>): any {
        switch (t.tag) {
            case "LEAF": {
                return [
                    {
                        "data": { 
                            "id": fresh("leaf") 
                        },
                        "position": {
                            "x": x,
                            "y": y 
                        } 
                    }
                ];
            }
            case "NODE": {
                const left = go(lvl + 1, x - 100 / lvl, y + 50, t.left);
                const right = go(lvl + 1, x + 100 / lvl, y + 50, t.right);
                const nodeId = fresh("node");
                const leftEdgeId = fresh("edge");
                const leftEdge = {
                    "data": {
                        "id": leftEdgeId,
                        "source": nodeId,
                        "target": left[0].data.id
                    }
                };
                const rightEdgeId = fresh("edge");
                const rightEdge = {
                    "data": {
                        "id": rightEdgeId,
                        "source": nodeId,
                        "target": right[0].data.id
                    }
                };
                
                return [
                    {
                        "data": {
                            "id": nodeId,
                            "label": t.contents
                        },
                        "position": {
                            "x": x,
                            "y": y
                        }
                    },
                    leftEdge,
                    rightEdge
                ].concat(left).concat(right);
            }
        }
    };
    
    return util.inspect(go(1, 0, 0, t));
};


/* ************************************************************************** */
/* Tree Class */
/* ************************************************************************** */

export class TreeCls<T> {
    public readonly contents: T | undefined;
    public readonly left: TreeCls<T> | undefined;
    public readonly right: TreeCls<T> | undefined;
    
    constructor(contents: T|undefined, left: TreeCls<T>|undefined, right: TreeCls<T>|undefined) {
        this.contents = contents;
        this.left = left;
        this.right = right;
    }

    height(): number {
        const l = this.left === undefined ? 0 : this.left.height();
        const r = this.right === undefined ? 0 : this.right.height();
        return 1 + Math.max(l, r);
    }

    toADT(): Tree<T> {
        if (this.contents === undefined && this.left === undefined && this.right === undefined) {
            return {
                tag: "LEAF"
            };
        } else {
            return {
                tag: "NODE",
                contents: this.contents,
                left: this.left !== undefined ? this.left.toADT() : { tag: "LEAF" } as Tree<T>,
                right: this.right !== undefined ? this.right.toADT() : { tag: "LEAF" } as Tree<T>
            };
        }
    }
}
