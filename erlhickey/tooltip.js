define(function(require, exports, module){
    var utils = require("./utils");
    var Renderer = require("ace/virtual_renderer").VirtualRenderer;
    var Editor = require("ace/editor").Editor;
    var EditSession = require("ace/edit_session").EditSession;
    var element;
    var editor ;

    exports.init = function(selector){
        element = $(selector)
        editor = new Editor(new Renderer($("#definition-tip").get()[0]), new EditSession(""));
        editor.setReadOnly(true);
    }
    exports.handleContext = function(context, project){
        if(context == null){
            element.hide();
        } else {
            var dirs = project.isElixir() ? [project.path, project.elixirPath] : [project.path, project.erlPath]
            utils.findDefinition(dirs, context.callee[0], context.name, function(result){
                var pos = env.editor.renderer.textToScreenCoordinates(context.row, context.column);
                //element.css("left", pos.pageX + 200);
                //element.css("top", pos.pageY + 10);
                var res = JSON.parse(result).result;
                var functionBody = res ? res[0] : null;
                if(functionBody) {
                    editor.setSession(new EditSession(functionBody));
                    editor.session.setMode(env.editor.session.getMode());
                    editor.setTheme(env.editor.getTheme());
                    element.show()
                } else {
                    element.hide();
                }
            });
        }
    }
    exports.highlightPhrase = function(row, column, endrow, endcolumn){
        var Range = require("ace/range").Range;
        editor.session.addMarker(new Range(row,column,endrow,endcolumn),"ace_error-marker");
    }
})