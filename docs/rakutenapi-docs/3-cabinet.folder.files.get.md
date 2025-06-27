# 3.cabinet.folder.files.get

> この機能を利用すると、指定したフォルダ内の画像一覧を取得することができます。

この機能を利用すると、指定したフォルダ内の画像一覧を取得することができます。  
画像の登録、更新、削除後の情報が本機能の取得情報に反映されるまでの時間は最短 10 秒です。  
ページング機能 (offset, limit) を用いて情報取得をしている時には該当フォルダの画像の登録、更新、削除はお控えください。情報が正しく取得できない場合があります。

Endpoint / HTTP Method
----------------------

<table><tbody><tr><th><b>Endpoint</b></th><th><b>HTTP&nbsp;Method</b></th></tr><tr><td>https://api.rms.rakuten.co.jp/es/1.0/cabinet/folder/files/get</td><td data-highlight-colour="red">GET</td></tr></tbody></table>

Request
-------

<table><tbody><tr><th><b>No</b></th><th><b>Key</b></th><th><b>Value</b></th><th><b>Note</b></th></tr><tr><td>1</td><td data-highlight-colour="red">Authorization</td><td>ESA Base64(serviceSecret:licenseKey)</td><td data-highlight-colour="red"></td></tr></tbody></table>

### Query parameters

<table><tbody><tr><th><b>No</b></th><th><b>Parameter</b></th><th><b>Description</b></th><th><b>Type</b></th><th><b>Mandatory</b></th><th><b>Multiplicity</b></th><th><b>Note</b></th></tr><tr><td>1</td><td data-highlight-colour="red">folderId</td><td>フォルダ ID</td><td data-highlight-colour="red">Integer</td><td>○</td><td data-highlight-colour="red">1</td><td></td></tr><tr><td>2</td><td data-highlight-colour="red">offset</td><td>検索結果取得ページ数</td><td data-highlight-colour="red">Integer</td><td></td><td data-highlight-colour="red">0,1</td><td>1を基準値とした検索結果取得ページ数<br><br><b>例）100件データが存在する場合を仮定し、検索結果の1ページあたりの取得上限数を10に設定した場合</b><br>offset=1、limit=10 → 1件目～10件目のデータを取得する<br>offset=2、limit=10 → 11件目～20件目のデータを取得する<br>offset=3、limit=10 → 21件目～30件目のデータを取得する<br><br><b>例）100件データが存在する場合を仮定し、検索結果の1ページあたりの取得上限数を20に設定した場合</b><br>offset=1、limit=20 → 1件目～20件目のデータを取得する<br>offset=2、limit=20 → 21件目～40件目のデータを取得する<br>offset=3、limit=20 → 41件目～60件目のデータを取得する</td></tr><tr><td>3</td><td data-highlight-colour="red">limit</td><td>検索結果取得上限数</td><td data-highlight-colour="red">Integer</td><td></td><td data-highlight-colour="red">0,1</td><td>検索結果の1ページあたりの取得上限数<br><br><b>例）100件データが存在する場合を仮定し、検索結果の1ページあたりの取得上限数を10に設定した場合</b><br>offset=1、limit=10 → 1件目～10件目のデータを取得する<br>offset=2、limit=10 → 11件目～20件目のデータを取得する<br>offset=3、limit=10 → 21件目～30件目のデータを取得する<br><br><b>例）100件データが存在する場合を仮定し、検索結果の1ページあたりの取得上限数を20に設定した場合</b><br>offset=1、limit=20 → 1件目～20件目のデータを取得する<br>offset=2、limit=20 → 21件目～40件目のデータを取得する<br>offset=3、limit=20 → 41件目～60件目のデータを取得する<br><br>※値は100まで指定可能です。</td></tr></tbody></table>

### HTTP Body

None

Response
--------

<table><tbody><tr><th><b>No</b></th><th><b>Key</b></th><th><b>Value</b></th></tr><tr><td>1</td><td data-highlight-colour="red">Content-Type</td><td>text/xml</td></tr></tbody></table>

### HTTP Body

#### XML : result

<table><tbody><tr><th><b>No</b></th><th><b>Element</b></th><th><b>Description</b></th><th><b>Type</b></th><th><b>Size(byte)</b></th><th><b>Multiplicity</b></th><th><b>Note</b></th></tr><tr><td>1</td><td data-highlight-colour="red">result.<b>status</b></td><td>ステータス</td><td data-highlight-colour="red"><a href="Functions%20Common%20Definition.md#xml--status">XML : status</a></td><td>-</td><td data-highlight-colour="red">1</td><td>interfaceId=cabinet.folder.files.get</td></tr><tr><td>2</td><td data-highlight-colour="red">result.<b>cabinetFolderFilesGetResult</b></td><td>フォルダ内画像情報取得結果</td><td data-highlight-colour="red">XML : cabinetFolderFilesGetResult&nbsp;</td><td>-</td><td data-highlight-colour="red">1</td><td></td></tr></tbody></table>

#### XML : cabinetFolderFilesGetResult

<table><tbody><tr><th><b>No</b></th><th><b>Element</b></th><th><b>Description</b></th><th><b>Type</b></th><th><b>Size(byte)</b></th><th><b>Multiplicity</b></th><th><b>Note</b></th></tr><tr><td>1</td><td data-highlight-colour="red">cabinetFolderFilesGetResult.<b>resultCode</b></td><td>結果コード</td><td data-highlight-colour="red">Integer</td><td>4</td><td data-highlight-colour="red">1</td><td></td></tr><tr><td>2</td><td data-highlight-colour="red">cabinetFolderFilesGetResult.<b>fileAllCount</b></td><td>全画像数</td><td data-highlight-colour="red">Integer</td><td>5</td><td data-highlight-colour="red">1</td><td></td></tr><tr><td>3</td><td data-highlight-colour="red">cabinetFolderFilesGetResult.<b>fileCount</b></td><td>返却画像数</td><td data-highlight-colour="red">Integer</td><td>5</td><td data-highlight-colour="red">1</td><td></td></tr><tr><td>4</td><td data-highlight-colour="red">cabinetFolderFilesGetResult.<b>files</b></td><td>画像情報リスト</td><td data-highlight-colour="red">XML :&nbsp;files</td><td>-</td><td data-highlight-colour="red">1</td><td></td></tr></tbody></table>

#### XML : files

<table><tbody><tr><th><b>No</b></th><th><b>Element</b></th><th><b>Description</b></th><th><b>Type</b></th><th><b>Size(byte)</b></th><th><b>Multiplicity</b></th><th><b>Note</b></th></tr><tr><td>1</td><td data-highlight-colour="red">files.<b>file</b></td><td>画像情報</td><td data-highlight-colour="red">XML :&nbsp;file</td><td>-</td><td data-highlight-colour="red">1 ... n</td><td></td></tr></tbody></table>

#### XML : file

<table><tbody><tr><th><b>No</b></th><th><b>Element</b></th><th><b>Description</b></th><th><b>Type</b></th><th><b>Size(byte)</b></th><th><b>Multiplicity</b></th><th><b>Note</b></th></tr><tr><td>1</td><td data-highlight-colour="red">file.<b>FolderId</b></td><td>フォルダ ID</td><td data-highlight-colour="red">Integer</td><td>10</td><td data-highlight-colour="red">1</td><td></td></tr><tr><td>2</td><td data-highlight-colour="red">file.<b>FolderName</b></td><td>フォルダ名</td><td data-highlight-colour="red">String</td><td>50</td><td data-highlight-colour="red">1</td><td></td></tr><tr><td>3</td><td data-highlight-colour="red">file.<b>FolderNode</b></td><td>フォルダノード</td><td data-highlight-colour="red">Integer</td><td>1</td><td data-highlight-colour="red">1</td><td>1 or 2 or 3</td></tr><tr><td>4</td><td data-highlight-colour="red">file.<b>FolderPath</b></td><td>フォルダパス</td><td data-highlight-colour="red">String</td><td>153</td><td data-highlight-colour="red">1</td><td>path1/path2/path3<br>区切り文字は"/"です。<br><br>フォルダ作成時にdirectory名を指定した場合、指定したdirectory名。<br>指定していなかった場合、以下の規則に基づいたフォーマット。<br>・フォルダIDが8桁未満の場合：8桁になるまでフォルダIDの冒頭に0を補完した値<br>・フォルダIDが8桁以上の場合：フォルダIDと同一の値</td></tr><tr><td>5</td><td data-highlight-colour="red">file.<b>FileId</b></td><td>画像 ID</td><td data-highlight-colour="red">Integer</td><td>10</td><td data-highlight-colour="red">1</td><td></td></tr><tr><td>6</td><td data-highlight-colour="red">file.<b>FileName</b></td><td>画像名</td><td data-highlight-colour="red">String</td><td>50</td><td data-highlight-colour="red">1</td><td></td></tr><tr><td>7</td><td data-highlight-colour="red">file.<b>FileUrl</b></td><td>画像保存先</td><td data-highlight-colour="red">String</td><td>265</td><td data-highlight-colour="red">1</td><td></td></tr><tr><td>8</td><td data-highlight-colour="red">file.<b>FilePath</b></td><td>file 名</td><td data-highlight-colour="red">String</td><td>50</td><td data-highlight-colour="red">1</td><td></td></tr><tr><td>9</td><td data-highlight-colour="red">file.<b>FileType</b></td><td>画像タイプ</td><td data-highlight-colour="red">Integer</td><td>1</td><td data-highlight-colour="red">1</td><td></td></tr><tr><td>10</td><td data-highlight-colour="red">file.<b>FileSize</b></td><td>画像サイズ (KB)</td><td data-highlight-colour="red">Decimal</td><td>7</td><td data-highlight-colour="red">1</td><td></td></tr><tr><td>11</td><td data-highlight-colour="red">file.<b>FileWidth</b></td><td>画像の横幅</td><td data-highlight-colour="red">Integer</td><td>4</td><td data-highlight-colour="red">1</td><td></td></tr><tr><td>12</td><td data-highlight-colour="red">file.<b>FileHeight</b></td><td>画像の縦幅</td><td data-highlight-colour="red">Integer</td><td>4</td><td data-highlight-colour="red">1</td><td></td></tr><tr><td>13</td><td data-highlight-colour="red">file.<b>FileAccessDate</b></td><td>画像アクセス日</td><td data-highlight-colour="red">Date</td><td>10</td><td data-highlight-colour="red">1</td><td>2018年以降、機能の停止に伴い、画像アクセス日は更新されておりません。<br>現在、この項目には画像が新規登録された日付が設定されます。<br>画像にアクセスしても、この日付は更新されませんのでご注意ください。</td></tr><tr><td>14</td><td data-highlight-colour="red">file.<b>TimeStamp</b></td><td>画像情報更新日時</td><td data-highlight-colour="red">DateTime</td><td>19</td><td data-highlight-colour="red">1</td><td></td></tr></tbody></table>

#### Response sample

```
<?xml version="1.0" encoding="UTF-8"?>
<result>
    <status>
        <interfaceId>cabinet.folder.files.get</interfaceId>
        <systemStatus>OK</systemStatus>
        <message>OK</message>
        <requestId>714a4983-555f-42d9-aeea-89dae89f2f55</requestId>
        <requests>
            <folderId>aaa</folderId>
        </requests>
    </status>
    <cabinetFolderFilesGetResult>
        <resultCode>0</resultCode>
        <fileAllCount>1000</fileAllCount>
        <fileCount>100</fileCount>
        <files>
            <file>
                <FolderId>10001</FolderId>
                <!-- omission -->
            </file>
            <file>
                <FolderId>10002</FolderId>
                <!-- omission -->
            </file>
            <file>
                <FolderId>10003</FolderId>
                <!-- omission -->
            </file>
        </files>
    </cabinetFolderFilesGetResult>
</result>

```