---
draft: true
hot: false
featured: false
lang: en
id: '202504c-cisco-ip-communicator-problem'
date: 2025-05-27T06:58:17.485Z
last_modified: 2025-05-27T16:10:00.000Z
title: >-
  Picking up Teams calls while using Cisco IP Communicator
description: How to solve the conflict between Cisco IP communicator & Microsoft Teams
image: /uploads/202504c-cisco-ip-communicator-problem-en.jpeg
image_top: /uploads/202504c-cisco-ip-communicator-problem.jpeg
author: K.Y.
category: Microsoft-365
tags:
  - Microsoft Teams
  - Cisco IP Communicator
  - Chat tool
comments: {}
---

Some of the companies use MS Teams as an internal chat tool while using a softphone application to receive external phone calls. Here is the quick tip for solving the problem where we cannot join MS Teams meetings while using Cisco IP Communicator due to a functional conflict. 

<!--more-->

## 1. About the issue

**Requirements:** 
Both MS Teams and Cisco IP Communicator app are running on Windows PC (including running in the background). 

**Trouble:** 
When you try to join a meeting in MS Teams, the handset of the Cisco IP Communicator app is automatically turned on and the user leaves from the Teams meeting. 

## 2. Solution 
From MS Teams setting menu, **turn off** the **Sync Devices button**. 

**Steps:** 
A. Open MS Teams app. In the upper right corner of MS Teams, select “Settings” from the three dots button. 
<figure class="flex flex-col justify-start items-left">
  <img alt="Screenshot of setting button in Teams" src="/uploads/202504c-cisco-ip-communicator-problem1.png" width="400px" transform-images="avif webp png jpeg 00@2">
</figure>

B. Select “Devices” from the Settings menu and turn off the “Sync button for devices” in the Audio item 
<figure class="flex flex-col justify-start items-left">
  <img alt="Screenshot of setting button in Teams" src="/uploads/202504c-cisco-ip-communicator-problem2-en.png" width="600px" transform-images="avif webp png jpeg 600@2">
</figure>

## 3. Summary 
The “device sync button” is a feature that allows a physical button on the external device like a headset to start Teams calls. Cisco IP Communicator app seems to conflict with this functionality. But turning it off seems to resolve the above issue by desyncing.
