---
draft: false
hot: false
featured: false
oldUrl: []
lang: en
id: 202509b-runas-command
date: 2026-09-29 00:00:00
last_modified: 2026-09-16 12:00:00
title: >-
  Understanding the runas Command - Running Apps with Another Account Without
  Logging Off
description: >-
  Learn how to use the Windows runas command to run apps or admin consoles with
  admin rights only when needed, while working mainly as a standard user. 
image: /uploads/202509b-runas-command-en.png
image_top: /uploads/202509b-runas-command.png
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
“I normally work with a standard user account, but sometimes I need admin rights to uninstall drivers or access admin web consoles.” Logging off and switching accounts every time is tedious. That’s where the built-in Windows **runas command** comes in handy. It lets you run programs using an admin account only when needed, without changing your main login.

<!--more-->

## What is runas
* runas is a Windows command that allows you to run a program as a different user.
* Even if you’re logged in as a standard user, you can launch a program with admin privileges by entering the admin username and password.
* Think of it like having your own key for normal tasks, but borrowing an admin key to access a locked room when necessary.

> [!NOTE]
> runas runs the program as another user. It does not automatically handle UAC elevation in all cases. Sometimes you need to use cmd.exe /c as an intermediary.

## Example 1: Opening Device Manager as an Admin
In my daily IT support, I sometimes uninstall and reinstall drivers on user PCs. To uninstall a device, admin rights are required, so I use runas to open Device Manager:

```cmd
runas /user:DOMAIN\AdminAccount "cmd.exe /c mmc devmgmt.msc"
```
* DOMAIN\AdminAccount = your admin account (or PCName\Administrator for local accounts)
* After entering the password, Device Manager opens with admin rights

> [!TIP]
> You don’t need to log off and log on as an admin every time, saving time and effort.

## Example 2: Opening Another Console as an Admin
I use the same trick for other administrative tools. For example, to open the Services console under my admin account and restart or reconfigure a Windows service:

```cmd
runas /user:DOMAIN\AdminAccount "cmd.exe /c mmc services.msc"
```

* The console opens running as the admin account, so I can manage services without switching my whole session.
* Swap `services.msc` for whichever console you need — for example `compmgmt.msc` (Computer Management) or `eventvwr.msc` (Event Viewer).

## Example 3: Keeping Admin Browsing in a Separate Session
Sometimes I want to sign in to a web console — the Microsoft 365 admin center, Intune, or the Exchange admin center — with a dedicated admin account, without disturbing my everyday browser login. `runas` can launch a browser under a different Windows account so it runs in its own isolated profile:

```cmd
runas /user:DOMAIN\AdminAccount "cmd.exe /c start chrome --user-data-dir=%LocalAppData%\ChromeAdmin"
```

> [!CAUTION]
> Launching the browser as a different Windows user only isolates the **browser session** — it does **not** grant admin rights in a web console. What you can do in Intune or the Exchange admin center depends entirely on the account you **sign in with in the browser**, not on the Windows account that started it. Chrome also shares one instance per profile, so pass a separate `--user-data-dir` (as above) to force a truly separate session; otherwise it may just open a tab in your existing window.

For everyday use, a separate Chrome profile or an InPrivate window is often simpler than `runas` — reach for `runas` when you specifically want the browser to run under a different Windows account.

## Common Questions / Tips
* Can I store the password in a script? → Not recommended. Storing in plain text is a security risk.
* Can I use /savecred? → Possible, but it has security risks. Always follow your company policy.
* What about UAC? → runas doesn’t handle all UAC prompts. If you get a 740 error, use cmd.exe /c or consider alternatives like Task Scheduler.

> [!CAUTION]
> Never hard-code an admin password in a batch file or script — plain-text credentials are a serious security risk. The `/savecred` option caches the password after the first use, which also increases exposure. Always follow your organization's security policy.

## Practical tips
* Batch files: Create a .bat for frequently used commands. Double-click and enter the password.
* Task Scheduler: IT can pre-create admin tasks. Users can run them with a single click.
* Third-party tools (e.g., PsExec): Useful, but be cautious with passwords and logs.

## Summary
* runas lets you run programs as another user without logging off.
* For Device Manager, use cmd.exe /c to avoid the 740 error.
* Other consoles, and even a browser session, can run under an admin account too — but a browser's web-console access depends on the account you sign in with, not on runas.
* Avoid storing passwords in scripts. Follow safe operational rules.
