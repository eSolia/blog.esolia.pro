---
draft: false
hot: false
featured: false
oldUrl: []
lang: en
id: 202609a-clipboard-managers
date: 2026-09-20T09:00:00.000Z
last_modified: 2026-09-20T09:00:00.000Z
title: 'If Win + V Is Not Enough: Clipboard Managers for Windows'
description: >-
  Copy, paste, and lose it a moment later. A clipboard manager keeps a history
  so you can go back — here are the Windows options, and the security question
  worth asking before you install one.
image: /uploads/202609a-clipboard-managers.jpg
image_top: /uploads/202609a-clipboard-managers.jpg
image_credit:
  name: Frames For Your Heart
  url: https://unsplash.com/@framesforyourheart
  source: Unsplash
  source_url: https://unsplash.com/photos/brown-wooden-boat-scale-model-rPRpBWXn2C4
author: Rick Cogley
category: Windows
tags:
  - Productivity
  - Windows
  - TechForBeginners
comments: {}
---
You copy some text, paste, then copy some more, but the first text is gone and you're wishing you could get it back. Everyone has had that moment, usually about two seconds after what you needed has vanished.

<!--more-->

## What a clipboard manager gives you

A "clipboard manager" fixes this lost text problem by keeping a history of what you copied, so you can reach back and paste something from earlier. On my Mac I use [Maccy](https://maccy.app/){target="_blank" rel="noopener"} : small, quick, lives in the menu bar, and always one keystroke away. When someone wants a Windows equivalent, I point them in the following direction.

{{ comp.icon({ name: "keyboard", size: 4, color: "sky" }) -}}**Start with what you already have: Win + V**

Windows has this built in, and a lot of people don't know it. Press **Win + V** and you get your clipboard history. If it's switched off, Windows will offer to turn it on the first time you press it, or you can go to **Settings › System › Clipboard**.

It costs nothing, installs nothing, and syncs across machines if you sign in with a Microsoft account. The history is short and the search is weak, but for most people it's enough — try it before installing anything.

{{ comp.icon({ name: "clipboard-text", size: 4, color: "sky" }) -}}**Ditto: the closest thing to Maccy**

If Win + V doesn't go far enough for you, [Ditto](https://ditto-cp.sourceforge.io/){target="_blank" rel="noopener"} is the one I would reach for. It's free and open source, it has been around for years, and it does the thing well: a long searchable history, pinned entries you can keep permanently, and keyboard-driven everything.

Install it from the Microsoft Store, or with `winget` like so:

```
winget install Ditto.Ditto
```

The interface looks a bit dated, but it's reliable and quick rather than pretty.

{{ comp.icon({ name: "arrows-left-right", size: 4, color: "sky" }) -}}**CopyQ: if you switch between operating systems**

[CopyQ](https://hluk.github.io/CopyQ/){target="_blank" rel="noopener"} is open source and runs on Windows, macOS and Linux, so it's a good choice if you want the same tool and the same habits on every machine you use. It has tabs, tags, and scripting, and you can edit items in place.

It asks more of you at setup than Ditto does. Worth it if you live across several systems; probably more than you need if you don't.

{{ comp.icon({ name: "magic-wand", size: 4, color: "sky" }) -}}**PowerToys: a useful companion, not a replacement**

Microsoft's [PowerToys](https://learn.microsoft.com/windows/powertoys/){target="_blank" rel="noopener"} includes **Advanced Paste**, which sits on top of Win + V and lets you paste as plain text or as Markdown. Pasting as plain text is the one people end up using daily — it strips the formatting that would otherwise arrive uninvited from a web page.

PowerToys complements a clipboard manager rather than replacing one, and it pairs well with the built-in history.

> [!IMPORTANT]
> Clipboard history stores whatever you copied, in plain text, on disk. Be aware that includes passwords you copied out of a password manager, client data, and anything else you moved around that day.

## Before you install one, think about this

Everything you copy ends up in that history: passwords, client names, the contents of an email you were moving between windows. Most clipboard managers store it unencrypted, on disk.

A few things worth doing whichever tool you choose:

* Check whether it has a setting to ignore your password manager, and switch it on. Most do.
* Decide how long history should be kept, and shorten it as appropriate.
* Clear the history before you hand a machine to someone else.
* If your work involves client data, check your own policy before installing anything that logs it, and learn how to delete an entry from the log.

None of that is a reason to avoid clipboard managers. It is a reason to set one up deliberately rather than just accepting the defaults.

<figure class="flex flex-col justify-start items-left">
  <img class="shadow-lg rounded-lg" alt="Maccy's Ignore settings on macOS, with the Codebook password vault listed under Applications so its copies are never recorded" src="/uploads/202609a-clipboard-managers-maccy-ignore.png" width="1000px" transform-images="avif webp png jpeg 1000@2">
  <figcaption class="text-left mt-2"><small><em>Fig: Maccy on macOS, set to ignore copies from Codebook, our password vault. Ditto and CopyQ have their own versions of this. Note Maccy's own warning at the bottom: excluding by application is not bullet-proof, and matching on pasteboard type is the sturdier option where a tool offers it.</em></small></figcaption>
</figure>



## Summary

Try **Win + V** first. It's already there. If you want more, **Ditto** is the straightforward pick on Windows, and **CopyQ** if you want the same tool across operating systems. Add **PowerToys** for paste-as-plain-text.

Then go into the settings and tell it what not to remember.
