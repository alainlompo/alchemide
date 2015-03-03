define(function(require, exports, module) {
    "use strict"
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

});