// コード名を返す
var chordname = function(tones, is_sharp)
{
    var complex = 0; //複雑さ

    //音名
    var tonename = function(tone)
    {
        tone %= 12;
        if (is_sharp)
            return ["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"][tone];
        else
            return ["C","Db","D","Eb","E","F","Gb","G","Ab","A","Bb","B"][tone];
    };

    //音程配列 bool[12]
    var relatives = function(root, tones)
    {
        return tones.reduce(function(ret, v) {
            ret[(v - root + 12) % 12] = true;
            return ret;
        }, []);
    };

    //3度と5度を取り出す(なんかエレガントな書き方ないか...?)
    var factorize = function(incl)
    {
        var triad = {};

        //m7とM7が同時に鳴っている和音はコード化できない
        if (incl[10] && incl[11]) return {};

        if (incl[4]) {        // ------------ M3 based
            triad.third = 4;
            if(incl[7]){          // M3 + P5
                triad.fifth = 7;
            } else if(incl[8]) {  // M3 + aug5
                triad.fifth = 8;
            } else if(incl[6]) {  // M3 + dim5 (複雑)
                triad.fifth = 6;
                complex += 3;
            } else {
                triad.opt = "omit5";
                complex += 3;
            }
        } else if (incl[3]) { // -------------- m3 based
            triad.third = 3;
            if (incl[7]) {         // m3 + P5
                triad.fifth = 7;
            } else if(incl[6]) {  // m3 + dim5
                triad.fifth = 6;
            } else if(incl[8]) {  // m3 + aug5 (複雑)
                triad.fifth = 8;
                complex += 3;
            } else {
                triad.opt = "omit5";
                complex += 3;
            }
        } else if (incl[7]) { // ------------- P5 based
            triad.fifth = 7;
            if (incl[5]) {              // P5 + P4
                triad.opt = "sus4";
                complex++;
                incl[5] = false;
            } else {
                triad.opt = "omit3";
                complex += 3;
            }
        }

        incl[triad.third] = false;
        incl[triad.fifth] = false;

        return triad;
    };

    //三和音と残りの構成音をコード名にする
    var assemblechord = function(triad, incl)
    {
        var tension = [];
        var str_triad = "";
        var str_7th = "";
        var str_5th = "";
        
        if (triad.third == 3) str_triad = "m";
        if (triad.third == 4) str_triad = "";
        if (triad.fifth == 6) str_5th = "-5";
        if (triad.fifth == 8) str_5th = "+5";
        if (incl[11]) str_7th = "M7";
        if (incl[10]) str_7th = "7";
        
        if (incl[1]) tension.push("-9");
        if (incl[2]) tension.push("9");
        if (incl[3]) tension.push("+9");
        if (incl[5]) tension.push("11");
        if (incl[6]) tension.push("+11");
        if (incl[8]) tension.push("-13");

        // 6th or 13th(7th,±5thがある場合のみ)
        if (incl[9]) {
            if (str_7th || str_5th)
                tension.push("13");
            else
                str_7th = "6";
        }
        
        // 慣用句 m-5(13) -> dim7
        if ((triad.third == 3) && (triad.fifth == 6) && incl[9] && !str_7th){
            str_triad = "dim";
            str_7th = "7";
            str_5th = "";
            tension.pop();
        }

        // テンションが2個以上あるときは複雑
        if (2 <= tension.length) complex += tension.length - 1;
        
        return str_triad
            + str_7th
            + str_5th
            + (tension.length ? "(" + tension.join(",") + ")" : "")
            + (triad.opt ? triad.opt: "");
    };

    //tones[] からコード名をつける
    return function(tones)
    {
        var originroot = tones[0];

        //重複音の除去
        tones = tones.filter((tone, i, self) => self.indexOf(tone) == i);

        //転回形を考える
        return tones.map(function(root) {
            complex = 0;

            // ルートからの音程クラス配列を得る
            var includings = relatives(root, tones);
 
            // 3度と5度を取り出す
            var triad = factorize(includings);
            if (!triad.third && !triad.fifth) return;

            // 命名する
            var fullname = tonename(root) + assemblechord(triad, includings);

            // オンコード
            if (root != originroot) {
                fullname += " (on " + tonename(originroot) + ")";
                complex++;
            }

            return {name:fullname, comp:complex};

        }).filter(a => a).sort(function(a, b){ return (a.comp - b.comp); });
    }(tones);
};

//コード名表示
var show_result = function(chords)
{
    $("#result").text("");

    var colorcode = ["#f00", "#a00", "#800", "#600", "#300", "#000"];

    chords.forEach(function(chord) {
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

// UIからtonesをつくる
var pftone = function()
{
    location.href = "#pf2c."
        + $(".keyboard.selected").map(function(){ return $(this).attr("name"); })
        .get().sort().join("");

    if ($(".keyboard.selected").length < 2) return [];

    return $(".keyboard.selected").map(function(){ return $(this).attr("name"); })
        .get().sort().map(tone => parseInt("0x" + tone, 16) % 0x10);
};

// UIからtonesをつくる
var gttone = function()
{
    var fretpos = [0,0,0,0,0,0];
    $(".fret.selected, .open.selected").each(function(){
        var strg = $(this).attr("name").charAt(0);
        var fret = $(this).attr("name").charAt(1);
        fretpos[strg - 1] = (0 < fret) ? parseInt(fret) : -1;
    });

    // 引数
    location.href = "#gt2c." + fretpos.map(v => v == -1 ? "x" : v.toString()).join("");
    location.href += ".c" + $(".ceja.selected").text() + ".p" + $(".ceja:first").text();

    // ツェーハの左側を押弦していたら開放扱い
    $(".ceja.selected").each(function(){
        var ceja = parseInt($(this).attr("name"));
        fretpos = fretpos.map(pos => ((pos != -1) && (pos < ceja)) ? ceja : pos);
    });

    // フレット表示位置の追加
    fretpos = fretpos.map(pos => (pos <= 0) ? pos : ($(".ceja:first").text() * 1 - 1 + pos));

    //音名に変換
    var toneOpen = [4, 11, 7, 2, 9, 4]; //ギターの開放弦(EBGDAE)
    return fretpos.map((pos, i) => (pos == -1) ? -1 : ((pos + toneOpen[i]) % 12))
        .filter(tone => (tone != -1)).reverse();
};

//コード表示欄の更新
var screenout = function()
{
    var chords = chordname(
        ($("#tab li.select").attr("id") == "gt") ? gttone() : pftone(),
        $(".accidental").hasClass("sharp")
    );
    show_result(chords);
};


//フレット表示欄の更新
var screenout_fret = function()
{
    var $ceja = $(".ceja.selected");

    var ceja = ($ceja.length == 0) ? 0 : $ceja.attr("name");
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
    screenout();
};


// pf2c・gt2cのUIイベントハンドラ
$(function() {
    $("#tab li").click(function() {
        var id = $(this).attr("id");
        $(".content_wrap").hide();
        $("#tab li").removeClass('select');
        $(this).addClass('select');
        if (id == "pf") $(".piano, #outchord").show();
        if (id == "gt") $(".guitar, #outchord").show();
        if (id == "ch2pf") $(".piano, #inchord").show();
        if (id == "ch2gt") $(".gtform, #inchord").show();
        screenout_fret();
    }).filter(".select").click();
    
    $(".reset").click(function(){
        if ($("#tab li.select").attr("id") === "pf") {
            $(".keyboard.selected").removeClass("selected");
            location.href = "#pf";
        } else {
            $(".fret, .open, .ceja").removeClass("selected");
            $(".ceja").each(function(){ $(this).text($(this).attr("name")); });
            location.href = "#gt";
        }
        screenout_fret();
    });
    
    $(".accidental").click(function(){
        var is_sharp = !($(this).hasClass("sharp"))
        if (is_sharp)
            $(this).addClass("sharp");
        else
            $(this).removeClass("sharp");
        
        $(this).val(is_sharp ? "[#]/b" : "#/[b]");
        if (!is_sharp) location.href += ";flat";
        screenout();
    });
    
    $(".keyboard").click(function(){
        var $obj = $(this);
        if($obj.hasClass("selected") ){
            $obj.removeClass("selected");
        } else {
            $obj.addClass("selected");
        }
        screenout();
    });

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
        screenout_fret();
    });
    $(".ceja").click( function(){
        var ceja = $(".ceja.selected").attr("name");
        var is_set = !$(this).hasClass("selected");
        $(".ceja").removeClass("selected");
        if (is_set) $(this).addClass("selected");
        screenout_fret();
    });
    $(".plus").click(function(){
        if ($(".ceja:last").text() * 1 >= 22) return;
        $(".ceja").each(function(){ $(this).text($(this).text() * 1 + 1); });
        screenout();
    });
    $(".minus").click(function(){
        if ($(".ceja:first").text() * 1 <= 1) return;
        $(".ceja").each(function(){ $(this).text($(this).text() * 1 - 1); });
        screenout();
    });
});
