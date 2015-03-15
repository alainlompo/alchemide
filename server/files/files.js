var http  = require("./../static");
var fs  = require("fs");
var async = require("async")
var dir = require("node-dir")

http.on("/files", function(req, res, params){
    var path = params["path"].replace(/('|")/g, "")
    fs.readdir(path, function(err, result){
        result = result.filter(function(a){return a[0] != "."})
        res.writeHead(200, {"Content-Type": 'application/json'});
        async.map(result, function(a, cb){
                fs.lstat(path + "/" + a, function(err, r){
                    cb(null, {text: a, children: r.isDirectory()})
                })
            },
            function(err, results){
                res.end(JSON.stringify(results))
            }
        )
    })
});
http.on("/file", function(req,res, params){
    var path = params["path"].replace(/('|")/g, "")
    fs.readFile(path, function(err, result){
        res.writeHead(200);
        res.end(result)
    })
})
http.on("/findFile", function(req, res, params){
    var fileName = params["name"];
    var fileRegExp = new RegExp("/"+fileName);
    var projectPath = params["path"].replace(/'/g, "");
    dir.files(projectPath, function(err, files){
        if(!err){
            res.end(JSON.stringify({result: files.filter(function(f){
                return fileRegExp.test(f)
            })}));
        }
    })
});
http.on("/projectTree", function(req,res, params){
    var projectPath = params["path"].replace(/'/g, "");
    dir.files(projectPath, function(err, files){
        res.end(JSON.stringify({err: err, result : files}))
    })
})