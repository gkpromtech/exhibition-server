/*
 * Copyright 2016 Promtech. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
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
