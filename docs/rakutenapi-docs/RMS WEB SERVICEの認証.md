# RMS WEB SERVICEの認証

概要
--

本 API リクエスト時の認証情報として、「serviceSecret(サービスシークレット)」と「licenseKey(ライセンスキー)」の 2 つが必要です。

■serviceSecret とは  
　RMS WEB SERVICE の利用者を特定するキー情報です。

　　【確認方法】

*   店舗様が RMS から WEB API サービス申込みをした場合  
    　　RMS メインメニュー＞拡張サービス一覧＞WEB API サービス＞利用設定　から確認できます。

*   開発企業が、開発企業用の API Portal サイトを利用している場合  
    　楽天に登録された製品毎に 1 つずつ割り当てられています。  
    　開発企業向けの API Portal サイトから確認できます。 

■licenseKey とは  
　RMS WEB SERVICE にアクセスしている店舗様を特定するキー情報です。

　　【確認方法】

*   店舗様が RMS から WEB API サービス申込みをした場合  
    　　RMS メインメニュー＞拡張サービス一覧＞WEB API サービス＞利用設定　から確認できます。

*   開発企業が、開発企業用の API Portal サイトを利用している場合  
    　開発企業が API Portal サイトから、店舗様に対してアクセス承認依頼を出した際、店舗様が承認すると発行されるキーです。  
    　店舗様にて、下記導線から確認できます。  
    　　RMS メインメニュー＞拡張サービス一覧＞WEB API サービス＞システム開発企業からのアクセス許可設定   
    

※serviceSecret、licenseKey それぞれ、最大値は 50 文字となります。

### 認証・認可情報の作成方法

<table><tbody><tr><th colspan="1"><p>How to create Authorization information</p></th></tr><tr><td><p>serviceSecret と licenseKey をコロン (:) をセパレータとして結合し、Base64 エンコードした値を "ESA" と接続したものを認証情報として利用します。<br>例) serviceSecret=aaa, licenseKey=bbb　の場合、aaa:bbb を Base64 エンコードした値 (YWFhOmJiYg==) を利用して、以下の情報を認証情報に設定します。</p><p>　ESA YWFhOmJiYg==</p></td></tr></tbody></table>

※Base64 エンコードを行う際には、エンコード対象の文字列に改行が含まれたりしていないかご確認ください。

### 認証・認可情報の設定サンプル

1.1 の例で作成した認証情報を利用する場合、以下のように設定します。

※REST API と SOAP API では設定する場所が違いますのでご注意ください。

#### REST API の場合

リクエストヘッダに設定します。

![](https://webservice.rms.rakuten.co.jp/merchant-portal/contents/rms/common/img/864729608.png)

<table><tbody><tr><td><b>Request header sample</b></td></tr><tr><td>GET /es/1.0/item/get?itemUrl=xxxxxx HTTP/1.1<p><strong>Authorization: ESA YWFhOmJiYg==</strong><br>User-Agent: Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/29.0.1547.76 Safari/537.36<br>Accept: application/xml<br>Accept-Encoding: gzip,deflate,sdch<br>Accept-Language: ja,en-US;q=0.8,en;q=0.6</p></td></tr></tbody></table>

#### SOAP API の場合（受注 API、在庫 API）

リクエストボディに設定します。

![](https://webservice.rms.rakuten.co.jp/merchant-portal/contents/rms/common/img/864729609.png)