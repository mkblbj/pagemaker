# Cabinet API Use Cases

CabinetAPI を利用して出来る、Use case を記載します。

[1.R-Cabinet の利用状況を確認する](#cabinetapiusecases-7290)

[2. フォルダの一覧を取得する](#cabinetapiusecases-7292)

[3. 画像を検索する](#cabinetapiusecases-7294)

1. R-Cabinet の利用状況を確認する

**1.1  R-Cabinet の各フォルダの画像保存可能数を確認する**

　　　1. cabinet.usage.get 実行  
　　　2. cabinet.folders.get 実行

　　→cabinet.usage.get のレスポンス項目 "FileMax" の値から、cabinet.folders.get のレスポンス項目 "FileCount" の値を引くことで、R-Cabinet の各フォルダの画像保存可能数を確認することができます。

2. フォルダの一覧を取得する

**2.1 R-Cabinet 内のフォルダ / 画像の一覧を取得する**

　　　1. cabinet.folders.get を実行  
　　　2. cabinet.folders.get のレスポンス項目 "FolderId" を、cabinet.folder.files.get のリクエスト項目 "folderId" にセットし、実行  
　　　　　※取得した FolderId の数分実行

　　→1 と 2 のレスポンスを組み合わせることで、R-Cabinet 内のフォルダ情報とそれに紐づく画像情報を全て確認することができます。

3. 画像を検索する

**3.1 検索対象の画像名が、R-Cabinet 内の各フォルダに存在するか確認する**

　　　1. cabinet.folders.get 実行  
　　　2. レスポンス項目 "FolderId" を、cabinet.files.search のリクエスト項目 "folderId" にセットし、実行  
　　　　　※取得した FolderId の数分実行

　　→R-Cabinet 内の各フォルダに検索対象の画像名が存在するか確認することができます。