server  = require("./../static")
fs      = require("fs")

settingsDir = ".settings"
console.log(require.main)

server.on "/settings", (req, res, params) ->
  if(req.method == "POST") then setSettings(req,res)
  else getSettings(req, res, params)

setSettings = (req,res) ->
  buffer = ""
  req.on "data", data ->
    buffer += data
  req.on "end", data ->
    data = JSON.parse(buffer)
    saveSettings(data.directory, data.content)
    res.end("ok")


getSettings = (req,res, params) ->
  path = params["path"].replace(/'/g, "")
  loadSettings path, (err, result) ->
    res.end JSON.stringify({err: err, result: result})

loadSettings = (dir, cb) ->
  fs.readFile dir, (err, res) ->
    cb(err, (if res then JSON.parse(res) else null))

saveSettings = (dir, data, cb) ->
  fs.writeFile dir, JSON.stringify(data), (err, res) ->
    cb(err, JSON.stringify(res))

