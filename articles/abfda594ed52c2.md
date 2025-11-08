---
emoji: "🙌"
publication_name: "doctormate"
published: true
published_at: 2025-11-12 12:00
title: "async-graphql で ValidationResult (complexity, depth) を確認する"
topics: ["rust"]
type: "tech"
---

## async-graphql の limit_complexity と limit_depth

[`async-graphql`](https://crates.io/crates/async-graphql) crate (7.0.17) には query の complexity と depth の制限を設定する機能があります。

ドキュメントでは↓に記載されています。

<https://async-graphql.github.io/async-graphql/en/depth_and_complexity.html>

具体的なメソッドとしては [limit_complexity](https://docs.rs/async-graphql/7.0.17/async_graphql/struct.SchemaBuilder.html#method.limit_complexity) と [limit_depth](https://docs.rs/async-graphql/7.0.17/async_graphql/struct.SchemaBuilder.html#method.limit_depth) です。

## どのような値を設定すればいいか

これらのメソッドで制限を設定することはできますが、ここにどのような値を設定すべきかはすこし迷うところです。

こういうときは実際に使われている値を確認してみると良さそうです。

この記事では query の complexity と depth を確認する方法について書いてみます。

## 方法 1: analyzer extension を使う

async-graphql には analyzer extension があります。

<https://docs.rs/async-graphql/7.0.17/async_graphql/extensions/struct.Analyzer.html>

この extension はレスポンスの `extensions` の `analyzer` に `complexity` と `depth` を含むオブジェクトを設定します。

```json
{"data":{"int":123},"extensions":{"complexity":1,"depth":1}}
```

今回のケースでは使われている値なのかを確認したいだけなので、レスポンスからは削っておくと良いです。

`async_graphql::Response::extensions` から `"analyzer"` を削ると良いです。

<https://github.com/bouzuya/rust-examples/blob/1aa40081b65db1aa969ea29797463983fc67d298/async-graphql6/src/main.rs#L32-L56>

```rust
async fn test_graphql_request(
    request: impl Into<async_graphql::Request>,
    expected_response: &str,
    expected_analyzer_response: &str,
) -> anyhow::Result<()> {
    let schema = async_graphql::Schema::build(
        MyObject,
        async_graphql::EmptyMutation,
        async_graphql::EmptySubscription,
    )
    .extension(async_graphql::extensions::Analyzer)
    .finish();
    let request: async_graphql::Request = request.into();
    let mut response: async_graphql::Response = schema.execute(request).await;
    let analyzer_response = response.extensions.remove("analyzer");
    assert_eq!(
        serde_json::Value::from_str(&serde_json::to_string(&response)?)?,
        serde_json::Value::from_str(&expected_response)?
    );
    assert_eq!(
        serde_json::Value::from_str(&serde_json::to_string(&analyzer_response)?)?,
        serde_json::Value::from_str(&expected_analyzer_response)?
    );
    Ok(())
}
```

## 方法 2: 独自の extension を使う

独自の extension を定義する方法もあります。

`Extension` trait の `validation` method は `ValidationResult` を扱っています。 `ValidationResult` には `complexity` と `depth` フィールドを持つため、そこから確認できます。

- <https://docs.rs/async-graphql/7.0.17/async_graphql/extensions/trait.Extension.html#method.validation>
- <https://docs.rs/async-graphql/7.0.17/async_graphql/struct.ValidationResult.html>

<https://github.com/bouzuya/rust-examples/blob/1aa40081b65db1aa969ea29797463983fc67d298/async-graphql6/src/main.rs#L110-L166>

```rust
async fn test_my_extension() -> anyhow::Result<()> {
    struct MyExtensionFactory;

    impl async_graphql::extensions::ExtensionFactory for MyExtensionFactory {
        fn create(&self) -> std::sync::Arc<dyn async_graphql::extensions::Extension> {
            std::sync::Arc::new(MyExtension)
        }
    }

    struct MyExtension;

    #[async_trait::async_trait]
    impl async_graphql::extensions::Extension for MyExtension {
        async fn validation(
            &self,
            ctx: &async_graphql::extensions::ExtensionContext<'_>,
            next: async_graphql::extensions::NextValidation<'_>,
        ) -> Result<async_graphql::ValidationResult, Vec<async_graphql::ServerError>>
        {
            let validation_result: async_graphql::ValidationResult = next.run(ctx).await?;

            // 任意の処理 (ここでは標準出力に書き込んでいる)
            println!(
                "complexity = {}, depth = {}",
                validation_result.complexity, validation_result.depth
            );

            Ok(validation_result)
        }
    }

    async fn test_graphql_request(
        request: impl Into<async_graphql::Request>,
        expected_response: &str,
    ) -> anyhow::Result<()> {
        let schema = async_graphql::Schema::build(
            MyObject,
            async_graphql::EmptyMutation,
            async_graphql::EmptySubscription,
        )
        .extension(MyExtensionFactory)
        .finish();
        let request: async_graphql::Request = request.into();
        let response: async_graphql::Response = schema.execute(request).await;
        assert_eq!(
            serde_json::Value::from_str(&serde_json::to_string(&response)?)?,
            serde_json::Value::from_str(&expected_response)?
        );
        Ok(())
    }

    let request = r#"{ int }"#;
    let expected_response = r#"{"data":{"int":123}}"#;
    test_graphql_request(request, expected_response).await?;

    Ok(())
}
```

`ExtensionFactory` trait の実装から `Extension` trait の実装を返し、 `Extension::validation` で `NextValidation::run` を呼び出せば `ValidationResult` が得られます。

`SchemaBuilder::extension` に `ExtensionFactory` trait の実装を設定すれば OK です。

## おわりに

async-graphql の query の complexity と depth の値を確認する方法について書きました。
