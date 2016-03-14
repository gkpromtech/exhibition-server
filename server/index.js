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
