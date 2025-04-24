---
draft: false
hot: false
featured: false
lang: en
id: 202503f-laptop-battery-health
date: 2025-04-09T01:07:46.664Z
last_modified: 2025-04-24T07:47:00.000Z
title: Tips for how to check your laptop battery health on Windows
description: >-
  How to check your laptop battery health on Windows using a simple command line
  technique
image: /uploads/202503f-laptop-battery-health-social-ja.jpg
author: Kisetsu Yamada
category: Troubleshooting
tags:
  - battery
  - health check
  - laptop
  - hardware
comments: {}
image_top: /uploads/202503f-laptop-battery-health-top.jpg
---
Every mobile device has a battery. And the battery condition will get gradually worse over time, lasting less time as you continue to use it. Windows offers a useful feature to check the battery status of your device by simply inputting a single command on the command line. Read on for a quick tip to check it on Windows laptops. 

<!--more-->

## 1. Open “Command Prompt”
The quickest way to open Command Prompt is: 

A. Press the <kbd>Windows</kbd> button
B. Type “cmd” in the search bar and press <kbd>Enter</kbd> 

<figure class="flex flex-col justify-start items-left">
  <img alt="Screenshot of searching comand prompt on windows" src="/uploads/202503e-laptop-battery-health-en(1).png" width="600px" transform-images="avif webp png jpeg 600@2">
</figure>

## 2. Generate Battery Report
In the black screen that pops up, input the below command and press Enter. 

```powershell
PS c:\> powercfg/batteryreport    
```

<figure class="flex flex-col justify-start items-left">
  <img alt="Screenshot of Typing a command into the Command Prompt" src="/uploads/202503e-laptop-battery-health-en(2).png" width="600px" transform-images="avif webp png jpeg 600@2">
</figure>

Once the command is entered, Command Prompt tells you that the battery report has been generated. 

> [!TIP]
> Just copy the folder path displayed in the black terminal window and paste it to Explorer using <kbd>Ctrl</kbd> + <kbd>C</kbd>, <kbd>Ctrl</kbd> + <kbd>V</kbd>

<figure class="flex flex-col justify-start items-left">
  <img alt="Screenshot of Typing the path into explorer" src="/uploads/202503e-laptop-battery-health-en(3).png" width="600px" transform-images="avif webp png jpeg 600@2">
</figure>

Paste the folder path here and press Enter 

## 3. Check the Battery Report 
Your default web browser launches and you will see a report page like this: 

<figure class="flex flex-col justify-start items-left">
  <img alt="Screenshot of the battery report" src="/uploads/202503e-laptop-battery-health(4).png" width="600px" transform-images="avif webp png jpeg 600@2">
</figure>

> [!TIP]
> While **DESIGN CAPACITY** shows how much capacity the battery was originally designed with, **FULL CHARGE CAPACITY** shows this battery’s current capacity.

Full charge capacity will basically decrease over time, and this tells how much your laptop battery is deteriorating. If you find there is a substantial gap between Design Capacity and Full Charge Capacity, let’s say Full charge capacity is 70% that of Design Capacity, it’s a good time to replace the battery or the laptop itself.

**CYCLE COUNT** shows how many times you charged this battery. Generally, the battery needs to be replaced after 300~500 charge cycles.

This is the method to objectively check the deterioration of your laptop battery. If you have noticed that your laptop battery is running down quickly recently, try checking the battery status using the method above.
