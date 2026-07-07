---
draft: true
hot: false
featured: false
oldUrl: []
lang: en
id: 202603a-copilot-pc-performance
date: 2026-05-22 08:12:00
last_modified: 2026-07-07 10:39:00
title: Copilot app affects your PC performance
description: >-
  If your PC has been feeling slow lately, Copilot might be the unexpected
  cause. Learn how Copilot can impact CPU and memory usage on Windows, and how
  to close or disable it to improve performance.
image: /uploads/202603a-copilot-pc-performance-en.png
image_top: /uploads/202603a-copilot-pc-performance.png
author: K.Y.
category: Windows
tags:
  - Copilot
  - PC Performance
comments: {}
---
More and more people are using MS Copilot as a standard AI assistant tool for Windows PC. However, Copilot itself can sometimes slow down PC performance. Based on actual cases reported to IT help desk, we'll introduce the examples. Please check your company PC as well. 

<!--more-->

## Copilot app is running in the background 
We got an email from a user saying that the PC gradually became sluggish during operation even though there have been no newly installed applications or major updates. When we check the user’s PC when the issue occurred, multiple applications were running, but we found that the Copilot app was significantly consuming memory and CPU resources.

## Turn OFF Copilot to prevent from launching when starting PC 
To completely close an app, the simple method is to terminate it via Task Manager. However, depending on your environment, Copilot may be on the background app list rather than on the running app list. If so, locating & closing Copilot among numerous background apps is annoying. 

<figure class="flex flex-col justify-start items-left">
  <img alt="Screenshot of ending the Copilot app from Task Manager" src="/uploads/202603a-copilot-pc-performance-en1.png" width="600px" transform-images="avif webp png jpeg 600@2">
</figure>

To prevent Copilot from launching automatically, follow these steps:  Remove it from startup apps. 

Restart your PC to apply changes and refresh the system. 

Go to Settings app > Apps > Startup, find Copilot, and if it's turned on, switch it off > Restart your PC 

<figure class="flex flex-col justify-start items-left">
  <img alt="Screenshot of disabling Copilot from Startup apps" src="/uploads/202603a-copilot-pc-performance-en2end.png" width="700px" transform-images="avif webp png jpeg 700@2">
</figure>

## Summary 
This method only prevents the standalone Copilot application from launching. 

<figure class="flex flex-col justify-start items-left">
  <img alt="Screenshot of the home page of Copilot" src="/uploads/202603a-copilot-pc-performance-en3.png" width="500px" transform-images="avif webp png jpeg 500@2">
</figure> 

Copilot within individual applications like Outlook or Word (Copilot add-in) will not be affected by this disabling. You can continue using Copilot within each respective application. 

If you're experiencing performance issue on especially your company PC, it’s worth checking if Copilot is launching automatically and affecting the PC performance.
