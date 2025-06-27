# 7.cabinet.trashbox.file.revert

> サービス一覧へ戻る / CabinetAPI

[サービス一覧へ戻る](https://webservice.rms.rakuten.co.jp/merchant-portal/backToMenu) / [CabinetAPI](https://webservice.rms.rakuten.co.jp/merchant-portal/view/ja/common/1-1_service_index/cabinetapi/ "CabinetAPI")

この機能を利用すると、削除フォルダ内にある画像を指定したフォルダに戻すことができます。

Endpoint / HTTP Method
----------------------

<table><tbody><tr><td><b>Endpoint</b></td><td><b>HTTP&nbsp;Method</b></td></tr><tr><td>https://api.rms.rakuten.co.jp/es/1.0/cabinet/trashbox/file/revert</td><td>POST</td></tr></tbody></table>

Request
-------

<table><tbody><tr><td><b>No</b></td><td><b>Key</b></td><td><b>Value</b></td><td><b>Note</b></td></tr><tr><td>1</td><td>Authorization</td><td>ESA Base64(serviceSecret:licenseKey)</td><td></td></tr></tbody></table>

### Query parameters

　None

### HTTP Body

#### XML:request

<table><tbody><tr><td><b>No</b></td><td><b>Element</b></td><td><b>Description</b></td><td><b>Type</b></td><td><b>Size(byte)</b></td><td><b>Mandatory</b></td><td><b>Multiplicity</b></td><td><b>Note</b></td></tr><tr><td>1</td><td>request.<strong>fileRevertRequest</strong></td><td>画像情報戻し要求</td><td>XML: fileRevertRequest</td><td>-</td><td>○</td><td>1</td><td></td></tr></tbody></table>

#### XML:fileRevertRequest

<table><tbody><tr><td><b>No</b></td><td><b>Element</b></td><td><b>Description</b></td><td><b>Type</b></td><td><b>Size(byte)</b></td><td><p><b>Mandatory</b></p></td><td><b>Multiplicity</b></td><td><b>Note</b></td></tr><tr><td>1</td><td>fileRevertRequest.<strong>file</strong></td><td>画像情報</td><td>XML:file</td><td>-</td><td>○</td><td>1</td><td></td></tr></tbody></table>

#### XML:file

<table><tbody><tr><td><b>No</b></td><td><b>Element</b></td><td><b>Description</b></td><td><b>Type</b></td><td><b>Size(byte)</b></td><td><p><b>Mandatory</b></p></td><td><b>Multiplicity</b></td><td><b>Note</b></td></tr><tr><td>1</td><td>file.<strong>fileId</strong></td><td>画像 ID</td><td>Integer</td><td>10</td><td>○</td><td>1</td><td></td></tr><tr><td>2<br></td><td>file.<strong>folderId</strong></td><td>戻し先のフォルダ ID</td><td>Integer</td><td>10</td><td>○</td><td>1</td><td></td></tr></tbody></table>

#### Request Sample

  

```
<?xml version="1.0" encoding="UTF-8"?>
<request>
	<fileRevertRequest>
		<file>
			<fileId>xxx</fileId>
			<folderId>xxx</folderId>
		</file>
	</fileRevertRequest>
</request>

```

Response
--------

<table><tbody><tr><td><b>No</b></td><td><b>Key</b></td><td><b>Value</b></td></tr><tr><td>1</td><td>Content-Type</td><td>text/xml</td></tr></tbody></table>

### HTTP Body

#### XML:result

<table><tbody><tr><td><b>No</b></td><td><b>Element</b></td><td><b>Description</b></td><td><b>Type</b></td><td><p><b>Size(byte)</b></p></td><td><p><b>Multiplicity</b></p></td><td><b>Note</b></td></tr><tr><td>1</td><td><p>result.<strong>status</strong></p></td><td>ステータス</td><td><a href="Functions%20Common%20Definition.md#xml--status">XML : status</a></td><td>-</td><td>1</td><td><p>interfaceId=cabinet.trashbox.file.revert</p></td></tr><tr><td>2</td><td><p>result.<strong>cabinetTrashboxFileRevertResult<br></strong></p></td><td><p>削除フォルダ内画像情報戻し結果</p></td><td><p>XML :&nbsp;cabinetTrashboxFileRevertResult</p></td><td>-</td><td>1</td><td></td></tr></tbody></table>

#### XML:cabinetTrashboxFileRevertResult

<table><tbody><tr><td><b>No</b></td><td><b>Element</b></td><td><p><b>Description</b></p></td><td><b>Type</b></td><td><b>Size(byte)</b></td><td><b>Multiplicity</b></td><td><b>Note</b></td></tr><tr><td>1</td><td>cabinetTrashboxFileRevertResult.<strong>resultCode</strong></td><td>結果コード</td><td>Integer</td><td>4</td><td>1</td><td></td></tr></tbody></table>

#### Response sample

  

```
<?xml version="1.0" encoding="UTF-8"?>
<result>
	<status>
		<interfaceId>cabinet.trashbox.file.revert</interfaceId>
		<systemStatus>OK</systemStatus>
		<message>OK</message>
		<requestId>714a4983-555f-42d9-aeea-89dae89f2f55</requestId>	 
	</status>
	<cabinetTrashboxFileRevertResult>
		<resultCode>x</resultCode>
	</cabinetTrashboxFileRevertResult>
</result>

```