---
draft: true
hot: false
featured: false
oldUrl: []
lang: en
id: 202509b-runas-command
date: 2026-04-08T01:10:46.910Z
last_modified: 2026-04-08T10:27:00.000Z
title: >-
  Understanding the runas Command - Running Apps with Another Account Without
  Logging Off
description: >-
  Learn how to use the Windows runas command to run apps or admin consoles with
  admin rights only when needed, while working mainly as a standard user. 
image: /uploads/blog-esolia-pro-default.png
image_top: /uploads/blog-esolia-pro-default-top.png
author: Kabaya
category: Windows
tags:
  - Runas
  - AdminRights
  - ITSupport
  - BeginnerFriendly
  - DeviceManager
  - Chrome
  - BusinessEfficiency
  - InternalIT
comments: {}
---
In day-to-day IT support, situations often come up like: 
“I normally work with a standard user account, but sometimes I need admin rights to uninstall drivers or access admin web consoles.” 
Logging off and switching accounts every time is tedious. That’s where the built-in Windows **runas command** comes in handy. 
It lets you run programs using an admin account only when needed, without changing your main login. 

<!--more-->

## What is runas 
* runas is a Windows command that allows you to run a program as a different user.
* Even if you’re logged in as a standard user, you can launch a program with admin privileges by entering the admin username and password. 
* Think of it like having your own key for normal tasks, but borrowing an admin key to access a locked room when necessary.
  
> [!NOTE]
> runas runs the program as another user. It does not automatically handle UAC elevation in all cases. Sometimes you need to use cmd.exe /c as an intermediary.

## Example 1: Opening Device Manager as an Admin
In my daily IT support, I sometimes uninstall and reinstall drivers on user PCs. 
To uninstall a device, admin rights are required, so I use runas to open Device Manager: 

```cmd
runas /user:DOMAIN\AdminAccount "cmd.exe /c mmc devmgmt.msc" 
```
* DOMAIN\AdminAccount = your admin account (or PCName\Administrator for local accounts) 
* After entering the password, Device Manager opens with admin rights

Why it’s useful: You don’t need to log off and log on as an admin every time, saving time and effort. 

## Example 2: Opening Chrome as an Admin 
Sometimes, I need to access admin web consoles like Exchange Admin Center or Intune. 
In those cases, I use runas to launch Chrome with my admin account: 

```cmd
runas /user:admin_account@example.com "C:\ProgramFiles\Google\Chrome\Application\chrome.exe"
```

* After entering the password, that Chrome session runs with admin privileges 
* Important: The Chrome installation path (C:\Program Files\Google\Chrome\Application\) may vary depending on the device. Adjust the path as needed.

This lets you stay logged in as a standard user while accessing admin tools only when necessary. 

## Common Questions / Tips 
* Can I store the password in a script? → Not recommended. Storing in plain text is a security risk. 
* Can I use /savecred? → Possible, but it has security risks. Always follow your company policy. 
* What about UAC? → runas doesn’t handle all UAC prompts. If you get a 740 error, use cmd.exe /c or consider alternatives like Task Scheduler.

## Practical tips 
* Batch files: Create a .bat for frequently used commands. Double-click and enter the password. 
* Task Scheduler: IT can pre-create admin tasks. Users can run them with a single click. 
* Third-party tools (e.g., PsExec): Useful, but be cautious with passwords and logs.

## Summary 
* runas lets you run programs as another user without logging off. 
* For Device Manager, use cmd.exe /c to avoid the 740 error. 
* Apps like Chrome can also run with admin privileges via runas. 
* Avoid storing passwords in scripts. Follow safe operational rules. 
