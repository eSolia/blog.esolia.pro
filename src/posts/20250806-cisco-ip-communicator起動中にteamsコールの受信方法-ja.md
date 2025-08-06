---
draft: false
hot: false
featured: false
lang: ja
id: 202504c-cisco-ip-communicator-problem
date: 2025-08-06T00:32:00.000Z
last_modified: 2025-08-06T09:32:00.000Z
title: Cisco IP Communicator起動中にTeamsコール受信する方法
description: Cisco IP CommunicatorとMicrosoft Teamsのアプリ相性不具合の解決方法を紹介します
image: /uploads/202504c-cisco-ip-communicator-problem-ja.jpeg
image_top: /uploads/202504c-cisco-ip-communicator-problem.jpeg
author: K.Y.
category: Microsoft-365
tags:
  - Microsoft Teams
  - Cisco IP Communicator
  - チャットツール
comments: {}
oldUrl: []
---
会社PCのチャットツールとしてMS Teamsを使いながら、電話を受けるためにソフトフォンアプリを利用しているという会社も少なくないかと思います。 今回は、チャットツールとして**Microsoft Teams**を利用しながら、電話用のソフトフォンアプリ**Cisco IP Communicator**を利用している環境で起こる不具合を解決する方法を紹介します。 

<!--more-->

## 1. 起きる不具合について 
**条件：**
MS TeamsとCisco IP Communicatorがどちらも起動していること（バックグラウンドで起動している場合も含める） 

**現象：** 
MS Teamsでミーティングに参加しようとすると、Cisco IP Communicatorの受話器が自動でONになり、Teamsミーティングから退出してしまい、参加できない。 

## 2. 解決方法 
MS Teamsの設定から、**デバイスの同期ボタン**を**OFF**にします。 

**設定手順：** 
A. MS Teamsを開き、ウィンドウ右上の三点のボタンから「設定」を選択 
<figure class="flex flex-col justify-start items-left">
  <img alt="Screenshot of setting button in Teams" src="/uploads/202504c-cisco-ip-communicator-problem1.png" width="400px" transform-images="avif webp png jpeg 00@2">
</figure>

B. 設定メニューから「デバイス」を選択し、オーディオの項目の中にある「デバイスの同期ボタン」をOFFにする 
<figure class="flex flex-col justify-start items-left">
  <img alt="Screenshot of setting button in Teams" src="/uploads/202504c-cisco-ip-communicator-problem2-ja.png" width="600px" transform-images="avif webp png jpeg 600@2">
</figure>

## 3. おわりに 
この「デバイスの同期ボタン」は、本来USB接続やBluetoothなどでヘッドセットを繋いでいるときに、ヘッドセットについている物理的なボタンでTeamsのコールに応答することを可能にする機能のようです。 

Cisco IP Communicatorアプリ利用時にはこの機能に干渉してしまうようですが、Teams側からOFFにすることにより、同期が外れて上記の問題が解決するようです。

株式会社eSoliaでは、頼れる企業のIT部門として日々ITサポートを提供しています。
IT部門のアウトソーシングをご検討の担当者様はぜひお気軽にお問合せください。
