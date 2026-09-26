# 公開前セキュリティ監査 — v1.19

実施日：2026-09-21。対象はゲームのJavaScript、保存データの取り込みとDOMへの表示、npm依存関係、Vite設定、静的配布物、GitHubへ含めるファイルとCIです。

**確認した範囲で、公開を妨げる未解決の重大な問題は見つかりませんでした。** 将来の脆弱性や、すべての攻撃が存在しないことを保証するものではありません。

## 検出と対応

| 項目 | 確認結果・対応 |
|---|---|
| 依存関係 | npm公式監査データで44依存を照合。既知の脆弱性0件（critical／high／moderate／lowすべて0）。ロックファイルを使用。 |
| 公開ファイルの秘密情報 | 公式Gitleaks v8.30.1をSHA-256で検証し、公開候補をローカル走査。検出0件。トークン・鍵をリポジトリへ含めない。 |
| 公開範囲 | 以前は原本・バックアップ・制作ログの除外が不十分だったため、Git対象を許可リスト化。実行用画像とGLB、ソース、テスト、公開用文書を対象に限定。 |
| モデル内の参照 | 3体のGLBを解析。外部リソースURIと個人環境の絶対パスなし。実行用画像でも個人環境のパス・代表的な鍵形式を確認。 |
| ブラウザの制限 | CSPを追加。外部スクリプト、インラインJavaScript、外部通信、base URLの差し替え、プラグインとフォーム送信を制限。 |
| HTTPヘッダー | プレビューでnosniff、フレーム埋め込み拒否、Referrer Policy、不要な機器APIのPermissions Policyを設定。 |
| 開発サーバー | 既定の全インターフェース待受けをlocalhost限定へ変更。LAN確認は明示したコマンドで実行。Git設定・バックアップ・監査ログ・原本・制作文書をアクセス拒否。 |
| 保存データとDOM | キャラID・数値・装備・編成を検証する既存処理を確認。改変した保存データのHTML文字列は実行されず、正しい経験値は維持されることを実画面で確認。 |
| 配布版の開発機能 | 開発用ゲーム状態変更機能がビルドに含まれないことを確認。ソースマップは公開しない。 |
| 再現可能性 | 非公開ログを参照していたモデル検証を、公開可能なフィクスチャへ変更。公開候補のみの別環境でインストール・テスト・ビルドが成功。 |
| 継続検証 | 公式Actionsを固定SHAで参照、原則contents:read、認証情報をcheckout後に保持しない設定。Dependabotを追加。 |

## 実施した検証

- `npm audit --json`：既知の脆弱性0件。
- `npm test`：198件成功、失敗0件。
- 公開候補だけのコピーで `npm ci --ignore-scripts` → `npm test` → `npm run build`：成功。
- `tests/security-browser-audit.mjs`：6項目成功。CSPとHTTPヘッダー、保存データの不正文字列、物語・3D戦闘・HUD・一時停止、オフライン起動、攻撃の遮断、非公開ファイル拒否を確認。
- Git設定、モデル原本、バックアップ、制作履歴、監査ファイルへの開発サーバーからのアクセスはHTTP 403。実行用GLBはHTTP 200。
- 不正インライン／外部スクリプト、外部fetch、base差し替えを試し、ブラウザのsecuritypolicyviolationを確認。
- Gitleaksの公開候補走査：検出0件。出力は機密値を伏せる設定で実行。

## 設計上の境界

ログイン・課金・外部API・ランキングのない、ブラウザ内で完結するゲームです。プレイヤー自身によるlocalStorageの編集を防ぐ設計ではありません。将来オンライン機能を追加する場合は、サーバー側の認証・権限・入力検証を別途監査する必要があります。

動的な位置指定やHPバーのため、インラインCSSは許可しています。インラインJavaScriptとevalは許可しません。フレーム埋め込み制限やPermissions PolicyはHTTPヘッダーに依存するため、任意のホスティング先へ自動で継承されるものではありません。

確認はMac上のChromeとローカル静的プレビューで実施しました。公開リポジトリへの変更後もCIを確認します。GitHubへの公開は、原本Blenderファイルや個人のセーブ・制作ログの公開を含みません。

## 参照した一次資料

- [npm auditの公式説明](https://docs.npmjs.com/cli/v11/commands/npm-audit/)
- [Gitleaks公式リリース](https://github.com/gitleaks/gitleaks/releases/tag/v8.30.1)
- [Viteのサーバー設定](https://vite.dev/config/server-options)
- [Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy)
- [style-src-attr](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy/style-src-attr)
