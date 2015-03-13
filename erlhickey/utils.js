define(function(require, exports, module) {
    exports.load = function(url, callback, errCallback) {
        if(!~url.indexOf(project.address)) url = project.address + url;
        var xhr;
        if (typeof XMLHttpRequest !== 'undefined') xhr = new XMLHttpRequest();
        else {
            var versions = ["MSXML2.XmlHttp.5.0",
                "MSXML2.XmlHttp.4.0",
                "MSXML2.XmlHttp.3.0",
                "MSXML2.XmlHttp.2.0",
                "Microsoft.XmlHttp"]

            for (var i = 0, len = versions.length; i < len; i++) {
                try {
                    xhr = new ActiveXObject(versions[i]);
                    break;
                }
                catch (e) {
                }
            } // end for
        }

        xhr.onreadystatechange = ensureReadiness;

        function ensureReadiness() {
            if (xhr.readyState === 4) {
                if(xhr.status >= 200 && xhr.status < 300)
                    callback(xhr);
                else
                    if(errCallback) errCallback()
            }
        }

        xhr.open('GET', url, true);
        xhr.send('');
    }
    exports.findDefinition = function(dirs, filename, name, callback) {
        var prefix = project.isElixir() ? "elixir" : "erl";
        exports.load(prefix+"/definition?dirs="+dirs +
        "&file="+filename +
        "&name="+name, function(res){
            callback(res.response)
        })
    }
})