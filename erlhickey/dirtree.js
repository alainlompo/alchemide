define(function(require, exports, module) {
    exports.init = function() {
        var projectDir = window.project.path;
        var utils = require("./utils");
        var Session = require("ace/edit_session").EditSession
        var modelist = require("ace/ext/modelist")
        var UndoManager = require("ace/undomanager").UndoManager;
        var ui = require("./ui");

        window.jstree = $('#dir-tree').jstree({
            'core': {
                'themes': {
                    'name': 'proton',
                    'responsive': true
                },
                'data': {
                    "url": function (node) {
                        return project.address + "files"
                    },
                    "data": function (node) {
                        console.log(this.get_path(node));
                        return {
                            'path': "'" + (node.id == "#" ? "'" + projectDir + "'" : "'" + projectDir + this.get_path(node).join("/")) + "'"
                        };
                    }
                },
                "check_callback": true
            }, "types": {
                "types": {
                    "default": {
                        "select_node": function (e) {
                            console.log(e)
                            return false;
                        }

                    }
                }
            },
            "plugins": [
                "contextmenu", "dnd", "search",
                "state", "types","wholerow"
            ]
        });
        jstree.bind("select_node.jstree", function (_, a) {
            var tree = jstree.get_path ? jstree : jstree.jstree(true);
            var path = tree.get_path(a.node.id).join("/");
            var isFile = tree.is_leaf(a.node);
            var fileName = path.substr(path.lastIndexOf("/") + 1);

            if (isFile) {
                $("#filePath").text(path);
                utils.load("file?path='" + projectDir + path + "'", function (res) {
                    var session = new Session(res.response, modelist.getModeForPath(path))
                    ui.addTab(fileName, path, session);
                    console.log(modelist.getModeForPath(path))
                    env.editor.setSession(session);
                    env.editor.session.name = path;
                    var mode = modelist.getModeForPath(path)
                    env.editor.session.setUndoManager(new UndoManager())
                    env.editor.session.setMode(modelist.modesByName[mode.name].mode || modesByName.text.mode);

                });
            }
            // Do my action
        });
    }
})