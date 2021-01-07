//コード名文字列解釈
var c2t = function(str) {
    var origin = str;
    str = str.split(" ").join("");

    var root = str.match(/^[A-G][#b]?/);
    if (!root) return false;
    str = str.substr(root[0].length);

    var onroot = str.match(/\(?(on|\/)([A-G][#b]?)\)?$/);
    if (onroot) {
        str = str.substr(0, str.length - onroot[0].length);
    }
    
    var triad = str.match(/^(maj|min|dim|aug|m)/i);
    if (triad) {
        triad = triad.shift();
        str = str.substr(triad.length);
        if (triad === "m") triad = "min";
        if (triad === "M") triad = "maj";
        triad = triad.toLowerCase();
    }

    var seventh = str.match(/^(6|7|M7?)/) || str.match(/^maj7?/i);
    if (seventh) {
        seventh = seventh.shift();
        str = str.substr(seventh.length);
        if (seventh !== "6" && seventh !== "7") seventh = "maj7";
        if (triad == "maj" && seventh === "7") seventh = "maj7";
    }
    
    var tensions = [];
    var tension = str.match(/add[0-9,#b+-]+/g);
    if (tension) {
        while (tension.length > 0) {
            var t = tension.shift();
            str = str.split(t).join("");
            var ts = t.substr(3).split("").map(function(c) {
                if (c == "1") return c;
                if (c.match(/[#b+-]/)) return "," + c;
                return c + ",";
            }).join("").split(",").forEach(function(v) {
                if (v) tensions.push(v);
            });
        }
    }
    
    var tension = str.match(/\([0-9,#b+-]+\)/g);
    if (tension) {
        while (tension.length > 0) {
            var t = tension.shift();
            str = str.split(t).join("");
            var ts = t.substr(1, t.length - 2).split("").map(function(c) {
                if (c == "1") return c;
                if (c.match(/[#b+-]/)) return "," + c;
                return c + ",";
            }).join("").split(",").forEach(function(v) {
                if (v) tensions.push(v);
            });
        }
    }

    var tension = str.match(/(aug|sus[24]|[#b+-]5|[#b+-]?9|[#+]?11|[b-]?13|omit[35])/gi);
    if (tension) {
        while (tension.length > 0) {
            var t = tension.shift();
            str = str.split(t).join("");
            tensions.push(t);
            
            //7th省略表記
            if (t.match(/(9|11|13)$/) && !seventh) {
                seventh = (triad == "maj") ? "maj7" : "7";
            }
        }
    }

    return {
        root: pitchclass(root[0]),
        triad: triad,
        tetrad: seventh,
        tensions: tensions,
        onroot: onroot ? pitchclass(onroot[2]) : -1,
        ignored: str
    };
};

//要素に切ったものをtones化する
var name2tones = function(triad, seventh, tensions)
{
     var pat = {
        "maj": [4, 7],
        "min": [3, 7],
        "dim": [3, 6],
        "aug": [4, 8]
    };
    var ret = triad ? pat[triad] : pat.maj;
    if (seventh == "6") {
        ret.push(interval2semitone("6"));
    }
    if (seventh == "maj7") {
        ret.push(interval2semitone("7"));
    }
    //["maj","7"]は"maj7"扱い, ["dim","7"]は"dim7"扱い, ["","7"]は"min7"扱い
    if (seventh == "7") {
        var c = interval2semitone("7");
        if (triad == "maj") ret.push(c);
        else if (triad == "dim") ret.push(c - 2);
        else ret.push(c - 1);
    }

    if (!tensions) tensions = [];
    tensions.forEach(function(val) {
        val = val.toLowerCase();
        if (val === "aug") ret[1] = interval2semitone("+5");;
        if (val.indexOf("sus4") == 0) ret[0] = interval2semitone("4");
        if (val.indexOf("sus2") == 0) ret[0] = interval2semitone("2");
        if (val.indexOf("omit3") == 0) ret[0] = -1;
        if (val.indexOf("omit5") == 0) ret[1] = -1;

        //テンション
        var interval = interval2semitone(val);
        if (interval < 0) return;

        //5度を書き換え
        if (val.indexOf("5") == val.length - 1) {
            ret[1] = interval;
        } else {
            ret.push(interval);
        }
    });
    ret.unshift(0);
    return ret;
};

// namefactorをformに展開
var extract_form = function(root, onroot, namefactors)
{
    var list = $("#inchord label").map(function(){ return $(this).text(); }).get()
        .map(key => key.split("/").shift().trim());
    $("#inchord :checkbox").prop("checked", false);
    var diffform = {"min":"m", "aug": "+5", "maj7":"M7"};

    namefactors.forEach(function(name) {
        if (!name) return;
        console.log(name);
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

//音名(C-B)からピッチクラス(0-11)を返す
var pitchclass = function(tonename) {
    var ret = ("C D EF G A B").indexOf(tonename.charAt(0));
    if (tonename.charAt(1) == "#") ret++;
    if (tonename.charAt(1) == "b") ret--;
    return (ret + 12) % 12;
};

//音程[度]から音程クラスを返す
var interval2semitone = function(str)
{
    var val = str.split("add").join("")
        .split("(").join("")
        .split("b").join("-").split("#").join("+").trim();

    var interval = parseInt(val.split("-").join("").split("+").join(""));
    if (isNaN(interval)) return -1;

    var octave = parseInt((interval - 1) / 7);
    var pitch = [0, 2, 4, 5, 7, 9, 11][(interval - 1) % 7];
    if (val.indexOf("+") != -1) pitch++;
    if (val.indexOf("-") != -1) pitch--;

    return pitch + 12 * octave;

    if (0) {
        if (val == "9") return 14;
        if (val == "11") return 17;
        if (val == "13") return 21;
        if (val == "#5") return 8;
        if (val == "#9") return 15;
        if (val == "#11") return 18;
        if (val == "-5") return 6;
        if (val == "-9") return 13;
        if (val == "-13") return 20;

        return -1;
    }
};

// c2gt・c2pfのUIイベントハンドラ
$(function() {
    ["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"].forEach(function(tone) {
        $("<option>").text(tone).appendTo("#root, #onroot");
    });


    $("#inchord :checkbox, #inchord select").change(function() {
        var val = $(this).parent().text().split("/").shift().trim();

        //排他処理
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

        var diffform = {"m": "min", "aug": "+5", "M7":"maj7"};

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
        location.href = "#" + $("#tab li.select").attr("id") + "." + val;
        analyze(ret);
    });

    $("#chordname").keydown(function(e) {
        if (e.keyCode != 13) return;
        var ret = c2t($(this).val());
        if (!ret) {
            var val = $("#root option:selected").text() + $(this).val()
            $(this).val(val);
            ret = c2t(val);
        }
        location.href = "#" + $("#tab li.select").attr("id") + "." + $(this).val();
        analyze(ret);
        ret.tensions.push(ret.triad);
        ret.tensions.push(ret.tetrad);
        extract_form(ret.root, ret.onroot, ret.tensions);
    });

    var analyze = function(ret) {
        $(".keyboard").removeClass("selected");
        var tones = name2tones(ret.triad, ret.tetrad, ret.tensions);
        var onroot = ret.onroot == -1 ? ret.root : ret.onroot;
        console.log(tones);

        if ($("#ch2pf").hasClass("select")) {
            tones.forEach(function(reltone) {
                if(reltone < 0) return;
                var tone = reltone + ret.root;
                if (tone % 12 == onroot % 12) return;
                if (tone < onroot) tone += 12;
                if (24 < tone) tone -= 12;
                var name = (parseInt(tone / 12) + 1).toString(16) + (tone % 12).toString(16);

                $(".keyboard[name=" + name + "]").addClass("selected");
            });
            var name = "1" + (onroot % 12).toString(16);
            $(".keyboard[name=" + name + "]").addClass("selected");
        }
        
        if ($("#ch2gt").hasClass("select")) {
            $("#chforms").html("");
            var abtones = tones.sort((a, b) => (a - b)).map(tone => (tone + ret.root + 3) % 12);
            if (ret.onroot != -1)
                abtones.unshift((ret.onroot + 3) % 12);
            tri(abtones);
        }
        
        if (ret.ignored) {
            $("#ignored").show();
            $("#ignoredstr").text(ret.ignored);
        } else {
            $("#ignored").hide();
        }
    };
});

/*
<c2tのalgorithm>
(1)ルートを取り除く
(2)トライアド部を取り除く
M,m,Maj,maj,dim,sus,aug
(3)テトラッド部を取り出す
7,6,M7
(4)残部
addX:add[+-]5 はadd[+-]11 扱い
omit3,5
9,11,13,+9,-9,+11,-13,カッコつき有無で意味変わる
-5,+5 カッコつきでも意味同じ
aug (2)であった場合はエラー
4,2,カッコつきはエラー

*/

var unittest = function(){
    console.log(interval2semitone("-9"));
    console.log(interval2semitone("9"));
    console.log(interval2semitone("#9"));
    console.log(interval2semitone("+9"));
    console.log(interval2semitone("11"));
    console.log(interval2semitone("+11"));
    console.log(interval2semitone("#11"));
    console.log(interval2semitone("b13"));
    console.log(interval2semitone("-13"));
    console.log(interval2semitone("13"));
    console.log(interval2semitone("+5"));
    console.log(interval2semitone("#5"));
    console.log(interval2semitone("-5"));
    console.log(interval2semitone("b5"));
    console.log(interval2semitone("omit3"));

    c2t("C#m7-5");
    c2t("C#m7(-5)");
    c2t("C#m7(b5)");
    c2t("C#m7b5");
    c2t("C#9-5");
    c2t("Cmaj7");
    c2t("CM7");
    c2t("CmM7");
    c2t("C9");
    c2t("Cm9");
    c2t("CM9");
    c2t("Cmin7");
    c2t("Csus4");
    c2t("Csus2");
    c2t("C7sus4");
    c2t("C9sus4");
    c2t("Cdim");
    c2t("Cdim7");
    c2t("C7aug");
    c2t("Caug7");
    c2t("CM7aug");
    c2t("C69");
    c2t("Cm(9,11)");
    c2t("Cm9(11)");
    c2t("Cm(9)(11)");
    c2t("Cadd9");
    c2t("Cadd9omit3");
};

unittest();
