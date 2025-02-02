# 2016 PHH ISUCON

## ディレクトリ構成概要

```
- app/
  |- nodejs/ # Node.js での参考実装が入ったディレクトリ
  |  |- app.js       # アプリケーション本体
  |  |- package.json # 依存リスト
  |  |- database.sql # DB スキーマ
  |  |- public       # 静的ファイル郡
  |  |- views        # テンプレート群
  |- bin/ # 実行ファイルディレクトリ
```

## アプリケーションの起動

```
$ cd app/nodejs
$ cat database.sql | mysql -uroot
$ npm install
$ node app.js
```

## レギュレーション

### サーバー事項

参加者は主催者が用意した AWS EC2 上のインスタンスを利用する。

サーバーは Ubuntu 16.04 LTS を利用する。

サーバーに事前にインストールされているソフトウェアは以下のとおり

- MySQL
- Redis
- Node.js

これら以外のソフトウェアのインストールは保証されない。

### ソフトウェア事項

コンテストにあたり、参加者は与えられたソフトウェア、もしくは自分で競技時間内に実装したソフトウェアを用いる。 高速化対象のソフトウェアとして主催者から Node.js によるWebアプリケーションが与えられる。 独自で実装したものを用いてもよい。

競技における高速化対象のアプリケーションとして与えられたアプリケーションから、以下の機能は変更しないこと。

- アクセス先のURI(ポート、およびHTTPリクエストパス)
- レスポンス(HTML)のDOM構造
- JavaScript/CSSファイルの内容
  - 1バイトの誤差も許容しない

各サーバーにおけるソフトウェアの入れ替え、設定の変更、アプリケーションコードの変更および入れ替えなどは一切禁止しない。 起動したインスタンス以外の外部リソースを利用する行為 (他のインスタンスに処理を委譲するなど) は禁止する。

許可される事項には、例として以下のような作業が含まれる。

- DBスキーマの変更やインデックスの作成・削除
- データベースに利用するミドルウェアの変更
- キャッシュ機構の追加、jobqueue機構の追加による遅延書き込み
- 他の言語による再実装


ただし以下の事項に留意すること。

- コンテスト進行用のメンテナンスコマンドが正常に動作するよう互換性を保つこと

### 採点

採点は採点条件(後述)をクリアした参加者の間で、性能値(後述)の高さを競うものとする。 予選参加者に提供される性能計測ツール(以下計測ツール)に参加者が実行リクエストを送り、その後ツール側から計測用の処理が実行される。

採点条件として、以下の各チェックの検査を通過するものとする。

- 負荷走行中、更新を伴うHTTPリクエストに対してレスポンスを返してから1秒以内に関連するURI GETのレスポンスデータに反映されていること
- エラー(ステータスコードが200および300番台以外のもの、ならびに規定の時間内に計測ツールがレスポンスを得られなかったもの)が発生しなかったこと
- レスポンスHTMLのDOM構造が変化していないこと
- ブラウザから対象アプリケーションにアクセスした結果、ページ上の表示および各種動作が正常であること


性能値として、以下の指標を用いる。計測ツールの実行時間は1分間とする。細かい閾値ならびに配点についての詳細は予選当日のマニュアルに記載する。

- 計測時間内の HTTP リクエスト成功数をベースとする
- リクエストの種類毎に配点を変更する
- エラーが1つでもあれば fail とする
- 時間内にエラーが一定数を超えた場合は計測失敗となる
- HTTP GET ならびに POST 、 PUT リクエストは一定時間内にレスポンスを返すこととし、違反はエラーとして扱う

### 各エンドポイントのタイムアウト

- `POST /reset` : 10s
- `GET /` : 5s
- `POST /access` : 2s
- `GET /count` : 5s
- `GET /stats` : 10s