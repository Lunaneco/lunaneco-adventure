# セキュリティ方針

このゲームは静的なブラウザアプリです。サーバー認証、課金、ランキング、外部APIはありません。キャラ育成・所持品・クリア状況はlocalStorageに保存し、開いたサイトとブラウザの範囲に留めます。

ブラウザの持ち主はセーブを書き換えられます。これはオフラインゲームの設計上の性質です。将来、課金・対戦・ランキングを実装する場合はサーバー側での検証が必要になります。

## 問題の報告

リポジトリの Security → Report a vulnerability から非公開で報告してください。秘密情報、個人情報、実際のセーブデータを公開Issueへ貼らないでください。影響範囲、再現手順、ブラウザ・バージョンを添えてください。

## 開発・ホスティング

- `npm ci` でロックファイルを使用し、`npm audit`、`npm test`、`npm run build` を実行します。
- 既定の開発／プレビューサーバーはlocalhost限定。LAN向け起動は明示した場合のみ使用します。
- Viteの開発サーバーにはソースへのアクセス機能があります。インターネットへの公開には使用しません。
- 静的配布物は `dist/`。非公開の制作ログ・バックアップ・原本モデルは配布物に含めません。
- ビルドしたHTMLにCSPとReferrer Policyを埋め込みます。スタイル属性はHPバーや位置の表示に必要ですが、インラインJavaScriptとevalは許可しません。
- ヘッダーを設定できるホスティングでは `security.config.js` の `SECURITY_HEADERS` を設定してください。特にframe-ancestorsとPermissions-PolicyはHTMLメタタグでは適用できず、HTTPヘッダーが必要です。
- HTTPSを使用してください。Service Workerは自身のオリジンのゲームファイルだけを保存し、公開ページのセーブを外部へ転送しません。

GitHub Pages版ではHTMLに埋め込んだCSPとReferrer Policyが適用されます。Pagesは任意のHTTPヘッダー設定に対応しないため、ローカルプレビューにあるframe-ancestors・X-Frame-Options・Permissions-Policyは同じ形では設定できません。ゲームにログインや決済などの機密操作はありません。オフラインの対象とキャッシュ更新はゲームの公開パスに限定しています。

## 公開範囲

`.gitignore` は公開対象を明示する方式です。環境変数ファイル、秘密鍵、バックアップ、監査時のユーザー画面、制作原本はコミットしません。GitHub Actionsは原則contents:readで動作し、公式Actionsを固定コミットで参照します。Pages公開用のpages:writeとid-token:writeは、mainブランチの検証成功後に実行するデプロイジョブだけに付与します。

[公開前の監査記録](docs/SECURITY-AUDIT.md)
