
exports.init = function(http) {
    var io = require("socket.io").listen(http);
    var pty = require('pty.js');


    io.on("connection", function (sock) {
        console.log("Got new connection")
        console.log(sock.handshake.address)
        var term = startNewTerminal();

        sock.on("data", function(data){

            console.log("got data from socket: " + data)
            term.write(data)
        });
        term.on("data", function(data){
            if(data.trim() == "^H") return;
            console.log("got data from terminal : " + data)
            sock.emit("data", data)
        });
        sock.on("disconnect", function(){
            console.log("got disconnection")
            term.kill();
        });
        //term.pipe(sock);
        //sock.pipe(term);
    });

    function startNewTerminal() {
        return pty.spawn('/bin/sh', [], {
            name: 'xterm-color',
            cols: 80,
            rows: 30,
            cwd: process.env.HOME,
            env: process.env
        });
    }
}