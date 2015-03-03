#!/usr/bin/env node

var http = require("http")
  , path = require("path")
  , mime = require("mime")
  , url = require("url")
  , fs = require("fs")
  , port = process.env.PORT || 8888
  , ip = process.env.IP || "0.0.0.0";

// compatibility with node 0.6
if (!fs.exists)
    fs.exists = path.exists;

var allowSave = process.argv.indexOf("--allow-save") != -1;

http.createServer(function(req, res) {
    var uri = url.parse(req.url).pathname
      , filename = path.join(process.cwd(), uri);

    console.log(uri);
    if(uri.length <= 1){
        uri = "/erlhickey.html"
    }
    if(isErl(uri)) {
        handleErlCall(uri, req, res)
        return
    }

    if (req.method == "PUT") {
        if (!allowSave)
            return error(res, 404, "Saving not allowed pass --allow-save to enable");
        save(req, res, filename);
    }

    fs.exists(filename, function(exists) {
        if (!exists)
            return error(res, 404, "404 Not Found\n");

        if (fs.statSync(filename).isDirectory()) {
            var files = fs.readdirSync(filename);
            res.writeHead(200, {"Content-Type": "text/html"});
            
            files.push(".", "..");
            var html = files.map(function(name) {
                var href = uri + "/" + name;
                href = href.replace(/[\/\\]+/g, "/").replace(/\/$/g, "");
                if (fs.statSync(filename + "/" + name + "/").isDirectory())
                    href += "/";
                return "<a href='" + href + "'>" + name + "</a><br>";
            });

            res._hasBody && res.write(html.join(""));
            res.end();
            return;
        }

        fs.readFile(filename, "binary", function(err, file) {
            if (err) {
                res.writeHead(500, { "Content-Type": "text/plain" });
                res.write(err + "\n");
                res.end();
                return;
            }

            var contentType = mime.lookup(filename) || "text/plain";
            res.writeHead(200, { "Content-Type": contentType });
            res.write(file, "binary");
            res.end();
        });
    });
}).listen(port, ip);

function error(res, status, message, error) {
    console.error(error || message);
    res.writeHead(status, { "Content-Type": "text/plain" });
    res.write(message);
    res.end();
}

function save(req, res, filePath) {
    var data = "";
    req.on("data", function(chunk) {
        data += chunk;
    });
    req.on("error", function() {
        error(res, 404, "Could't save file");
    });
    req.on("end", function() {
        try {
            fs.writeFileSync(filePath, data);
        }
        catch (e) {
            return error(res, 404, "Could't save file", e);
        }
        res.statusCode = 200;
        res.end("OK");
    });
}

function getLocalIps() {
    var os = require("os");

    var interfaces = os.networkInterfaces ? os.networkInterfaces() : {};
    var addresses = [];
    for (var k in interfaces) {
        for (var k2 in interfaces[k]) {
            var address = interfaces[k][k2];
            if (address.family === "IPv4" && !address.internal) {
                addresses.push(address.address);
            }
        }
    }
    return addresses;
}

console.log("http://" + (ip == "0.0.0.0" ? getLocalIps()[0] : ip) + ":" + port);

//==================================================================
//=========================== ErlHickey ============================
//==================================================================
function isErl(uri){
    return /^\/erl\//.test(uri)
}
function handleErlCall(uri, req, res) {
    var get = getCurr(uri);
    var url = require('url');
    var parameters = url.parse(req.url, true).query;

    get(/complete/, function(){
        erlCompServer.awaitCompletion(parameters["word"], function(result){
            res.end(JSON.stringify({result : result}))
        });
    })
    get(/compile/, function(){
        erlCompServer.compile(parameters["module"], function(result){
            res.end(JSON.stringify(result, null, 2))
        })
    })
    get(/dialyze/, function(){
        erlCompServer.dialyze(parameters["module"], function(result){
            res.end(JSON.stringify(result, null, 2))
        })
    })
}
function getCurr(uri) {
    return function(pathregex, fun){
        if(pathregex.test(uri)) fun()
    }
}

/// INITIALIZATION
var erlCompServer = {};
(function(){
    var pty = require('pty.js');

    var term = pty.spawn('erl', [], {
        name: 'xterm-color',
        cols: 80,
        rows: 30,
        cwd: process.env.HOME,
        env: process.env
    });



    function awaitCompletion(word, callback, acc) {
        acc = acc | "";
        word = word || "";
        console.log("word = " + word);

        term.write(word + "\t");
        term.once("data", function(data)
        {
            if((new RegExp(">\\s*")).test(data) || data.split(" ").length == 1){
               callback( prepareResult(acc + data));
                console.log("good");
                //CLEAR THE CONSOLE
                term.write(".\n")
            }
            else {
                //callback( prepareResult(acc + data));
                //console.log("bad");
                term.write(".\n");
                awaitCompletion(word, callback, acc  + "," + data)
            }
        })
    }
    function prepareResult(res) {
        res = res.replace('\u0007',"").split(/\s+/);
        if(res.length > 1) {
            res.splice(0, 1);
            res.splice(res.length - 2, 2);
            return res;
        }
        else return [res[0].split("").slice(1).join("")]

    }

    function compileModule(name, cb){
        term.write("c('" + name + "').\n");
        var lines = [];
        var listenForData = function() {
            term.once("data", function (data) {
                var lastRes = false;
                data.split("\n").map(function (line) {
                    var res = recognizeCompilerLine(line);
                    if (res) {
                        lines.push(res);
                        if (res.type == "result") {
                            cb(lines);
                            lastRes = true;
                        }
                    }
                });
                if(!lastRes){
                    listenForData()
                }
            })
        }
        listenForData()
    }
    function recognizeCompilerLine(line){
        //if tuple result
        if(!line.length) return undefined;
        line = line.trim();

        if(/^\{.*\}\s*$/.test(line) || /^\S*error*\S$/.test(line)){
            return {
                type: "result",
                content: line
            }
        }
        else
        {
            var cake = line.split(":");
            return {
                type: / error /.test(line) ? "error" : "info" ,
                path: cake[0],
                line: cake[1],
                content: cake.slice(2).join(":")
            }
        }
    }
    function dialyzeModule(name, cb) {
        var dialTerm = pty.spawn('dialyzer', [name, "--quiet"], {
            name: 'xterm-color',
            cols: 80,
            rows: 30,
            cwd: process.env.HOME,
            env: process.env
        });
        var lines = [];
        var awaitData = function(){
            dialTerm.on("data", function(data){
                data.split("\n").map(function(line){
                    if(line)lines.push(recognizeDialyzerLine(line))
                })
            })
        };
        dialTerm.on("exit", function(){
            cb(lines)
        });
        dialTerm.on("error", function(e){
            cb({err: e})
        });

        awaitData()
    }
    function recognizeDialyzerLine(line){
        var cake = line.split(":")
        return {path: cake[0], line: cake[1], content: cake.slice(2).join(":")}
    }
    erlCompServer.awaitCompletion = awaitCompletion;
    erlCompServer.compile = compileModule;
    erlCompServer.dialyze = dialyzeModule;
})();

//==================================================================
//===========================/ErlHickey  ============================
//==================================================================

