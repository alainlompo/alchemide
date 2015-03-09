define(function(require, exports, module){
    exports.init = function() {

        var lastInput = "";
        var lastSent = ""
        window.terminal = $(".terminal-container").terminal(function (command, term) {
            enterCommand(command)
            lastInput = ""
        }, {
            greetings: '#! bin/sh',
            name: 'binsh',
            prompt: "",
            exit: false,
            completion: false,
            onExit: function () {
                console.log("yo")
            },
            keydown: function (e) {
                //is focused
                if ($(".cursor").hasClass("blink")) {
                    if (e.ctrlKey) {
                        if (e.keyCode == "D".charCodeAt(0)) {
                            enterCommand("\04")
                        }
                        if (e.keyCode == "C".charCodeAt(0)) {
                            enterCommand("\03")
                        }
                        return false
                    }
                    //tab
                    if (e.keyCode == 9) {
                        enterTab();
                        return false
                    }
                    if (e.keyCode == 8) {
                        lastInput = lastInput.substring(0, lastInput.length - 1)
                        socket.emit("data", "\b")
                    }
                }
            }
        });
        var RESULT_BUFFER_PERIOD = 100;
        var cmdInput = $(".cmd span:eq(1)")
        var socket = io("http://" + window.location.host)

        var bufferEE = function (emiter, event, onListener, period, after) {
            emiter.on(event, onListener);

            var flush = function () {
                emiter.removeListener(event, onListener);
                after()
            };
            setTimeout(flush, period);

            return {
                flush: function () {
                    clearTimeout(flush(), period)
                    flush()
                }
            }
        };

        function enterCommand(command) {
            terminal.pause();
            var acc = "";
            socket.emit("data", command.replace(lastInput, '') + "\n")
            bufferEE(socket, "data", function (data) {
                acc += data
            }, 1000, function () {
                acc = acc.replace(command, "");
                acc = acc.replace(command, "");
                acc = acc.replace("\n", "");
                lastInput = ""
                displayLines(acc);
            })
        }

        function enterTab() {
            var toSend = cmdInput.text();
            toSend = toSend.replace(lastInput, "");
            socket.emit("data", toSend + "\t");
            lastSent = toSend;
            var acc = "";

            bufferEE(socket, "data", function (data) {
                    acc += data
                }
                , RESULT_BUFFER_PERIOD, function () {
                    var cake = acc.split("\n")

                    if (cake.length == 1) {
                        var line = cake.join();
                        line.replace(lastSent, "");
                        lastInput += line;
                        terminal.set_command(lastInput);
                        return
                    }
                    displayLines(acc)
                })
        }

        function displayLines(input) {
            var cake = input.split("\n")
            console.log(cake)

            var lastLine = cake[cake.length - 1];
            var lastLineCake = lastLine.trim().split(" ");

            cake.slice(0, cake.length - 1).map(terminal.echo)
            terminal.set_prompt(lastLineCake[0] + " ")
            terminal.set_command(lastLineCake.slice(1).join())
            lastInput = lastLineCake.slice(1).join()

            terminal.resume();

        }

        window.socket = socket
    }
});