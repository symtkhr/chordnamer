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

*/

let p2c = {};
let g2c = {};
let c2p = {};
let c2g = {};
let ui = g2c;

const show_chords = (chords) =>
{
    $("#result").text("");

    const colorcode = ["#f00", "#a00", "#800", "#600", "#300", "#000"];

    chords.forEach(chord => {
        var $li = $("<li>").appendTo("#result").text(chord.name).css({
            "font-size": (140 - chord.comp * 10) + "%",
            "color": colorcode[chord.comp],
        });
        if (chord.comp != chords[0].comp) return;
        $li.css({
            "font-weight": "bold",
            "background-color": "#ecc"
        });
    });
}

const is_sharp = () => {
    const sharp = $(".accidental").hasClass("sharp");
    $(".accidental").val(sharp ? "[#]/b" : "#/[b]");
    return sharp;
};

p2c.show_chords = show_chords;
p2c.hash = (hash) => {
    if (hash == undefined) {
        location.href = "#p2c="
            + $(".keyboard.selected").map(function(){ return $(this).attr("name"); })
            .get().sort().join("");
        return;
    }

    hash.split(".").forEach(key => {
        if (key == "b") {
            $(".accidental").removeClass("sharp");
            return;
        }
        if (key.match(/^([123][0-9ab])+$/)) {
            $(".keyboard").removeClass("selected");
            (key.match(/(..)/g) || []).forEach(v => {
                $(".keyboard[name=" + v + "]").addClass("selected");
            });
        }
    });
};

p2c.tone = () => {
    if ($(".keyboard.selected").length < 2) return [];
    return $(".keyboard.selected").map(function(){ return $(this).attr("name"); })
        .get().sort().map(tone => parseInt("0x" + tone, 16) % 0x10);
};

p2c.event = () => {
    $(".keyboard").click(function(){
        let id = $("#tab li.select").attr("id");
        if (id != "p2c") $("#p2c").click();
        var $obj = $(this);
        if ($obj.hasClass("selected")) {
            $obj.removeClass("selected");
        } else {
            $obj.addClass("selected");
        }
        p2c.hash();
    });
};

p2c.draw = () => {
    $(".piano, #outchord").show();
    const chords = chordname(p2c.tone(), is_sharp());
    return p2c.show_chords(chords);
};

p2c.reset = () => {
    $(".keyboard.selected").removeClass("selected");
};


g2c.show_chords = show_chords;

g2c.hash = function(hash)
{
    if (hash == undefined) {
        let fret = $(".fret.selected, .open.selected").map(function(){
            return $(this).attr("name");
        }).get().reduce((fret, v) => {
            const string = v[0] - 1;
            const pos = parseInt(v[1]);
            fret[string] = (0 < pos) ? pos : "x";
            return fret;
        }, [0,0,0,0,0,0]).join("");
        
        let params = [fret];
        const ceja = $(".ceja.selected").attr("name");
        const pos = parseInt($(".ceja:first").text());
        if (ceja) params.push("c" + ceja);
        if (pos > 1) params.push("p" + pos);
        if (!$(".accidental").hasClass("sharp")) params.push("b");
        
        location.href = "#g2c=" + params.join(".");
        return;
    }

    hash.split(".").forEach(key => {
        if (key.length == 6) {
            $(".fret,.ceja,.open").removeClass("selected");
            key.split("").map((v,i) => (v == "x") ? [".open", (i * 10 + 10)] : [".fret", (i * 10 + 10 + v * 1)])
                .forEach(obj => $(obj[0] + "[name=" + obj[1] + "]").addClass("selected"));
        }
        if (key.match(/^c[0-9]+/)) {
            $(".ceja").removeClass("selected");
            $(".ceja[name=" + key.slice(1) + "]")
                .addClass("selected");
        }
        if (key == "b") {
            $(".accidental").removeClass("sharp");
        }
        if (key.match(/^p[0-9]+/)) {
            $(".ceja").each(function(i){
                $(this).text(key.slice(1) * 1 + i);
            });
        }
    });
};

g2c.tone = function()
{
    let fretpos = [0,0,0,0,0,0];
    $(".fret.selected, .open.selected").each(function(){
        var strg = $(this).attr("name").charAt(0);
        var fret = $(this).attr("name").charAt(1);
        fretpos[strg - 1] = (0 < fret) ? parseInt(fret) : -1;
    });

    // ツェーハの左側を押弦していたら開放扱い
    $(".ceja.selected").each(function(){
        const ceja = parseInt($(this).attr("name"));
        fretpos = fretpos.map(pos => ((pos != -1) && (pos < ceja)) ? ceja : pos);
    });

    // フレット表示位置の追加
    fretpos = fretpos.map(pos => (pos <= 0) ? pos : ($(".ceja:first").text() * 1 - 1 + pos));

    //音名に変換
    const toneOpen = [4, 11, 7, 2, 9, 4]; //ギターの開放弦(EBGDAE)
    return fretpos.map((pos, i) => (pos == -1) ? -1 : ((pos + toneOpen[i]) % 12))
        .filter(tone => (tone != -1)).reverse();
};

g2c.draw = () => {
    var $ceja = $(".ceja.selected");

    const ceja = ($ceja.length == 0) ? 0 : $ceja.attr("name");
    $(".fret").text("").each(function(){
        var strg = $(this).attr("name").charAt(0);
        var fret = $(this).attr("name").charAt(1);
        if ($(this).hasClass("selected") && (ceja < fret))
            $("<div>").addClass('pressdown').appendTo(this);
        if ((ceja == fret) && (strg == 1))
            $("<div>").addClass('pressceja').appendTo(this);
    });

    $(".open").text("").each(function(){
        if ($(this).hasClass("selected"))
            $(this).text("X");
        else if (ceja)
            return;
        else if ($(this).siblings(".selected").length == 0)
            $(this).text("O");
    });
    $("<div>").addClass("strings").appendTo(".open");

    $(".guitar, #outchord").show();
    const chords = chordname(g2c.tone(), is_sharp());
    g2c.show_chords(chords);
};



g2c.reset = () => {
    $(".fret, .open, .ceja").removeClass("selected");
    $(".ceja").each(function(){ $(this).text($(this).attr("name")); });
};

g2c.event = () => {
    $(".fret, .open").click(function(){
        var $ceja = $(".ceja.selected");
        var ceja = ($ceja.length == 0) ? 0 : $ceja.attr("name");
        var fret_dep = $(this).attr("name") % 10;
        if (0 < fret_dep && fret_dep <= ceja) return;
        if (!$(this).hasClass("selected")){
            $(this).siblings(".selected").removeClass("selected");
            $(this).addClass("selected");
        } else {
            $(this).removeClass("selected");
        }
        g2c.hash();
    });
    
    $(".ceja").click( function(){
        var ceja = $(".ceja.selected").attr("name");
        var is_set = !$(this).hasClass("selected");
        $(".ceja").removeClass("selected");
        if (is_set) $(this).addClass("selected");
        g2c.hash();
    });
    
    $(".plus").click(function(){
        if ($(".ceja:last").text() * 1 >= 22) return;
        $(".ceja").each(function(){ $(this).text($(this).text() * 1 + 1); });
        g2c.hash();
    });
    
    $(".minus").click(function(){
        if ($(".ceja:first").text() * 1 <= 1) return;
        $(".ceja").each(function(){ $(this).text($(this).text() * 1 - 1); });
        g2c.hash();
    });
};

c2p.reset = () => {
    $("#inchord :checkbox").prop("checked", false);
};

c2p.hash = (hash) => {
    if (hash == undefined) {
        location.href = "#" + $("#tab li.select").attr("id") + "=" + $("#chordname").val();
        return;
    }

    hash.split(".").forEach(key => {
        if (key == "b") {
            $(".accidental").removeClass("sharp");
            return;
        }
        $("#chordname").val(key);
    });

    c2p.name2check();
};

c2p.event = () => {
    $("#chordname").keydown(function(e) {
        if (e.keyCode != 13) return;
        c2p.hash();
    });

    $("#inchord :checkbox, #inchord select").change(function() {
        var val = $(this).parent().text().split("/").shift().trim();

        // 排他処理
        if ($(this).prop("checked")) {
            var list = $("#inchord label").map(function(){ return $(this).text(); }).get()
                .map(key => key.split("/").shift().trim());

            [["+5","-5","dim"],
             ["+5","-5","omit5"],
             ["+5","(-13)"],
             ["-5","(+11)"],
             ["m","(+9)"],
             ["m", "omit3", "sus4", "sus2"],
             ["(11)", "sus4"],
             ["(13)", "6"],
             ["m", "dim"],
             ["6","M7","7"]].forEach(function(exclusives) {
                 if (exclusives.indexOf(val) < 0) return;

                 exclusives.forEach(function(form) {
                     if (list.indexOf(form) < 0) return;
                     $("#inchord :checkbox").eq(list.indexOf(form)).prop("checked", false);
                 });
             });
            $(this).prop("checked", true);
        }

        let ret = c2p.check2name();
        c2p.hash();
    });

};

// 命名およびretオブジェクトの生成
c2p.check2name = () => {
    const diffform = {"m": "min", "aug": "+5", "M7":"maj7"};
    var ret = {root:0, triad: "", tetrad: "", tensions: [], onroot: -1};
    ret.root = pitchclass($("#root option:selected").text());
    var val = $("#root option:selected").text();

    $("#inchord :checkbox:checked").each(function() {
        var n = $("#inchord :checkbox").index(this)
        var key = $(this).parent().text().split("/").shift().trim();
        if (key == "on") {
            var onrootkey = $("#onroot option:selected").text();
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

    $("#chordname").val(val);
    return ret;
};

const ignored_chordname = (ignored) => {
    if (!ignored) {
        return $("#ignored").hide();
    }
    $("#ignored").show();
    $("#ignoredstr").text(ignored);
};

c2p.draw = (struct) => {
    $(".piano, #inchord").show();
    $(".keyboard").removeClass("selected");
    var tones = name2tones(struct.triad, struct.tetrad, struct.tensions);
    var onroot = struct.onroot == -1 ? struct.root : struct.onroot;
    
    let keynames = tones.map((reltone) => {
        if (reltone < 0) return;
        var tone = reltone + struct.root;
        if (tone % 12 == onroot % 12) return;
        if (tone < onroot) tone += 12;
        if (24 < tone) tone -= 12;
        return (parseInt(tone / 12) + 1).toString(16) + (tone % 12).toString(16);
    });
    
    keynames.push("1" + (onroot % 12).toString(16));
    keynames.forEach(name => {
        if (name) $(".keyboard[name=" + name + "]").addClass("selected");
    });
    ignored_chordname(struct.ignored);
};

c2p.name2check = () => {

    let $this = $("#chordname");
    var ret = c2t($this.val());
    if (!ret) {
        var val = $("#root option:selected").text() + $this.val()
        $this.val(val);
        ret = c2t(val);
    }

    $("#tab li.select").attr("id") == "c2p" ? c2p.draw(ret) : c2g.draw(ret);

    // namefactorをformに展開
    const extract_form = function(root, onroot, namefactors)
    {
        var list = $("#inchord label").map(function(){ return $(this).text(); }).get()
            .map(key => key.split("/").shift().trim());
        $("#inchord :checkbox").prop("checked", false);
        const diffform = {"min":"m", "aug": "+5", "maj7":"M7"};
        
        namefactors.forEach((name) => {
            if (!name) return;
            var form = name;
            if (diffform[name]) form = diffform[name];
            
            if (list.indexOf(form) != -1) {
                $("#inchord :checkbox").eq(list.indexOf(form)).prop("checked", true);
                return;
            }
            var val = form;
            
            //テンション
            var interval = interval2semitone(val);
            if (interval < 0) return;
            // (c2t内でやるべき)
            var form = { 13: "(-9)", 14: "(9)", 15: "(+9)",
                         17: "(11)", 18: "(+11)",
                         20: "(-13)", 21: "(13)",
                         6: "-5",  8: "+5"}[interval];
            if(list.indexOf(form) == -1) return;
            $("#inchord :checkbox").eq(list.indexOf(form)).prop("checked", true);
        });
        
        $("#root option").eq(root).prop("selected", true);
        
        if (onroot != -1) {
            $("#onroot option").eq(onroot).prop("selected", true);
            $("#inchord :checkbox:last").prop("checked", true);
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

    $(".gtform, #inchord").show();
    $("#chforms").html("");

    tri(tones);
    ignored_chordname(struct.ignored);
};



$(function() {
    // モード切替
    $("#tab li").click(function() {
        extract_hash("#" + $(this).attr("id") + "=");
    });

    // リセット
    $(".reset").click(function(){
        ui.reset();
        extract_hash();
    });

    // 臨時記号
    $(".accidental").click(function(){
        if ($(this).hasClass("sharp"))
            $(this).removeClass("sharp");
        else
            $(this).addClass("sharp");
        extract_hash();
    });

    ["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"].forEach(function(tone) {
        $("<option>").text(tone).appendTo("#root, #onroot");
    });

    p2c.event();
    g2c.event();
    c2p.event();

    // ハッシュのDOM展開
    const extract_hash = (hash) => {
        if (!hash) hash = "#" + $("#tab li.select").attr("id") + "=";

        let param = decodeURI(hash.slice(1)).split("=");
        const id = param.shift();
        const key = param.shift();

        $(".content_wrap").hide();
        $("#tab li").removeClass('select');
        $("#" + id).addClass('select');

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
});
