# 10.cabinet.folder.insert

> この機能を利用すると、フォルダを作成することができます。

この機能を利用すると、フォルダを作成することができます。

Endpoint / HTTP Method
----------------------

<table><tbody><tr><th><b>Endpoint</b></th><th><b>HTTP Method</b></th></tr><tr><td>https://api.rms.rakuten.co.jp/es/1.0/cabinet/folder/insert</td><td data-highlight-colour="red">POST</td></tr></tbody></table>

Request
-------

<table><tbody><tr><th><b>No</b></th><th><b>Key</b></th><th><b>Value</b></th><th><b>Note</b></th></tr><tr><td>1</td><td data-highlight-colour="red">Authorization</td><td>ESA Base64(serviceSecret:licenseKey)</td><td data-highlight-colour="red"></td></tr></tbody></table>

### Query parameters

None

### HTTP Body

#### XML : request

<table><tbody><tr><th><b>No</b></th><th><b>Element</b></th><th><b>Description</b></th><th><b>Type</b></th><th><b>Size(byte)</b></th><th><b>Mandatory</b></th><th><b>Multiplicity</b></th><th><b>Note　　　</b></th></tr><tr><td>1</td><td data-highlight-colour="red">request.<b>folderInsertRequest</b></td><td>フォルダ情報登録要求</td><td data-highlight-colour="red">XML :&nbsp;folderInsertRequest</td><td>-</td><td data-highlight-colour="red">○</td><td>1</td><td data-highlight-colour="red"></td></tr></tbody></table>

#### XML : folderInsertRequest

<table><tbody><tr><th><b>No</b></th><th><b>Element</b></th><th><b>Description</b></th><th><b>Type</b></th><th><b>Size(byte)</b></th><th><b>Mandatory</b></th><th><b>Multiplicity</b></th><th><b>Note</b></th></tr><tr><td>1</td><td data-highlight-colour="red">folderInsertRequest.<b>folder</b></td><td>フォルダ情報</td><td data-highlight-colour="red">XML : folder</td><td>-</td><td data-highlight-colour="red">○</td><td>1</td><td data-highlight-colour="red"></td></tr></tbody></table>

#### XML : file

<table><tbody><tr><th><b>No</b></th><th><b>Element</b></th><th><b>Description</b></th><th><b>Type</b></th><th><b>Size(byte)</b></th><th><b>Mandatory</b></th><th><b>Multiplicity</b></th><th><b>Note</b></th></tr><tr><td>1</td><td data-highlight-colour="red">folder.<b>folderName</b></td><td>フォルダ名</td><td data-highlight-colour="red">String</td><td>50</td><td data-highlight-colour="red">○</td><td>1</td><td data-highlight-colour="red"></td></tr><tr><td>2</td><td data-highlight-colour="red">folder.<b>directoryName</b></td><td>ディレクトリ名</td><td data-highlight-colour="red">String</td><td>20</td><td data-highlight-colour="red"></td><td>0,1</td><td data-highlight-colour="red">任意で指定可能なファイルパス。未指定の場合は自動採番（8桁以上の値）。<br>以下の英数字、記号が使用可能。<br>・"a~z"<br>・"0~9"<br>・"-", "_"</td></tr><tr><td>3</td><td data-highlight-colour="red">folder.<b>upperFolderId</b></td><td>上位階層フォルダ ID</td><td data-highlight-colour="red">Integer</td><td>10</td><td data-highlight-colour="red"></td><td>0,1</td><td data-highlight-colour="red">下位フォルダとして作成する場合はその上位階層フォルダIDを指定<br>0（基本フォルダ）は指定不可</td></tr></tbody></table>

#### Request Sample

```
<?xml version="1.0" encoding="UTF-8"?>
<request>
    <folderInsertRequest>
        <folder>
            <folderName>xxx</folderName>
            <directoryName>xxx</directoryName>
            <upperFolderId>19946</upperFolderId>
        </folder>
    </folderInsertRequest>
</request>

```

Response
--------

<table><tbody><tr><th><b>No</b></th><th><b>Key</b></th><th><b>Value</b></th></tr><tr><td>1</td><td data-highlight-colour="red">Content-Type</td><td>text/xml</td></tr></tbody></table>

### HTTP Body

#### XML : result

<table><tbody><tr><th><b>No</b></th><th><b>Element</b></th><th><b>Description</b></th><th><b>Type</b></th><th><b>Size(byte)</b></th><th><b>Multiplicity</b></th><th><b>Note</b></th></tr><tr><td>1</td><td data-highlight-colour="red">result.<b>status</b></td><td>ステータス</td><td data-highlight-colour="red"><a href="Functions%20Common%20Definition.md#xml--status">XML : status</a></td><td>-</td><td data-highlight-colour="red">1</td><td>interfaceId=cabinet.folder.insert</td></tr><tr><td>2</td><td data-highlight-colour="red">result.<b>cabinetFolderInsertResult</b></td><td>フォルダ情報登録結果</td><td data-highlight-colour="red">XML :&nbsp;cabinetFolderInsertResult</td><td>-</td><td data-highlight-colour="red">1</td><td></td></tr></tbody></table>

#### XML : cabinetFolderInsertResult

<table><tbody><tr><th><b>No</b></th><th><b>Element</b></th><th><b>Description</b></th><th><b>Type</b></th><th><b>Size(byte)</b></th><th><b>Multiplicity</b></th><th><b>Note</b></th></tr><tr><td>1</td><td data-highlight-colour="red">cabinetFolderInsertResult.<b>resultCode</b></td><td>結果コード</td><td data-highlight-colour="red">Integer</td><td>4</td><td data-highlight-colour="red">1</td><td></td></tr><tr><td>2</td><td data-highlight-colour="red">cabinetFolderInsertResult.<b>FolderId</b></td><td>フォルダ ID</td><td data-highlight-colour="red">Integer</td><td>10</td><td data-highlight-colour="red">1</td><td></td></tr></tbody></table>

#### Response sample

```
<?xml version="1.0" encoding="UTF-8"?>
<result>
    <status>
        <interfaceId>cabinet.folder.insert</interfaceId>
        <systemStatus>OK</systemStatus>
        <message>OK</message>
        <requestId>714a4983-555f-42d9-aeea-89dae89f2f45</requestId>
        <requests/>
    </status>
    <cabinetFolderInsertResult>
        <resultCode>0</resultCode>
        <FolderId>0</FolderId>
    </cabinetFolderInsertResult>
 </result>

```