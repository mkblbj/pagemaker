# 2.cabinet.folders.get
> この機能を利用すると、フォルダの一覧を取得することができます。

この機能を利用すると、フォルダの一覧を取得することができます。  
フォルダの登録、更新、削除後の情報が本機能の取得情報に反映されるまでの時間は最短 10 秒です。  
ページング機能 (offset, limit) を用いて情報取得している時にはフォルダの登録、更新、削除はお控えください。情報が正しく取得できない場合があります。

Endpoint / HTTP Method
----------------------

<table><tbody><tr><th><b>Endpoint</b></th><th><b>HTTP&nbsp;Method</b></th></tr><tr><td>https://api.rms.rakuten.co.jp/es/1.0/cabinet/folders/get</td><td data-highlight-colour="red">GET</td></tr></tbody></table>

Request
-------

<table><tbody><tr><th><b>No</b></th><th><b>Key</b></th><th><b>Value</b></th><th><b>Note</b></th></tr><tr><td>1</td><td data-highlight-colour="red">Authorization</td><td>ESA Base64(serviceSecret:licenseKey)</td><td data-highlight-colour="red"></td></tr></tbody></table>

### Query parameters

<table><tbody><tr><th><b>No</b></th><th><b>Parameter</b></th><th><b>Description</b></th><th><b>Type</b></th><th><b>Mandatory</b></th><th><b>Multiplicity</b></th><th><b>Note</b></th></tr><tr><td>1</td><td data-highlight-colour="red">offset</td><td>検索結果取得ページ数</td><td data-highlight-colour="red">Integer</td><td></td><td data-highlight-colour="red">0,1</td><td>1を基準値とした検索結果取得ページ数<br><br><b>例）100件データが存在する場合を仮定し、検索結果の1ページあたりの取得上限数を10に設定した場合</b><br>offset=1、limit=10 → 1件目～10件目のデータを取得する<br>offset=2、limit=10 → 11件目～20件目のデータを取得する<br>offset=3、limit=10 → 21件目～30件目のデータを取得する<br><br><b>例）100件データが存在する場合を仮定し、検索結果の1ページあたりの取得上限数を20に設定した場合</b><br>offset=1、limit=20 → 1件目～20件目のデータを取得する<br>offset=2、limit=20 → 21件目～40件目のデータを取得する<br>offset=3、limit=20 → 41件目～60件目のデータを取得する</td></tr><tr><td>2</td><td data-highlight-colour="red">limit</td><td>検索結果取得上限数</td><td data-highlight-colour="red">Integer</td><td></td><td data-highlight-colour="red">0,1</td><td>検索結果の1ページあたりの取得上限数<br><br><b>例）100件データが存在する場合を仮定し、検索結果の1ページあたりの取得上限数を10に設定した場合</b><br>offset=1、limit=10 → 1件目～10件目のデータを取得する<br>offset=2、limit=10 → 11件目～20件目のデータを取得する<br>offset=3、limit=10 → 21件目～30件目のデータを取得する<br><br><b>例）100件データが存在する場合を仮定し、検索結果の1ページあたりの取得上限数を20に設定した場合</b><br>offset=1、limit=20 → 1件目～20件目のデータを取得する<br>offset=2、limit=20 → 21件目～40件目のデータを取得する<br>offset=3、limit=20 → 41件目～60件目のデータを取得する<br><br>※値は100まで指定可能です。</td></tr></tbody></table>

### HTTP Body

None

Response
--------

<table><tbody><tr><th><b>No</b></th><th><b>Key</b></th><th><b>Value</b></th></tr><tr><td>1</td><td data-highlight-colour="red">Content-Type</td><td>text/xml</td></tr></tbody></table>

### HTTP Body

#### XML : result

<table><tbody><tr><th><b>No</b></th><th><b>Element</b></th><th><b>Description</b></th><th><b>Type</b></th><th><b>Size(byte)</b></th><th><b>Multiplicity</b></th><th><b>Note</b></th></tr><tr><td>1</td><td data-highlight-colour="red">result.<b>status</b></td><td>ステータス</td><td data-highlight-colour="red"><a href="Functions%20Common%20Definition.md#xml--status">XML : status</a></td><td>-</td><td data-highlight-colour="red">1</td><td>interfaceId=cabinet.folders.get</td></tr><tr><td>2</td><td data-highlight-colour="red">result.<b>cabinetFoldersGetResult</b></td><td>フォルダ内画像情報取得結果</td><td data-highlight-colour="red">XML :&nbsp;cabinetFoldersGetResult</td><td>-</td><td data-highlight-colour="red">1</td><td></td></tr></tbody></table>

#### XML : cabinetFoldersGetResult

<table><tbody><tr><th><b>No</b></th><th><b>Element</b></th><th><b>Description</b></th><th><b>Type</b></th><th><b>Size(byte)</b></th><th><b>Multiplicity</b></th><th><b>Note</b></th></tr><tr><td>1</td><td data-highlight-colour="red">cabinetFoldersGetResult.<b>resultCode</b></td><td>結果コード</td><td data-highlight-colour="red">Integer</td><td>4</td><td data-highlight-colour="red">1</td><td></td></tr><tr><td>2</td><td data-highlight-colour="red">cabinetFoldersGetResult.<b>folderAllCount</b></td><td>全フォルダ数</td><td data-highlight-colour="red">Integer</td><td>5</td><td data-highlight-colour="red">1</td><td></td></tr><tr><td>3</td><td data-highlight-colour="red">cabinetFoldersGetResult.<b>folderCount</b></td><td>返却フォルダ数</td><td data-highlight-colour="red">Integer</td><td>5</td><td data-highlight-colour="red">1</td><td></td></tr><tr><td>4</td><td data-highlight-colour="red">cabinetFoldersGetResult.<b>folders</b></td><td>フォルダ情報リスト</td><td data-highlight-colour="red">XML : folders</td><td>-</td><td data-highlight-colour="red">1</td><td></td></tr></tbody></table>

#### XML : folders

<table><tbody><tr><th><b>No</b></th><th><b>Element</b></th><th><b>Description</b></th><th><b>Type</b></th><th><b>Size(byte)</b></th><th><b>Multiplicity</b></th><th><b>Note</b></th></tr><tr><td>1</td><td data-highlight-colour="red">folders.<b>folder</b></td><td>フォルダ情報</td><td data-highlight-colour="red">XML : folder</td><td>-</td><td data-highlight-colour="red">1 ... n</td><td></td></tr></tbody></table>

#### XML : folder

<table><tbody><tr><th><b>No</b></th><th><b>Element</b></th><th><b>Description</b></th><th><b>Type</b></th><th><b>Size(byte)</b></th><th><b>Multiplicity</b></th><th><b>Note</b></th></tr><tr><td>1</td><td data-highlight-colour="red">folder.<b>FolderId</b></td><td>フォルダ ID</td><td data-highlight-colour="red">Integer</td><td>10</td><td data-highlight-colour="red">1</td><td></td></tr><tr><td>2</td><td data-highlight-colour="red">folder.<b>FolderName</b></td><td>フォルダ名</td><td data-highlight-colour="red">String</td><td>50</td><td data-highlight-colour="red">1</td><td></td></tr><tr><td>3</td><td data-highlight-colour="red">folder.<b>FolderNode</b></td><td>フォルダノード</td><td data-highlight-colour="red">Integer</td><td>1</td><td data-highlight-colour="red">1</td><td>1 or 2 or 3</td></tr><tr><td>4</td><td data-highlight-colour="red">folder.<b>FolderPath</b></td><td>フォルダパス</td><td data-highlight-colour="red">String</td><td>153</td><td data-highlight-colour="red">1</td><td>path1/path2/path3<br>区切り文字は"/"です。<br><br>フォルダ作成時にdirectory名を指定した場合、指定したdirectory名。<br>指定していなかった場合、以下の規則に基づいたフォーマット。<br>・フォルダIDが8桁未満の場合：8桁になるまでフォルダIDの冒頭に0を補完した値<br>・フォルダIDが8桁以上の場合：フォルダIDと同一の値</td></tr><tr><td>5</td><td data-highlight-colour="red">folder.<b>FileCount</b></td><td>格納画像数</td><td data-highlight-colour="red">Integer</td><td>10</td><td data-highlight-colour="red">1</td><td></td></tr><tr><td>6</td><td data-highlight-colour="red">folder.<b>FileSize</b></td><td>フォルダ内の画像の合計サイズ（KB）</td><td data-highlight-colour="red">Decimal</td><td>10,3 ※小数点第 3 位まで</td><td data-highlight-colour="red">1</td><td></td></tr><tr><td>7</td><td data-highlight-colour="red">folder.<b>TimeStamp</b></td><td>フォルダ更新日時</td><td data-highlight-colour="red">DateTime</td><td>19</td><td data-highlight-colour="red">1</td><td></td></tr></tbody></table>

#### Response sample

```
<?xml version="1.0" encoding="UTF-8"?>
<result>
    <status>
        <interfaceId>cabinet.folders.get</interfaceId>
        <systemStatus>OK</systemStatus>
        <message>OK</message>
        <requestId>714a4983-555f-42d9-aeea-89dae89f2f55</requestId>
    </status>
    <cabinetFoldersGetResult>
        <resultCode>0</resultCode>
        <folderAllCount>1000</folderAllCount> 
        <folderCount>100</folderCount>
        <folders>
            <folder>
                <FolderId>10001</FolderId>
                <!-- omission -->
            </folder>
            <folder>
                <FolderId>10002</FolderId>
                <!-- omission -->
            </folder>
            <folder>
                <FolderId>10003</FolderId>
                <!-- omission -->
            </folder>
        </folders>
    </cabinetFoldersGetResult>
</result>

```