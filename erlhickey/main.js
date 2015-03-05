define(function(require, exports, module) {
    "use strict";

    var erlhickey = exports;
    var utils = require("./utils");
    exports.compile = function(editor) {
        utils.load("erl/compile?name" + editor.session.name, function(result){
            console.log(result)
        })
    };
    exports.save = function(editor) {

    };
    function addError(editor, atRow, text){
        editor.session.setAnnotations([{
            row: atRow,
            column: 2,
            text: text,
            type: "error"
        }]);
    }
    exports.indentTest = function(line){
        if(/(->|receive|try|\{)\s*$/.test(line)) return true;
        return false
    };
    exports.outdentTest = function(line){
        if(/(;|\.|\})/.test(line) && /(\{|->|-\w+)/.test(line)) return false;
        if(/(;|\.|\})/.test(line)) return true;
        return false
    };
    //ERL HICKEY
    exports.erlangCheckIndent  = function(line, indentf, outdentf){
        //indent rules
        if(erlhickey.indentTest(line)){
            console.log("indent")
            indentf();
        }
        //oudentrules
        if(erlhickey.outdentTest(line)){
            console.log("outdent")
            outdentf();
        }

    };
    exports.isErlang = function(mode){return (mode && /erlang/.test(mode.$id))}
    exports.isElixir = function(mode){return (mode && /elixir/.test(mode.$id))}
    //ERL HICKEY
    exports.getCompletion = function(word, wordList, wordScore, pos, editor, callback, isElixir){
        var target = isElixir ? "elixir" : "erl";

        var context = editor.session.getDocument().getLine(pos.row).slice(0,pos.column).split(/( |\(|\))/);
        var lastWord = context[context.length-1];

        //Last word is module or definition
        if(/^\w+(\.|:)\w*/.test(lastWord)){
            word = lastWord
        }
        utils.load(word ? "/"+target+"/complete?word="+word: "/"+target+"/complete", function(res){
            var words = JSON.parse(res.response)["result"];
            var localWords = wordList.map(function(word) {
                return {
                    caption: word,
                    value: word,
                    score: wordScore[word],
                    meta: "local"
                };
            });
            var globalWords = words.map(function(word) {

                var cleanWords = word.split("/")[0].split(/(\.|:)/);
                return {
                    caption: word,
                    value: cleanWords[cleanWords.length-1] || word,
                    score: 10000,
                    meta: "global"
                }
            });
            console.log(globalWords);
            callback(null, localWords.concat(globalWords))
        }, function(){  //ON ERROR
            var localWords = wordList.map(function(word) {
                return {
                    caption: word,
                    value: word,
                    score: wordScore[word],
                    meta: "local"
                };
            });
            callback(localWords)
        })

    }


    //==================================================================
    //===========================/ErlHickey  ============================
    //==================================================================
});