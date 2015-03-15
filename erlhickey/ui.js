define(function(require, exports, module) {
    var EditSession = require("ace/edit_session").EditSession;
    var modelist = require("ace/ext/modelist")


    exports.init = function(finished) {
        var pstyle = "";
        $('#layout').w2layout({
            name: 'layout',
            panels: [
                {
                    type: 'top',
                    size: 52,
                    resizable: false,
                    style: pstyle,
                    content: '<div id="drag-bar"><span class="fa fa-file-code-o fa-2x"  style="font-size:1.3em; margin-top: 5px"></span><span id="filePath"></span><div class="separator></div></div>"'
                },
                {
                    type: 'main', style: pstyle, content: 'main',
                    tabs: {
                        active: 'newfile',
                        tabs: [
                            {id: 'newfile', caption: 'New file...', closable: false }
                        ],
                        onClick: function (event) {
                            env.editor.setSession(new EditSession("", modelist.modesByName.text))
                        },
                        onClose: function (e) {
                            if (w2ui['layout_main_tabs'].active == e.target) {
                                w2ui.layout_main_tabs.select("newfile")
                            }
                            console.log(e)
                        }
                    }
                },
                {
                    type: "bottom", size: 200, resizable: true, style: pstyle, content: "Terminal", tabs: {
                    active: 'terminal',
                    tabs: [
                        {id: 'terminal', caption: 'Terminal', closable: true},
                    ],
                    onClick: function (event) {
                        console.log(this)
                        //this.owner.content('main', event);
                    }
                }
                }
            ]
        });
        $().w2layout({
            name: "editorLayout",
            panels: [
                {type: 'main', size: 100, resizable: true, style: pstyle, content: "<div class='editor-container' id='editor-container'></div>"},
                {type: 'right', size: 400 ,resizable: true, style: pstyle, content: "<div  class='editor-container' id='editor-secondary-container'></div>"}],
            onResize: function (event) {
                //console.log("resizing");
                setTimeout(function () {
                    try {
                        env.split.resize()
                    } catch (e) {
                    }
                }, 0);
                setTimeout(function () {
                    try {
                        env.split2.resize()
                    } catch (e) {
                    }
                }, 0)
            }

        });
        w2ui['layout'].content('main', w2ui["editorLayout"]);
        w2ui['layout'].content('bottom', "<div class='terminal-container'></div>")
        var myFun = function(){
            setTimeout(finished, 0)
            w2ui["editorLayout"].off("render", myFun);
        }
        w2ui["editorLayout"].on("render", myFun);

        exports.addTab = function (name, filepath, session) {
            var sameTabs = w2ui.layout_main_tabs.tabs.filter( function(tab){return tab.id == "tab-" + name})
            console.log(sameTabs    )
            if(sameTabs[0]){
                exports.selectTab(sameTabs[0].id);
            }

            exports.addSession(filepath, session);
            w2ui.layout_main_tabs.add({
                "id": "tab-" + name,
                "text": name,
                "closable": true,
                "hint": filepath,
                "onClick": function () {
                    exports.setSession(filepath);
                },
                "onRefresh": function () {
                    //loadFile(filepath)
                },
                "onClose": function () {
                    exports.removeSession(filepath)
                },
                "caption": name
            })
            exports.selectTab(name)

        };
        $("#menuBt").click(function () {
            var sidePage = $("#side-page");
            if (!sidePage.hasClass("opened")) {
                sidePage.animate({"width": "0%"}, function () {
                    console.log("progress")
                    w2ui.layout.resize();
                })
                sidePage.addClass("opened")
            } else {
                sidePage.animate({"width": "20%"}, function () {
                    console.log("progress")
                    w2ui.layout.resize();
                })
                sidePage.removeClass("opened")
            }
        });
        var sessions = {};
        exports.setSession = function(path){
            console.log(path)
            console.log(sessions)
            env.editor.setSession(sessions[path])
        }
        exports.addSession = function addSession(path, session){
            sessions[path] = session
        }
        exports.removeSession = function removeSession(path) {
            delete sessions[path]
        }
        exports.showUnsaved = function(){
            var activeTab = w2ui.layout_main_tabs.get(w2ui.layout_main_tabs.active)
            var activeTabName = activeTab.caption;
            if(!/\*$/.test(activeTabName)){
                activeTab.caption += "*";
                w2ui.layout_main_tabs.refresh();
            }
        };
        exports.showSaved = function showUnsaved(){
            var activeTab = w2ui.layout_main_tabs.get(w2ui.layout_main_tabs.active)
            var activeTabName = activeTab.caption;
            if(/\*$/.test(activeTabName)){
                activeTab.caption = activeTab.caption.substring(0,activeTab.caption.length-2);
                w2ui.layout_main_tabs.refresh();
            }
        }
        exports.selectTab = function(name){
            w2ui.layout_main_tabs.select("tab-" + name)
        }
    }
});