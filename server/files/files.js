var http  = require("./../static");
var fs  = require("fs");
var async = require("async")

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
        console.log(err)
        console.log(result)
        res.writeHead(200);
        res.end(result)
    })
})

function File(text, icon, children){

    return {
        text        : text, // node text
        icon        : icon, // string for custom
        children    : children  // array of strings or objects
    }
}