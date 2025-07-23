---
emoji: "🌦️"
publication_name: "doctormate"
published: false
# published_at: 2025-08-19 13:00
title: "例外代わりの `Result<T, E>`"
topics: ["rust"]
type: "tech"
---

# 例外代わりの `Result<T, E>`

Rust には [`Result<T, E>`](https://doc.rust-lang.org/std/result/enum.Result.html) という型があります。だいたいこういう定義です。

```rust
enum Result<T, E> {
    Ok(T),
    Err(E),
}
```

`Result<T, E>` は定義から分かるとおり、結果 (成否) を表す型で、 `Ok` のときの型 `T` と `Err` のときの型 `E` のどちらか一方を保持します。

Rust は他のプログラミング言語にあるような例外がありません。代わりにエラーハンドリングにはいくつかの方法がありますが、主に `Result<T, E>` 型を使用します。

`Result<T, E>` は標準ライブラリを含めて広く使われている型です。 `Option<T>` と同様に、 Rust をはじめるとすぐにふれることになる型のひとつです。

ここまで [`Option<T>` のとき](https://zenn.dev/doctormate/articles/7100b404d89917)とほとんど同じ書き出しにしてみました。

# 基本的な使い方

`Result<T, E>` は、たとえば次のように構築できます。

```rust
let r1: Result<i32, &str> = Err("Error!");
let r2: Result<i32, &str> = Ok(123);
```

`T` と `E` は任意の型を取れるので、↑の例のように `E` として `&str` を取ることもできますし、 `()` のように実質エラーの詳細を持たないこともできます。

```rust
let r1: Result<bool, ()> = Err(());
let r2: Result<bool, ()> = Ok(true);
```

`Error` trait を実装した型を持つことが多いです。 `Error` についてはまた別で書きます (たぶん) 。

`Result<T, E>` は、たとえば次のように分解できます。

```rust
let r: Result<i32, &str> = Ok(123);
match r {
    Ok(t) => println!("{t}"),
    Err(e) => println!("{e}"),
}
```

`match` は[「 if より match 」](https://zenn.dev/doctormate/articles/269b20722fd9cd) でも触れています。

# `Result<T, E>` を `bool` にするメソッド

## `is_err` / `is_err_and` / `is_ok` / `is_ok_and`

`Option<T>` の `is_none` や `is_some` などと同様に `is_err` や `is_ok` などで `bool` に変換できます。

```rust
let r: Result<i32, &str> = Err("Error!");
assert!(r.is_err());
let r: Result<i32, &str> = Ok(123);
assert!(r.is_ok());

let r: Result<i32, &str> = Err("Error!");
assert!(r.is_err_and(|e| e == "Error!"));
let r: Result<i32, &str> = Ok(123);
assert!(r.is_ok_and(|t| t == 123));
```

# `Result<T, E>` を `T` や `E` にする (中身を取り出す) メソッド

## `expect` / `unwrap`

`Option<T>` の `expect` や `unwrap` などと同様に `Result<T, E>` も `expect` や `unwrap` でも中身を取り出せます。

```rust
let r: Result<i32, &str> = Ok(123);
assert_eq!(r.unwrap(), 123);

let r: Result<i32, &str> = Err("Error!");
r.unwrap(); // panic
// called `Result::unwrap()` on an `Err` value: "Error!"

let r: Result<i32, &str> = Ok(123);
assert_eq!(r.expect("r is Ok"), 123);

let r: Result<i32, &str> = Err("Error!");
r.expect("r is Ok"); // panic
// r is Ok: "Error!"
```

## `expect_err` / `unwrap_err`

`Option<T>` は `T` のみなので、これで終わりですが、 `Result<T, E>` は `Ok` と `Err` の 2 つがあるので、そのための unwrap もあります。

```rust
let r: Result<i32, &str> = Ok(123);
r.unwrap_err(); // panic
// called `Result::unwrap_err()` on an `Ok` value: 123

let r: Result<i32, &str> = Err("Error!");
assert_eq!(r.unwrap_err(), "Error!");

let r: Result<i32, &str> = Ok(123);
r.expect_err("r is Err"); // panic
// r is Err: 123

let r: Result<i32, &str> = Err("Error!");
assert_eq!(r.expect_err("r is Err"), "Error!");
```

## `unwrap_or` / `unwrap_or_default` / `unwrap_or_else`

`unwrap_or` は `Err` の場合の値を指定することで unwrap します。 `unwrap_or_default` は `Err` の場合の値として `T` の `Default::default` の値を使用します。 `unwrap_or_else` は `Err` の場合の値の代わりに値を返す関数を指定します。 

```rust
let r: Result<i32, &str> = Ok(123);
assert_eq!(r.unwrap_or(456), 123);
let r: Result<i32, &str> = Err("Error!");
assert_eq!(r.unwrap_or(456), 456);

let r: Result<i32, &str> = Ok(123);
assert_eq!(r.unwrap_or_default(), 123);
let r: Result<i32, &str> = Err("Error!");
assert_eq!(r.unwrap_or_default(), 0);

let r: Result<i32, &str> = Ok(123);
assert_eq!(r.unwrap_or_else(|_| 456), 123);
let r: Result<i32, &str> = Err("Error!");
assert_eq!(r.unwrap_or_else(|_| 456), 456);
```


## ドクターメイト株式会社での運用

`Option<T>` のときにも触れたのですが、ドクターメイト株式会社では `unwrap` を使用しないようにしています。テストコードでも、です。理由は、テストコードで `unwrap` を使用していると、プロダクションコード側で誤って `unwrap` の使用を残してしまっていても検索でそれに気づくことが難しくなるためです。安全に unwrap できる場合は代わりに `expect` を使用しています。

一方で `unwrap_err` は意外とテストにおけるエラーの検証に使われています。 `unwrap` はダメだけど、 `unwrap_err` はいいんですね。ふしぎですね。


# 次回予告

ほとんど `Option<T>` と同じですね！　次回もほとんど `Option<T>` と同じになりそうですね！！ `?` 演算子に触れると思います。たぶん。

# 参考

- [`std::result::Result<T, E>`](https://doc.rust-lang.org/std/result/enum.Result.html)
