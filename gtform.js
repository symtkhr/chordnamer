var gt_open = [7, 0, 5, 10, 2, 7];
var gt_octave = [0, 1, 1, 1, 2, 2];

//構成音の押弦位置を返す
var gt_mapper = function(notes)
{
    var postable = [];
    return notes.map(function(note) {
        return gt_open.map(open => (12 + note - open) % 12);
    });

    return postable;
}

// 全通りの押弦パタンを検出する
var make_pattern = function(postable) {

    var n = 0;
    var sol = [];
    var check_all_in_3 = function(ret) {
        var max, min;
        ret.forEach(function(val){
            if (val <= 0) return;
            if (!max || max < val) max = val;
            if (!min || val < min) min = val;
        });
        return (max - min <= 3);
    }

    var select_rest = function(index, ret) {
        postable.forEach(function(val) {
            ret.push(val[index]);
            if (check_all_in_3(ret)) {
                if (index == 5) {
                    sol.push([].concat(ret));
                    n++;
                } else {
                    select_rest(index + 1, ret);
                }
            }
            ret.pop();
        });
        
    };

    
    postable[0].forEach(function(val, index) {
        var ret = [];
        if (2 < index) return;
        if (index == 2 && 4 < val) return;
        for (var i = 0; i < index; i++) ret.push(-1);
        ret.push(val);

        select_rest(index + 1, ret);
        
    });

    return sol;
}

// 押弦効率を評価する
var eval_pattern = function(pattern, tonesize, ceja) {
    var c = 0;
    var check_all_in_3 = function(ret) {
        var max = -1;
        var min = -1;
        ret.forEach(function(val){
            if (val <= 0) return;
            if (max == -1 || max < val) max = val;
            if (min == -1 || val < min) min = val;
        });
        return (max - min >= 3);
    }

    var fingers = function(ret) {
        var fn = 0;
        var min = -1;
        ret.forEach(function(val, index) {
            if (val == -1) return;
            if (min == -1 || val < min) min = val;
        });

        if (min != 0) fn++;
        
        ret.forEach(function(val, index) {
            if (val == min || val == -1) return;
            fn++;
        });
        
        return fn;
    }

    var num_of_tone = function(ret) {

        var p = [];
        ret.forEach(function(val, index) {
            if (val == -1) return;
            p.push((gt_open[index] + val) % 12);
        });
        return p.filter(function (x, i, self) {
            return self.indexOf(x) === i;
        }).length;
    };

    var same_tone = function(ret) {
        var p = [];
        ret.forEach(function(val, index) {
            if (val == -1) return;
            p.push(gt_open[index] + 12 * gt_octave[index] + val);
        });
        return p.length != 
            p.filter(function (x, i, self) {
                return self.indexOf(x) === i;
            }).length; 
    };


    
    if (check_all_in_3(pattern)) c += 4;
    var fn = fingers(pattern);
    if (fn == 4) c += 1;
    if (fn >= 5) c += 16;
    if (num_of_tone(pattern) < tonesize) c += 8;
    if (same_tone(pattern)) c += 2;
    
    return c;
}

//不使用
if(0) {
    $(function() {
        var factor2tones = function(str) {

            var tones = str.split(" ");
            var ret = [];
            
            tones.forEach(function(tone){
                var index = "A BC D EF G".indexOf(tone[0]);
                if (index < 0) return;
                if (tone[1] == "#") index++;
                if (tone[1] == "b") index--;
                
                ret.push((index + 12) % 12);
            });
            
            console.log(ret);
            
            return ret;
        };



        $("#cpos").click(function(){
            var input = $("#factor").val();
            tri(factor2tones(input));
        });
    });

}

// 結果表示
var tri = function(tones) {
    var result = [];
    tones = tones.filter((tone, i, self) => self.indexOf(tone) == i);

    var flets = gt_mapper(tones);
    var ret = make_pattern(flets);
    ret.forEach(function(val) {
        var c = eval_pattern(val, tones.length);
        result.push([val, c]);
    });

    result.sort(function(a,b) {
        if (a[1] - b[1] != 0) return a[1] - b[1];

        var avg = function(arr) {
            var sum = 0;
            var num = 0;
            arr.forEach(function(val) {
                if (val == 0 || val == 1) return;
                sum += val;
                num++;
            });
            return sum / num;
        }
        return avg(a[0]) - avg(b[0]);
    })
        .forEach(function(ret) {
            if (ret[1] < 8)
                draw(ret[0], ret[1]);
            console.log(ret[0], ret[1]);
        });
};

var draw = function(flet, point) {
    var first = $("#chord_template");
    var chord = first.clone(true).appendTo("#chforms").show();
    //var strings = chord.find(".s");
    var min = -1;
    flet.forEach(function(val, index) {
        if (val <= 0) return;
        if (min == -1 || val < min) min = val;
    });

    if (min != 0) chord.find(".min").html(min);
    chord.find(".point").html(point);

    flet.forEach(function(val, index) {
        var $obj = $('<div class="s">').appendTo(chord);
        if (val == -1)
            $obj.css({"left": "0", "top": ((5 - index) * 7 - 3) + "px", "background-color":"transparent"}).html("X");
        else if (val == 0)
            $obj.css({"left": "0", "top": ((5 - index) * 7) + "px"});
        else
            $obj.css({"left": (12 * (val - min + 1)) + "px", "top": ((5 - index) * 7) + "px"});
    });
};

/*
<ch2gt:algorithm>
(1)ひとまず構成音の押弦位置をすべて洗う
 triad: ACE
 A=[5, 0, 7,2,10,5](=6弦5フレ、5弦開放、4弦7フレ...)
 C=[8, 3,10,5, 1,9]
 E=[0, 7, 2,9, 5,0]

(2)ルートを決める
->条件は第3要素が4以下(=4弦4フレ以下)。
[5,_,_,_,_,_](=6弦5フレ)
[x,0,_,_,_,_](=5弦開放)

(3)残り±3フレ以内になるように全部パターンを洗う
-> ここでどの条件でxにするかは課題.

(4)以下で加点し低い順にソート
・3離：+4
・不足：+8
・多指：+1, +5 (4指/5指)
・同高：+2
・低テンション：+1 (たぶん未実装)

　　　　　　　指 乏 離 同
[5,0,2,2,5,0] x  x  x  xx
[5,0,2,2,5,5] xx x  x  x
[5,0,2,5,5,0] x     x  xx
[5,0,2,2,5,5] xx x  x  x
[5,0,7,5,5,0] x        xx
[5,0,7,5,5,5] xx       x
[5,3,2,5,5,0] xx    x  x
[x,0,2,2,1,0]
[x,0,2,2,5,5] x  x  x
....

* 3離・多指は人中薬小の距離で評価するほうがベター(未実装)。

(5)乏=0のやつはxをどっかにつけてみて再評価(未実装)

 */

