#!/usr/bin/env sh

# install-cloudflare.sh
#
# Deploy LumeCMS on a VPS behind a Cloudflare Tunnel, authenticated by
# Cloudflare Access. A Cloudflare-native alternative to the Caddy-based
# cms-deploy (https://github.com/lumeland/cms-deploy).
#
# Differences vs the official install.sh:
#   - No Caddy and no public 80/443. `cloudflared` dials OUT to Cloudflare, so
#     the VPS exposes only SSH. The origin IP is never reachable directly.
#   - Auth is handled by Cloudflare Access (per-user SSO / one-time PIN), not a
#     shared .env username/password. cms.auth() in _cms.ts is optional; Access
#     sits in front either way.
#   - The CMS runs as a small systemd service on 127.0.0.1; the tunnel routes
#     to it.
#
# Requirements: Ubuntu 24.04 with sudo, a domain whose zone is on Cloudflare,
# and Cloudflare Zero Trust enabled (free tier covers <=50 users).
#
# Note: the Access application and the tunnel's public-hostname route are
# configured in the Cloudflare dashboard (instructions printed at the end) —
# they aren't scriptable here without a scoped API token.

# Install and update packages
sudo apt update -y
sudo apt install -y curl git unzip

# Install Deno (local, like the official script)
curl -fsSL https://deno.land/install.sh > deno.sh
deno_dir="$(pwd)/.deno"
DENO_INSTALL="${deno_dir}" sh deno.sh -y --no-modify-path
rm deno.sh
deno="${deno_dir}/bin/deno"

# Install cloudflared (Cloudflare apt repo)
sudo mkdir -p --mode=0755 /usr/share/keyrings
curl -fsSL https://pkg.cloudflare.com/cloudflare-public-v2.gpg \
  | sudo tee /usr/share/keyrings/cloudflare-public-v2.gpg > /dev/null
echo 'deb [signed-by=/usr/share/keyrings/cloudflare-public-v2.gpg] https://pkg.cloudflare.com/cloudflared any main' \
  | sudo tee /etc/apt/sources.list.d/cloudflared.list > /dev/null
sudo apt update -y
sudo apt install -y cloudflared

# Ask for required variables
read -p "The SSH URL of the repository: " repo
read -p "Your email: " email
read -p "The CMS hostname (cms.example.com): " domain
read -p "Local port for the CMS (3000): " port
port=${port:-3000}

dir="$(pwd)/${domain}"

# Create a SSH deploy key
ssh_file="$(pwd)/.ssh/id_rsa_${domain}"
mkdir -p "$(pwd)/.ssh"
ssh-keygen -t rsa -b 4096 -C "${email}" -N "" -f "${ssh_file}"

echo "Add the following deploy key to the GitHub repository settings"
echo "and allow write access:"
echo "---"
cat "${ssh_file}.pub"
echo "---"
read _

# Setup git repository
git -c core.sshCommand="ssh -i ${ssh_file}" clone "${repo}" "${dir}"

cd "${dir}"
git config user.email "${email}"
git config user.name LumeCMS
git config pull.rebase false
git config core.sshCommand "ssh -i ${ssh_file}"
cd ..

# Launcher: run `lume --serve` (auto-loads _cms.ts) bound to loopback only.
# IMPORTANT: 127.0.0.1, not localhost — on Ubuntu localhost resolves to IPv6
# ::1 first, and the tunnel would fail to reach an IPv4-only listener.
cat > "${dir}/.cms-serve.sh" << EOF
#!/usr/bin/env sh
cd "${dir}"
echo "import 'lume/cli.ts'" | "${deno}" run -A - -s --hostname=127.0.0.1 --port=${port}
EOF
chmod +x "${dir}/.cms-serve.sh"

# Systemd service for the CMS
service="lumecms-${domain}"
sudo tee /etc/systemd/system/${service}.service > /dev/null << EOF
[Unit]
Description=LumeCMS (${domain})
Documentation=https://lume.land/cms/
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
ExecStart=/usr/bin/env sh ${dir}/.cms-serve.sh
WorkingDirectory=${dir}
Restart=always
LimitNOFILE=65535

[Install]
WantedBy=multi-user.target
EOF
sudo systemctl daemon-reload
sudo systemctl enable --now ${service}

# Install the cloudflared connector
echo ""
echo "Now create a tunnel in the Cloudflare Zero Trust dashboard:"
echo "  Networks > Tunnels > Create a tunnel > Cloudflared > (name it)"
echo "then copy the connector token from the install command it shows."
read -p "Paste the cloudflared connector token: " cf_token
sudo cloudflared service install "${cf_token}"

# Firewall: SSH only. No 80/443 — the tunnel is outbound-only.
sudo ufw allow ssh
sudo ufw --force enable
sudo systemctl enable ufw

# Final dashboard steps (not scriptable without an API token)
cat << EOF

================================================================================
VPS side done. The CMS is serving on 127.0.0.1:${port}, and cloudflared is
connected. Finish in the Cloudflare dashboard:

1) Tunnel > Public Hostname > Add:
     Subdomain/Domain = ${domain}      Path = (blank)
     Service = HTTP  ->  127.0.0.1:${port}     <-- 127.0.0.1, NOT localhost
   This auto-creates a proxied CNAME. Delete any old A/AAAA records for
   ${domain} that point at this server's IP.

2) Zero Trust > Access > Applications > Add an application > Self-hosted:
     Application hostname = ${domain}  (path blank)
     Policy = Allow, include "Emails ending in @yourcompany.com"  (NOT "Everyone")

3) On the tunnel route > advanced settings > Access:
     Enable "Enforce Access JSON Web Token (JWT) validation" and select the app
     (defense in depth, since the CMS does no auth of its own).

Verify: open https://${domain} in an incognito window (signed out / VPN off) —
you should hit the Cloudflare Access login and be denied without a company
identity. Direct hits to this server's IP are firewalled off.

Update later with:  cd ${dir} && git pull && sudo systemctl restart ${service}
================================================================================
EOF
