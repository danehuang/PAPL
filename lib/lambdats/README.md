
# LambdaTS

Mini language with just basic arithmetic and one-parameter functions.

# Installing

Run:

    % npm install

# Running

Run:

    % npm start

# Language

```
    binop ::= + | - | * | /
    e ::= x | e(e) | λx => e | n | e binop e | e ? e : e | (e) | let x = e in e
    
    Precedence, highest to lowest, and associativity:
            
            e(e)               left to right
            e * e | e / e      left to right
            e + e | e - e      left to right
            e ? e : e          right to left
            λx => e            right to left
            let x = e in e     right to left
```
