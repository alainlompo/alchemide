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
    if(mode && /erlang/.test(mode.$id)) {
        this.off("change", erlangIndent);
        this.on("change", erlangIndent)
    }
    //ERL HICKEY

});