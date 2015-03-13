define(function(require, exports, module){
    var listeners = []
    var _editor;
    var _delimiter;
    exports.init = function(editor, moduleDelimiter)
    {
        _editor = editor;
        _delimiter = moduleDelimiter || "."
    };
    exports.on = function (event ,f){
        if(event != "contextSwitch") throw new Error("Wrong event name "+event);
        if(!listeners.length) start();
        listeners.push(f)
    };
    exports.off = function(f){
        listeners.splice(listeners.indexOf(f));
    };
    var lastState;
    exports.emit = function(event){
        var args = Array.prototype.slice.call(arguments, 1);
        if(lastState == JSON.stringify(args)) return;
        if(event != "contextSwitch") throw new Error("Wrong event name "+event);
        listeners.map(function(f){f.apply(null, args)});
        lastState = JSON.stringify(args);
    }
    function start(){
        console.log("start")
        _editor.on("changeSelection", function (a, editor) {
            var p = editor.getCursorPosition();


            //get line
            var line = editor.session.getLine(p.row);
            exports.emit("contextSwitch", exports.getContext(line, p.column, p.row, _delimiter))
        })
    }
    exports.getContext = function(line, column, row, calleeDelimiter){
        column = column || line.length;
        calleeDelimiter = calleeDelimiter || ".";

        //get the part before
        line = line.substring(0, column);
        var start_row = line.lastIndexOf(" ");
        //remove strings
        line = line.replace(/(".*?"|'.*?')/g, "");
        //remove arrays and tuples
        line = line.replace(/(\\{.*?\\}|\\[.*?\\])/g, "");
        //remove closed funs
        var functionRegExp = /[(][^(]+?[)]/;
        while(functionRegExp.test(line)){line = line.replace(functionRegExp, "")}

        var cake = line.match(new RegExp("[\\-\\w"+calleeDelimiter+"]+\\s*\\(", "g"));
        if(!cake) return null;
        var nameOfFunction = cake[cake.length-1].replace("(","");
        var lastParameterList = line.replace(/.*\(/ , "");
        var parameter = lastParameterList.split(/,/).length;

        var functionCake = nameOfFunction.split(calleeDelimiter);
        return {
            name : functionCake[functionCake.length-1],
            callee : functionCake.slice(0,functionCake.length-1),
            parameter: parameter,
            column: start_row,
            row : row
        }
    }
});