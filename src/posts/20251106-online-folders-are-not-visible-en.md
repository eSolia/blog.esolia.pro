---
draft: false
hot: false
featured: false
oldUrl: []
lang: en
id: 202506c-windows-sync-center
date: 2025-11-06T02:00:00.000Z
last_modified: 2025-11-06T11:10:00.000Z
title: >-
  A Tip for the issue where online folders are not visible due to Windows Sync
  Center
description: >-
  The reason why files that should be visible aren’t showing up might be the
  Sync Center. This article clearly explains how to check and fix issues when
  folders don’t appear due to Windows Sync Center.
image: /uploads/202506c-windows-sync-center-en.jpeg
image_top: /uploads/202506c-windows-sync-center.jpeg
author: K.Y.
category: Troubleshooting
tags:
  - Sync Center
  - File Server
comments: {}
---
This article explains what to do if you are having problems accessing or viewing some files in network folders that require the internet connection, such as a company's shared folder (shared server) or NAS. 
<!--more-->

## Situations where problems occur
When you cannot access the folder due to the Sync Center, the following situation will occur: 

* All the folders that should be in the shared folder are not displayed, or only some of them are displayed 
* There are no problems with the Internet connection. And the shared folder itself can be accessible 
* You can access the folder from another PC. And also able to access with another person's account that has the same permissions

## Solution 
It's easy to tell if this is the problem. 

You'll see below message in the bottom left of Explorer. 
<figure class="flex flex-col justify-start items-left">
  <img class="shadow-lg rounded-lg" alt="A screenshot showing a green icon and the label Status: Online" src="/uploads/202506c-windows-sync-center-en2.png" width="700px" transform-images="avif webp png jpeg 700@2">
  <figcaption class="text-left mt-2"><small><em>Fig:↑ There should be "Status: Online" message with a green icon</em></small></figcaption>
</figure>

Turn off this feature from the following location: 

* Open Control Panel > Sync Center 
* Select "Manage offline files" on the left pane, and select "Disable offline files" in the separate window 
* Apply > OK to close 
<figure class="flex flex-col justify-start items-left">
  <img class="shadow-lg rounded-lg" alt="A screenshot of Windows Sync Center" src="/uploads/202506c-windows-sync-center-en3.png" width="700px" transform-images="avif webp png jpeg 700@2">
</figure>
↑When this feature is on, you'll see the message "Offline files is currently **enabled**." 

## What is “Online Sync”? 
This is a function that allows you to access files that are located online, such as in shared folders, even if your PC is not connected to the internet. If you turn this function on in advance, even if you find yourself in a situation where you cannot connect to the internet, the data will be temporarily downloaded to your PC as local data (cache file), and you will be able to edit it. Then, when you are back online again, it will automatically sync with the shared folder and update the files. 

Since most users who are working from home are connected to the internet constantly, this function is no longer helpful. We basically should disable this function.
