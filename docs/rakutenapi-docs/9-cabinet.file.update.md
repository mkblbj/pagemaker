# 9.cabinet.file.update

> サービス一覧へ戻る / CabinetAPI

[サービス一覧へ戻る](https://webservice.rms.rakuten.co.jp/merchant-portal/backToMenu) / [CabinetAPI](https://webservice.rms.rakuten.co.jp/merchant-portal/view/ja/common/1-1_service_index/cabinetapi/ "CabinetAPI")

この機能を利用すると、画像 ID を指定して画像情報を更新することができます。

Endpoint / HTTP Method
----------------------

<table><tbody><tr><td><b>Endpoint</b></td><td><b>HTTP&nbsp;Method</b></td></tr><tr><td>https://api.rms.rakuten.co.jp/es/1.0/cabinet/file/update</td><td>POST</td></tr></tbody></table>

Request
-------

<table><tbody><tr><td><b>No</b></td><td><b>Key</b></td><td><b>Value</b></td><td><b>Note</b></td></tr><tr><td>1</td><td>Authorization</td><td>ESA Base64(serviceSecret:licenseKey)</td><td></td></tr><tr><td>2</td><td>Content-Type</td><td>multipart/form-data</td><td></td></tr></tbody></table>

### Query parameters

　None

### HTTP Body

#### Form Values

<table><tbody><tr><td><b>No</b></td><td><b>Key</b></td><td><b>Description</b></td><td><b>Mandatory</b></td><td><b>Type</b></td><td><b>Note</b></td></tr><tr><td>1</td><td>xml</td><td>リクエスト</td><td>○</td><td>String</td><td>APIのパラメータ</td></tr><tr><td>2</td><td>file</td><td>画像情報</td><td>※1</td><td>binary</td><td>HTMLのフォームを使ったファイルアップロード<br><br>1ファイルあたりの重さ：2MBまで<br>1ファイルあたりのサイズ：横3840×縦3840pixelまで<br><br>登録可能な形式：JPEG、GIF、アニメーションGIF、PNG、TIFF、BMP<br>※PNG、TIFF、BMP形式の画像はJPEGに変換（その他の形式はエラー）</td></tr></tbody></table>

#### XML : request

<table><tbody><tr><td><b>No</b></td><td><b>Element</b></td><td><b></b><p><b>Description</b></p></td><td><b>Type</b></td><td><b>Size(byte)</b></td><td><b>Mandatory</b></td><td><b>Multiplicity</b></td><td><b>Note</b></td></tr><tr><td>1</td><td>request.<strong>fileUpdateRequest</strong></td><td>画像情報更新要求</td><td>XML : fileUpdateRequest</td><td>-</td><td>○</td><td>1</td><td></td></tr></tbody></table>

#### XML : fileUpdateRequest

<table><tbody><tr><td><b>No</b></td><td><b>Element</b></td><td><b>Description</b></td><td><b>Type</b></td><td><b>Size(byte)</b></td><td><b>Mandatory</b></td><td><p><b>Multiplicity</b></p></td><td><b>Note</b></td></tr><tr><td>1</td><td>fileUpdateRequest.<strong>file</strong></td><td>画像情報</td><td>XML : file</td><td>-</td><td>○</td><td>1</td><td></td></tr></tbody></table>

#### XML : file

  
<table><tbody><tr><th><b>No</b></th><th><b>Element</b></th><th><b>Description</b></th><th><b>Type</b></th><th><b>Size(byte)</b></th><th><b>Mandatory</b></th><th><b>Multiplicity</b></th><th><b>Note</b></th></tr><tr><td>1</td><td>file.<strong>fileId</strong></td><td>画像 ID</td><td>Integer</td><td>10</td><td>○</td><td>1</td><td></td></tr><tr><td>2</td><td>file.<strong>fileName</strong></td><td>更新画像名</td><td>String</td><td>50</td><td rowspan="2">※1</td><td>0,1</td><td>50バイト以内（全角25文字以内/半角50文字以内）<br><br>使用禁止文字：機種依存文字（コントロールコード除く）、半角カタカナ<br>全角スペース→半角スペースに変換<br>スペースのみは不可<br>前後にスペースがある場合は、スペースを自動削除<br>タグは無効（入力した場合は、タグと判断されたものを削除して更新）</td></tr><tr><td>3</td><td>file.<strong>filePath</strong></td><td>更新ファイル名</td><td>String</td><td>20</td><td>0,1</td><td>20バイト以内（半角20文字以内）<br>renameのみmoveはしない<br>登録時にdefaultで設定した場合、img+別数字,imgrc+別数字の形式へは変更不可<br>登録時と同じ値は指定不可<br>入力可能な文字は、半角英数字（小文字）/記号は「-」「_」のみ<br><br>使用禁止文字：機種依存文字（コントロールコード含む）、img+8桁の数字、imgrc+10桁の数字<br>スペースのみ/字間にスペースは不可（スペースのみの場合は更新しない）<br>前後にスペースがある場合は、スペースは自動削除<br>タグは無効（入力した場合はタグと判断されたものを削除して更新）</td></tr></tbody></table>  

　　※1. file、fileName、filePath の項目のうち、最低でも 1 つは指定してください。  
　　　　　入力のない項目は更新されず、既存のデータのままとなります。  

#### Request Sample

  

```
<?xml version="1.0" encoding="UTF-8"?>
<request>
    <fileUpdateRequest>
        <file>
            <fileId>19946</fileId>
            <fileName>xxx</fileName>
            <filePath>xxx</filePath>
        </file>
    </fileUpdateRequest>
</request>

```

```
POST /public/1.0/cabinet/file/update HTTP/1.1
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
    <fileUpdateRequest>
        <file>
            <fileId>19946</fileId>
            <fileName>xxx</fileName>
            <filePath>xxx</filePath>
        </file>
    </fileUpdateRequest>
</request>
------【boundaryの文字列】
Content-Disposition: form-data; 
Content-Type: image/jpeg
  
[画像ファイルのバイナリデータ]
------【boundaryの文字列】--

```

Response
--------

<table><tbody><tr><td><b>No</b></td><td><b>Key</b></td><td><b>Value</b></td></tr><tr><td>1</td><td>Content-Type</td><td>text/xml</td></tr></tbody></table>

### HTTP Body

#### XML : result

<table><tbody><tr><td><b>No</b></td><td><b>Element</b></td><td><b>Description</b></td><td><b>Type</b></td><td><p><b>Size(byte)</b></p></td><td><p><b>Multiplicity</b></p></td><td><b>Note</b></td></tr><tr><td>1</td><td><p>result.<strong>status</strong></p></td><td>ステータス</td><td><a href="Functions%20Common%20Definition.md#xml--status">XML : status</a></td><td>-</td><td>1</td><td><p>interfaceId=cabinet.file.update</p></td></tr><tr><td>2</td><td><p>result.<strong>cabinetFileUpdateResult</strong><strong></strong></p></td><td><p>画像情報更新結果</p></td><td>XML :&nbsp;cabinetFileUpdateResult</td><td>-</td><td>1</td><td></td></tr></tbody></table>

#### XML : cabinetFileUpdateResult

<table><tbody><tr><td><b>No</b></td><td><b>Element</b></td><td><b>Description</b></td><td><p><b>Type</b></p></td><td><b>Size(byte)</b></td><td><b>Multiplicity</b></td><td><b>Note</b></td></tr><tr><td>1</td><td><p>cabinetFileUpdateResult.<strong>resultCode</strong></p></td><td><strong></strong><p>結果コード</p></td><td>Integer</td><td><p>4</p></td><td><p>1</p></td><td></td></tr></tbody></table>

#### Response sample

  

```
<?xml version="1.0" encoding="UTF-8"?>
<result>
    <status>
        <interfaceId>cabinet.file.update</interfaceId>
        <systemStatus>OK</systemStatus>
        <message>OK</message>
        <requestId>714a4983-555f-42d9-aeea-89dae89f2f45</requestId>
        <requests />
    </status>
    <cabinetFileUpdateResult>
        <resultCode>0</resultCode>
    </cabinetFileUpdateResult>
</result>

```