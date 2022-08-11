npm run build
cp ./dist/dribbblish-dynamic.js %appdata%/spicetify/Extensions/
spicetify config extensions dribbblish-dynamic.js
spicetify config current_theme DribbblishDynamic
spicetify config color_scheme base
spicetify config inject_css 1 replace_colors 1 overwrite_assets 1
spicetify apply
