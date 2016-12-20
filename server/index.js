/*
 * Copyright 2016 Primesoft. All rights reserved.
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
var fs = require("fs");
var server = require("./server");
var router = require("./router");
var serviceNames = [];
process.conf = require("./conf").conf;
process.services = {};

var files = fs.readdirSync("services/");
for (var file in files) {
    var match = files[file].match(/^(.*)\.js$/);
    if (match !== null) {
        serviceNames.push(match[1]);
    }
}

var htmlServices = "<h1>Deployed services</h1>";
function deployedServices(ctx) {
    ctx.response.writeHead(200, {"Content-Type": "text/html"});
    ctx.response.write("<html>" + htmlServices + "</html>");
    ctx.response.end();
}

var handle = {};
for (var i = 0; i < serviceNames.length; ++i) {
    var serviceName = serviceNames[i];
    var handlers = {};
    htmlServices += "<h2>" + serviceName + "</h2>operations:<br/><ul>";
    var service = require("./services/" + serviceName);
    service.register(handlers);
    process.services[serviceName] = service;
    for (var handler in handlers) {
        var path = "/" + serviceName + "/" + handler;
        htmlServices += "<li><a href=\"" + path + "\">" + handler + "</a></li>";
        handle[path] = handlers[handler];
    }
    htmlServices += "</ul>";
}
handle["/"] = deployedServices;

server.start(router.route, handle);

console.log("Deployed services: " + JSON.stringify(serviceNames));
