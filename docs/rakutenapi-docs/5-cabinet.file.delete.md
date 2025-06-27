# 5.cabinet.file.delete

> サービス一覧へ戻る / CabinetAPI

[サービス一覧へ戻る](https://webservice.rms.rakuten.co.jp/merchant-portal/backToMenu) / [CabinetAPI](https://webservice.rms.rakuten.co.jp/merchant-portal/view/ja/common/1-1_service_index/cabinetapi/ "CabinetAPI")

この機能を利用すると、画像 ID を指定して画像を削除フォルダに移動することができます。

Endpoint / HTTP Method
----------------------

<table><tbody><tr><td><b>Endpoint</b></td><td><b>HTTP&nbsp;Method</b></td></tr><tr><td>https://api.rms.rakuten.co.jp/es/1.0/cabinet/file/delete</td><td>POST</td></tr></tbody></table>

Request
-------

<table><tbody><tr><td><b>No</b></td><td><b>Key</b></td><td><b>Value</b></td><td><b>Note</b></td></tr><tr><td>1</td><td>Authorization</td><td>ESA Base64(serviceSecret:licenseKey)</td><td></td></tr></tbody></table>

### Query parameters

　None

### HTTP Body

#### XML:request

<table><tbody><tr><td><b>No</b></td><td><b>Element</b></td><td><b>Description</b></td><td><b>Type</b></td><td><b>Size(byte)</b></td><td><b>Mandatory</b></td><td><b>Multiplicity</b></td><td><b>Note</b></td></tr><tr><td>1</td><td>request.<strong>fileDeleteRequest</strong></td><td>画像情報削除要求</td><td>XML:fileDeleteRequest</td><td>-</td><td>○</td><td>1</td><td></td></tr></tbody></table>

#### XML:fileDeleteRequest

<table><tbody><tr><td><b>No</b></td><td><b>Element</b></td><td><b>Description</b></td><td><b>Type</b></td><td><b>Size(byte)</b></td><td><b>Mandatory</b></td><td><b>Multiplicity</b></td><td><b>Note</b></td></tr><tr><td>1</td><td>fileDeleteRequest.<strong>file</strong></td><td>画像情報</td><td>XML:file</td><td>-</td><td>○</td><td>1</td><td></td></tr></tbody></table>

#### XML:file

<table><tbody><tr><td><b>No</b></td><td><b>Element</b></td><td><p><b>Description</b></p></td><td><b>Type</b></td><td><b>Size(byte)</b></td><td><b>Mandatory</b></td><td><b>Multiplicity</b></td><td><b>Note</b></td></tr><tr><td>1</td><td>file.<strong>fileId</strong></td><td>画像 ID</td><td>Integer</td><td>10</td><td>○</td><td>1</td><td></td></tr></tbody></table>

#### Request Sample

  

```
<?xml version="1.0" encoding="UTF-8"?>
<request>
	<fileDeleteRequest>
		<file>
			<fileId>xxx</fileId>
		</file>
	</fileDeleteRequest>
</request>

```

  

Response
--------

<table><tbody><tr><td><b>No</b></td><td><b>Key</b></td><td><b>Value</b></td></tr><tr><td>1</td><td>Content-Type</td><td>text/xml</td></tr></tbody></table>

### HTTP Body

#### XML:result

<table><tbody><tr><td><b>No</b></td><td><b>Element</b></td><td><b>Description</b></td><td><b>Type</b></td><td><p><b>Size(byte)</b></p></td><td><p><b>Multiplicity</b></p></td><td><b>Note</b></td></tr><tr><td>1</td><td><p>result.<strong>status</strong></p></td><td>ステータス</td><td><a href="https://webservice.rms.rakuten.co.jp/enterprise-portal/view?page=document0030"></a><a href="https://webservice.rms.rakuten.co.jp/merchant-portal/view/ja/common/1-1_service_index/functionsCommonDefinition">XML : status</a></td><td>-</td><td>1</td><td><p>nterfaceId=cabinet.file.delete</p></td></tr><tr><td>2</td><td><p>result.<strong>cabinetFileDeleteResult</strong><strong></strong></p></td><td><p>画像情報削除結果</p></td><td>XML :&nbsp;cabinetFileDeleteResult</td><td>-</td><td>1</td><td></td></tr></tbody></table>

#### XML:cabinetFileDeleteResult

<table><tbody><tr><td><b>No</b></td><td><b>Element</b></td><td><b>Description</b></td><td><b>Type</b></td><td><b>Size(byte)</b></td><td><b>Multiplicity</b></td><td><b>Note</b></td></tr><tr><td>1</td><td><p>cabinetFileDeleteResult.<strong>resultCode</strong></p></td><td>結果コード</td><td>Integer</td><td>4</td><td>1</td><td></td></tr></tbody></table>

#### Response sample

  

```
<?xml version="1.0" encoding="UTF-8"?>
<result>
	<status>
		<interfaceId>cabinet.file.delete</interfaceId>
		<systemStatus>OK</systemStatus>
		<message>OK</message>
		<requestId>714a4983-555f-42d9-aeea-89dae89f2f45</requestId>
	</status>
	<cabinetFileDeleteResult>
		<resultCode>0</resultCode>
	</cabinetFileDeleteResult>
 </result>

```