---
draft: true
hot: false
featured: false
oldUrl: []
lang: en
id: 202603a-copilot-pc-performance
date: 2026-05-22T08:12:19.867Z
last_modified: 2026-05-22T17:18:00.000Z
title: Copilot PC performance
description: >-
  If your PC has been feeling slow lately, Copilot might be the unexpected
  cause. Learn how Copilot can impact CPU and memory usage on Windows, and how
  to close or disable it to improve performance.
image: /uploads/blog-esolia-pro-default.png
image_top: /uploads/blog-esolia-pro-default-top.png
author: K.Y.
category: Windows
tags:
  - Copilot
  - PC performance
comments: {}
---
More and more people are using MS Copilot as a standard AI assistant tool for Windows PC. However, Copilot itself can sometimes slow down PC performance. Based on actual cases reported to IT help desk, we'll introduce the examples. Please check your company PC as well. 

<!--more-->

## Copilot app is running in the background 
We got an email from a user saying that the PC gradually became sluggish during operation even though there have been no newly installed applications or major updates. When we check the user’s PC when the issue occurred, multiple applications were running, but we found that the Copilot app was significantly consuming memory and CPU resources.

## Turn OFF Copilot to prevent from launching when starting PC 
To completely close an app, the simple method is to terminate it via Task Manager. However, depending on your environment, Copilot may be on the background app list rather than on the running app list. If so, locating & closing Copilot among numerous background apps is annoying. 

Screenshot01を挿入 

To prevent Copilot from launching automatically, follow these steps:  Remove it from startup apps. 

Restart your PC to apply changes and refresh the system. 

Go to Settings app > Apps > Startup, find Copilot, and if it's turned on, switch it off > Restart your PC 

Screenshot02を挿入 

## Summary 
This method only prevents the standalone Copilot application from launching. 

Screenshot03を挿入 

Copilot within individual applications like Outlook or Word (Copilot add-in) will not be affected by this disabling. You can continue using Copilot within each respective application. 

If you're experiencing performance issue on especially your company PC, it’s worth checking if Copilot is launching automatically and affecting the PC performance. 
