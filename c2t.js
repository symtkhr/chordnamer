// コード名を返す
const chordname = function(tones, is_sharp)
{
    let complex = 0; //複雑さ

    //音名
    const tonename = function(tone)
    {
        tone %= 12;
        if (is_sharp)
            return ["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"][tone];
        else
            return ["C","Db","D","Eb","E","F","Gb","G","Ab","A","Bb","B"][tone];
    };

    //音程配列 bool[12]
    const relatives = function(root, tones)
    {
        return tones.reduce((ret, v) => {
            ret[(v - root + 12) % 12] = true;
            return ret;
        }, []);
    };

    //3度と5度を取り出す(なんかエレガントな書き方ないか...?)
    const factorize = function(incl)
    {
        var triad = {};

        //m7とM7が同時に鳴っている和音はコード化できない
        if (incl[10] && incl[11]) return {};

        if (incl[4]) {        // ------------ M3 based
            triad.third = 4;
            if　(incl[7]) {          // M3 + P5
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
    const assemblechord = function(triad, incl)
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
        return tones.map(root => {
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

        }).filter(a => a).sort((a, b) => (a.comp - b.comp));
    }(tones);
};

//コード名文字列解釈
const c2t = function(str) {
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
const name2tones = function(triad, seventh, tensions)
{
    const pat = {
        "maj": [4, 7],
        "min": [3, 7],
        "dim": [3, 6],
        "aug": [4, 8]
    };
    let ret = triad ? pat[triad] : pat.maj;
    if (seventh == "6") {
        ret.push(interval2semitone("6"));
    }
    if (seventh == "maj7") {
        ret.push(interval2semitone("7"));
    }
    //["maj","7"]は"maj7"扱い, ["dim","7"]は"dim7"扱い, ["","7"]は"min7"扱い
    if (seventh == "7") {
        let c = interval2semitone("7");
        if (triad == "maj") ret.push(c);
        else if (triad == "dim") ret.push(c - 2);
        else ret.push(c - 1);
    }

    if (!tensions) tensions = [];
    tensions.forEach(val => {
        val = val.toLowerCase();
        if (val === "aug") ret[1] = interval2semitone("+5");;
        if (val.indexOf("sus4") == 0) ret[0] = interval2semitone("4");
        if (val.indexOf("sus2") == 0) ret[0] = interval2semitone("2");
        if (val.indexOf("omit3") == 0) ret[0] = -1;
        if (val.indexOf("omit5") == 0) ret[1] = -1;

        //テンション
        const interval = interval2semitone(val);
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

//音名(C-B)からピッチクラス(0-11)を返す
const pitchclass = (tonename) => {
    let ret = ("C D EF G A B").indexOf(tonename.charAt(0));
    if (tonename.charAt(1) == "#") ret++;
    if (tonename.charAt(1) == "b") ret--;
    return (ret + 12) % 12;
};

//音程[度]から音程クラスを返す
const interval2semitone = (str) =>
{
    const val = str.split("add").join("")
        .split("(").join("")
        .split("b").join("-").split("#").join("+").trim();

    const interval = parseInt(val.split("-").join("").split("+").join(""));
    if (isNaN(interval)) return -1;

    const octave = parseInt((interval - 1) / 7);
    let pitch = [0, 2, 4, 5, 7, 9, 11][(interval - 1) % 7];
    if (val.indexOf("+") != -1) pitch++;
    if (val.indexOf("-") != -1) pitch--;

    return pitch + 12 * octave;
};


/*
<c2t:algorithm>
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

