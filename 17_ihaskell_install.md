Install instructions
1. Only works with x86_64 architecture (used homebrew in x86_64 mode)
2. Works with ghc8.7.10
3. Change `stack.yaml` to comment out `cairo` dependencies
```
packages:
    - .
    - ./ipython-kernel
    - ./ghc-parser
    - ./ihaskell-display/ihaskell-aeson
    - ./ihaskell-display/ihaskell-blaze
    # - ./ihaskell-display/ihaskell-charts
    # - ./ihaskell-display/ihaskell-diagrams
    - ./ihaskell-display/ihaskell-gnuplot
    - ./ihaskell-display/ihaskell-graphviz
    - ./ihaskell-display/ihaskell-hatex
    - ./ihaskell-display/ihaskell-juicypixels
    - ./ihaskell-display/ihaskell-magic
    # - ./ihaskell-display/ihaskell-plot
    # - ./ihaskell-display/ihaskell-static-canvas
    - ./ihaskell-display/ihaskell-widgets
```
4. Use IHaskell stack instructions

