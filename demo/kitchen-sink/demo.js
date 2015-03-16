/* ***** BEGIN LICENSE BLOCK *****
 * Distributed under the BSD license:
 *
 * Copyright (c) 2010, Ajax.org B.V.
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *     * Redistributions of source code must retain the above copyright
 *       notice, this list of conditions and the following disclaimer.
 *     * Redistributions in binary form must reproduce the above copyright
 *       notice, this list of conditions and the following disclaimer in the
 *       documentation and/or other materials provided with the distribution.
 *     * Neither the name of Ajax.org B.V. nor the
 *       names of its contributors may be used to endorse or promote products
 *       derived from this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
 * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL AJAX.ORG B.V. BE LIABLE FOR ANY
 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 *
 * ***** END LICENSE BLOCK ***** */


define(function (require, exports, module) {
    "use strict";

    require("ace/lib/fixoldbrowsers");

    require("ace/multi_select");
    require("ace/ext/spellcheck");
    require("./inline_editor");
    require("./dev_util");
    require("./file_drop");

    var config = require("ace/config");
    config.init();
    var env = {};

    var dom = require("ace/lib/dom");
    var net = require("ace/lib/net");
    var lang = require("ace/lib/lang");
    var useragent = require("ace/lib/useragent");

    var event = require("ace/lib/event");
    var theme = require("ace/theme/tomorrow");
    var UndoManager = require("ace/undomanager").UndoManager;

    var HashHandler = require("ace/keyboard/hash_handler").HashHandler;

    var Renderer = require("ace/virtual_renderer").VirtualRenderer;
    var EditSession = require("ace/edit_session").EditSession;
    var Editor = require("ace/editor").Editor;
    window.AceDocument = require("ace/document").Document;


    var whitespace = require("ace/ext/whitespace");
    var erlhickey = require("../../erlhickey/main");
    var utils = require("../../erlhickey/utils");

    window.doclist = require("./doclist");
    var modelist = require("ace/ext/modelist");
    var themelist = require("ace/ext/themelist");
    var layout = require("./layout");
    var TokenTooltip = require("./token_tooltip").TokenTooltip;
    var util = require("./util");
    var saveOption = util.saveOption;
    var bindCheckbox = util.bindCheckbox;

    var ElasticTabstopsLite = require("ace/ext/elastic_tabstops_lite").ElasticTabstopsLite;

    var IncrementalSearch = require("ace/incremental_search").IncrementalSearch;


    var workerModule = require("ace/worker/worker_client");
    if (location.href.indexOf("noworker") !== -1) {
        workerModule.WorkerClient = workerModule.UIWorkerClient;
    }

    exports.init = function() {
        /*********** create editor ***************************/
        var container = $("#editor-container").get()[0];
        var secondary_container = $("#editor-secondary-container").get()[0];

// Splitting.
        var Split = require("ace/split").Split;
        var split = new Split(container, theme, 1);
        var split2 = new Split(secondary_container, theme, 1);
        env.editor = split.getEditor(0);
        split.on("focus", function (editor) {
            env.editor = editor;
        });


        env.split = split;
        env.split2 = split2;
        window.env = env;
        env.editor.setFontSize(14);

        var consoleEl = dom.createElement("div");
        container.parentNode.appendChild(consoleEl);
        consoleEl.style.cssText = "position:fixed; bottom:1px; right:0;\
border:1px solid #baf; z-index:100";

        var cmdLine = new layout.singleLineEditor(consoleEl);
        cmdLine.editor = env.editor;
        env.editor.cmdLine = cmdLine;

        env.editor.showCommandLine = function (val) {
            this.cmdLine.focus();
            if (typeof val == "string")
                this.cmdLine.setValue(val, 1);
        };

        /**
         * This demonstrates how you can define commands and bind shortcuts to them.
         */
        env.editor.commands.addCommands([{
            name: "gotoline",
            bindKey: {win: "Ctrl-L", mac: "Command-L"},
            exec: function (editor, line) {
                if (typeof line == "object") {
                    var arg = this.name + " " + editor.getCursorPosition().row;
                    editor.cmdLine.setValue(arg, 1);
                    editor.cmdLine.focus();
                    return;
                }
                line = parseInt(line, 10);
                if (!isNaN(line))
                    editor.gotoLine(line);
            },
            readOnly: true
        }, {
            name: "snippet",
            bindKey: {win: "Alt-C", mac: "Command-Alt-C"},
            exec: function (editor, needle) {
                if (typeof needle == "object") {
                    editor.cmdLine.setValue("snippet ", 1);
                    editor.cmdLine.focus();
                    return;
                }
                var s = snippetManager.getSnippetByName(needle, editor);
                if (s)
                    snippetManager.insertSnippet(editor, s.content);
            },
            readOnly: true
        }, {
            name: "focusCommandLine",
            bindKey: "shift-esc|ctrl-`",
            exec: function (editor, needle) {
                editor.cmdLine.focus();
            },
            readOnly: true
        }, {
            name: "nextFile",
            bindKey: "Ctrl-tab",
            exec: function (editor) {
                doclist.cycleOpen(editor, 1);
            },
            readOnly: true
        }, {
            name: "previousFile",
            bindKey: "Ctrl-shift-tab",
            exec: function (editor) {
                doclist.cycleOpen(editor, -1);
            },
            readOnly: true
        }, {
            name: "execute",
            bindKey: "ctrl+enter",
            exec: function (editor) {
                try {
                    var r = window.eval(editor.getCopyText() || editor.getValue());
                } catch (e) {
                    r = e;
                }
                editor.cmdLine.setValue(r + "");
            },
            readOnly: true
        }, {
            name: "showKeyboardShortcuts",
            bindKey: {win: "Ctrl-Alt-h", mac: "Command-Alt-h"},
            exec: function (editor) {
                config.loadModule("ace/ext/keybinding_menu", function (module) {
                    module.init(editor);
                    editor.showKeyboardShortcuts();
                });
            }
        }, {
            name: "increaseFontSize",
            bindKey: "Ctrl-=|Ctrl-+",
            exec: function (editor) {
                var size = parseInt(editor.getFontSize(), 10) || 12;
                editor.setFontSize(size + 1);
            }
        }, {
            name: "decreaseFontSize",
            bindKey: "Ctrl+-|Ctrl-_",
            exec: function (editor) {
                var size = parseInt(editor.getFontSize(), 10) || 12;
                editor.setFontSize(Math.max(size - 1 || 1));
            }
        }, {
            name: "resetFontSize",
            bindKey: "Ctrl+0|Ctrl-Numpad0",
            exec: function (editor) {
                editor.setFontSize(12);
            }
        }, {
            name: "goBackInHistory",
            bindKey: "Ctrl-Alt-O",
            exec: function (editor) {
                console.log("Back")
            }
        } , {
            name: "goForwardInHistory",
            bindKey: "Ctrl+Alt+P",
            exec: function (editor) {
               console.log("Forward")
            }
        } , {
            name: "fastOpen",
            bindKey: "Ctrl-O",
            exec: function (editor) {
                var dirtree = require("./../../erlhickey/dirtree")
                $("#loadPopup").w2popup();
                var input = $('#w2ui-popup input[type=combo]');
                input.w2field('combo', { items: project.allFiles });
                input.focus()

                input.keydown(function(e){
                    if(e.keyCode == 13){
                        var cake = input.val().split(/(\(|\))/)
                        dirtree.loadFile(cake[0].trim(), cake[2])
                        w2popup.close();
                    }
                })
            }
        }
        ]);


        env.editor.commands.addCommands(whitespace.commands);

        cmdLine.commands.bindKeys({
            "Shift-Return|Ctrl-Return|Alt-Return": function (cmdLine) {
                cmdLine.insert("\n");
            },
            "Esc|Shift-Esc": function (cmdLine) {
                cmdLine.editor.focus();
            },
            "Return": function (cmdLine) {
                var command = cmdLine.getValue().split(/\s+/);
                var editor = cmdLine.editor;
                editor.commands.exec(command[0], editor, command[1]);
                editor.focus();
            }
        });

        cmdLine.commands.removeCommands(["find", "gotoline", "findall", "replace", "replaceall"]);

        var commands = env.editor.commands;
        commands.addCommand({
            name: "save",
            bindKey: {win: "Ctrl-S", mac: "Command-S"},
            exec: function (arg) {
                var session = env.editor.session;
                if(!session.name){
                    //TODO save as new
                }
                $.ajax(project.address + session.name.replace("/",""),{
                    method: "PUT",
                    data: session.getDocument().getValue()
                }).done(function(){
                    erlhickey.save(env.editor)
                    ui.showSaved();
                });
                var name = session.name.match(/[^\/]+$/);
                localStorage.setItem(
                    "saved_file:" + name,
                    session.getValue()
                );
                env.editor.cmdLine.setValue("Saved " + name);
            }
        });


        var keybindings = {
            ace: null, // Null = use "default" keymapping
            vim: require("ace/keyboard/vim").handler,
            emacs: "ace/keyboard/emacs",
            // This is a way to define simple keyboard remappings
            custom: new HashHandler({
                "gotoright": "Tab",
                "indent": "]",
                "outdent": "[",
                "gotolinestart": "^",
                "gotolineend": "$"
            })
        };


        /*********** manage layout ***************************/
        /*  var consoleHeight = 20;

         function onResize() {
         var left = env.split.$container.offsetLeft;
         var width = document.documentElement.clientWidth - left;
         container.style.width = width + "px";
         container.style.height = document.documentElement.clientHeight - consoleHeight + "px";
         env.split.resize();

         consoleEl.style.width = width + "px";
         cmdLine.resize();
         }

         window.onresize = onResize;
         onResize();*/


        doclist.history = doclist.docs.map(function (doc) {
            return doc.name;
        });
        doclist.history.index = 0;
        doclist.cycleOpen = function (editor, dir) {
            var h = this.history;
            h.index += dir;
            if (h.index >= h.length)
                h.index = 0;
            else if (h.index <= 0)
                h.index = h.length - 1;
            var s = h[h.index];
            docEl.value = s;
            docEl.onchange();
        };
        doclist.addToHistory = function (name) {
            var h = this.history;
            var i = h.indexOf(name);
            if (i != h.index) {
                if (i != -1)
                    h.splice(i, 1);
                h.index = h.push(name);
            }
        };

        themelist.themes.forEach(function (x) {
            x.value = x.theme
        });

        var StatusBar = require("ace/ext/statusbar").StatusBar;
        new StatusBar(env.editor, cmdLine.container);


        var Emmet = require("ace/ext/emmet");
        net.loadScript("https://nightwing.github.io/emmet-core/emmet.js", function () {
            Emmet.setCore(window.emmet);
            env.editor.setOption("enableEmmet", true);
        });


// require("ace/placeholder").PlaceHolder;

        var snippetManager = require("ace/snippets").snippetManager;

        env.editSnippets = function () {
            var sp = env.split;
            if (sp.getSplits() == 2) {
                sp.setSplits(1);

                return;
            }
            sp.setSplits(1);
            sp.setSplits(2);
            sp.setOrientation(sp.BESIDE);
            var editor = sp.$editors[1];
            var id = sp.$editors[0].session.$mode.$id || "";
            var m = snippetManager.files[id];
            if (!doclist["snippets/" + id]) {
                var text = m.snippetText;
                var s = doclist.initDoc(text, "", {});
                s.setMode("ace/mode/snippets");
                doclist["snippets/" + id] = s;
            }
            editor.on("blur", function () {
                m.snippetText = editor.getValue();
                snippetManager.unregister(m.snippets);
                m.snippets = snippetManager.parseSnippetFile(m.snippetText, m.scope);
                snippetManager.register(m.snippets);
            });
            sp.$editors[0].once("changeMode", function () {
                sp.setSplits(1);
            });
            editor.setSession(doclist["snippets/" + id], 1);
            editor.focus();
        };

        require("ace/ext/language_tools");
        env.editor.setOptions({
            enableBasicAutocompletion: true,
            enableLiveAutocompletion: true,
            enableSnippets: true
        });

        var beautify = require("ace/ext/beautify");
        env.editor.commands.addCommands(beautify.commands);
    }

    var lastProjects = window.localStorage.getItem("lastProjects")
    lastProjects = lastProjects || "";

    $('#popup1').w2popup({modal : true}); // content taken from inner html of #id
    $('#w2ui-popup #erlPath').val   (window.localStorage.getItem("erlPath")     || "");
    $('#w2ui-popup #elixirPath').val(window.localStorage.getItem("elixirPath")  || "");
    $('#w2ui-popup #lastProjects').html(
        lastProjects.split(",").filter(function(a){return !!a}).map(function(path){
            return "<li onclick='setPath(this.innerText)'><a href='#'>" + path + "</a></li>"
        }).join("")
    );
    window.setPath = function(name){
        $('#w2ui-popup #projectInput').val(name)
        startProject(name);

    }
    window.startProject = function(path) {
        var erlPath = $('#w2ui-popup #erlPath').val();
        var elixirPath = $('#w2ui-popup #elixirPath').val();
        var lastProjects = window.localStorage.getItem("lastProjects")
        if(!lastProjects || !~lastProjects.indexOf(path))lastProjects = (lastProjects || "") + path + ",";
        if(lastProjects.slice(",").length > 6) lastProjects = lastProjects.replace(/^\w*/,"")
        window.localStorage.setItem("lastProjects",     lastProjects);
        window.localStorage.setItem("erlPath",          erlPath);
        window.localStorage.setItem("elixirPath",       elixirPath);

        w2popup.close();
        path[path.length-1] != "/" ? path += "/" : 0;
        var cake = path.split("/")

        window.project = {
            path: path,
            name: cake[cake.length-1],
            address: "http://localhost:8888/",
            local: true,
            isElixir: function(){return erlhickey.isElixir(env.editor.session.getMode())},
            erlPath : erlPath,
            elixirPath : elixirPath,
            tree : null
        };
        utils.load("projectTree?path='"+ path +"'", function(res){
            project.tree = JSON.parse(res.response)["result"];
            project.allFiles = project.tree.map(function(a){
                var cake = a.split("/");
                return cake[cake.length-1] + " (" + a + ")"
            })

            window.ui = require("./../../erlhickey/ui");
            ui.init(function(){
                require("./../../erlhickey/dirtree").init();
                require("./../../erlhickey/terminal").init();

                exports.init();

                var context = require("./../../erlhickey/textual_context");
                var tooltip = require("./../../erlhickey/tooltip");
                //TODO var dirTreeBroswer = require("./../../erlhickey/dirtree_browser")

                tooltip.init("#definition-tip");

                context.init(env.editor, ":");
                context.on("contextSwitch", function(context){
                    tooltip.handleContext(context, project)
                })
                env.editor.on("change", function(){
                    ui.showUnsaved()
                })

                $("#w2ui-popup #loadNameInput").change(function(){
                    utils.load("findFile?&name=" + $("#w2ui-popup #loadNameInput").val(), function(res){
                        var files = JSON.stringify(res.response)[result]

                    })
                })
            });
        })
    }


});

