#!/bin/node
let test = {};
test.interval = function(){
    let chordlibs = require("./chordlibs.js");
    ["-9", "9", "#9", "+9",
     "11", "+11", "#11",
     "b13", "-13", "13",
     "+5", "#5", "-5", "b5", "omit3"].forEach(v => {
         console.log(v,":",chordlibs.interval2semitone(v));
     });
};
test.chordstruct = function(){
    let chordlibs = require("./chordlibs.js");
    let test = chordlibs.struct;
    ["C#m7-5", "C#m7(-5)", "C#m7(b5)", "C#m7b5", "C#9-5",
     "Cmaj7", "CM7", "CmM7", "C9", "Cm9", "CM9", "Cmin7",
     "Csus4", "Csus2", "C7sus4", "C9sus4", "Cdim", "Cdim7",
     "C7aug", "Caug7", "CM7aug", "C69",
     "Cm(9,11)", "Cm9(11)", "Cm(9)(11)", "Cadd9", "Cadd9omit3",
     "F/C","Fm7onC",
    ]
    .forEach(v => console.log(v + "\t" + JSON.stringify(test(v))));
}
test.chordname = function(){
    let chordlibs = require("./chordlibs.js");
    let params = [[0,3,6],[0,4,6],
     [0,3,7],[0,4,7],[0,5,7],
     [0,3,8],[0,4,8],[0,5,8],
     [0,3,9],[0,4,9],[0,5,9],[0,6,9],
     [0,3,7,9],[0,3,7,10],[0,3,7,11],
     [0,4,7,9],[0,4,7,10],[0,4,7,11],
     [0,5,7,9],[0,5,7,10],[0,5,7,11],
     [0,3,6,9],[0,3,6,10],[0,3,6,11],
     [0,4,8,10],[0,4,8,11],
    ];
    //params.forEach(v => console.log(v, JSON.stringify(test(v,true))));
    params.forEach(v => {
        let name = chordlibs.name(v);
        let t = chordlibs.struct(name[0].name).tones.map(t => t%12).sort((a,b)=>a-b).filter((v,i,self) => self.indexOf(v)==i);
        console.log(v.join(",")==t.join(","), v, t, name[0].name);
    });
};
test.gtform = () => {
    let guitarform = require("./gtform.js");
    let chordlibs = require("./chordlibs.js");
    const params = [
        "A","B","C","D","E","F","G",
        "Am","Bm","Cm","Dm","Em","Fm","Gm",
        "Am7","Bm7","Cm7","Dm7","Em7","Fm7","Gm7",
        "AM7","BM7","CM7","DM7","EM7","FM7","GM7",
        "A7","B7","C7","D7","E7","F7","G7",
        "Asus4","Bsus4","Csus4","Dsus4","Esus4","Fsus4","Gsus4",
    ];

    params.forEach(v => {
        let tone = chordlibs.struct(v).tones;
        let ret = guitarform(tone).filter(a=>a.comp<2).map(a=>a.form.map(v=>v<0?"x":v.toString(16)).join("")+":"+a.comp);
        console.log('"' + v + '",' + JSON.stringify(ret));
    });

};

let args = process.argv.slice(2);
console.log(args);
if (args.length == 0 || !test[args[0]]) return console.log(Object.keys(test));
test[args[0]]();

/*
"A",["x02220","x57655"]
"B",["x24442","764447"]
"C",["x32010","x35553"]
"D",["xx0232","x57775"]
"E",["022100","x79997"]
"F",["133211","x8aaa8"]
"G",["320003","355433"]
"Am",["x02210","577555"]
"Bm",["799777","x24432"]
"Cm",["8aa888","x35543"]
"Dm",["xx0231","x57765"]
"Em",["022000","x79987"]
"Fm",["133111","x8aa98"]
"Gm",["355333",]
"Am7",["x02010","575555"]
"Bm7",["x24232","797777"]
"Cm7",["x35343","8a8888"]
"Dm7",["xx0211","x57565"]
"Em7",["020000","x75757"]
"Fm7",["131111","x8a898"]
"Gm7",["353333"]
"AM7",["x02120","576655"]
"BM7",["x24342","764446"]
"CM7",["x32000","x35453"]
"DM7",["xx0222","x57675"]
"EM7",["021100","x79897"]
"FM7",["xx3210","132211"]
"GM7",["320002","354433"]
*/
