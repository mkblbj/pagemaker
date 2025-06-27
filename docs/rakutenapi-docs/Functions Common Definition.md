# Functions Common Definition

> サービス一覧へ戻る

[サービス一覧へ戻る](https://webservice.rms.rakuten.co.jp/merchant-portal/backToMenu)

API Response status
-------------------

### XML ： status

<table><tbody><tr><td><b>No</b></td><td><b>Element</b></td><td><b>Description</b></td><td><b>Type</b></td><td><b>Multiplicity</b></td><td><b>Note</b></td></tr><tr><td>1</td><td>interfaceId</td><td>API 識別子</td><td>String</td><td>1</td><td></td></tr><tr><td>2</td><td>systemStatus</td><td>API リクエストに対する結果ステータス</td><td>String</td><td>1</td><td>詳細は、<strong><a href="#systemstatuselement">SystemStatusElement&nbsp;</a></strong>を参照してください</td></tr><tr><td>3</td><td>message</td><td>API リクエストに対する結果メッセージ</td><td>String</td><td>1</td><td>詳細は、<strong><a href="#messageelement">MessageElement&nbsp;</a></strong>を参照してください</td></tr><tr><td>4</td><td>requestId</td><td>API リクエスト識別子</td><td>String</td><td>1</td><td>API をリクエストする度に発行される番号。<br>楽天への問い合わせに利用します。</td></tr><tr><td>5</td><td>requests</td><td>API リクエスト情報</td><td></td><td>0...1</td><td>リクエストの内容が設定されます</td></tr></tbody></table>

### SystemStatusElement

<table><tbody><tr><td><b>No</b></td><td><b>Code</b></td><td><b>Reason</b></td><td><b>Note</b></td></tr><tr><td>1</td><td>OK</td><td></td><td></td></tr><tr><td>2</td><td>NG</td><td>エラーケース</td><td></td></tr></tbody></table>

### MessageElement

<table><tbody><tr><td><b>No</b></td><td><b>Code</b></td><td><b>Reason</b></td><td><b>Note</b></td></tr><tr><td>1</td><td>OK</td><td></td><td>通常ケース</td></tr><tr><td>2</td><td>ParameterError</td><td>パラメータエラー</td><td>ItemAPI の item.get で、itemUrl が不足している場合、など</td></tr><tr><td>3</td><td>Request data is wrong format</td><td>リクエストのフォーマットエラー</td><td>リクエスト XML のフォーマットが正しくない場合、など</td></tr><tr><td>4</td><td>AuthError</td><td>認証エラー</td><td>licenseKey，serviceSecret が間違っている場合、<br>Base64 エンコードが正しくできていない場合、など</td></tr><tr><td>5</td><td>AccessLimit</td><td>リクエスト閾値エラー</td><td>QPS、QPM、スレッド数が上限に達した場合、など</td></tr><tr><td>6</td><td>SystemError()</td><td>予期せぬエラー</td><td>API 内部のシステムエラー、など</td></tr><tr><td>7</td><td>Method Not Allowed</td><td>許可されていない HTTP メソッド</td><td>ItemAPI の item.get で、POST メソッドを使用した場合、など</td></tr></tbody></table>

### Error Example

  

sample response body

```
<?xml version="1.0" encoding="UTF-8"?>
<result>
         <status>
              <interfaceId>ItemAPI_Get</interfaceId>
              <systemStatus>NG</systemStatus>
              <message>AuthError</message>
              <requestId>714a4983-555f-42d9-aeea-89dae89f2f55</requestId>
              <requests>
                   ・
                   ・
                   ・
              </requests>
          </status>
 </result>

```

  

HTTP Status Code
----------------

### Response Http code

<table><tbody><tr><td><b>No</b></td><td><b>Http Code</b></td><td><b>Case<br></b></td></tr><tr><td>1</td><td>200 (OK)</td><td>通常ケース</td></tr><tr><td>2</td><td>400 (Bad Request)</td><td>パラメータエラー</td></tr><tr><td>3</td><td>401 (Unauthorized)</td><td>認証エラー</td></tr><tr><td>4</td><td>403 (Forbidden)</td><td>リクエスト閾値エラー</td></tr><tr><td>5</td><td>405 (Method Not Allowed)</td><td>許可されていない HTTP メソッドエラー</td></tr><tr><td>6</td><td>500 (Internal Server Error)</td><td>予期せぬエラー</td></tr><tr><td>7</td><td>503 (Service Unavailable)</td><td>システムエラー</td></tr></tbody></table>

Restrictions
------------

### Upper Limit on handling requests

　リクエスト数の上限を超過した場合は、 HTTP ヘッダの Status Code が 403 で返却されます。

  

上限を超えた場合のレスポンス例

```
Status Code: 403 Forbidden 
<?xml version="1.0" encoding="UTF-8"?>
<result>
	<status>
		<interfaceId>item.get</interfaceId>
		<systemStatus>NG</systemStatus>
		<message>QPSLimit</message>
		<requestId>xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx</requestId>
		<requests>
			<shopUrl>xxxxxxxx</shopUrl>
			<itemUrl>xxxxxxxx</itemUrl>
		</requests>
	</status>
</result>

```