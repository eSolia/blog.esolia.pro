---
draft: true
hot: false
featured: false
oldUrl: []
lang: en
id: 202506b-fix-internet-connection
date: 2025-07-10T05:42:40.609Z
last_modified: 2025-07-10T15:15:00.000Z
title: How to Fix a PC That Won’t Connect to the Internet
description: >-
  Your PC suddenly can't connect to the internet? Neither Wi-Fi nor Ethernet is
  working? This article explains specific recovery steps, including how to
  resolve the "Ethernet doesn’t have a valid IP configuration" error. 
image: /uploads/202506b-fix-internet-connection-en.jpeg
image_top: /uploads/202506b-fix-internet-connection.jpeg
author: Kabaya
category: Troubleshooting
tags:
  - Network
  - Internet Connection
  - Windows10
  - Surface
  - Wi-Fi Issues
  - Ethernet
  - IT Support
  - Command Prompt
comments: {}
---
“It was working fine yesterday... but for some reason, I can't connect to the internet today.” 
If you work in IT support, you've likely heard this line more times than you can count. 
Sudden, unexplained network issues are a common headache. 
This article shares a real-life case in which a laptop suddenly couldn’t connect via Wi-Fi or wired LAN—along with the specific recovery steps that worked in the end. 

<!--more-->

## The Symptom: No Network Connection at All 
One day, a laptop used in our office began exhibiting the following symptoms: 
* Unable to connect via Wi-Fi or wired LAN 
* No improvement after swapping LAN cables, docking stations, or USB-LAN adapters 
* Other PCs on the same network worked fine
  
In short, **this particular PC was completely unable to connect to any network.** 

## Initial Troubleshooting Attempts 
We started with standard network troubleshooting: 
1. **Uninstalled network adapters** (Wi-Fi and Ethernet) from Device Manager → Rebooted 
2. **Reset network settings** via: 
Settings → Network & Internet → Network Reset 
3. **Tried renewing IP configuration** via command prompt:
```cmd
C:\> ipconfig /release 
```
```cmd
C:\> ipconfig /renew 
```
None of the above worked. Running the built-in Windows network troubleshooter only resulted in the message: 
"**Ethernet doesn't have a valid IP configuration.**" 

## What Solved It: Full Network Stack Reset 
What finally fixed the issue was resetting the entire Windows network stack using the following commands. 

**Run as Administrator in Command Prompt**: 
```cmd
C:\> netsh winsock reset
```
```cmd
C:\> netsh int ip reset 
```

After restarting the PC, both Wi-Fi and wired LAN connections were fully restored— 
**as if nothing had ever gone wrong.**

## Why These Commands Worked 
> [!NOTE]
> **netsh winsock reset**
→ Resets the Winsock catalog, which underpins Windows network communications 
**netsh int ip reset** 
→ Restores IP and TCP/IP-related settings (including registry values) to default

These two commands are often seen as a **last-resort fix for stubborn Windows networking issues.** 

## Additional Notes: The Affected Environment
The issue occurred on the following device: 
**Device**: Surface Laptop 6 
**Operating System**: Windows 10 

With Surface devices running Windows 10, the following issues are commonly reported: 
* Network settings become corrupted after Windows Updates 
* LAN ports on USB-C docks become temporarily disabled 
* Winsock settings are altered or broken by VPN clients or security software
This makes resetting the network configuration especially effective on Surface environments.

## Prevention Tips and Quick Fixes 

**Create a Batch File for Quick Recovery** 
```bat
@echo off
netsh winsock reset
netsh int ip reset
pause
```
Save this as a .bat file to keep a quick-fix tool on hand in case the issue returns. 

## Other Cases Where This Helps 
* When multiple adapters (including USB-LAN) show similar symptoms 
* When the IP address shows as 169.254.x.x (APIPA/auto-configured) 
* When DHCP fails to assign an IP and "no valid IP configuration" errors appear

## Conclusion 
Even when a network problem seems like a dead end, 
**returning to the basics and resetting the entire network configuration** can often bring a system back to life. 

If you're facing similar symptoms, we recommend trying the steps described here. 
