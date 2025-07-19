このページの目次

> 関連ドキュメント： [[スマートフォン デザイン設定] スマートフォン用入力項目で利用できるHTMLタグ](./スマートフォン デザイン設定.md)

*   [【サンプル 1】シンプルテキスト](#link-01)
*   [【サンプル 2】テーブル](#link-02)
*   [【サンプル 3】テキスト付き画像](#link-03)
*   [【サンプル 4】画像 2 段陳列・ 1](#link-04)
*   [【サンプル 5】画像 2 列陳列・ 2](#link-05)
*   [【サンプル 6】画像 3 枚陳列・ 1](#link-06)
*   [【サンプル 7】画像 3 枚陳列・ 2](#link-07)
*   [【サンプル 8】画像＋説明文](#link-08)
*   [【サンプル 9】カテゴリ 2 列 4 段](#link-09)
*   [【サンプル 10】カテゴリ 4 列 2 段](#link-10)
*   [【サンプル 11】商品陳列 2 列 1 段](#link-11)
*   [【サンプル 12】商品陳列 3 列 1 段](#link-12)

HTML タグは、RMS コールセンターのサポート対象外です

HTML タグについては、**RMS コールセンターのサポート対象外**となっております。

また、HTML タグにより制作した WEB ページは、ユーザーのデバイス種類、OS のバージョン、通信状況等、様々な環境の影響を受ける可能性があります。  
つきましては、個別の**動作保証や表示保証はできかねます**のであらかじめご了承ください。

[スマートフォン デザイン設定] スマートフォン用説明文の参考 HTML タグ
---------------------------------------

スマートフォン用説明文に入力する HTML タグの例をご紹介します。  
HTML タグをコピーしてスマートフォン用入力項目に入力いただくと、サンプルのような内容を表示できます。

*   ※文字数にご注意ください。  
    トップ説明文・商品ページ共通説明文・カテゴリページ共通説明文：　それぞれ 4,000byte  
    スマートフォン用商品説明文：　10,240byte  
    スマートフォン用カテゴリ説明文：　8,000byte
*   ※プレビュー画面、スマートフォン実機、または [こちら](/design/000009461) でご紹介している方法でのページ確認をお願いいたします。

<a id="link-01"></a>
### 【サンプル 1】シンプルテキスト

_【サンプル画面イメージ】_

*   ![](https://www.rakuten.co.jp/shops/manual/navi/design/img/id_180_420_10_01.gif)

_【サンプルソース】_

<table width="300" cellpadding="0" cellspacing="0" border="0" align="center">  
<tr>  
<td><font size="3"> 見出し </font></td>  
</tr>  
<tr>  
<td><font size="-1" color="#ff0000"> 小見出 </fon></td>  
</tr>  
<tr>  
<td> テキストテキストテキストテキストテキストテキストテキスト </td>  
</tr>  
<tr>  
<td><a href="■こちらにリンク先の URL を記入してください■"> テキストテキストテキストテキストテキスト </a></td>  
</tr>  
<tr>  
<td> ・箇条書き１</td>  
</tr>  
<tr>  
<td> ・箇条書き２</td>  
</tr>  
</table>

<a id="link-02"></a>
### 【サンプル 2】テーブル

_【サンプル画面イメージ】_

*   ![](https://www.rakuten.co.jp/shops/manual/navi/design/img/id_180_420_10_02.gif)

_【サンプルソース】_

<table width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#999999" align="center">  
<tr>  
<td bgcolor="#ffffff"><font size="3"> 見出し </font></td>  
</tr>  
<tr>  
<td>  
<table width="100%" cellpadding="5" cellspacing="1" border="0">  
<tr>  
<td width="20%" bgcolor="#dddddd"> </td>  
<td width="40%" bgcolor="#dddddd"> 項目 1</td>  
<td width="40%" bgcolor="#dddddd"> 項目 2</td>  
</tr>  
<tr>  
<td bgcolor="#dddddd">1 行目 </td>  
<td bgcolor="#ffffff"> ああああああああああああああああああああ </td>  
<td bgcolor="#ffffff"> かかかかかかかかかかかかかかかかかかか </td>  
</tr>  
<tr>  
<td bgcolor="#dddddd">2 行目 </td>  
<td bgcolor="#ffffff"> いいいいいいいいいいいいいいいいいいいい </td>  
<td bgcolor="#ffffff"> きききききききききききききききききききききき </td>  
</tr>  
<tr>  
<td bgcolor="#dddddd">3 行目 </td>  
<td bgcolor="#ffffff"> うううううううううううううううううううううううううう </td>  
<td bgcolor="#ffffff"> くくくくくくくくくくくくくくくくくくくくくくくくくくくくくくくく </td>  
</tr>  
</table>  
</td>  
</tr>  
</table>

<a id="link-03"></a>
### 【サンプル 3】テキスト付き画像

_【サンプル画面イメージ】_

*   ![](https://www.rakuten.co.jp/shops/manual/navi/design/img/id_180_420_10_03.gif)

_【サンプルソース】_

<table width="100%" cellpadding="0" cellspacing="0" border="0" align="center">  
<tr>  
<td><font size="3"> 見出し </font></td>  
</tr>  
<tr>  
<td><a href="■こちらにリンク先の URL を記入してください■"><img src="▲画像 URL▲" width="100%"></a></td>  
</tr>  
<tr>  
<td><a href="■こちらにリンク先の URL を記入してください■"> テキストテキストテキストテキストテキストテキスト </a></td>  
</tr>  
</table>

<a id="link-04"></a>
### 【サンプル 4】画像 2 段陳列・ 1

_【サンプル画面イメージ】_

*   ![](https://www.rakuten.co.jp/shops/manual/navi/design/img/id_180_420_10_04.gif)

_【サンプルソース】_

<table width="100%" cellpadding="0" cellspacing="0" border="0" align="center">  
<tr>  
<td><font size="3"> 見出し </font></td>  
</tr>  
<tr>  
<td><a href="■こちらにリンク先の URL を記入してください■"><img src="▲画像 URL▲" width="100%"></a></td>  
</tr>  
<tr>  
<td><a href="■こちらにリンク先の URL を記入してください■"><img src="▲画像 URL▲" width="100%"></a></td>  
</tr>  
</table>

<a id="link-05"></a>
### 【サンプル 5】画像 2 列陳列・ 2

_【サンプル画面イメージ】_

*   ![](https://www.rakuten.co.jp/shops/manual/navi/design/img/id_180_420_10_05.gif)

_【サンプルソース】_

<table width="100%" border="0" cellpadding="0" cellspacing="0" align="center">  
<tr>  
<td colspan="2"><font size="3"> 見出し </font></td>  
</tr>  
<tr>  
<td width="50%"> <a href="■こちらにリンク先の URL を記入してください■"> <img src="▲画像 URL▲" width="100%"> </a> </td>  
<td width="50%"> <a href="■こちらにリンク先の URL を記入してください■"> <img src="▲画像 URL▲" width="100%"> </a> </td>  
</tr>  
</table>

<a id="link-06"></a>
### 【サンプル 6】画像 3 枚陳列・ 1

_【サンプル画面イメージ】_

*   ![](https://www.rakuten.co.jp/shops/manual/navi/design/img/id_180_420_10_06.gif)

_【サンプルソース】_

<table width="100%" cellpadding="0" cellspacing="0" border="0" align="center">  
<tr>  
<td colspan="2"><font size="3"> 見出し </font></td>  
</tr>  
<tr>  
<td width="50%" rowspan="2"> <a href="■こちらに 1 つ目のリンク先の URL を記入してください■"> <img src="▲画像 URL▲" width="100%"> </a> </td>  
<td width="50%"> <a href="■こちらに 2 つ目のリンク先の URL を記入してください■"> <img src="▲画像 URL▲" width="100%"> </a> </td>  
</tr>  
<tr>  
<td>  
<a href="■こちらに 3 つ目のリンク先の URL を記入してください■">  
<img src="▲画像 URL▲" width="100%">  
</a>  
</td>  
</tr>  
</table>

<a id="link-07"></a>
### 【サンプル 7】画像 3 枚陳列・ 2

_【サンプル画面イメージ】_

*   ![](https://www.rakuten.co.jp/shops/manual/navi/design/img/id_180_420_10_07.gif)

_【サンプルソース】_

<table width="100%" cellpadding="0" cellspacing="0" border="0" align="center">  
<tr>  
<td colspan="2"><font size="3"> 見出し </font></td>  
</tr>  
<tr>  
<td colspan="2" width="100%"> <a href="■こちらに 1 つ目のリンク先の URL を記入してください■"> <img src="▲画像 URL▲" width="100%"> </a> </td>  
</tr>  
<tr>  
<td width="50%"> <a href="■こちらに 2 つ目のリンク先の URL を記入してください■"> <img src="▲画像 URL▲" width="100%"> </a> </td>  
<td width="50%"> <a href="■こちらに 3 つ目のリンク先の URL を記入してください■"> <img src="▲画像 URL▲" width="100%"> </a> </td>  
</tr>  
</table>

<a id="link-08"></a>
### 【サンプル 8】画像＋説明文

_【サンプル画面イメージ】_

*   ![](https://www.rakuten.co.jp/shops/manual/navi/design/img/id_180_420_10_08.gif)

_【サンプルソース】_

<table width="100%" border="0" cellpadding="0" cellspacing="2" align="center">  
<tr>  
<td colspan="2"><font size="3"> 見出し </font></td>  
</tr>  
<tr valign="top">  
<td width="50%" align="left"> <a href="■こちらにリンク先の URL を記入してください■"> <img alt=""src="▲画像 URL▲"width="100%"> </a> </td>  
<td width="50%"> <a href="■こちらにリンク先の URL を記入してください■"> テキストテキストテキストテキストテキストテキスト </a> </td>  
</tr>  
</table>

<a id="link-09"></a>
### 【サンプル 9】カテゴリ 2 列 4 段

_【サンプル画面イメージ】_

*   ![](https://www.rakuten.co.jp/shops/manual/navi/design/img/id_180_420_10_09.gif)

_【サンプルソース】_

<table width="100%" border="0" cellspacing="0" cellpadding="0">  
<tr>  
<td colspan="2"><font size="3"> 見出し </font></td>  
</tr>  
<tr>  
<td width="48%"><a href="■こちらにリンク先の URL を記入してください■"> <img src="▲画像 URL▲" width="100%"></a> </td>  
<td width="2%"></td>  
<td width="48%"><a href="■こちらにリンク先の URL を記入してください■"> <img src="▲画像 URL▲" width="100%"></a> </td>  
</tr>  
<tr>  
<td width="48%"><a href="■こちらにリンク先の URL を記入してください■"> <img src="▲画像 URL▲" width="100%"></a> </td>  
<td width="2%"></td>  
<td width="48%"><a href="■こちらにリンク先の URL を記入してください■"> <img src="▲画像 URL▲" width="100%"></a> </td>  
</tr>  
<tr>  
<td width="48%"><a href="■こちらにリンク先の URL を記入してください■"> <img src="▲画像 URL▲" width="100%"></a> </td>  
<td width="2%"></td>  
<td width="48%"><a href="■こちらにリンク先の URL を記入してください■"> <img src="▲画像 URL▲" width="100%"></a> </td>  
</tr>  
<tr>  
<td width="48%"><a href="■こちらにリンク先の URL を記入してください■"> <img src="▲画像 URL▲" width="100%"></a> </td>  
<td width="2%"></td>  
<td width="48%"><a href="■こちらにリンク先の URL を記入してください■"> <img src="▲画像 URL▲" width="100%"></a> </td>  
</tr>  
</table>

<a id="link-10"></a>
### 【サンプル 10】カテゴリ 4 列 2 段

_【サンプル画面イメージ】_

*   ![](https://www.rakuten.co.jp/shops/manual/navi/design/img/id_180_420_10_10.gif)

_【サンプルソース】_

<table width="100%" border="0" cellspacing="0" cellpadding="0">  
<tr>  
<td colspan="4"><font size="3"> 見出し </font></td>  
</tr>  
<tr>  
<td width="25%"><a href="■こちらにリンク先の URL を記入してください■"><img src="▲画像 URL▲" width="100%"></a></td>  
<td width="25%"><a href="■こちらにリンク先の URL を記入してください■"><img src="▲画像 URL▲" width="100%"></a></td>  
<td width="25%"><a href="■こちらにリンク先の URL を記入してください■"><img src="▲画像 URL▲" width="100%"></a></td>  
<td width="25%"><a href="■こちらにリンク先の URL を記入してください■"><img src="▲画像 URL▲" width="100%"></a></td>  
</tr>  
<tr>  
<td width="25%"><a href="■こちらにリンク先の URL を記入してください■"><img src="▲画像 URL▲" width="100%"></a></td>  
<td width="25%"><a href="■こちらにリンク先の URL を記入してください■"><img src="▲画像 URL▲" width="100%"></a></td>  
<td width="25%"><a href="■こちらにリンク先の URL を記入してください■"><img src="▲画像 URL▲" width="100%"></a></td>  
<td width="25%"><a href="■こちらにリンク先の URL を記入してください■"><img src="▲画像 URL▲" width="100%"></a></td>  
</tr>  
</table>

<a id="link-11"></a>
### 【サンプル 11】商品陳列 2 列 1 段

_【サンプル画面イメージ】_

*   ![](https://www.rakuten.co.jp/shops/manual/navi/design/img/id_180_420_10_11.gif)

_【サンプルソース】_

<table border="0" width="98%">  
<tr>  
<td colspan="3"><font size="3"> 見出し </font></td>  
</tr>  
<tr>  
<td align="center" width="1%"></td>  
<td align="center" width="48%"><a href="■こちらにリンク先の URL を記入してください■"><img src="▲画像 URL▲" width="100%"></a></td>  
<td align="center" width="2%"></td>  
<td align="center" width="48%"><a href="■こちらにリンク先の URL を記入してください■"><img src="▲画像 URL▲" width="100%"></a></td>  
<td align="center" width="1%"></td>  
</tr>  
<tr>  
<td width="1%"></td>  
<td align="left" valign="top"><font size="2">XXXXXXXXXXXXXXXXXXXXXXXXXX</font></td>  
<td width="2%"></td>  
<td align="left" valign="top"><font size="2">XXXXXXXXXXXXXXXXXXXXXXXXXX</font></td>  
<td width="1%"></td>  
</tr>  
<tr>  
<td width="1%"></td>  
<td align="center" valign="top"><font size="2" color="#F00000"><b>○○円 </b></font></td>  
<td width="2%"></td>  
<td align="center" valign="top"><font size="2" color="#F00000"><b>○○円 </b></font></td>  
<td width="1%"></td>  
</tr>  
</table>

<a id="link-12"></a>
### 【サンプル 12】商品陳列 3 列 1 段

_【サンプル画面イメージ】_

*   ![](https://www.rakuten.co.jp/shops/manual/navi/design/img/id_180_420_10_12.gif)

_【サンプルソース】_

<table border="0" width="98%">  
<tr>  
<td colspan="5"><font size="3"> 見出し </font></td>  
</tr>  
<tr>  
<td align="center" width="32%"><a href="■こちらにリンク先の URL を記入してください■"><img src="▲画像 URL▲" width="100%"></a></td>  
<td align="center" width="2%"></td>  
<td align="center" width="32%"><a href="■こちらにリンク先の URL を記入してください■"><img src="▲画像 URL▲" width="100%"></a></td>  
<td align="center" width="2%"></td>  
<td align="center" width="32%"><a href="■こちらにリンク先の URL を記入してください■"><img src="▲画像 URL▲" width="100%"></a></td>  
</tr>  
<tr>  
<td align="left" valign="top"><font size="2">XXXXXXXXXXXXXXXXXXXXXXXX</font></td>  
<td align="left" width="2%"></td>  
<td align="left" valign="top"><font size="2">XXXXXXXXXXXXXXXXXXXXXXXX</font></td>  
<td align="left" width="2%"></td>  
<td align="left" valign="top"><font size="2">XXXXXXXXXXXXXXXXXXXXXXXX</font></td>  
</tr>  
<tr>  
<td align="center" valign="top"><font size="2" color="#F00000"><b>○○円 </b></font></td>  
<td align="center" width="2%"></td>  
<td align="center" valign="top"><font size="2" color="#F00000"><b>○○円 </b></font></td>  
<td align="center" width="2%"></td>  
<td align="center" valign="top"><font size="2" color="#F00000"><b>○○円 </b></font></td>  
</tr>  
</table>

*   ショップ紹介文、新着情報、更新情報の記載にご利用ください。

*   列を増やしたい時は <tr>~</tr > の間に < td></td > の行を増やしてください。  
    段を増やしたい時は <tr>~</tr > までの記述のセットを追加してください。

*   ショップレビュー画像や楽天ランキング受賞画像の表示、キャンペーンバナーの掲載などにご利用ください。

*   キャンペーンバナーの掲載、カテゴリページへの遷移などにご利用ください。

*   商品ページやカテゴリページへの遷移などにご利用ください。

*   商品ページやカテゴリページへの遷移などにご利用ください。

*   商品ページやカテゴリページへの遷移などにご利用ください。

*   注目商品や新着商品の露出にお使いください。

マニュアル ID

000038880

旧マニュアル ID

000009464

カテゴリ

[店舗ページをデザインする](https://navi-manual.faq.rakuten.net/design?l-id=Manual2ndCategory)

更新日

2023 年 11 月 30 日
