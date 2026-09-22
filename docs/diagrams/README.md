# Diagrams

D2 source plus rendered SVG and PNG. GitHub shows the rendered files; the `.d2`
is what you edit.

## CMS architecture

How an editor reaches the blog CMS, and how a published post reaches readers.

![How the blog CMS is reached and how a post reaches readers](cms-architecture.svg)

Source: [`cms-architecture.d2`](cms-architecture.d2). After editing it,
re-render both files so they stay in step ([d2](https://d2lang.com), v0.9.0
here):

```sh
d2 --pad=24 docs/diagrams/cms-architecture.d2 docs/diagrams/cms-architecture.svg
d2 --pad=24 docs/diagrams/cms-architecture.d2 docs/diagrams/cms-architecture.png
```

The PNG is for places that cannot show an SVG, such as the staff guide and chat.

Details behind the diagram:
[Cloudflare Access + Tunnel runbook](../cloudflare-access-tunnel-runbook-en.md)
([日本語](../cloudflare-access-tunnel-runbook-ja.md)) and the CMS sections of
the [README](../../README.md).
