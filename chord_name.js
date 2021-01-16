// DOMセレクタ
const $id = (id) => document.getElementById(id);
const $name = (name) => document.getElementsByName(name);
const $c = (c) => document.getElementsByClassName(c);
const $q = (query) => document.querySelectorAll(query);

// 各タブUI
let p2c = {name:"p2c"};
let g2c = {name:"g2c"};
let c2p = {name:"c2p"};
let c2g = {name:"c2g"};
let ui = g2c;

const show_chords = (chords) =>
{
    $id("result").innerText = "";

    const colorcode = ["#f00", "#a00", "#800", "#600", "#300", "#000"];

    chords.forEach(chord => {
        let $li = document.createElement("li");
        $id("result").appendChild($li);
        $li.innerText = (chord.name);
        $li.style.fontSize = (140 - chord.comp * 10) + "%";
        $li.style.color = colorcode[chord.comp];
        if (chord.comp != chords[0].comp) return;
        $li.style.fontWeight = "bold";
        $li.style.backgroundColor = "#ecc"
    });
    if (chords.length) $id("chordname").value = chords[0].name;
};

const is_sharp = () => {
    const sharp = $c("accidental")[0].classList.contains("sharp");
    $c("accidental")[0].value = (sharp ? "[#]/b" : "#/[b]");
    return sharp;
};

const rewrap = (id) => {
    [...$q(".content_wrap")].map($dom => $dom.style.display = "none");
    [...$q("#tab li")].map($dom => $dom.classList.remove('select'));
    if (!id) id = decodeURI(location.hash.slice(1)).split("=").shift();
     $id(id) && $id(id).classList.add('select');
};

p2c.hash = (hash) => {
    if (hash == undefined) {
        return "#p2c="
            + [... $q(".keyboard.selected")].map($dom => $dom.id.slice(1))
            .sort().join("") + (is_sharp() ? "" : ".b");
    }

    hash.split(".").forEach(key => {
        if (key == "b") {
            $c("accidental")[0].classList.remove("sharp");
            return;
        }
        if (key.match(/^([123][0-9ab])+$/)) {
            [...$c("keyboard")].map($dom => $dom.classList.remove("selected"));
            (key.match(/(..)/g) || []).map(v => $id("k" + v).classList.add("selected"));
        }
    });
};

p2c.tone = () => {
    let $sel = [...$q(".keyboard.selected")];
    if ($sel.length < 2) return [];
    return $sel.map($dom => $dom.id).sort().map(v => parseInt("0x" + v.slice(1), 16) % 0x10);
};

p2c.event = () => {
    [...$c("keyboard")].map($dom => $dom.addEventListener("click", () => {
        let id = $q("#tab li.select")[0].id;
        if (id != "p2c") $id("p2c").click();
        $dom.classList.toggle("selected");
        location.hash = p2c.hash();
    }));
};

p2c.draw = () => {
    rewrap("p2c");
    $id("outchord").style.display = "";
    $c("piano")[0].style.display = "";
    show_chords(chordlibs.name(p2c.tone(), is_sharp()));
};

p2c.reset = () => {
    [...$q(".keyboard.selected")].map($dom => $dom.classList.remove("selected"));
};


g2c.hash = function(hash)
{
    if (hash == undefined) {
        let fret = [... $q(".fret.selected, .open.selected")].map($dom => $dom.id)
        .reduce((fret, v) => {
            const string = v[1] - 1;
            const pos = parseInt(v[2]);
            fret[string] = (0 < pos) ? pos : "x";
            return fret;
        }, [0,0,0,0,0,0]).join("");

        let params = [fret];
        const ceja = $q(".ceja.selected")[0]
        const pos = parseInt($c("ceja")[0].innerText);
        if (ceja) params.push(ceja.id);
        if (1 < pos) params.push("p" + pos);
        if (!is_sharp()) params.push("b");

        return "#g2c=" + params.join(".");
    }

    hash.split(".").forEach(key => {
        if (key.length == 6) {
            [...$q(".fret,.ceja,.open")].map($dom => $dom.classList.remove("selected"));
            key.split("").map((v, i) => {
                if (v == 0) return;
                let id = "g" + (i + 1).toString() + (v == "x" ? "0" : v);
                $id(id) && $id(id).classList.add("selected");
            });
        }
        if (key.match(/^c[0-7]+/)) {
            [... $c("ceja")].map($dom => $dom.classList.remove("selected"));
            $id(key).classList.add("selected");
        }
        if (key == "b") {
            $c("accidental")[0].classList.remove("sharp");
        }
        if (key.match(/^p[0-9]+/)) {
            [...$c("ceja")].map(($dom, i) => { $dom.innerText = (key.slice(1) * 1 + i); });
        }
    });
};

g2c.tone = function()
{
    let fretpos = [0,0,0,0,0,0];
    [... $q(".fret.selected, .open.selected")].forEach(($dom) => {
        var strg = $dom.id[1];
        var fret = $dom.id[2];
        fretpos[strg - 1] = (0 < fret) ? parseInt(fret) : -1;
    });

    // ツェーハの左側を押弦していたら開放扱い
    const ceja = $q(".ceja.selected")[0] ? $q(".ceja.selected")[0].id.slice(1) * 1 : 0;
    fretpos = fretpos.map(pos => ((pos != -1) && (pos < ceja)) ? ceja : pos);
    
    // フレット表示位置の追加
    fretpos = fretpos.map(pos => (pos <= 0) ? pos : ($c("ceja")[0].innerText * 1 - 1 + pos));

    //音名に変換
    const toneOpen = [4, 11, 7, 2, 9, 4]; //ギターの開放弦(EBGDAE)
    return fretpos.map((pos, i) => (pos == -1) ? -1 : ((pos + toneOpen[i]) % 12))
        .filter(tone => (tone != -1)).reverse();
};

g2c.draw = () => {
    let $ceja = $q(".ceja.selected");
    const ceja = ($ceja.length == 0) ? 0 : $ceja[0].id.slice(1);

    [... $c("fret")].forEach($dom => {
        $dom.innerText = "";
        const strg = $dom.id[1];
        const fret = $dom.id[2];
        if ($dom.classList.contains("selected") && (ceja < fret)) {
            let $div = document.createElement("div");
            $div.classList.add('pressdown');
            $dom.appendChild($div);
        }
        if ((ceja == fret) && (strg == 1)) {
            let $div = document.createElement("div");
            $div.classList.add('pressceja');
            $dom.appendChild($div);
        }
    });

    [... $c("open")].forEach($dom => {
        $dom.innerText = ("");
        if ($dom.classList.contains("selected"))
            $dom.innerText = ("X");
        else if (!ceja && $dom.parentNode.getElementsByClassName("selected").length == 0)
            $dom.innerText = ("O");

        let $div = document.createElement("div");
        $div.classList.add("strings");
        $dom.append($div);
    });

    rewrap("g2c");
    $c("guitar")[0].style.display = "";
    $id("outchord").style.display = "";
    show_chords(chordlibs.name(g2c.tone(), is_sharp()));
};

g2c.reset = () => {
    [...$q(".fret, .open, .ceja")].map($dom => $dom.classList.remove("selected"));
    [...$c("ceja")].map($dom => $dom.innerText = $dom.id.slice(1));
};

g2c.event = () => {
    [...$q(".fret, .open")].map(
        $dom => $dom.addEventListener("click", () => {
            const $ceja = $q(".ceja.selected");
            const ceja = ($ceja.length == 0) ? 0 : $ceja[0].id.slice(1);
            const pos = $dom.id.slice(1) % 10;
            if (0 < pos && pos <= ceja) return;
            let is_set = !$dom.classList.contains("selected");
            [...$dom.parentNode.children].map($sibl => $sibl.classList.remove("selected"));
            if (is_set) $dom.classList.add("selected");
            location.hash = g2c.hash();
        }));

    [...$c("ceja")].map($dom => $dom.addEventListener("click", () => {
        let is_set = !$dom.classList.contains("selected");
        [...$c("ceja")].map($sibl => $sibl.classList.remove("selected"));
        if (is_set) $dom.classList.add("selected");
        location.hash = g2c.hash();
    }));
    
    $c("plus")[0].addEventListener("click", () => {
        if ($c("ceja")[0].innerText * 1 >= 22) return;
        [...$c("ceja")].map($obj => $obj.innerText = ($obj.innerText * 1 + 1));
        location.hash = g2c.hash();
    });
    
    $c("minus")[0].addEventListener("click", () => {
        if ($c("ceja")[0].innerText * 1 <= 1) return;
        [...$c("ceja")].map($obj => $obj.innerText = ($obj.innerText * 1 - 1));
        location.hash = g2c.hash();
    });
};

c2p.reset = () => {
    [... $q("#inchord input[type=checkbox]")].map($dom => ($dom.checked = false));
    $id("chordname").value = [...$q("#root option")].find($dom => $dom.selected).value;
};

c2p.hash = (hash) => {
    if (hash == undefined) {
        let hash = "#" + $q("#tab li.select")[0].id + "=" + $id("chordname").value;
        return hash;
    }

    hash.split(".").filter(v => v).forEach(key => {
        $id("chordname").value = key;
        if (key[1] == "b") $c("accidental")[0].classList.remove("sharp");
        if (key[1] == "#") $c("accidental")[0].classList.add("sharp");
    });

    c2p.draw();
};

c2p.event = () => {
    const $checks = [... $q("#inchord input[type=checkbox]")];
    const listener = $dom => $dom.addEventListener("change", () => {
        let val = $dom.parentNode.innerText.split("/").shift().trim();
        let options = $checks.map($dom => $dom.parentNode.innerText.split("/").shift().trim());

        // 排他処理
        if ($dom.checked) {
            [["+5","-5","dim"],
             ["+5","-5","omit5"],
             ["+5","(-13)"],
             ["-5","(+11)"],
             ["m","(+9)"],
             ["m", "omit3", "sus4", "sus2"],
             ["(11)", "sus4"],
             ["(13)", "6"],
             ["m", "dim"],
             ["6","M7","7"]].filter(excls => excls.indexOf(val) != -1)
                .map(excls => excls.join(";")).join(";").split(";").sort()
                .map(form => options.indexOf(form)).filter(v => v != -1)
                .forEach(idx => $checks[idx].checked = false);
            $dom.checked = true;
        }
        
        // 命名
        let root = [...$q("#root option")].find($dom => $dom.selected).value;
        let onroot = [...$q("#onroot option")].find($dom => $dom.selected).value;
        $id("chordname").value = root + $checks.map(($dom, n) => {
            if (!$dom.checked) return "";
            let key = options[n];
            if (key != "on") return key;
            return (onroot == root) ? "" : " (on " + onroot + ")";
        }).join("");

        location.hash = c2p.hash();
    });

    $checks.map(listener);
    [...$q("#inchord select")].map(listener);
    $id("chordname").addEventListener("keydown", (e) => {
        if (e.keyCode == 13)
            location.hash = c2p.hash();
    });
};

c2p.show_form = (tones) => {
    $c("piano")[0].style.display = "";
    $id("inchord").style.display = "";
    [...$c("keyboard")].map($dom => $dom.classList.remove("selected"));

    tones.map(tone => tone % 12)
        .map(tone => (tone < tones[0] ? "2" : "1") + tone.toString(16))
        .forEach(name => $id("k" + name).classList.add("selected"));
};

c2p.draw = () => {

    let $this = $id("chordname");
    let struct = chordlibs.struct($this.value);
    if (!struct) {
        let val = [...$q("#root option")].find($dom => $dom.selected).value + $this.value;
        $this.value = (val);
        struct = chordlibs.struct(val);
    }

    rewrap();
    let ui = $q("#tab li.select")[0].id == "c2p" ? c2p : c2g;
    ui.show_form(struct.tones);

    const show_ignored = (ignored) => {
        if (!ignored) {
            return $id("ignored").style.display = "none";
        }
        $id("ignored").style.display = "inline";
        $id("ignoredstr").innerText = ignored;
    };
    show_ignored(struct.ignored);

    (is_sharp() ?
     ["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"] :
     ["C","Db","D","Eb","E","F","Gb","G","Ab","A","Bb","B"])
        .forEach((name, i) =>
                 $q("#root option")[i].innerText =
                 $q("#onroot option")[i].innerText = name);
    $this.focus();
    
    // namefactorをformに展開
    const $checks = [...$q("#inchord input[type=checkbox]")];
    const options = $checks.map($dom => $dom.parentNode.innerText.split("/").shift().trim());

    $checks.map($dom => ($dom.checked = false));
    $q("#root option")[struct.root].selected = true;
    if (struct.onroot != -1) {
        $q("#onroot option")[struct.onroot].selected = true;
        $checks[$checks.length - 1].checked = true;
    }

    struct.tensions.concat([struct.triad, struct.tetrad]).map(name => {
        if (!name) return -1;
        let form = {"min":"m", "aug":"+5", "maj7":"M7"}[name] || name;
        let interval = chordlibs.interval2semitone(form);
        return (interval < 0) ? options.indexOf(form) :
            options.map(v => chordlibs.interval2semitone(v))
            .indexOf(interval);
    }).filter(v => v != -1)
        .forEach(idx => ($checks[idx].checked = true));
};

c2g.reset = c2p.reset;
c2g.hash = c2p.hash;
c2g.draw = c2p.draw;
c2g.show_form = (tones) => {
    $c("gtform")[0].style.display = "";
    $id("inchord").style.display = "";
    $id("chforms").innerText = "";

    guitarform(tones).map(v => {
        let fret = v.form;
        let $chord = $id("chord_template").cloneNode(true);
        $chord.style.display = "block";
        $id("chforms").appendChild($chord);

        let min = fret.reduce((min, v) => ((0 < v) && (min == -1 || v < min) ? v : min), -1);
        if (0 < min) $chord.getElementsByClassName("min")[0].innerText = (min);
        $chord.getElementsByClassName("point")[0].innerText = (v.eval);

        fret.map((val, index) => {
            let $span = document.createElement("span");
            let $div = document.createElement("div");
            let row = (index == 0) ? 4 : (5 - index);
            $div.style.top = ((index == 0) ? 0 : -7) + "px";
            let col = (0 < val) ? (val - min) : 0;
            $div.style.left = ((0 < val) ? 3 : -9) + "px";
            $div.classList.add("s");

            $chord.querySelectorAll(".onko tr")[row].children[col].appendChild($span);
            $span.appendChild($div);

            if (val < 0) {
                $div.style["background-color"] = "transparent";
                $div.innerText = "X";
            }
        });
        $chord.onclick = () => {
            location.hash = "#g2c="
                + fret.reverse().map(v => 0 < v ? (v - min + 1) : (v == 0 ?  0 : "x")).join("")
                + "." + "p" + min;
        };
    });
};



window.onload = function() {
    // モード切替
    [...$q("#tab li")].map($dom => $dom.addEventListener("click", function() {
        location.hash = "#" + $dom.getAttribute("id") + "=";
    }));

    // リセット
    $c("reset")[0].addEventListener("click", function(){
        ui.reset();
        extract_hash();
    });

    // 臨時記号
    $c("accidental")[0].addEventListener("click", function(){
        this.classList.toggle("sharp");
        extract_hash();
    });

    // プルダウン生成
    [...Array(12)].forEach(v => {
        let $opt = document.createElement("option");
        $id("root").appendChild($opt);
        $id("onroot").appendChild($opt.cloneNode(true));
    });

    p2c.event();
    g2c.event();
    c2p.event();

    // ハッシュのDOM展開
    const extract_hash = (hash) => {
        if (!hash) hash = "#" + $q("#tab li.select")[0].getAttribute("id") + "=";

        let param = decodeURI(hash.slice(1)).split("=");
        const id = param.shift();
        const key = param.shift();

        ui = g2c;
        if (id == "p2c") ui = p2c;
        if (id == "c2p") ui = c2p;
        if (id == "c2g") ui = c2g;

        ui.hash(key);
        let rehash = ui.hash();
        if (rehash == location.hash) return ui.draw();
        location.hash = rehash;
    };

    window.addEventListener("hashchange", () => { extract_hash(location.hash); }, false);
    extract_hash(location.hash);
};
