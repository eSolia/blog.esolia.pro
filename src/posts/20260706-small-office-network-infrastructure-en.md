---
draft: true
hot: false
featured: false
oldUrl: []
lang: en
id: 202603f-small-office-infra
date: 2026-10-27 00:00:00
last_modified: 2026-09-25 12:00:00
title: 'Switching to IPoE? Check What Depends on Your Old Line First'
description: >-
  A client asked whether to move their office internet from PPPoE to IPoE. The
  line change was the easy part; the hard part was everything that depended on
  the old connection. Four things to check before you switch, and where we
  would take it instead.
image: /uploads/202603f-small-office-infra-en.png
image_top: /uploads/202603f-small-office-infra.png
author: Kabaya
image_credit:
  source: Adobe Express
category: Network
tags:
  - IPoE
  - PPPoE
  - VPN
  - Network
  - IT Support
  - Remote Work
  - Cloud Migration
comments: {}
---
<!-- REVIEW NOTE (Rick, 2026-09-25): restructured around the finding: the line change is really a remote-access decision. Kabaya, please check every TODO, fill in what only you know, and delete each TODO when done. Keep the post as a draft until then. The original diagram is still in uploads (202603f-small-office-infra-diagram.png) if you want it back. -->

"We may want to change our internet connection from PPPoE to IPoE."

A client asked me this recently. <!-- TODO(Kabaya): why did they ask? Slow evenings, an offer from the ISP, cost? One sentence with the real reason. --> I knew both terms. What I didn't know yet was what else in their office depended on the old connection, and that turned out to be the real question.

<!--more-->

## PPPoE and IPoE, briefly

Most offices in Japan reach the internet over NTT's FLET'S fiber network, or one of the Hikari Collaboration (光コラボ) services built on it. With **PPPoE**, the router logs in to the internet provider with an ID and password, and traffic passes through shared network termination equipment (網終端装置) that is known to get congested at busy times. With **IPoE**, there's no login and no pass through that equipment, which is why it's usually faster in the evening.

The catch is IPv4. IPoE runs on IPv6, and IPv4 traffic is carried inside it using a method such as MAP-E (used by v6プラス, for example) or DS-Lite (used by transix). Either way, the office usually shares its public IPv4 address with other customers of the provider. That means no static IP of its own, and in most cases nothing outside can connect in to the office. Providers do sell fixed-IP options for IPoE, at extra cost.

<!-- TODO(Kabaya): which IPoE service and method would this client get (v6プラス, transix, OCN バーチャルコネクト, other)? If unknown, leave this paragraph general. -->

## What I found in this office

There was no network diagram, so I started with the handover notes and whatever network records existed. They were a useful starting point, but documents don't always match what's installed, so I checked each device against them: the firewall, the switches, and the server.

The firewall's management screen showed two things that mattered. The office was connected with PPPoE on a static IP address, and the same firewall provided the VPN that staff used to reach the office from outside.

That VPN is the story. Remote staff connect to the office's static IP. Switch to IPoE without a fixed-IP option and that address goes away, and the VPN goes with it. What looked like a speed upgrade was really a decision about remote access.

<figure class="flex flex-col justify-start items-left">
  <img class="shadow-lg rounded-lg" alt="Diagram of the office before the switch: remote staff connect by VPN to the office's static IP, and outside services trust that IP. The PPPoE line, the firewall and the outside services are highlighted as things to check." src="/uploads/202603f-office-network-before-en.png" width="520px" transform-images="avif webp png jpeg 520@2">
  <figcaption class="text-left mt-2"><small><em>Fig: The office before the switch. Orange marks what depends on the old line; the numbers match the checklist below.</em></small></figcaption>
</figure>

## Four things to check before you switch

Sketching the network, even roughly, is what made these visible. Before changing the line, check each one:

1. **Outside services that only accept your office IP.** Online banking, vendor portals, and SaaS sign-in rules (Microsoft 365 conditional access can restrict sign-in by location, for example). If the address changes, these stop working, often without a clear error message.
2. **A VPN on the firewall or router.** If staff connect in from outside, it almost certainly relies on the static IP.
3. **Port forwards.** Cameras, a NAS, or a server reached from outside through the office IP.
4. **Whether the router or firewall supports IPoE at all.** It has to support the method your provider uses, MAP-E or DS-Lite. Older equipment may not.

<!-- TODO(Kabaya): which of these applied at this client? Was the static IP registered anywhere (bank, vendor, SaaS)? Were there any port forwards? Does their firewall support the provider's IPoE method? Add a sentence under the relevant items. -->

## Three ways forward

With the dependencies on paper, the client had three options:

* **Stay on PPPoE for now.** Nothing breaks, and nothing gets faster.
* **Switch to IPoE and buy the fixed-IP option.** The VPN and the allowlists keep working, at an extra monthly cost, and the firewall VPN stays exposed to the internet.
* **Take remote access off the office line.** This is what we recommend.

In our view, a small office's internet line shouldn't carry anything but internet. Files move to SharePoint and OneDrive. Sign-in moves from the office server (Active Directory) to Microsoft Entra ID, which works the same in the office and at home. Anything that has to stay in the office for a while, like an old NAS during a migration, is reached through Cloudflare: staff run the WARP client, and a small connector in the office dials out to Cloudflare, so nothing needs a static IP or an open port. After that, the IPoE switch is just a speed upgrade.

<figure class="flex flex-col justify-start items-left">
  <img class="shadow-lg rounded-lg" alt="Diagram of the office after: staff sign in to Microsoft 365 and connect through Cloudflare from anywhere. The office has an IPoE line and a firewall with no VPN and no static IP; an old NAS is reached through an outbound tunnel until the migration ends." src="/uploads/202603f-office-network-after-en.png" width="520px" transform-images="avif webp png jpeg 520@2">
  <figcaption class="text-left mt-2"><small><em>Fig: Where we would take it. Green is where the old dependencies went, blue is temporary, and grey is ordinary plumbing. Nothing on the office line is orange anymore.</em></small></figcaption>
</figure>

## What the client decided

<!-- TODO(Kabaya): what did the client decide, and how did it go? One or two paragraphs in your own words. If it is still undecided, say what we recommended and what they are weighing. Delete this heading if you would rather end on the diagram. -->

I started with a question about a faster line and ended up with a sketch of the whole office. That sketch is worth keeping: the next time someone wants to change the line, the router, or the firewall, you'll know what depends on it before anything breaks.
