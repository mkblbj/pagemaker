# 4.cabinet.files.search

> サービス一覧へ戻る / CabinetAPI

[サービス一覧へ戻る](https://webservice.rms.rakuten.co.jp/merchant-portal/backToMenu) / [CabinetAPI](https://webservice.rms.rakuten.co.jp/merchant-portal/view/ja/common/1-1_service_index/cabinetapi/ "CabinetAPI")  

この機能を利用すると、画像名を指定して画像を検索することができます。  
画像の登録、更新、削除後の情報が本機能の取得情報に反映されるまでの時間は最短 10 秒です。  
ページング機能 (offset, limit) を用いて情報取得をしている時には画像の登録、更新、削除はお控えください。情報が正しく取得できない場合があります。

Endpoint / HTTP Method
----------------------

<table><tbody><tr><td><b>Endpoint</b></td><td><b>HTTP&nbsp;Method</b></td></tr><tr><td>https://api.rms.rakuten.co.jp/es/1.0/cabinet/files/search</td><td>GET</td></tr></tbody></table>

Request
-------

<table><tbody><tr><td><b>No</b></td><td><b>Key</b></td><td><b>Value</b></td><td><b>Note</b></td></tr><tr><td>1</td><td>Authorization</td><td>ESA Base64(serviceSecret:licenseKey)</td><td></td></tr></tbody></table>

### Query parameters

<table><tbody><tr><th>No</th><th>Parameter</th><th>Description</th><th>Type</th><th>Mandatory</th><th>Multiplicity</th><th>Note</th></tr><tr><td>1</td><td data-highlight-colour="red">fileId</td><td>画像 ID</td><td data-highlight-colour="red">Integer</td><td colspan="1" rowspan="3">△</td><td data-highlight-colour="red">0,1</td><td colspan="1" rowspan="3">画像ID、ファイル名、画像名のうちいずれか一つを必ず指定する必要あります。<br><br>複数指定した場合、（１）画像ID　（２）ファイル名　（３）画像名の優先順位で検索します。</td></tr><tr><td>2</td><td data-highlight-colour="red">filePath</td><td>ファイル名</td><td data-highlight-colour="red">String</td><td data-highlight-colour="red">0,1</td></tr><tr><td>3</td><td data-highlight-colour="red">fileName</td><td>画像名</td><td data-highlight-colour="red">String</td><td data-highlight-colour="red">0,1</td></tr><tr><td>4</td><td data-highlight-colour="red">folderId</td><td>フォルダ ID</td><td data-highlight-colour="red">Integer</td><td></td><td data-highlight-colour="red">0,1</td><td colspan="1" rowspan="2">フォルダID、フォルダ名を両方指定した場合は、フォルダIDを優先して検索します。</td></tr><tr><td>5</td><td data-highlight-colour="red">folderPath</td><td>フォルダ名</td><td data-highlight-colour="red">String</td><td></td><td data-highlight-colour="red">0,1</td></tr><tr><td>6</td><td data-highlight-colour="red">offset</td><td>検索結果取得ページ数</td><td data-highlight-colour="red">Integer</td><td></td><td data-highlight-colour="red">0,1</td><td>1を基準値とした検索結果取得ページ数<br><br><b>例）100件データが存在する場合を仮定し、検索結果の1ページあたりの取得上限数を10に設定した場合</b><br>offset=1、limit=10 → 1件目～10件目のデータを取得する<br>offset=2、limit=10 → 11件目～20件目のデータを取得する<br>offset=3、limit=10 → 21件目～30件目のデータを取得する<br><br><b>例）100件データが存在する場合を仮定し、検索結果の1ページあたりの取得上限数を20に設定した場合</b><br>offset=1、limit=20 → 1件目～20件目のデータを取得する<br>offset=2、limit=20 → 21件目～40件目のデータを取得する<br>offset=3、limit=20 → 41件目～60件目のデータを取得する</td></tr><tr><td>7</td><td data-highlight-colour="red">limit</td><td>検索結果取得上限数</td><td data-highlight-colour="red">Integer</td><td></td><td data-highlight-colour="red">0,1</td><td colspan="1" rowspan="2">検索結果の1ページあたりの取得上限数<br><br><b>例）100件データが存在する場合を仮定し、検索結果の1ページあたりの取得上限数を10に設定した場合</b><br>offset=1、limit=10 → 1件目～10件目のデータを取得する<br>offset=2、limit=10 → 11件目～20件目のデータを取得する<br>offset=3、limit=10 → 21件目～30件目のデータを取得する<br><br><b>例）100件データが存在する場合を仮定し、検索結果の1ページあたりの取得上限数を20に設定した場合</b><br>offset=1、limit=20 → 1件目～20件目のデータを取得する<br>offset=2、limit=20 → 21件目～40件目のデータを取得する<br>offset=3、limit=20 → 41件目～60件目のデータを取得する<br><br>※値は100まで指定可能です。</td></tr></tbody></table>

### HTTP Body

　None

Response
--------

<table><tbody><tr><td><b>No</b></td><td><b>Key</b></td><td><b>Value</b></td></tr><tr><td>1</td><td>Content-Type</td><td>text/xml</td></tr></tbody></table>

### HTTP Body

#### XML:result

<table><tbody><tr><td><b>No</b></td><td><b>Element</b></td><td><b>Description</b></td><td><b>Type</b></td><td><p><b>Size(byte)</b></p></td><td><p><b>Multiplicity</b></p></td><td><b>Note</b></td></tr><tr><td>1</td><td><p>result.<strong>status</strong></p></td><td>ステータス</td><td><p><a href="Functions%20Common%20Definition.md#xml--status">XML:status</a></p></td><td>-</td><td>1</td><td><p>interfaceId=cabinet.files.search</p></td></tr><tr><td>2</td><td><p>result.<strong>cabinetFilesSearchResult</strong></p></td><td><p>フォルダ内画像情報検索結果</p></td><td>XML:cabinetFilesSearchResult<br></td><td>-</td><td>1</td><td></td></tr></tbody></table>

#### XML:cabinetFilesSearchResult

<table><tbody><tr><td><b>No</b></td><td><b>Element</b></td><td><b>Description</b></td><td><b>Type</b></td><td><p><b>Size(byte)</b></p></td><td><b>Multiplicity</b></td><td><b>Note</b></td></tr><tr><td>1</td><td><p>cabinetFilesSearchResult.<strong>resultCode</strong></p></td><td><p>結果コード</p></td><td>Integer</td><td>4</td><td>1</td><td></td></tr><tr><td>2</td><td><p>cabinetFilesSearchResult.<strong>fileAllCount</strong></p></td><td>全画像数</td><td>Integer</td><td>5</td><td>1</td><td></td></tr><tr><td>3</td><td><p>cabinetFilesSearchResult.<strong>fileCount</strong></p></td><td><p>返却画像数</p></td><td>Integer</td><td>5</td><td>1</td><td></td></tr><tr><td>4</td><td><p>cabinetFilesSearchResult.<strong>files</strong></p></td><td><p>画像情報リスト</p></td><td><p>XML :&nbsp;files<br></p></td><td>-</td><td>1</td><td></td></tr></tbody></table>

#### XML:files

<table><tbody><tr><td><b>No</b></td><td><b>Element</b></td><td><b>Description</b></td><td><b>Type</b></td><td><p><b>Size(byte)</b></p></td><td><b>Multiplicity</b></td><td><b>Note</b></td></tr><tr><td>1</td><td>file</td><td>ファイル情報</td><td>XML :&nbsp;file<br></td><td>-</td><td>1 ... n</td><td></td></tr></tbody></table>

#### XML:file

<table><tbody><tr><td><b>No</b></td><td><b>Element</b></td><td><b>Description</b></td><td><b>Type</b></td><td><b>Size(byte)</b></td><td><b>Multiplicity</b></td><td><b>Note</b></td></tr><tr><td>1</td><td>file.<strong>FolderId</strong></td><td><p>フォルダ ID</p></td><td>Integer</td><td>10</td><td>1</td><td></td></tr><tr><td>2</td><td>file.<strong>FolderName</strong></td><td><p>フォルダ名</p></td><td>String</td><td>50</td><td>1</td><td></td></tr><tr><td>3</td><td>file.<strong>FolderNode</strong></td><td><p>フォルダノード</p></td><td>Integer</td><td>1</td><td>1</td><td>1 or 2 or 3</td></tr><tr><td>4</td><td>file.<strong>FolderPath</strong></td><td><p>フォルダパス</p></td><td>String</td><td>153</td><td>1</td><td>path1/path2/path3<br>区切り文字は"/"です。</td></tr><tr><td>5</td><td>file.<strong>FileId</strong></td><td>画像 ID</td><td>Integer</td><td>10</td><td>1</td><td></td></tr><tr><td>6</td><td>file.<strong>FileName</strong></td><td>画像名</td><td>String</td><td>50</td><td>1</td><td></td></tr><tr><td>7</td><td>file.<strong>FileUrl</strong></td><td>画像保存先</td><td>String</td><td>265</td><td>1</td><td></td></tr><tr><td>8</td><td>file.<strong>FilePath</strong></td><td>file 名</td><td>String</td><td>50</td><td>1</td><td></td></tr><tr><td>9</td><td>file.<strong>FileType</strong></td><td>画像タイプ</td><td>Integer</td><td>1</td><td>1</td><td></td></tr><tr><td>10</td><td>file.<strong>FileSize</strong></td><td><strong></strong>画像サイズ (KB)</td><td>Decimal</td><td>7</td><td>1</td><td></td></tr><tr><td>11</td><td>file.<strong>FileWidth</strong></td><td>画像の横幅</td><td>Integer</td><td>4</td><td>1</td><td></td></tr><tr><td>12</td><td>file.<strong>FileHeight</strong></td><td>画像の縦幅</td><td>Integer</td><td>4</td><td>1</td><td></td></tr><tr><td>13</td><td>file.<strong>FileAccessDate</strong></td><td>画像アクセス日</td><td>Date</td><td>10</td><td>1</td><td></td></tr><tr><td>14</td><td>file.<strong>TimeStamp</strong></td><td>画像情報更新日時</td><td>DateTime</td><td>19</td><td>1</td><td></td></tr></tbody></table>

#### Response sample

  

```
<?xml version="1.0" encoding="UTF-8"?>
<result>
    <status>
        <interfaceId>cabinet.files.search</interfaceId>
        <systemStatus>OK</systemStatus>
        <message>OK</message>
        <requestId>714a4983-555f-42d9-aeea-89dae89f2f55</requestId> 
        <requests>
            <folderId>aaa</folderId>
            <fileName>bbb</fileName>
        </requests>
    </status>
    <cabinetFilesSearchResult> 
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
    </cabinetFilesSearchResult>
</result>

```