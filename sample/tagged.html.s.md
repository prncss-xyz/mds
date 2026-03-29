---
checksum: BhYu2EP+EJxa6A7nbNWieQ==
lang: en
mtime: "Sun Mar 29 2026 18:04:38 GMT-0400 (Eastern Daylight Time)"
path: sample/tagged.html
---

[Skip to main content](#main-content)

[Hashnode](https://hashnode.com/?utm_source=https%3A%2F%2Fetorreborre.blog&utm_medium=referral&utm_campaign=blog_header_logo&utm_content=logo)[Galaxy
brain](https://etorreborre.blog/)

Open search (press Control or Command and K)

Toggle theme

Open menu

## Command Palette

Search for a command to run\...

# Typed Tagless Final, for real!

UpdatedDecember 27, 2023

•

10 min read

![Typed Tagless Final, for real!]()

[![Eric
Torreborre]()](https://hashnode.com/@etorreborre)[](https://hashnode.com/@etorreborre)

### Eric Torreborre

Software engineer at the intersection of functional programming, product
development and open-source

Tags

[#haskell](https://etorreborre.blog/tag/haskell)[#scala](https://etorreborre.blog/tag/scala)[#functional-programming](https://etorreborre.blog/tag/functional-programming)

On this page

[What is it really?](#heading-what-is-it-really)[Data serialization to
JSON](#heading-data-serialization-to-json)[A JSON
algebra](#heading-a-json-algebra)[Putting the \"typed\" in \"typed
tagless
final\"](#heading-putting-the-typed-in-typed-tagless-final)[Wrapping-up](#heading-wrapping-up)

Every so often, a software technique takes the center stage of attention
and becomes the source of countless articles, tutorials, and conference
talks.

This is particularly true in the world of functional programming with
techniques such as:

-   [\"failure\" datatypes: `Option`, `Either`,
    `Validation`](https://www.innoq.com/en/blog/2015/03/validate-your-domain-in-scala/)

-   [lenses /
    optics](https://hackage.haskell.org/package/optics-0.4.2.1/docs/Optics.html)

-   [recursion
    schemes](https://blog.sumtypeofway.com/posts/introduction-to-recursion-schemes.html)

-   [generics / type-level
    programming](https://blog.rockthejvm.com/type-level-programming-scala-3/)

-   effect libraries:
    [`effectful`](https://hackage.haskell.org/package/effectful),
    [cats-effect `IO`](https://typelevel.org/cats-effect/),
    [`ZIO`](https://zio.dev/),\...

-   [the \"typed tagless final\"
    approach](https://www.baeldung.com/scala/tagless-final-pattern)

Today I want to give a proper, real-life, example of using the so-called
\"Typed tagless final\" approach. Over the years I have become quite
frustrated with how this topic was presented. In the eyes of many people
this is mostly a way to create interfaces where the result of each
operation has an effect abstracted as a type variable:

    trait CustomerRepository[F : Monad] {
      def saveCustomer(c: Customer): F[()]
      def getCustomers(): F[List[Customer]]
    }

            
            
          

In practice `F` ends up being a type permitting side-effects like `IO`.
`F` might also end up being `State[RepositoryState, _]` in order to
write tests purely in memory for example.

I generally argue that:

1.  This is merely using interfaces, parametrized with an effect.

2.  In that case, this does not deserve a complicated and scary named
    such as \"typed tagless final\".

3.  The \"typed tagless final\" approach is much more interesting and
    covers a different topic than building a system based on modules and
    interfaces.

# What is it really?

You will find the best reference on the topic on [Oleg Kiselyov\'s
website](https://okmij.org/ftp/tagless-final/):

1.  This is a way to create internal Domain Specific Languages (DSL).
    \"Internal\" means that terms are embedded directly in a \"host\"
    programming language.

2.  The DSL terms can be well-typed. The type-checker of the host
    language guarantees it.

3.  The DSL terms can be interpreted in a variety of ways: evaluation,
    printing, optimization (in a type-preserving way), etc\...

4.  The DSL is extensible: new term types can be introduced, existing
    interpreters can be reused.

Why \"Typed tagless final\" then? In short:

-   **Typed** DSL terms can be typed

-   **Tagless** DSL terms do not require to embed tags to keep track of
    their type

-   **Final** DSL terms are not constructed as a specific data type but
    rather via functions

This possibly looks quite interesting, but still very abstract.
Moreover, if you look at examples, most of the time they are about
creating a DSL for:

-   A simplified arithmetic language, or

-   A version of the Lambda Calculus.

Those are hardly real-life examples.

# Data serialization to JSON

Data serialization is (sadly) an essential part of many software
projects, with many pitfalls in terms of correctness, performance,
maintenance, and productivity.

For example the question on how to evolve serialization protocols, so
that we can reuse most of our serialization code from one version to
another, is not entirely trivial.

I have created a library `registry-aeson`, based on the
[`aeson`](https://hackage.haskell.org/package/aeson) Haskell library, to
propose a solution to this problem. That library is structured around
two data types, `Decoder a`, to decode a value of type `a` from some
JSON text, and `Encoder a` to encode a value of type `a` to a JSON
value.

Encoding values seems a bit more straightforward than decoding them
because there\'s no need for error management, but this is not the case!
For performance reasons the `aeson` library proposes a `ToJSON`
typeclass with 2 methods:

    class ToJSON a where
      toJSON :: a -> Value
      toEncoding :: a -> Encoding

            
            
          

`toJSON` creates a `Value` which can be a `String`, an `Object`, an
`Array` etc\... (all the types that we expect from a JSON data type).
However, if we only had this method, we would spend time encoding to an
intermediate data structure *then* transforming this structure to some
bytes on wire. That is pretty ineffective.

This is why the `toEncoding` method exists. To transform the value `a`
directly into bytes, using specific combinators. For example:
`string "hello"` or `pairs (pair "name" value)`.

In the `registry-aeson` library, the first version of the `Encoder` data
type was:

    newtype Encoder a = Encoder { encode :: a -> (Value, Encoding) }

            
            
          

In order to define an `Encoder` you need to return both a `Value` *and*
an `Encoding`, like the `ToJSON` typeclass does. But this is very
tedious, in particular because the API to create values and encodings
are very different in the `aeson` library.

For example if you want to serialize a data type with both field names
and values:

-   If you want to create a `Value`: you build an `Object` with a
    `KeyMap` from a list of keys and values.

-   if you want to go to `ByteString` directly: you make `pairs` with a
    `Series` of encoded values built with the `pair` combinator.

What if we could have one expression and interpret it to either a
`Value` or an `Encoding`? This is exactly what the Type Tagless Final
approach gives us!

# A JSON algebra

We are going to define operations that allow us to build simple JSON
terms, with only strings, ints and maps:

    -- | Operations used to create JsonTerms
    data JsonAlgebra a = JsonAlgebra
      { string_ :: Text -> a,
        int_ :: Int -> a,
        object_ :: [(Key, a)] -> a,
      }

    -- | Polymorphic JSON term. It can be interpreted later
    newtype JsonTerm = JsonTerm {term :: forall a. JsonAlgebra a -> a}

    -- | Interpret a JsonTerm via a specific algebra
    interpret :: JsonTerm -> JsonAlgebra a -> a
    interpret (JsonTerm t) j = t j

    -- | Top-level JSON DSL operations
    string :: Text -> JsonTerm
    string t = JsonTerm $ \ja -> string_ ja t

    int :: Int -> JsonTerm
    int b = JsonTerm $ \ja -> int_ ja b

    object :: [(Key, forall a. JsonAlgebra a -> Pair a)] -> JsonTerm
    object vs = JsonTerm $ \ja -> 
      object_ ja ((\(k, v) -> (k, interpret v ja)) <$> vs)

            
            
          

-   A `JsonAlgebra a` defines operations to build a concrete type `a`.
    In our case we are eventually interested in `a = Value` and
    `a = Encoding`.

-   A `JsonTerm` is something that uses a concrete `JsonAlgebra a` and
    returns any `a` specified by that algebra.

-   The `string`, `int`, `object` functions are the top-level functions
    of our JSON DSL. They are the common API to build both `Values` and
    `Encodings`.

Let\'s see an example of a `JsonTerm`. For example the JSON value:

    { "name": "eric", "credits": 100 }

            
            
          

can be represented with the `JsonTerm`:

    let term :: JsonTerm = 
      object [("name", string "eric"), ("credits", int 100)]

            
            
          

This `JsonTerm` can be interpreted via concrete `JsonAlgebra`
implementation. We can create such an algebra to build `Values`:

    valueJsonAlgebra :: JsonAlgebra Value
    valueJsonAlgebra = JsonAlgebra {..}
      where
        string_ :: Text -> Value
        string_ = String

        int_ :: Int -> Value
        int_ = Number . fromInteger . integerFromInt

        object_ :: [(Key, Value)] -> Value
        object_ = Object . fromList

            
            
          

This algebra replaces each invocation of a function in a `JsonTerm` with
an implementation building a `Value`. Hence, if we apply it to our
`term` above we get a `Value`:

    let value :: Value = interpret term valueJsonAlgebra

    > print value
    > Object (fromList [("name",String "eric"), ("credits",Number 100.0)])

            
            
          

We can also define an implementation building an `aeson`\'s `Encoding`:

    import Data.Aeson.Encoding as E

    encodingJsonAlgebra :: JsonAlgebra Encoding
    encodingJsonAlgebra = JsonAlgebra {..}
      where
        string_ :: Text -> Encoding
        string_ = E.text

        int_ :: Int -> Encoding
        int_ = E.scientific . fromInteger . integerFromInt

        object_ :: [(Key, Encoding)] -> Encoding
        object_ = E.pairs . foldMap identity . fmap (\(k, v) -> E.pair k v)

            
            
          

This time we can interpret our JSON term directly as an `Encoding` (more
or less a `ByteString`):

    let encoding :: Encoding = interpret term encodingJsonAlgebra

    > print encoding
    > "{\"name\":\"eric\",\"credits\":100}"

            
            
          

Two interpretations for the same term! Now, users of the
`registry-aeson` library don\'t have to produce 2 expressions, with a
different API, to generate efficient JSON 🤗.

# Putting the \"typed\" in \"typed tagless final\"

Our DSL is well-typed. It is not possible to use its API to build terms
which cannot be meaningfully interpreted. However, it is not quite
optimal because we are missing the point of `aeson`\'s `Encoding` a bit.
Our `object` operation requires building tuples and putting them in a
list instead of building a `ByteString` right away.

On the other hand, the documentation for `Encoding` shows this example:

    toEncoding (Person name age) = pairs ("name" .= name <> "age" .= age)

            
            
          

In the example above:

-   `"name" .= name` creates a `Series` which directly contains the
    serialized string `"name":"eric"`

-   It is appended with `<>` to another `Series` to directly create the
    comma-separated string `"name":"eric","age":100`

**We need better operations and better types!**

Here is another version of the `JsonAlgebra`:

    data JsonAlgebra r = JsonAlgebra
      { string_ :: Text -> r (),
        int_ :: Int -> r (),
        pair_ :: Key -> r () -> r Key,
        empty_ :: r Key,
        concatenate_ :: r Key -> r Key -> r Key,
        object_ :: r Key -> r (),
      }

            
            
          

This time we introduce 3 new operations, almost as a sub-DSL:

-   `pairs_` to create a key/value pair, ready to be added to other
    key/value pairs

-   `empty_` to denote the empty list of key/value pairs

-   `concatenate_` to concat 2 lists of key/value pairs

We also use another representation, `r`, parametrized by a type in order
to track the type of term we are constructing:

-   `r ()` is for regular terms denoting normal JSON values

-   `r Key` is for lists of key/value pairs being constructed before
    being passed to the `object_` function. We can choose any type that
    is different from `()`, I just chose to reuse an existing type.

This new representation still guarantees that our DSL is type-safe, but
with no need to introduce types like lists and pairs in the algebra
operations.

If we add new top-level functions, we can see the new operations in
action:

    pair :: Key -> JsonTerm () -> (forall r. JsonAlgebra r -> r Key)
    pair k v ja = pair_ ja k (interpret v ja)

    (><) :: (forall r. JsonAlgebra r -> r Key) -> (forall r. JsonAlgebra r -> r Key) -> (forall r. JsonAlgebra r -> r Key)
    (><) = concatenate_ ja (v1 ja) (v2 ja)

    object :: (forall r. JsonAlgebra r -> r A.Key) -> JsonTerm ()
    object vs = JsonTerm $ \ja -> object_ ja (vs ja)

            
            
          

Now we can build a term with:

    let term :: JsonTerm = 
      object $ (pair "name" (string "eric") >< 
               (pair "credits" (int 100))

            
            
          

In this example, we are really concatenating pairs of key/values, as we
go, without having to build an intermediary list of tuples (this is very
similar to what happens in the `Encoding` API of `aeson`).

Can we still get both `Values` and `Encodings` from such a term?
Absolutely, we just need to find the right implementation and
representation for each concrete algebra.

Our previous algebras were parametrized with `Value` and `Encoding`, now
we will use `Values` and `Encoded`:

    data Values k where
      SingleValue :: Value -> Values ()
      ManyValues :: [(A.Key, Value)] -> Values A.Key

    valueJsonAlgebra :: JsonAlgebra Values
    valueJsonAlgebra = ...

    data Encoded k where
      Encoded :: Encoding -> Encoded ()
      CommaSeparated :: E.Series -> Encoded A.Key

    encodingJsonAlgebra :: JsonAlgebra Encoded
    encodingJsonAlgebra = ...

            
            
          

It is not hard to implement each `JsonAlgebra` with those data types:

-   `Values` simply accumulates key/value pairs in a list when the
    `pair_` and `concatenate_` operations are called.

-   `Encoded` re-uses the `Series` data type defined in `aeson`\'s
    `Encoding` to efficiently create comma-separated string as key/value
    pairs are being added.

Now interpreting a `JsonTerm` with a `JsonAlgebra` produces either a
`Values` value or an `Encoded` value. We need 2 more functions to
produce a `Value` or an `Encoding`:

    toValue :: Values k -> Value
    toValue (SingleValue v) = v
    toValue (ManyValues vs) = Object . fromList $ vs

    toEncoding :: Encoded k -> Encoding
    toEncoding (Encoded e) = e
    toEncoding (CommaSeparated s) = E.pairs s

            
            
          

# Wrapping-up

This whole post will probably look a bit scary if you have never read
about the (proper) typed tagless final approach (or if you are new to
Haskell and `aeson` 😄). Let me summarize:

-   We have defined a DSL to create simple JSON terms with strings, ints
    and maps.

-   This DSL uses the operations:

    -   `string`

    -   `int`

    -   `pair`

    -   `object`

              let term :: JsonTerm = 
                object $ (pair "name" (string "eric") >< 
                         (pair "credits" (int 100))

                    
                    
                  

-   We can eventually interpret a DSL term to either:

    -   a `Value` to do JSON manipulations

    -   an `Encoding` to efficiently serialize data to binary

I hope that this blog post will encourage you to read more about this
technique for creating DSLs, you never know when you might need it!

## More from this blog

[](https://etorreborre.blog/my-first-unison-cloud-service)

### My first Unison Cloud service

I already mentioned on this blog how amazing it feels to program with
Unison. Since I started using Unison, I have created several libraries,
but I never deployed and used a Unison Cloud service that wasn\'t just
an experiment. Not anymore! Scratching\...

Nov 11, 2025

5 min read

![My first Unison Cloud service]()

Subscribe to the newsletter.

Get new posts in your inbox.

Subscribe

[](https://etorreborre.blog/dont-look-down-look-at-the-data-instead)

### Don\'t look down! Look at the data instead!

You might get the same vertigo

Nov 4, 2025

6 min read

![Don\'t look down! Look at the data instead!]()

[](https://etorreborre.blog/we-can-do-much-better)

### We can do much better

By coming back to the fundamentals\...

Jan 28, 2025

6 min read

![We can do much better]()

[](https://etorreborre.blog/2024-in-review)

### 2024 in review

This year I decided to do a quick professional retrospective. It's
easier to plan the road ahead when you also have an eye on the rear-view
mirror! I can group most of my highlights of 2024 in 3 categories:
Becoming a technologist Unison The small\...

Dec 31, 2024

14 min read

![2024 in review]()

[](https://etorreborre.blog/what-is-so-unique-about-unison)

### What is so unique about Unison?

I have recently started exploring the Unison programming language. Some
programming languages are good because they improve the current state of
affairs. For example Gleam brings type-safety to the Erlang platform.
Other languages are game-changers: \...

May 4, 2024

14 min read

![What is so unique about Unison?]()

![Publication avatar]()

Galaxy brain

I am a software engineer. Put me at the center of a Venn diagram with
functional programming, product development, and open-source

13 posts published

[](https://twitter.com/etorreborre)[](https://github.com/etorreborre)[](https://www.linkedin.com/in/etorreborre)[](https://specs2.org/)[](https://hashnode.com/@etorreborre)[](https://fosstodon.org/@etorreborre)

© 2026 Galaxy brain

-   [Members](https://etorreborre.blog/members)
-   [Archive](https://etorreborre.blog/archive)
-   [Privacy](https://hashnode.com/privacy)
-   [Terms](https://hashnode.com/terms)

[Sitemap](https://etorreborre.blog/sitemap.xml)[RSS](https://etorreborre.blog/rss.xml)

[![]()](https://hashnode.com/?utm_source=https%3A%2F%2Fetorreborre.blog&utm_medium=referral&utm_campaign=blog_footer_logo&utm_content=logo)
