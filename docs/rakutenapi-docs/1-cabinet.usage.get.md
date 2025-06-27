# 1. cabinet.usage.get

[サービス一覧へ戻る](https://webservice.rms.rakuten.co.jp/merchant-portal/backToMenu) / [CabinetAPI](https://webservice.rms.rakuten.co.jp/merchant-portal/view/ja/common/1-1_service_index/cabinetapi/ "CabinetAPI")  

この機能を利用すると、R-Cabinet の利用状況を取得することができます。

Endpoint / HTTP Method
----------------------

<table><tbody><tr><td><b>Endpoint</b></td><td><b>HTTP&nbsp;Method</b></td></tr><tr><td>https://api.rms.rakuten.co.jp/es/1.0/cabinet/usage/get</td><td>GET</td></tr></tbody></table>

Request
-------

<table><tbody><tr><td><b>No</b></td><td><b>Key</b></td><td><b>Value</b></td><td><b>Note</b></td></tr><tr><td>1</td><td>Authorization</td><td>ESA Base64(serviceSecret:licenseKey)</td><td></td></tr></tbody></table>

### Query parameters

　None

### HTTP Body

　None

Response
--------

<table><tbody><tr><td><b>No</b></td><td><b>Key</b></td><td><b>Value</b></td></tr><tr><td>1</td><td>Content-Type</td><td>text/xml</td></tr></tbody></table>

### HTTP Body

#### XML:result

<table><tbody><tr><td><b>No</b></td><td><b>Element</b></td><td><b>Description</b></td><td><b>Type</b></td><td><p><b>Size(byte)</b></p></td><td><p><b>Multiplicity</b></p></td><td><b>Note</b></td></tr><tr><td>1</td><td><p>result.<strong>status</strong></p></td><td>ステータス</td><td><a href="./Functions Common Definition.md">XML:status</a></td><td>-</td><td>1</td><td><p>interfaceId=cabinet.usage.get</p></td></tr><tr><td>2</td><td><p>result.<strong>cabinetUsageGetResult</strong></p></td><td><p>キャビネット利用情報取得結果</p></td><td><p>XML :&nbsp;cabinetUsageGetResult<br></p></td><td>-</td><td>1</td><td></td></tr></tbody></table>

#### XML:cabinetUsageGetResult

<table><tbody><tr><td><b>No</b></td><td><b>Element</b></td><td><b>Description</b></td><td><b>Type</b></td><td><p><b>Size(byte)</b></p></td><td><p><b>Multiplicity</b></p></td><td><b>Note</b></td></tr><tr><td>1</td><td><p>cabinetUsageGetResult.<strong>resultCode</strong></p></td><td><p>結果コード</p></td><td><p>Integer</p></td><td>4</td><td>1</td><td></td></tr><tr><td>2</td><td><p>cabinetUsageGetResult.<strong>MaxSpace</strong></p></td><td><p>契約容量 (MB)</p></td><td><p>Integer</p></td><td>10</td><td>1</td><td></td></tr><tr><td>3</td><td><p>cabinetUsageGetResult.<strong>FolderMax</strong></p></td><td><p>フォルダ数上限</p></td><td><p>Integer</p></td><td>10</td><td>1</td><td></td></tr><tr><td>4</td><td><p>cabinetUsageGetResult.<strong>FileMax</strong></p></td><td><p>フォルダ内画像数上限</p></td><td><p>Integer</p></td><td>10</td><td>1</td><td></td></tr><tr><td>5</td><td><p>cabinetUsageGetResult.<strong>UseSpace</strong></p></td><td><p>利用容量 (KB)</p></td><td><p>Decimal</p></td><td>10,3<br>※少数点第 3 位まで<br></td><td>1</td><td></td></tr><tr><td>6</td><td><p>cabinetUsageGetResult.<strong>AvailSpace</strong></p></td><td><p>利用可能容量 (KB)</p></td><td><p>Decimal</p></td><td>10,3<br>※少数点第 3 位まで</td><td>1</td><td>契約容量 - 利用容量</td></tr><tr><td>7</td><td><p>cabinetUsageGetResult.<strong>UseFolderCount</strong></p></td><td><p>利用フォルダ数</p></td><td><p>Integer</p></td><td>10</td><td>1</td><td></td></tr><tr><td>8</td><td>cabinetUsageGetResult.<strong>AvailFolderCount</strong></td><td>利用可能フォルダ数</td><td>Integer</td><td>10</td><td>1</td><td>フォルダ数上限 - 利用フォルダ数</td></tr></tbody></table>

#### Response sample

  

```
 <?xml version="1.0" encoding="UTF-8"?>
<result>
    <status>
        <interfaceId>cabinet.usage.get</interfaceId>
        <systemStatus>OK</systemStatus>
        <message>OK</message>
        <requestId>714a4983-555f-42d9-aeea-89dae89f2f55</requestId>
    </status>
     
    <cabinetUsageGetResult>
        <resultCode>0</resultCode>
        <MaxSpace>100</MaxSpace>
        <!-- omission -->
    </cabinetUsageResult>
</result>

```