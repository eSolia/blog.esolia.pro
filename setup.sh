# setup.sh to be auto-run from devcontainer.json via postCreateCommand on codespace creation
echo "= ADD PATHS and INITS to .bashrc ="
echo 'export PATH="/home/node/.deno/bin:$PATH"' >> ~/.bashrc
echo 'eval "$(starship init bash)"' >> ~/.bashrc

echo "= INSTALL LUME CLI ="
deno install --allow-run --allow-env --allow-read --name lume --force --reload --global https://deno.land/x/lume_cli/mod.ts

echo "= INSTALL STARSHIP PROMPT ="
curl -sS https://starship.rs/install.sh | sh -s -- -y && . ~/.bashrc

echo "= PREP COMPLETE ="
