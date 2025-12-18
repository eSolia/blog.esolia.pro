---
draft: true
hot: false
featured: false
oldUrl: []
lang: en
id: 202508d-power-on-pc
date: 2025-12-18T05:07:36.938Z
last_modified: 2025-12-18T14:21:00.000Z
title: >-
  How to Automatically Power On a PC After a Power Outage：Dell BIOS Setting
  Guide
description: >-
  Learn how to configure Dell Optiplex BIOS settings so that your PC
  automatically powers on after power loss or updates. Includes a real-world
  case using a warehouse PC as an SCCM distribution point. 
image: /uploads/blog-esolia-pro-default.png
image_top: /uploads/blog-esolia-pro-default-top.png
author: Kabaya
category: Troubleshooting
tags:
  - BIOSSettings
  - Dell
  - AutoPowerOn
  - ACRecovery
  - PCManagement
  - PowerOutageRecovery
  - ITAdminTips
  - PowerSettings
comments: {}
---
In business environments, it's not uncommon to run into situations where a PC doesn't automatically restart after a Windows update, or remains powered off after a power outage. 
This can become a real problem, especially for PCs used for remote access or unattended operations like surveillance or server-related tasks. 
In this article, we’ll walk you through how to configure the BIOS setting on Dell Optiplex PCs (e.g., 7060) so that the system will automatically power on after power is restored. 

<!--more-->

## When This Setting is Useful
* After a Windows update, you want the PC to restart automatically 
* When the power cable is accidentally unplugged or there's a power cut 
* For systems that should always stay on or boot before office hours

## BIOS Feature: Auto Power On
Many Dell systems provide several power-related BIOS settings. Here are the key ones:

<table class="not-prose w-full text-sm">
  <thead>
    <tr>
      <th>Feature Name</th>
      <th>Description</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>AC Recovery / AC Power Recovery</td>
      <td>Powers on the PC automatically when AC power is restored</td>
    </tr>
    <tr>
      <td>Auto Power On / Auto On Time</td>
      <td>Powers on the PC at a specific time every day</td>
    </tr>
    <tr>
      <td>Wake on LAN</td>
      <td>Allows powering on the PC over the network (different use case)</td>
    </tr>
  </tbody>
</table>

In this article, we'll focus on **AC Recovery**. 

## How to Configure AC Recovery (Dell Optiplex 7060)
1. Turn on the PC and press <kbd>F2</kbd> repeatedly to enter the BIOS Setup 
2. Go to 
　[Power Management] > [AC Recovery] 
3. Change the setting to: 
　[Power On] 
　(The default is usually [Off]) 
4. Click [Apply] to save, then [Exit] to reboot

## Related Settings (Optional)
* **Auto On Time**: Useful if you want the PC to power on at a fixed time (e.g., 9:00 AM) 
* **Wake on LAN**: Use this if you want to boot the PC via network commands

## Real-World Example 
At one client site, a desktop PC placed in a warehouse was being used as an SCCM Distribution Point server. 
However, the PC often powered off unexpectedly due to various reasons, and each time the warehouse staff had to manually turn it back on. 
After enabling the AC Recovery setting, the PC now automatically powers back on after power is restored—whether it’s due to a power outage, updates, or the power strip being switched off. 
This eliminated the need for manual intervention by on-site staff. 

## Summary
<table class="not-prose w-full text-sm">
  <tbody>
    <tr>
      <td>Setting</td>
      <td>BIOS - Power Management > AC Recovery</td>
    </tr>
    <tr>
      <td>Recommended Value</td>
      <td>Power On</td>
    </tr>
    <tr>
      <td>Applicable Models</td>
      <td>Dell Optiplex series and similar</td>
    </tr>
  </tbody>
</table>

This small but powerful BIOS setting can save time, reduce manual effort, and help maintain system uptime—especially for systems that should stay available at all times. 

Make sure to check and configure this on any critical PC you manage.
