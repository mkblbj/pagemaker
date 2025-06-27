# RMS WEB SERVICE : CabinetAPI

> CabinetAPI は R-Cabinet 上のフォルダ、画像の管理をサポートする API です。

* * *

CabinetAPI は R-Cabinet 上のフォルダ、画像の管理をサポートする API です。

[1. 機能一覧](#機能一覧)

[2. エラーメッセージ](#エラーメッセージ)

[3. 認証・認可](#認証・認可)

[4. 制約事項](#制約事項)

[5. 参考資料](#参考資料)

[6. 更新履歴](#更新履歴)

機能一覧
----

1.  [cabinet.usage.get](1-cabinet.usage.get.md)  
    この機能を利用すると、R-Cabinet の利用状況を取得することができます。
2.  [cabinet.folders.get](2-cabinet.folders.get.md)  
    この機能を利用すると、フォルダの一覧を取得することができます。  
    画像の登録、更新、削除後の情報が本機能の取得情報に反映されるまでの時間は最短 10 秒です。
3.  [cabinet.folder.files.get](3-cabinet.folder.files.get.md)  
    この機能を利用すると、指定したフォルダ内の画像一覧を取得することができます。  
    画像の登録、更新、削除後の情報が本機能の取得情報に反映されるまでの時間は最短 10 秒です。
4.  [cabinet.files.search](4-cabinet.files.search.md)  
    この機能を利用すると、画像名を指定して画像を検索することができます。  
    画像の登録、更新、削除後の情報が本機能の取得情報に反映されるまでの時間は最短 10 秒です。
5.  [cabinet.file.delete](5-cabinet.file.delete.md)  
    この機能を利用すると、画像 ID を指定して画像を削除フォルダに移動することができます。
6.  [cabinet.trashbox.files.get](6-cabinet.trashbox.files.get.md)  
    この機能を利用すると、削除フォルダ内にある画像の一覧を取得することができます。  
    画像の登録、更新、削除後の情報が本機能の取得情報に反映されるまでの時間は最短 10 秒です。
7.  [cabinet.trashbox.files.revert](7-cabinet.trashbox.file.revert.md)  
    この機能を利用すると、削除フォルダ内にある画像を指定したフォルダに戻すことができます。
8.  [cabinet.file.insert](8-cabinet.file.insert.md)  
    この機能を利用すると、画像ファイルを指定して画像を登録することができます。
9.  [cabinet.file.update](9-cabinet.file.update.md)  
    この機能を利用すると、画像 ID を指定して画像情報を更新することができます。
10.  [cabinet.folder.insert](10-cabinet.folder.insert.md)  
    この機能を利用すると、フォルダを作成することができます。

エラーメッセージ
--------

*   [Code Reference](Functions%20Common%20Definition.md#code-reference)

認証・認可
-----

本 API の認証方法につきましては、「[RMS WEB SERVICE の認証](Functions%20Common%20Definition.md#rms-web-service-authentication)」を参照してください。 

制約事項
----

ここでは、CabinetAPI における制約事項について記載します。

### CabinetAPI の files/search 機能で取得できる画像情報について

R-Cabinet 上に登録されている画像枚数にかかわらず、検索結果で返却される画像の上限は 50,000 件までです。  
検索結果が 50,000 件を超える場合には、検索する条件を変更して再度お試しください。

### R-Cabinet 上の動画ファイルについて

CabinetAPI では、動画情報の管理はできません。

### 利用登録について

R-Cabinet にアクセスしたことがない状態で、CabinetAPI を実行するとエラー (AuthError) が発生します。  
エラーが発生する場合は、一度 R-Cabinet にアクセスしてから CabinetAPI を実行してください。

<table><tbody><tr><th><b>R-Cabinet</b></th></tr><tr><td>RMS メインメニュー　＞　1　店舗設定　＞　1-3　画像・動画登録　＞　画像管理</td></tr></tbody></table>

```
<?xml version="1.0" encoding="UTF-8"?>
<result>
        <status>
                <interfaceId>cabinet.usage.get</interfaceId>
                <systemStatus>NG</systemStatus>
                <message>AuthError</message>
                <requestId>b69733e9-89da-4bff-a876-7f36041db0b9</requestId>
        </status>
</result>

```

### 画像管理について

画像管理につきましては、出店プランごとにその制限が異なります。  
詳細は、[店舗運営 Navi](https://navi-manual.faq.rakuten.net/rule/000031730) をご確認ください。

### 利用方法について

CabinetAPI へのリクエストは、1 秒に 1 リクエストまでを目安にアクセスしてください。  
※ トラフィックが集中した場合には、トラフィック制限をかけさせていただく場合がございます。

参考資料
----

*   [Use Cases](Functions%20Common%20Definition.md#use-cases)

  

更新履歴
----

<table><tbody><tr><th>No</th><th>Ver.</th><th>Update Date</th><th>Description</th></tr><tr><td>1</td><td>1.0</td><td>2014/05/21</td><td>初版</td></tr><tr><td>2</td><td>2.0</td><td>2014/10/14</td><td>下記機能追加<br>　・ cabinet.file.delete<br>　・ cabinet.trashbox.files.get<br>　・ cabinet.trashbox.file.revert</td></tr><tr><td>3</td><td>2.1</td><td>2014/11/11</td><td>記載不備がありましたので、記載を削除しました。<br>　cabinet.file.delete Response の項目 fileId「ファイル ID」</td></tr><tr><td>4</td><td>3.0</td><td>2015/01/14</td><td>下記機能追加<br>　・ cabinet.file.insert<br>　・ cabinet.file.update<br>　・ cabinet.folder.insert</td></tr><tr><td>5</td><td>3.1</td><td>2015/04/23</td><td>記載不備がありましたので、記載を削除しました。<br>　cabinet.trashbox.file.revert Response の項目 file「ファイル情報」</td></tr><tr><td>6</td><td>3.2</td><td>2016/07/19</td><td>エラーコードを追加（errorId: 3013, 3014, 3015)<br>　<a href="Functions%20Common%20Definition.md#cabinetapi-codes-reference">CabinetAPI Codes Reference</a></td></tr><tr><td>7</td><td>3.3</td><td>2016/08/23</td><td>以下の機能に関して、画像の登録、更新、削除後の情報が取得情報へ反映されるまでの時間が最大 30 分から最短 10 秒に変更。<br>　・ cabinet.folders.get<br>　・ cabinet.folder.files.get<br>　・ cabinet.files.search<br>　・ cabinet.trashbox.files.get</td></tr><tr><td>8</td><td>3.4</td><td>2016/10/06</td><td>エラーコードを追加（ errorId: 6004 )<br>　<a href="Functions%20Common%20Definition.md#cabinetapi-codes-reference">CabinetAPI Codes Reference</a></td></tr><tr><td>9</td><td>3.5</td><td>2018/03/28</td><td>cabinet.files.search の 2.2 Query parameters を更新<br>　・ No. 1 fileId を追加<br>　・ No. 2 filepath を追加<br>　・ No. 5 folderpath を追加</td></tr><tr><td>10</td><td>3.6</td><td>2020/09/25</td><td>以下の機能に関して、画像 1 ファイルあたりのサイズ制限を、縦横ともに 3840 ピクセルに変更<br>　・ cabinet.file.insert<br>　・ cabinet.file.update</td></tr><tr><td>11</td><td>3.7</td><td>2021/02/08</td><td>cabinet.folder.insert に記載不備がありましたので、3.2.2 XML : cabinetFolderInsertResult を修正</td></tr><tr><td>12</td><td>3.8</td><td>2022/07/28</td><td>cabinet.file.insert<br>　登録可能な画像形式は「JPEG」より「JPG」に変更</td></tr><tr><td>13</td><td>3.9</td><td>2023/08/04</td><td>cabinet.folder.insert<br>　folder.directoryName の「Description」と「Note」を修正<br>以下の機能に関して、folder.FolderPath の「Note」を修正<br>　・ cabinet.folders.get<br>　・ cabinet.folder.files.get<br>他に軽微な修正</td></tr><tr><td>14</td><td>4.0</td><td>2024/10/18</td><td>cabinet.folder.files.get<br>　file.FileAccessDate の「Note」を修正</td></tr></tbody></table>