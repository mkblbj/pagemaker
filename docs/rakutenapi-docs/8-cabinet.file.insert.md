# 8.cabinet.file.insert

> サービス一覧へ戻る / CabinetAPI

[サービス一覧へ戻る](https://webservice.rms.rakuten.co.jp/merchant-portal/backToMenu) / [CabinetAPI](https://webservice.rms.rakuten.co.jp/merchant-portal/view/ja/common/1-1_service_index/cabinetapi/ "CabinetAPI")

この機能を利用すると、画像ファイルを指定して画像を登録することができます。

Endpoint / HTTP Method
----------------------

<table><tbody><tr><td><b>Endpoint</b></td><td><b>HTTP&nbsp;Method</b></td></tr><tr><td>https://api.rms.rakuten.co.jp/es/1.0/cabinet/file/insert</td><td>POST</td></tr></tbody></table>

Request
-------

<table><tbody><tr><td><b>No</b></td><td><b>Key</b></td><td><b>Value</b></td><td><b>Note</b></td></tr><tr><td>1</td><td>Authorization</td><td>ESA Base64(serviceSecret:licenseKey)</td><td></td></tr><tr><td>2</td><td>Content-Type</td><td>multipart/form-data</td><td></td></tr></tbody></table>

### Query parameters

　None

### HTTP Body

#### Form Values

<table><tbody><tr><td><b>No</b></td><td><b>Key</b></td><td><b>Description</b></td><td><b>Mandatory</b></td><td><b>Type</b></td><td><b>Note</b></td></tr><tr><td>1</td><td>xml</td><td>リクエスト</td><td>○</td><td>String</td><td>APIのパラメータ</td></tr><tr><td>2</td><td>file</td><td>画像情報</td><td>○</td><td>binary</td><td>HTMLのフォームを使ったファイルアップロード<br><br>1ファイルあたりの重さ：2MBまで<br>1ファイルあたりのサイズ：横3840×縦3840pixelまで<br><br>登録可能な形式：JPG、GIF、アニメーションGIF、PNG、TIFF、BMP<br>※PNG、TIFF、BMP形式の画像はJPGに変換（その他の形式はエラー）</td></tr></tbody></table>

#### XML : request

<table><tbody><tr><td><b>No</b></td><td><b>Element</b></td><td><b>Description</b></td><td><b></b><p><b>Type</b></p></td><td><b>Size(byte)</b></td><td><b>Mandatory</b></td><td><b>Multiplicity</b></td><td><b>Note</b></td></tr><tr><td>1</td><td>request.<strong>fileInsertRequest</strong></td><td>画像情報登録要求</td><td>XML : fileInsertRequest</td><td>-</td><td>○</td><td>1</td><td></td></tr></tbody></table>

#### XML : fileInsertRequest

<table><tbody><tr><td><b>No</b></td><td><b>Element</b></td><td><b>Description</b></td><td><b>Type</b></td><td><b>Size(byte)</b></td><td><b>Mandatory</b></td><td><b>Multiplicity</b></td><td><b>Note</b></td></tr><tr><td>1</td><td>fileInsertRequest.<strong>file</strong></td><td>画像情報</td><td>XML : file</td><td>-</td><td>○</td><td>1</td><td></td></tr></tbody></table>

#### XML : file

<table><tbody><tr><td><b>No</b></td><td><b>Element</b></td><td><b>Description</b></td><td><b>Type</b></td><td><b>Size(byte)</b></td><td><b>Mandatory</b></td><td><b>Multiplicity</b></td><td><b>Note</b></td></tr><tr><td>1</td><td>file.<strong>fileName</strong></td><td>登録画像名</td><td>String</td><td>50</td><td>○</td><td>1</td><td>50バイト以内（全角25文字以内/半角50文字以内）<br><br>使用禁止文字：機種依存文字（コントロールコード除く）、半角カタカナ<br>全角スペース→半角スペースに変換<br>スペースのみは不可<br>前後にスペースがある場合は、スペースを自動削除<br>タグは無効（入力した場合は、タグと判断されたものを削除して表示）</td></tr><tr><td>2</td><td>file.<strong>folderId</strong></td><td>登録先フォルダ ID</td><td>Integer</td><td>10</td><td>○</td><td>0,1</td><td></td></tr><tr><td>3</td><td>file.<strong>filePath</strong></td><td>登録file名</td><td>String</td><td>20</td><td></td><td>0,1</td><td>20バイト以内（半角20文字以内）<br><br>デフォルト値：img[数字8桁].gif/jpg or imgrc[数字10桁].gif/jpg<br>入力可能文字：半角英数字（小文字）/記号は「-」「_」のみ<br>使用禁止文字：機種依存文字（コントロールコード含む）、img+8桁の数字、imgrc+10桁の数字<br><br>スペースのみ/字間にスペースは不可<br>前後にスペースがある場合は、スペースは自動削除<br>タグは無効（入力した場合はタグと判断されたものを削除して表示）</td></tr><tr><td>4</td><td>file.<strong>overWrite</strong></td><td>上書きフラグ</td><td>boolean</td><td>-</td><td></td><td>0,1</td><td>デフォルト値：false</td></tr></tbody></table>

　※overWrite が true かつ filePath の指定がある場合、filePath をキーとして画像情報を上書きすることができます。

#### Request Sample

  

```
<?xml version="1.0" encoding="UTF-8"?>
<request>
    <fileInsertRequest>
        <file>
            <fileName>ZZZ</fileName>
            <folderId>0</folderId>
            <filePath>img136281.jpg</filePath>
            <overWrite>true</overWrite>
        </file>
    </fileInsertRequest>
</request>

```

```
POST /public/1.0/cabinet/file/insert HTTP/1.1
Host: 127.0.0.1:8011
Proxy-Connection: keep-alive
Content-Length: 999999 --サイズ
User-Agent: Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/38.0.2125.111 Safari/537.36
Origin: chrome-extension://hgmloofddffdnphfgcellkdfbfbjeloo
Content-Type: multipart/form-data; boundary="【boundaryの文字列】"
Accept: */*
Accept-Encoding: gzip,deflate
Accept-Language: ja,en-US;q=0.8,en;q=0.6
 
------【boundaryの文字列】
Content-Disposition: form-data; 
 
<?xml version="1.0" encoding="UTF-8"?>
<request>
    <fileInsertRequest>
        <file>
            <fileName>ZZZ</fileName>
            <folderId>0</folderId>
            <filePath>img136281.jpg</filePath>
            <overWrite>true</overWrite>
        </file>
    </fileInsertRequest>
</request>

------【boundaryの文字列】
Content-Disposition: form-data; 
Content-Type: image/jpg
 
[画像ファイルのバイナリデータ]
------【boundaryの文字列】--

```

Response
--------

<table><tbody><tr><td><b>No</b></td><td><b>Key</b></td><td><b>Value</b></td></tr><tr><td>1</td><td>Content-Type</td><td>text/xml</td></tr></tbody></table>

### HTTP Body

#### XML : result

<table><tbody><tr><td><b>No</b></td><td><b>Element</b></td><td><b>Description</b></td><td><b>Type</b></td><td><p><b>Size(byte)</b></p></td><td><p><b>Multiplicity</b></p></td><td><b>Note</b></td></tr><tr><td>1</td><td><p>result.<strong>status</strong></p></td><td>ステータス</td><td><a href="Functions%20Common%20Definition.md#xml--status">XML : status</a></td><td>-</td><td>1</td><td><p>interfaceId=cabinet.file.insert</p></td></tr><tr><td>2</td><td><p>result.<strong>cabinetFileInsertResult</strong><strong></strong></p></td><td><p>画像情報登録結果</p></td><td><p>XML :&nbsp;cabinetFileInsertResult</p></td><td>-</td><td>1</td><td></td></tr></tbody></table>

#### XML : cabinetFileInsertResult

<table><tbody><tr><td><b>No</b></td><td><b>Element</b></td><td><p><b>Description</b></p></td><td><b>Type</b></td><td><p><b>Size(byte)</b></p></td><td><b>Multiplicity</b></td><td><b>Note</b></td></tr><tr><td>1</td><td><p>cabinetFileInsertResult.<strong>resultCode</strong></p></td><td><strong></strong><p>結果コード</p></td><td><p>Integer</p></td><td><p>4</p></td><td>1</td><td></td></tr><tr><td>2</td><td><p>cabinetFileInsertResult.<strong>FileId</strong></p></td><td><strong></strong><p>画像 ID</p></td><td>Integer</td><td><p>10</p></td><td>1</td><td></td></tr></tbody></table>

#### Response sample

  

```
<?xml version="1.0" encoding="UTF-8"?>
<result>
    <status>
        <interfaceId>cabinet.file.insert</interfaceId>
        <systemStatus>OK</systemStatus>
        <message>OK</message>
        <requestId>714a4983-555f-42d9-aeea-89dae89f2f45</requestId>
        <requests />
    </status>
    <cabinetFileInsertResult>
        <resultCode>0</resultCode>
        <FileId>0</FileId>
    </cabinetFileInsertResult>
</result>

```