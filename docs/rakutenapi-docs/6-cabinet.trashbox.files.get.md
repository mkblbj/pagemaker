# 6.cabinet.trashbox.files.get

> サービス一覧へ戻る / CabinetAPI

[サービス一覧へ戻る](https://webservice.rms.rakuten.co.jp/merchant-portal/backToMenu) / [CabinetAPI](https://webservice.rms.rakuten.co.jp/merchant-portal/view/ja/common/1-1_service_index/cabinetapi/ "CabinetAPI")

この機能を利用すると、削除フォルダ内にある削除した画像の一覧を取得することができます。  
画像の登録、更新、削除後の情報が本機能の取得情報に反映されるまでの時間は最短 10 秒です。  
ページング機能 (offset, limit) を用いて情報取得をしている時には画像の登録、更新、削除はお控えください。情報が正しく取得できない場合があります。

Endpoint / HTTP Method
----------------------

<table><tbody><tr><td><b>Endpoint</b></td><td><b>HTTP&nbsp;Method</b></td></tr><tr><td>https://api.rms.rakuten.co.jp/es/1.0/cabinet/trashbox/files/get</td><td>GET</td></tr></tbody></table>

Request
-------

<table><tbody><tr><td><b>No</b></td><td><b>Key</b></td><td><b>Value</b></td><td><b>Note</b></td></tr><tr><td>1</td><td>Authorization</td><td>ESA Base64(serviceSecret:licenseKey)</td><td></td></tr></tbody></table>

### Query parameters

<table><tbody><tr><td><b>No</b></td><td><b>Parameter</b></td><td><b>Description</b></td><td><b>Type</b></td><td><b>Mandatory</b></td><td><b>Multiplicity</b></td><td>Note</td></tr><tr><td>1</td><td>offset</td><td>検索結果取得ページ数</td><td>Integer</td><td></td><td>0,1</td><td><p>1 を基準値とした検索結果取得ページ数<br>&nbsp;　</p><p>　例）100 件データが存在する場合を仮定し、検索結果の 1 ページあたりの取得上限数を 10 に設定した場合<br>　offset=1、limit=10 → 1 件目～10 件目のデータを取得する<br>　offset=2、limit=10 → 11 件目～20 件目のデータを取得する<br>　offset=3、limit=10 → 21 件目～30 件目のデータを取得する<br>&nbsp;　</p><p>　例）100 件データが存在する場合を仮定し、検索結果の 1 ページあたりの取得上限数を 20 に設定した場合<br>　offset=1、limit=20 → 1 件目～20 件目のデータを取得する<br>　offset=2、limit=20 → 21 件目～40 件目のデータを取得する<br>　offset=3、limit=20 → 41 件目～60 件目のデータを取得する</p></td></tr><tr><td>2</td><td>limit</td><td>検索結果取得上限数</td><td>Integer</td><td></td><td>0,1</td><td><p>検索結果の 1 ページあたりの取得上限数<br>　</p><p>　例）100 件データが存在する場合を仮定し、検索結果の 1 ページあたりの取得上限数を 10 に設定した場合<br>　offset=1、limit=10 → 1 件目～10 件目のデータを取得する<br>　offset=2、limit=10 → 11 件目～20 件目のデータを取得する<br>　offset=3、limit=10 → 21 件目～30 件目のデータを取得する<br>　</p><p>　例）100 件データが存在する場合を仮定し、検索結果の 1 ページあたりの取得上限数を 20 に設定した場合<br>　offset=1、limit=20 → 1 件目～20 件目のデータを取得する<br>　offset=2、limit=20 → 21 件目～40 件目のデータを取得する<br>　offset=3、limit=20 → 41 件目～60 件目のデータを取得する<br>　</p><p>※値は 100 まで指定可能です。</p></td></tr></tbody></table>

### HTTP Body

 None

Response
--------

<table><tbody><tr><td><b>No</b></td><td><b>Key</b></td><td><b>Value</b></td></tr><tr><td>1</td><td>Content-Type</td><td>text/xml</td></tr></tbody></table>

### HTTP Body

#### XML:result

<table><tbody><tr><td><b>No</b></td><td><b>Element</b></td><td><b>Description</b></td><td><b>Type</b></td><td><p><b>Size(byte)</b></p></td><td><p><b>Multiplicity</b></p></td><td><b>Note</b></td></tr><tr><td>1</td><td><p>result.<strong>status</strong></p></td><td>ステータス</td><td><a href="Functions%20Common%20Definition.md#xml--status">XML : status</a></td><td>-</td><td>1</td><td><p>interfaceId=cabinet.trashbox.files.get</p></td></tr><tr><td>2</td><td><p>result.<strong>cabinetTrashboxFilesGetResult<br></strong></p></td><td><p>削除フォルダ内画像情報取得結果</p></td><td><p>XML: cabinetTrashboxFilesGetResult</p></td><td>-</td><td>1</td><td></td></tr></tbody></table>

#### XML:cabinetTrashboxFilesGetResult

<table><tbody><tr><td><b>No</b></td><td><b>Element</b></td><td><b>Description</b></td><td><b>Type</b></td><td><b>Size(byte)</b></td><td><b>Multiplicity</b></td><td><b>Note</b></td></tr><tr><td>1</td><td><p>cabinetTrashboxFilesGetResult.<strong>resultCode</strong></p></td><td>結果コード</td><td>Integer</td><td>4</td><td>1</td><td></td></tr><tr><td>2</td><td><p>cabinetTrashboxFilesGetResult.<strong>file</strong><strong>AllCount</strong></p></td><td>全画像数</td><td><p>Integer</p></td><td>5</td><td>1</td><td></td></tr><tr><td>3</td><td><p>cabinetTrashboxFilesGetResult.<strong>fileCount</strong></p></td><td>返却画像数</td><td>Integer</td><td>5</td><td>1</td><td></td></tr><tr><td>4</td><td><p>cabinetTrashboxFilesGetResult.<strong>files</strong></p></td><td>画像情報リスト</td><td>XML:files</td><td>-</td><td>1</td><td></td></tr></tbody></table>

#### XML:files

<table><tbody><tr><td><b>No</b></td><td><b>Element</b></td><td><b>Description</b></td><td><b>Type</b></td><td><b>Size(byte)</b></td><td><b>Multiplicity</b></td><td>Note</td></tr><tr><td>1</td><td>files.<strong>file</strong></td><td>画像情報</td><td>XML :&nbsp;file<br></td><td>-</td><td>1 ... n</td><td></td></tr></tbody></table>

#### XML:file

<table><tbody><tr><td><b>No</b></td><td><b>Element</b></td><td><b>Description</b></td><td><p><b>Type</b></p></td><td><b>Size(byte)</b></td><td><b>Multiplicity</b></td><td><b>Note</b></td></tr><tr><td>1</td><td>file.<strong>FolderNode</strong></td><td>フォルダノード</td><td>Integer</td><td>1</td><td>1</td><td><p>0 or 1 or 2 or 3</p><p>基本フォルダの場合： 0<br></p></td></tr><tr><td>2</td><td>file.<strong>FolderPath</strong></td><td>フォルダパス</td><td>String</td><td>153</td><td>1</td><td><p>path1/path2/path3</p><p>区切り文字は "/" です。</p><p>基本フォルダの場合： /</p></td></tr><tr><td>3</td><td>file.<strong>FileId</strong></td><td>画像 ID</td><td>Integer</td><td>10</td><td>1</td><td></td></tr><tr><td>4</td><td>file.<strong>FileName</strong></td><td>画像名</td><td>String</td><td>50</td><td>1</td><td></td></tr><tr><td>5</td><td>file.<strong>FileUrl</strong></td><td>画像保存先</td><td>String</td><td>265</td><td>1</td><td></td></tr><tr><td>6</td><td>file.<strong>FilePath</strong></td><td>file 名</td><td>String</td><td>50</td><td>1</td><td></td></tr><tr><td>7</td><td>file.<strong>FileType</strong></td><td>画像タイプ</td><td>Integer</td><td>1</td><td>1</td><td>1: jpg<br>2: gif (画像)<br>3: gif (動画)</td></tr><tr><td>8</td><td>file.<strong>FileSize</strong></td><td>画像サイズ (KB)</td><td>Decimal</td><td>7</td><td>1</td><td><p>小数点第 3 位まで</p><p>0.000 の場合： 0</p></td></tr><tr><td>9</td><td>file.<strong>FileWidth</strong></td><td>画像の横幅</td><td>Integer</td><td>4</td><td>1</td><td></td></tr><tr><td>10</td><td>file.<strong>FileHeight</strong></td><td>画像の縦幅</td><td>Integer</td><td>4</td><td>1</td><td></td></tr><tr><td>11</td><td>file.<strong>FileAccessDate</strong></td><td>画像アクセス日</td><td>Date</td><td>10</td><td>1</td><td></td></tr><tr><td>12</td><td>file.<strong>TimeStamp</strong></td><td>画像情報更新日時</td><td>DateTime</td><td>19</td><td>1</td><td></td></tr></tbody></table>

#### Response sample

  

```
<?xml version="1.0" encoding="UTF-8"?>
<result>
	<status>
		<interfaceId>cabinet.trashbox.files.get</interfaceId>
		<systemStatus>OK</systemStatus>
		<message>OK</message>
		<requestId>714a4983-555f-42d9-aeea-89dae89f2f55</requestId>
		<!-- To understand the request from client. But, do not record the authentication information.-->
		<requests>
			<offset>1</offset>
			<limit>1</limit>
		</requests>
	</status>
	<cabinetTrashboxFilesGetResult>
		<resultCode>0</resultCode>
		<fileAllCount>3</fileAllCount>
		<fileCount>1</fileCount>
		<files>
			<file>
				<!-- omission -->
				<FileId>134189</FileId>
				<!-- omission -->
			</file>
		</files>
	</cabinetTrashboxFilesGetResult>
</result> 

```