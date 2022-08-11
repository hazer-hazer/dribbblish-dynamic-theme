#!/bin/sh
# Copyright 2019 khanhas. GPL license.
# Edited from project Denoland install script (https://github.com/denoland/deno_install)

npm run build

cp ./dist/dribbblish-dynamic.js ../../Extensions/.
spicetify config extensions default-dynamic.js- extensions dribbblish.js- extensions Vibrant.min.js- extensions dribbblish-dynamic.js
spicetify config current_theme DribbblishDynamic
spicetify config color_scheme base
spicetify config inject_css 1 replace_colors 1 overwrite_assets 1

echo "PATCHING"
PATCH='[Patch]
xpui.js_find_8008 = ,(\\w+=)32,
xpui.js_repl_8008 = ,\${1}58,'
if cat config-xpui.ini | grep -o '\[Patch\]'; then
    perl -i -0777 -pe "s/\[Patch\].*?($|(\r*\n){2})/$PATCH\n\n/s" config-xpui.ini
else
    echo -e "\n$PATCH" >> config-xpui.ini
fi

echo "APPLYING"
spicetify apply
