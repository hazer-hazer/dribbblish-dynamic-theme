let current = "2.6.0";

/* Config settings */

DribbblishShared.config.register({
    area: "Animations & Transitions",
    type: "slider",
    key: "fadeDuration",
    name: "Color Fade Duration",
    description: "Select the duration of the color fading transition",
    defaultValue: 0.5,
    data: {
        min: 0,
        max: 10,
        step: 0.1,
        suffix: "s"
    },
    onChange: (val) => document.documentElement.style.setProperty("--song-transition-speed", val + "s")
});

// waitForElement because Spicetify is not initialized at startup
waitForElement(["#main"], () => {
    DribbblishShared.config.register({
        area: { name: "About", order: 999 },
        type: "button",
        key: "aboutDribbblish",
        name: "Info",
        description: `
            OS: ${capitalizeFirstLetter(Spicetify.Platform.PlatformData.os_name)} v${Spicetify.Platform.PlatformData.os_version}
            Spotify: v${Spicetify.Platform.PlatformData.event_sender_context_information?.client_version_string ?? Spicetify.Platform.PlatformData.client_version_triple}
            Dribbblish: v${current}
        `,
        data: "Copy",
        onChange: (val) => {
            copyToClipboard(DribbblishShared.config.getOptions("aboutDribbblish").description);
            Spicetify.showNotification("Copied Versions");
        }
    });
});

function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

function copyToClipboard(text) {
    var input = document.createElement("textarea");
    input.style.display = "fixed";
    input.innerHTML = text;
    document.body.appendChild(input);
    input.select();
    var result = document.execCommand("copy");
    document.body.removeChild(input);
    return result;
}

/* js */
function getAlbumInfo(uri) {
    return Spicetify.CosmosAsync.get(`hm://album/v1/album-app/album/${uri}/desktop`);
}

function isLight(hex) {
    var [r, g, b] = hexToRgb(hex).map(Number);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness > 128;
}

function hexToRgb(hex) {
    var bigint = parseInt(hex.replace("#", ""), 16);
    var r = (bigint >> 16) & 255;
    var g = (bigint >> 8) & 255;
    var b = bigint & 255;
    return [r, g, b];
}

function rgbToHex([r, g, b]) {
    const rgb = (r << 16) | (g << 8) | (b << 0);
    return "#" + (0x1000000 + rgb).toString(16).slice(1);
}

const LightenDarkenColor = (h, p) =>
    "#" +
    [1, 3, 5]
        .map((s) => parseInt(h.substr(s, 2), 16))
        .map((c) => parseInt((c * (100 + p)) / 100))
        .map((c) => (c < 255 ? c : 255))
        .map((c) => c.toString(16).padStart(2, "0"))
        .join("");

function rgbToHsl([r, g, b]) {
    (r /= 255), (g /= 255), (b /= 255);
    var max = Math.max(r, g, b),
        min = Math.min(r, g, b);
    var h,
        s,
        l = (max + min) / 2;
    if (max == min) {
        h = s = 0; // achromatic
    } else {
        var d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r:
                h = (g - b) / d + (g < b ? 6 : 0);
                break;
            case g:
                h = (b - r) / d + 2;
                break;
            case b:
                h = (r - g) / d + 4;
                break;
        }
        h /= 6;
    }
    return [h, s, l];
}

function hslToRgb([h, s, l]) {
    var r, g, b;
    if (s == 0) {
        r = g = b = l; // achromatic
    } else {
        function hue2rgb(p, q, t) {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1 / 6) return p + (q - p) * 6 * t;
            if (t < 1 / 2) return q;
            if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
            return p;
        }
        var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        var p = 2 * l - q;
        r = hue2rgb(p, q, h + 1 / 3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1 / 3);
    }
    return [r * 255, g * 255, b * 255];
}

function setLightness(hex, lightness) {
    hsl = rgbToHsl(hexToRgb(hex));
    hsl[2] = lightness;
    return rgbToHex(hslToRgb(hsl));
}

function parseComputedStyleColor(col) {
    if (col.startsWith("#")) return col;
    if (col.startsWith("rgb("))
        return rgbToHex(
            col
                .replace(/rgb|(|)/g, "")
                .split(",")
                .map((part) => Number(part.trim()))
        );
}

// `parseComputedStyleColor()` beacuse "--spice-sidebar" is `rgb()`
let textColor = parseComputedStyleColor(getComputedStyle(document.documentElement).getPropertyValue("--spice-text"));
let textColorBg = parseComputedStyleColor(getComputedStyle(document.documentElement).getPropertyValue("--spice-main"));
let sidebarColor = parseComputedStyleColor(getComputedStyle(document.documentElement).getPropertyValue("--spice-sidebar"));

function setRootColor(name, colHex) {
    let root = document.documentElement;
    if (root === null) return;
    root.style.setProperty("--spice-" + name, colHex);
    root.style.setProperty("--spice-rgb-" + name, hexToRgb(colHex).join(","));
}

function toggleDark(setDark) {
    if (setDark === undefined) setDark = isLight(textColorBg);

    document.documentElement.style.setProperty("--is_light", setDark ? 0 : 1);
    textColorBg = setDark ? "#0A0A0A" : "#FAFAFA";

    setRootColor("main", textColorBg);
    setRootColor("player", textColorBg);
    setRootColor("card", setDark ? "#040404" : "#ECECEC");
    setRootColor("subtext", setDark ? "#EAEAEA" : "#3D3D3D");
    setRootColor("notification", setDark ? "#303030" : "#DDDDDD");

    updateColors(textColor, sidebarColor, false);
}

function checkDarkLightMode(colors) {
    const theme = DribbblishShared.config.get("theme");
    if (theme == 2) {
        // Based on Time
        const start = 60 * parseInt(DribbblishShared.config.get("darkModeOnTime").split(":")[0]) + parseInt(DribbblishShared.config.get("darkModeOnTime").split(":")[1]);
        const end = 60 * parseInt(DribbblishShared.config.get("darkModeOffTime").split(":")[0]) + parseInt(DribbblishShared.config.get("darkModeOffTime").split(":")[1]);

        const now = new Date();
        const time = 60 * now.getHours() + now.getMinutes();

        if (end < start) dark = start <= time || time < end;
        else dark = start <= time && time < end;
        toggleDark(dark);
    } else if (theme == 3) {
        // Based on Color
        if (colors && colors.length > 0) toggleDark(isLight(colors[0]));
    }
}
// Run every Minute to check time and set dark / light mode
setInterval(checkDarkLightMode, 60000);

DribbblishShared.config.register({
    area: "Theme",
    type: "checkbox",
    key: "dynamicColors",
    name: "Dynamic",
    description: "If the Theme's Color should be extracted from Albumart",
    defaultValue: true,
    onChange: (val) => updateColors(),
    showChildren: (val) => !val,
    children: [
        {
            type: "color",
            key: "colorOverride",
            name: "Color",
            description: "The Color of the Theme",
            defaultValue: "#1ed760",
            fireInitialChange: false,
            onChange: (val) => updateColors()
        }
    ]
});

DribbblishShared.config.register({
    area: "Theme",
    type: "select",
    data: ["Dark", "Light", "Based on Time", "Based on Color"],
    key: "theme",
    name: "Theme",
    description: "Select Dark / Bright mode",
    defaultValue: 0,
    showChildren: (val) => {
        if (val == 2) return ["darkModeOnTime", "darkModeOffTime"];
        //if (val == 3) return [""];
        return false;
    },
    onChange: (val) => {
        switch (val) {
            case 0:
                toggleDark(true);
                break;
            case 1:
                toggleDark(false);
                break;
            case 2:
                checkDarkLightMode();
                break;
            case 3:
                checkDarkLightMode();
                break;
        }
    },
    children: [
        {
            type: "time",
            key: "darkModeOnTime",
            name: "Dark Mode On Time",
            description: "Beginning of Dark mode time",
            defaultValue: "20:00",
            fireInitialChange: false,
            onChange: checkDarkLightMode
        },
        {
            type: "time",
            key: "darkModeOffTime",
            name: "Dark Mode Off Time",
            description: "End of Dark mode time",
            defaultValue: "06:00",
            fireInitialChange: false,
            onChange: checkDarkLightMode
        }
    ]
});

var currentColor;
var currentSideColor;

function updateColors(textColHex, sideColHex, checkDarkMode = true) {
    if (textColHex && sideColHex) {
        currentColor = textColHex;
        currentSideColor = sideColHex;
    } else {
        if (!(currentColor && currentSideColor)) return; // If `updateColors()` is called early these vars are undefined and would break
        textColHex = currentColor;
        sideColHex = currentSideColor;
    }

    if (!DribbblishShared.config.get("dynamicColors")) {
        const col = DribbblishShared.config.get("colorOverride");
        textColHex = col;
        sideColHex = col;
    }

    let isLightBg = isLight(textColorBg);
    if (isLightBg) textColHex = LightenDarkenColor(textColHex, -15); // vibrant color is always too bright for white bg mode

    let darkColHex = LightenDarkenColor(textColHex, isLightBg ? 12 : -20);
    let darkerColHex = LightenDarkenColor(textColHex, isLightBg ? 30 : -40);
    let buttonBgColHex = setLightness(textColHex, isLightBg ? 0.9 : 0.14);
    setRootColor("text", textColHex);
    setRootColor("button", darkerColHex);
    setRootColor("button-active", darkColHex);
    setRootColor("selected-row", darkerColHex);
    setRootColor("tab-active", buttonBgColHex);
    setRootColor("button-disabled", buttonBgColHex);
    setRootColor("sidebar", sideColHex);

    if (checkDarkMode) checkDarkLightMode([textColHex, sideColHex]);
}

let nearArtistSpanText = "";
let coverListenerInstalled = false;
async function songchange() {
    try {
        // warning popup
        if (Spicetify.Platform.PlatformData.client_version_triple < "1.1.68") Spicetify.showNotification(`Your version of Spotify ${Spicetify.Platform.PlatformData.client_version_triple}) is un-supported`);
    } catch (err) {
        console.error(err);
    }

    let album_uri = Spicetify.Player.data.track.metadata.album_uri;
    let bgImage = Spicetify.Player.data.track.metadata.image_url;
    if (bgImage === undefined) {
        bgImage = "/images/tracklist-row-song-fallback.svg";
        textColor = "#509bf5";
        updateColors(textColor, textColor);
        coverListenerInstalled = false;
    }
    if (!coverListenerInstalled) hookCoverChange(true);

    if (album_uri !== undefined && !album_uri.includes("spotify:show")) {
        const albumInfo = await getAlbumInfo(album_uri.replace("spotify:album:", ""));

        let album_date = new Date(albumInfo.year, (albumInfo.month || 1) - 1, albumInfo.day || 0);
        let recent_date = new Date();
        recent_date.setMonth(recent_date.getMonth() - 6);
        album_date = album_date.toLocaleString("default", album_date > recent_date ? { year: "numeric", month: "short" } : { year: "numeric" });
        album_link = '<a title="' + Spicetify.Player.data.track.metadata.album_title + '" href="' + album_uri + '" data-uri="' + album_uri + '" data-interaction-target="album-name" class="tl-cell__content">' + Spicetify.Player.data.track.metadata.album_title + "</a>";

        nearArtistSpanText = album_link + " • " + album_date;
    } else if (Spicetify.Player.data.track.uri.includes("spotify:episode")) {
        // podcast
        bgImage = bgImage.replace("spotify:image:", "https://i.scdn.co/image/");
        nearArtistSpanText = Spicetify.Player.data.track.metadata.album_title;
    } else if (Spicetify.Player.data.track.metadata.is_local == "true") {
        // local file
        nearArtistSpanText = Spicetify.Player.data.track.metadata.album_title;
    } else if (Spicetify.Player.data.track.provider == "ad") {
        // ad
        nearArtistSpanText = "advertisement";
        coverListenerInstalled = false;
        return;
    } else {
        // When clicking a song from the homepage, songChange is fired with half empty metadata
        // todo: retry only once?
        setTimeout(songchange, 200);
    }

    if (document.querySelector("#main-trackInfo-year") === null) {
        waitForElement([".main-trackInfo-container"], (queries) => {
            nearArtistSpan = document.createElement("div");
            nearArtistSpan.id = "main-trackInfo-year";
            nearArtistSpan.classList.add("main-trackInfo-artists", "ellipsis-one-line", "main-type-finale");
            nearArtistSpan.innerHTML = nearArtistSpanText;
            queries[0].append(nearArtistSpan);
        });
    } else {
        nearArtistSpan.innerHTML = nearArtistSpanText;
    }
    document.documentElement.style.setProperty("--image_url", 'url("' + bgImage + '")');
}

Spicetify.Player.addEventListener("songchange", songchange);

function pickCoverColor(img) {
    if (!img.currentSrc.startsWith("spotify:")) return;
    var swatches = new Vibrant(img, 5).swatches();
    lightCols = ["Vibrant", "DarkVibrant", "Muted", "LightVibrant"];
    darkCols = ["Vibrant", "LightVibrant", "Muted", "DarkVibrant"];

    mainCols = isLight(textColorBg) ? lightCols : darkCols;
    textColor = "#509bf5";
    for (var col in mainCols)
        if (swatches[mainCols[col]]) {
            textColor = swatches[mainCols[col]].getHex();
            break;
        }

    sidebarColor = "#509bf5";
    for (var col in lightCols)
        if (swatches[lightCols[col]]) {
            sidebarColor = swatches[lightCols[col]].getHex();
            break;
        }
    updateColors(textColor, sidebarColor);
}

waitForElement([".main-nowPlayingBar-left"], (queries) => {
    var observer = new MutationObserver(function (mutations) {
        mutations.forEach(function (mutation) {
            if (mutation.removedNodes.length > 0) coverListenerInstalled = false;
        });
    });
    observer.observe(queries[0], { childList: true });
});

function hookCoverChange(pick) {
    waitForElement([".cover-art-image"], (queries) => {
        coverListenerInstalled = true;
        var elem = queries.slice(-1)[0];
        if (pick && elem.complete && elem.naturalHeight !== 0) pickCoverColor(elem);
        elem.addEventListener("load", function () {
            try {
                pickCoverColor(elem);
            } catch (error) {
                console.error(error);
                setTimeout(pickCoverColor, 300, elem);
            }
        });
    });
}

(function Startup() {
    if (!Spicetify.showNotification) {
        setTimeout(Startup, 300);
        return;
    }
    // Check latest release
    fetch("https://api.github.com/repos/JulienMaille/dribbblish-dynamic-theme/releases/latest")
        .then((response) => {
            return response.json();
        })
        .then((data) => {
            if (data.tag_name > current) {
                upd = document.createElement("div");
                upd.innerText = `Theme UPD v${data.tag_name} avail.`;
                upd.classList.add("ellipsis-one-line", "main-type-finale");
                upd.setAttribute("title", `Changes: ${data.name}`);
                upd.style.setProperty("color", "var(--spice-button-active)");
                document.querySelector(".main-userWidget-box").append(upd);
                document.querySelector(".main-userWidget-box").classList.add("update-avail");
                new Spicetify.Menu.Item("Update Dribbblish", false, () => window.open("https://github.com/JulienMaille/dribbblish-dynamic-theme/blob/main/README.md#install--update", "_blank")).register();
            }
        })
        .catch((err) => {
            // Do something for an error here
            console.error(err);
        });
})();

document.documentElement.style.setProperty("--warning_message", " ");
