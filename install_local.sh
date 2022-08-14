npm run build
echo "REPLACING THEME FILES"
cp -rf ./dist/. $(dirname "$(spicetify -c)")/Themes
echo "REPLACING EXTENSION FILES"
cp -rf ./dist/dribbblish-dynamic.js $(dirname "$(spicetify -c)")/Extensions
spicetify config extensions dribbblish-dynamic.js
spicetify config current_theme DribbblishDynamic
spicetify config color_scheme base
spicetify config inject_css 1 replace_colors 1 overwrite_assets 1

echo "PATCHING"
PATCH='[Patch]
xpui.js_find_8008 = ,(\\w+=)32,
xpui.js_repl_8008 = ,\${1}58,'
if cat $(spicetify -c) | grep -o '\[Patch\]'; then
    perl -i -0777 -pe "s/\[Patch\].*?($|(\r*\n){2})/$PATCH\n\n/s" $(spicetify -c)
else
    echo -e "\n$PATCH" >> $(spicetify -c)
fi

spicetify apply

sleep 100
