---
draft: true
hot: false
featured: false
oldUrl: []
lang: ja
id: 202603a-copilot-pc-performance
date: 2026-05-22T07:31:37.662Z
last_modified: 2026-05-22T17:05:00.000Z
title: 最近PCが重いと思ったら「Copilot」を終了させよう
description: >-
  PCが重い原因は、意外にもCopilotかもしれません。WindowsでCopilotがメモリやCPUに与える影響と、終了・無効化する方法をわかりやすく解説します。
image: /uploads/blog-esolia-pro-default.png
image_top: /uploads/blog-esolia-pro-default-top.png
author: K.Y.
category: Windows
tags:
  - Copilot
  - Office365
  - PCパフォーマンス
comments: {}
---
Windows PCの定番AIアシスタントツールCopilotを活用している方が増えてきました。一方でこの便利なMicrosoft Copilot自体がPCの動作を重くする方に影響を及ぼしていることがあります。ITヘルプデスクに寄せられた実際の案件をもとに、その事例を紹介します。会社のPCなどでも確認してみてください。 

<!--more-->

## Copilotアプリが常駐しています 
PCを起動していると徐々に動作が重くなってくるという連絡がありました。特に新しくインストールしたアプリや大きなアップデートは無いということでした。問題が発生したタイミングでそのPCを確認したところ、複数のアプリが立ち上がっていましたが、特に大きくメモリ容量とCPU使用量を圧迫していたのが「Copilot」アプリということが判明しました。

## PC起動時にCopilotを起動させないようOFFに 
あるアプリを完全終了させる場合、タスクマネージャーから終了させるというのが一つの手段になりますが、環境によっては実行中のアプリとしてではなく、バックグラウンドアプリとして常駐していることもあります。その場合、沢山あるバックグラウンドアプリの中からCopilotを探して終了させるのは大変です。 

<figure class="flex flex-col justify-start items-left">
  <img alt="Screenshot of ending the Copilot app from Task Manager" src="/uploads/202603a-copilot-pc-performance-ja1.png" width="500px" transform-images="avif webp png jpeg 500@2">
</figure>

自動で立ち上がらないよう、下記の手順でスタートアップアプリから解除しましょう。 
変更の適用とリフレッシュのため、PCの再起動も行ってしまいましょう。 

設定アプリ > アプリ > スタートアップ からCopilotを探し、オンになっていたらオフに変更 > PC再起動 

<figure class="flex flex-col justify-start items-left">
  <img alt="Screenshot of disabling Copilot from Startup apps" src="/uploads/202603a-copilot-pc-performance-ja2.png" width="500px" transform-images="avif webp png jpeg 500@2">
</figure>

## まとめ  
以上がCopilotの常駐を解除する方法になります。 
この方法で立ち上がらなくなるのは、Copilot単体のアプリです。 

<figure class="flex flex-col justify-start items-left">
  <img alt="Screenshot of the home page of Copilot" src="/uploads/202603a-copilot-pc-performance-ja3.png" width="500px" transform-images="avif webp png jpeg 500@2">
</figure>

OutlookやWordといった個別のアプリ上にあるCopilot(Copilotアドイン)はこの解除の影響を受けませんので、それぞれのアプリ上で個別にCopilotが利用できます。 
会社のPCなどでパフォーマンスの問題が発生している方はCopilotが勝手に立ち上がっていないかどうか確認をしてみてください。
