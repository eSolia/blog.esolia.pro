# CMS VPS nightly pull

Keeps the LumeCMS host (`ssh blog-cms`, repo at `/root/www`) in step with
`main`. The timer runs at 18:00 UTC (03:00 JST), outside editing hours.

| File                        | Installed at                                    |
| --------------------------- | ----------------------------------------------- |
| `blog-nightly-pull.sh`      | `/usr/local/bin/blog-nightly-pull.sh`           |
| `blog-nightly-pull.service` | `/etc/systemd/system/blog-nightly-pull.service` |
| `blog-nightly-pull.timer`   | `/etc/systemd/system/blog-nightly-pull.timer`   |

What it does:

- Fast-forwards `/root/www` to `origin/main` only (never merges or resets).
- Uncommitted CMS drafts are left in place. If an incoming commit touches a
  file that has uncommitted edits, git refuses and nothing changes; the
  journal names the file. Publish or Save state that draft in the CMS, then
  run it again.
- Restarts `lumecms` only when `deno.json`, `deno.lock`, `_config.ts`,
  `_cms.ts`, `_md5_shim.ts` or `plugins.ts` changed.

These copies are the source of truth. After changing them, install on the VPS:

```bash
scp scripts/vps/blog-nightly-pull.sh blog-cms:/usr/local/bin/
scp scripts/vps/blog-nightly-pull.{service,timer} blog-cms:/etc/systemd/system/
ssh blog-cms 'chmod 755 /usr/local/bin/blog-nightly-pull.sh && systemctl daemon-reload'
```

Run it now and read the result:

```bash
ssh blog-cms 'systemctl start blog-nightly-pull.service; journalctl -u blog-nightly-pull -n 20 --no-pager'
```
