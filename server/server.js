var http = require("http");
var url = require("url");

function parseGetQuery(query) {
    var result = {};
    if (query !== null) {
        var args = query.split('&');
        for (var i = 0, l = args.length; i < l; ++i) {
            var arg = args[i];
            var pos = arg.indexOf('=');
            if (pos === -1) {
                result[arg] = null;
            } else {
                result[arg.substr(0, pos)] = arg.substr(pos + 1);
            }
        }
    }
    return result;
}

function start(route, handle) {
    function onRequest(request, response) {
        var parsedUrl = url.parse(request.url);
        var ctx = {
            handle: handle,
            request: request,
            response: response,
            url: parsedUrl,
            query: parseGetQuery(parsedUrl.query)
        };

        route(ctx);
    }

    http.createServer(onRequest).listen(process.conf.server.port);
    console.log("Server has started.");
}

exports.start = start;
