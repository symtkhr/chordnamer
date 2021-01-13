/* 

ui.g2c.draw() -> classDOMを画面展開(screenout_fret)
ui.g2c.hash(hash) -> hashをclassDOMに展開(extract), 無引数でDOMをhash化
ui.g2c.tone() -> hashをtone化 (gttone)
ui.g2c.events() -> clickイベント ($(function())
ui.gp2c.showchord() -> chordを画面表示
ui.sharp() -> sharp表現のトグル

ui.c2pg.events() -> clickイベント,keyイベント
ui.c2pg.hash(hash) -> hashをDOMに展開(extract), 無引数でDOMをhash化
ui.c2pg.check2name() -> checkからinputDOMに展開
ui.c2pg.name2check() -> inputDOM値からcheck展開
ui.c2pg.tone() -> {root:0, triad: "", tetrad: "", tensions: [], onroot: -1} というオブジェクトを返す
ui.c2p.draw(tone) -> 上記オブジェクトをベースに描画(analyze)
ui.c2g.draw(tone) -> 上記オブジェクトをベースに描画(analyze)

<hashベースに書換>
onload,tab click => domベース(hash書換)
それ以外 => hashベース

*/
const $id = (id) => document.getElementById(id);
const $name = (name) => document.getElementsByName(name);
const $c = (c) => document.getElementsByClassName(c);
const $q = (query) => document.querySelectorAll(query);

let p2c = {};
let g2c = {};
let c2p = {};
let c2g = {};
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
};

const is_sharp = () => {
    const sharp = $c("accidental")[0].classList.contains("sharp");
    $c("accidental")[0].value = (sharp ? "[#]/b" : "#/[b]");
    return sharp;
};

p2c.show_chords = show_chords;
p2c.hash = (hash) => {
    if (hash == undefined) {
        location.href = "#p2c="
            + [... $q(".keyboard.selected")].map($dom => $dom.id.slice(1))
            .sort().join("");
        return;
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
        p2c.hash();
    }));
};

p2c.draw = () => {
    $id("outchord").style.display = "";
    $c("piano")[0].style.display = "";
    const chords = chordname(p2c.tone(), is_sharp());
    return p2c.show_chords(chords);
};

p2c.reset = () => {
    [...$q(".keyboard.selected")].map($dom => $dom.classList.remove("selected"));
};


g2c.show_chords = show_chords;

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
        if (!$c("accidental")[0].classList.contains("sharp")) params.push("b");
        console.log(params);

        location.href = "#g2c=" + params.join(".");
        return;
    }

    hash.split(".").forEach(key => {
        if (key.length == 6) {
            [...$q(".fret,.ceja,.open")].map($dom => $dom.classList.remove("selected"));
            key.split("").map((v, i) => {
                if (v == 0) return;
                let id = "g" + (i + 1).toString() + (v == "x" ? "0" : v);
                $id(id).classList.add("selected");
            });
        }
        if (key.match(/^c[0-9]+/)) {
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
        else if (ceja)
            return;
        else if ($dom.parentNode.getElementsByClassName("selected").length == 0)
            $dom.innerText = ("O");
    });

    $c("guitar")[0].style.display = "";
    $id("outchord").style.display = "";

    [...$c("open")].map($dom => {
        let $div = document.createElement("div");
        $div.classList.add("strings");
        $dom.append($div);
    });

    const chords = chordname(g2c.tone(), is_sharp());
    g2c.show_chords(chords);
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
            g2c.hash();
        }));

    [...$c("ceja")].map($dom => $dom.addEventListener("click", () => {
        let is_set = !$dom.classList.contains("selected");
        [...$c("ceja")].map($sibl => $sibl.classList.remove("selected"));
        if (is_set) $dom.classList.add("selected");
        g2c.hash();
    }));
    
    $c("plus")[0].addEventListener("click", () => {
        if ($c("ceja")[0].innerText * 1 >= 22) return;
        [...$c("ceja")].map($obj => $obj.innerText = ($obj.innerText * 1 + 1));
        g2c.hash();
    });
    
    $c("minus")[0].addEventListener("click", () => {
        if ($c("ceja")[0].innerText * 1 <= 1) return;
        [...$c("ceja")].map($obj => $obj.innerText = ($obj.innerText * 1 - 1));
        g2c.hash();
    });
};

c2p.reset = () => {
    [... $q("#inchord input[type=checkbox]")].map($dom => ($dom.checked = false));
};

c2p.hash = (hash) => {
    if (hash == undefined) {
        location.href = "#" + $q("#tab li.select")[0].id + "=" + $id("chordname").value;
        return;
    }

    hash.split(".").forEach(key => {
        if (key == "b") {
            $c("accidental")[0].classList.remove("sharp");
            return;
        }
        $id("chordname").value = key;
    });

    c2p.name2check();
};

c2p.event = () => {
    $id("chordname").addEventListener("keydown", (e) => (e.keyCode == 13) ? c2p.hash() : "");

    [...$q("#inchord input[type=checkbox], #inchord select")].map(
        $dom => $dom.addEventListener("change", () => {
            let val = $dom.parentNode.innerText.split("/").shift().trim();

            // 排他処理
            if ($dom.checked) {
                let list = [...$q("#inchord label")]
                    .map($dom => $dom.innerText.split("/").shift().trim());

                [["+5","-5","dim"],
                 ["+5","-5","omit5"],
                 ["+5","(-13)"],
                 ["-5","(+11)"],
                 ["m","(+9)"],
                 ["m", "omit3", "sus4", "sus2"],
                 ["(11)", "sus4"],
                 ["(13)", "6"],
                 ["m", "dim"],
                 ["6","M7","7"]].forEach((exclusives) => {
                     if (exclusives.indexOf(val) < 0) return;

                     exclusives.forEach((form) => {
                         if (list.indexOf(form) < 0) return;
                         $q("#inchord input[type=checkbox]")[list.indexOf(form)].checked = false;
                     });
                 });
                $dom.checked = true;
            }

            let ret = c2p.check2name();
            c2p.hash();
        }));
};

// 命名およびretオブジェクトの生成
c2p.check2name = () => {
    const diffform = {"m": "min", "aug": "+5", "M7": "maj7"};
    let val = [...$q("#root option")].find($dom => $dom.selected).value;
    let ret = {root:0, triad: "", tetrad: "", tensions: [], onroot: -1, root: pitchclass(val)};

    [...$q("#inchord input[type=checkbox]")].map(($dom, n) => {
        if (!$dom.checked) return;
        let key = $dom.parentNode.innerText.split("/").shift().trim();
        if (key == "on") {
            let onrootkey = [...$q("#onroot option")].find($dom => $dom.selected).value;
            ret.onroot = pitchclass(onrootkey);
            if (ret.onroot == ret.root) {
                ret.onroot = -1;
            } else {
                val += " (on " + onrootkey + ")";
            }
            return;
        }
        val += key;
        if (diffform[key]) key = diffform[key];

        if (n < 2) ret.triad = key;
        else if (n < 5) ret.tetrad = key;
        else ret.tensions.push(key);
    });

    $id("chordname").value = val;
    return ret;
};

const ignored_chordname = (ignored) => {
    if (!ignored) {
        return $id("ignored").style.display = "none";
    }
    $id("ignored").style.display = "inline";
    $id("ignoredstr").innerText = ignored;
};

c2p.draw = (struct) => {
    $c("piano")[0].style.display = "";
    $id("inchord").style.display = "";
    [...$c("keyboard")].map($dom => $dom.classList.remove("selected"));
    let tones = name2tones(struct.triad, struct.tetrad, struct.tensions);
    let onroot = struct.onroot == -1 ? struct.root : struct.onroot;
    
    let keynames = tones.map((reltone) => {
        if (reltone < 0) return;
        let tone = reltone + struct.root;
        if (tone % 12 == onroot % 12) return;
        if (tone < onroot) tone += 12;
        if (24 < tone) tone -= 12;
        return (parseInt(tone / 12) + 1).toString(16) + (tone % 12).toString(16);
    });
    
    keynames.push("1" + (onroot % 12).toString(16));
    keynames.forEach(name => {
        if (name) $id("k" + name).classList.add("selected");
    });
    ignored_chordname(struct.ignored);
};

c2p.name2check = () => {

    let $this = $id("chordname");
    let ret = c2t($this.value);
    if (!ret) {
        let val = [...$q("#root option")].find($dom => $dom.selected).value + $this.value;
        $this.value = (val);
        ret = c2t(val);
    }

    $q("#tab li.select")[0].id == "c2p" ? c2p.draw(ret) : c2g.draw(ret);

    // namefactorをformに展開
    const extract_form = function(root, onroot, namefactors)
    {
        let $checks = $q("#inchord input[type=checkbox]");
        let list = [... $q("#inchord label")]
            .map($dom => $dom.innerText.split("/").shift().trim());
        [...$checks].map($dom => $dom.checked = false);
        const diffform = {"min":"m", "aug": "+5", "maj7":"M7"};
        
        namefactors.forEach((name) => {
            if (!name) return;
            let form = name;
            if (diffform[name]) form = diffform[name];
            
            if (list.indexOf(form) != -1) {
                $checks[list.indexOf(form)].checked = true;
                return;
            }
            let val = form;
            
            //テンション
            let interval = interval2semitone(val);
            if (interval < 0) return;
            // (c2t内でやるべき)
            form = { 13: "(-9)", 14: "(9)", 15: "(+9)",
                     17: "(11)", 18: "(+11)",
                     20: "(-13)", 21: "(13)",
                     6: "-5",  8: "+5"}[interval];
            if(list.indexOf(form) == -1) return;
            $checks[list.indexOf(form)].checked = true;
        });

        $q("#root option")[root].selected = true;

        if (onroot != -1) {
            $q("#onroot option")[onroot].selected = true;
            $checks[$checks.length - 1].checked = true;
        }
    };

    ret.tensions.push(ret.triad);
    ret.tensions.push(ret.tetrad);
    extract_form(ret.root, ret.onroot, ret.tensions);
};

c2g.reset = c2p.reset;
c2g.hash = c2p.hash;
c2g.draw = (struct) => {
    let tones = name2tones(struct.triad, struct.tetrad, struct.tensions)
        .sort((a, b) => (a - b))
        .map(tone => (tone + struct.root + 3) % 12);
    if (struct.onroot != -1)
        tones.unshift((struct.onroot + 3) % 12);

    $c("gtform")[0].style.display = "";
    $id("inchord").style.display = "";
    $id("chforms").innerText = "";

    tri(tones, (fret, point) => {
        let $chord = $id("chord_template").cloneNode(true);
        $chord.style.display = "block";
        $id("chforms").appendChild($chord);

        let min = fret.reduce((min, v) => ((0 < v) && (min == -1 || v < min) ? v : min), -1);
        if (min != 0) $chord.getElementsByClassName("min")[0].innerText = (min);
        $chord.getElementsByClassName("point")[0].innerText = (point);

        fret.map((val, index) => {
            let $div = document.createElement("div");
            $chord.appendChild($div);
            $div.classList.add("s");
            $div.css = (param) => Object.keys(param).forEach(key => $div.style[key] = param[key]);

            if (val == -1) {
                $div.css({"left": "0", "top": ((5 - index) * 7 - 3) + "px", "background-color":"transparent"});
                $div.innerHTML = "X";
            }
            else if (val == 0)
                $div.css({"left": "0", "top": ((5 - index) * 7) + "px"});
            else
                $div.css({"left": (12 * (val - min + 1)) + "px", "top": ((5 - index) * 7) + "px"});
        });
    });

    ignored_chordname(struct.ignored);
};



window.onload = function() {
    // モード切替
    [...$q("#tab li")].map($dom => $dom.addEventListener("click", function() {
        extract_hash("#" + $dom.getAttribute("id") + "=");
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

    ["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"].forEach((tone) => {
        let $opt = document.createElement("option");
        $opt.innerText = tone;
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

        [...$q(".content_wrap")].map($dom => $dom.style.display = "none");
        [...$q("#tab li")].map($dom => $dom.classList.remove('select'));
        $id(id).classList.add('select');

        if (id == "p2c") {
            ui = p2c;
            p2c.hash(key);
            p2c.hash();
            p2c.draw();
            return;
        }

        if (id == "c2p") {
            ui = c2p;
            ui.hash(key);
            ui.hash();
            return;
        }

        if (id == "c2g") {
            ui = c2g;
            ui.hash(key);
            ui.hash();
            return;
        }
        ui = g2c;
        g2c.hash(key);
        g2c.hash();
        g2c.draw();
    };

    window.addEventListener("hashchange", () => { extract_hash(location.hash); }, false);
    extract_hash(location.hash);
};
