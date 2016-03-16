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
var CHANGE_ADDED = 0;
var CHANGE_UPDATED = 1;
var CHANGE_DELETED = 2;

function getUpdates(ctx) {
    var clientRevision = ctx.query.revision;
    var db = ctx.getDb();
    db.query("SELECT * FROM changes WHERE id > ? ORDER BY id ASC",
                     clientRevision, function(err, changes){
        if (err !== null) {
            ctx.error(ctx, err);
            return;
        }

        // оптимизация:
        // * упаковка нескольких изменений в одно
        // * добавление + изменение = добавление
        // * добавление [+ изменение] + удаление = нет изменений
        // * изменение + удаление = удаление

        var entityChanges = {};

        for (var changeIndex = 0, clen = changes.length; changeIndex < clen; ++changeIndex) {
            var change = changes[changeIndex];

            var entityChange = entityChanges[change.entity];
            if (entityChange === undefined) {
                entityChange = entityChanges[change.entity] = {};
            }

            var entityRowChange = entityChange[change.rowid];
            if (entityRowChange === undefined) {
                entityChange[change.rowid] = change;
            } else {
                switch (entityRowChange.changetype) {
                case CHANGE_ADDED:
                    switch (change.changetype) {
                    case CHANGE_ADDED:
                        console.error("INSERT " + JSON.stringify(change)
                                      + " after INSERT " + JSON.stringify(entityRowChange)
                                      + " IGNORED.");
                        break;

                    case CHANGE_UPDATED: // будет добавлен уже с обновленными данными
                        break;

                    case CHANGE_DELETED: // добавлен а затем удален = не было объекта
                        delete entityChange[change.rowid];
                        break;

                    default:
                         console.error("Invalid change type for " + JSON.stringify(lastPackedChange));
                    }
                    break;

                case CHANGE_UPDATED:
                    switch (change.changetype) {
                    case CHANGE_ADDED:
                        console.error("UPDATE " + JSON.stringify(change)
                                      + " after INSERT " + JSON.stringify(entityRowChange)
                                      + " IGNORED.");
                        break;

                    case CHANGE_UPDATED: // берем последнее обновление
                    case CHANGE_DELETED: // обновлен + удален = удален
                        entityChange[change.rowid] = change;
                        break;

                    default:
                         console.error("Invalid change type for " + JSON.stringify(lastPackedChange));
                    }

                    break;

                case CHANGE_DELETED:
                    console.error("SOMETHING " + JSON.stringify(change)
                                  + " after DELETE " + JSON.stringify(entityRowChange)
                                  + " IGNORED.");
                    break;

                default:
                     console.error("Invalid change type for " + JSON.stringify(lastPackedChange));
                }
            }
        }

        var result = [];
        var entitiesRows = [];
        for (var entity in entityChanges) {
            entityChange = entityChanges[entity];
            var entityRows = "";
            for (var rowId in entityChange) {
                change = entityChange[rowId];
                result[change.id] = change;
                if (change.changetype !== CHANGE_DELETED) {
                    if (entityRows !== "")
                        entityRows += ",";
                    entityRows += change.rowid;
                }
            }
            if (entityRows !== "") {
                entitiesRows.push({name: entity, rows: entityRows});
            }
        }
        result = result.filter(Object);


        // вычитывание данных касающихся изменений
        var entityData = {};
        (function queryNextEntity(index) {
            if (index === entitiesRows.length) {
                sendResult();
                return;
            }


            var entity = entitiesRows[index];
            db.query("SELECT * FROM " + entity.name + " WHERE id IN ("
                             + entity.rows + ")", function(err, data){
                if (err !== null) {
                    ctx.error(ctx, err);
                    return;
                }

                var item = entityData[entity.name] = {};
                for (var i = 0, len = data.length; i < len; ++i) {
                    var row = data[i];
                    item[row.id] = row;
                }

                queryNextEntity(index + 1);
            });
        })(0);


        // добавление данных в наборы изменений
        function sendResult() {
            for (var index = 0, len = result.length; index < len; ++index) {
                var change = result[index];
                if (change.changetype !== CHANGE_DELETED) {
                    change.data = entityData[change.entity][change.rowid];
                }
            }

            if (changes.length === 0) {
                db.query("SELECT MAX(id) rev FROM changes", function(err, data){
                    if (err !== null) {
                        ctx.error(ctx, err);
                        return;
                    }
                    try {
                        ctx.success(ctx, {revision: data[0].rev, changes: []});
                    } catch (e) {
                        ctx.error(ctx, e);
                    }
                });

            } else {
                ctx.success(ctx, {revision: changes[changes.length - 1].id, changes: result});
            }
        }
    });
}

exports.register = function(handlers) {
    handlers.getUpdates = getUpdates;
};

