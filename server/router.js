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
var mysql = require("mysql");

function success(ctx, result) {
    if (ctx.db !== undefined) {
        if (ctx.dbUsesTransaction) {
            ctx.db.query("COMMIT");
        }
        ctx.db.end();
    }

    if (ctx.query.jsoncallback) { // JSONP
        ctx.response.writeHead(200, {"Content-Type": "text/plain"});
        ctx.response.write(ctx.query.jsoncallback + "(" + JSON.stringify(result) + ");");
    } else if (typeof result === "string") {
        ctx.response.writeHead(200, {"Content-Type": "text/plain"});
        ctx.response.write(result);
    } else if (typeof result === "object") {
        ctx.response.writeHead(200, {"Content-Type": "application/json"});
        ctx.response.write(JSON.stringify(result));
    }
    ctx.response.end();
}

function error(ctx, err, status) {
    if (ctx.db !== undefined) {
        if (ctx.dbUsesTransaction) {
            ctx.db.query("ROLLBACK");
        }
        ctx.db.end();
    }

    if (typeof err !== 'string') {
        err = (err || "UNKNOWN ERROR").toString();
    }

    err = JSON.stringify({ err: err });

    if (ctx.query.jsoncallback) { // JSONP
        ctx.response.writeHead(200, {"Content-Type": "application/json"});
        ctx.response.write(ctx.query.jsoncallback + "(" + err + ");");
    } else {
        ctx.response.writeHead(status || 500, {"Content-Type": "application/json"});
        ctx.response.write(err);
    }
    ctx.response.end();

    console.warn(ctx.request.url + ": " + err);
}

function route(ctx) {
    console.log("request URL " + ctx.request.url);
    if (typeof ctx.handle[ctx.url.pathname] === 'function') {
        ctx.success = success;
        ctx.error = error;
        ctx.getDb = function(usesTransaction) {
            if (ctx.db === undefined) {
                ctx.db = mysql.createConnection(process.conf.db);
                ctx.dbUsesTransaction = usesTransaction;
                if (ctx.dbUsesTransaction) {
                    ctx.db.query("BEGIN");
                }
            }
            return ctx.db;
        };
        try {
            var result = ctx.handle[ctx.url.pathname](ctx);
            if (result !== undefined)
                success(ctx, result);
        } catch (e) {
            error(ctx, e);
        }
    } else {
        console.warn("No request handler found for " + ctx.url.pathname);
        ctx.response.writeHead(404, {"Content-Type": "text/plain"});
        ctx.response.write("404 Not found");
        ctx.response.end();
    }
}

exports.route = route;
