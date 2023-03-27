module.exports = function init(site) {
    let app = {
        name: 'stockTaking',
        allowMemory: false,
        memoryList: [],
        allowCache: false,
        cacheList: [],
        allowRoute: true,
        allowRouteGet: true,
        allowRouteAdd: true,
        allowRouteUpdate: true,
        allowRouteApprove: true,
        allowRouteUnapprove: true,
        allowRouteDelete: true,
        allowRouteView: true,
        allowRouteAll: true,
    };

    app.$collection = site.connectCollection(app.name);

    app.init = function () {
        if (app.allowMemory) {
            app.$collection.findMany({}, (err, docs) => {
                if (!err) {
                    if (docs.length == 0) {
                        app.cacheList.forEach((_item, i) => {
                            app.$collection.add(_item, (err, doc) => {
                                if (!err && doc) {
                                    app.memoryList.push(doc);
                                }
                            });
                        });
                    } else {
                        docs.forEach((doc) => {
                            app.memoryList.push(doc);
                        });
                    }
                }
            });
        }
    };
    app.add = function (_item, callback) {
        app.$collection.add(_item, (err, doc) => {
            if (callback) {
                callback(err, doc);
            }
            if (app.allowMemory && !err && doc) {
                app.memoryList.push(doc);
            }
        });
    };
    app.update = function (_item, callback) {
        app.$collection.edit(
            {
                where: {
                    id: _item.id,
                },
                set: _item,
            },
            (err, result) => {
                if (callback) {
                    callback(err, result);
                }
                if (app.allowMemory && !err && result) {
                    let index = app.memoryList.findIndex((itm) => itm.id === result.doc.id);
                    if (index !== -1) {
                        app.memoryList[index] = result.doc;
                    } else {
                        app.memoryList.push(result.doc);
                    }
                } else if (app.allowCache && !err && result) {
                    let index = app.cacheList.findIndex((itm) => itm.id === result.doc.id);
                    if (index !== -1) {
                        app.cacheList[index] = result.doc;
                    } else {
                        app.cacheList.push(result.doc);
                    }
                }
            }
        );
    };
    app.delete = function (_item, callback) {
        app.$collection.delete(
            {
                id: _item.id,
            },
            (err, result) => {
                if (callback) {
                    callback(err, result);
                }
                if (app.allowMemory && !err && result.count === 1) {
                    let index = app.memoryList.findIndex((a) => a.id === _item.id);
                    if (index !== -1) {
                        app.memoryList.splice(index, 1);
                    }
                } else if (app.allowCache && !err && result.count === 1) {
                    let index = app.cacheList.findIndex((a) => a.id === _item.id);
                    if (index !== -1) {
                        app.cacheList.splice(index, 1);
                    }
                }
            }
        );
    };
    app.view = function (_item, callback) {
        if (callback) {
            if (app.allowMemory) {
                if ((item = app.memoryList.find((itm) => itm.id == _item.id))) {
                    callback(null, item);
                    return;
                }
            } else if (app.allowCache) {
                if ((item = app.cacheList.find((itm) => itm.id == _item.id))) {
                    callback(null, item);
                    return;
                }
            }

            app.$collection.find({ id: _item.id }, (err, doc) => {
                callback(err, doc);

                if (!err && doc) {
                    if (app.allowMemory) {
                        app.memoryList.push(doc);
                    } else if (app.allowCache) {
                        app.cacheList.push(doc);
                    }
                }
            });
        }
    };
    app.all = function (_options, callback) {
        if (callback) {
            if (app.allowMemory) {
                callback(null, app.memoryList);
            } else {
                app.$collection.findMany(_options, callback);
            }
        }
    };

    if (app.allowRoute) {
        if (app.allowRouteGet) {
            site.get(
                {
                    name: app.name,
                },
                (req, res) => {
                    res.render(app.name + '/index.html', { title: app.name, appName: 'Stocktaking' }, { parser: 'html', compres: true });
                }
            );
        }

        if (app.allowRouteAdd) {
            site.post({ name: `/api/${app.name}/add`, require: { permissions: ['login'] } }, (req, res) => {
                let response = {
                    done: false,
                };

                let _data = req.data;
                _data.company = site.getCompany(req);

                let numObj = {
                    company: site.getCompany(req),
                    screen: app.name,
                    date: new Date(),
                };

                let cb = site.getNumbering(numObj);
                if (!_data.code && !cb.auto) {
                    response.error = 'Must Enter Code';
                    res.json(response);
                    return;
                } else if (cb.auto) {
                    _data.code = cb.code;
                }

                _data.addUserInfo = req.getUserFinger();

                app.add(_data, (err, doc) => {
                    if (!err && doc) {
                        response.done = true;
                        response.doc = doc;
                    } else {
                        response.error = err.mesage;
                    }
                    res.json(response);
                });
            });
        }

        if (app.allowRouteUpdate) {
            site.post({ name: `/api/${app.name}/update`, require: { permissions: ['login'] } }, (req, res) => {
                let response = {
                    done: false,
                };

                let _data = req.data;
                _data.editUserInfo = req.getUserFinger();

                app.update(_data, (err, result) => {
                    if (!err) {
                        response.done = true;
                        response.result = result;
                    } else {
                        response.error = err.message;
                    }
                    res.json(response);
                });
            });
        }

        if (app.allowRouteApprove) {
            site.post({ name: `/api/${app.name}/approve`, require: { permissions: ['login'] } }, (req, res) => {
                let response = {
                    done: false,
                };

                let _data = req.data;
                _data['approved'] = true;

                let errBatchList = [];
                _data.itemsList.forEach((_item) => {
                    if (_item.workByBatch || _item.workBySerial) {
                        if (_item.batchesList && _item.batchesList.length > 0) {
                            _item.$batchCount = _item.batchesList.reduce((a, b) => +a + +b.count, 0);
                            let notCode = _item.batchesList.some((_b) => !_b.code);
                            if (_item.$batchCount != _item.count || notCode) {
                                let itemName = req.session.lang == 'Ar' ? _item.nameAr : _item.nameEn;
                                errBatchList.push(itemName);
                            }
                        } else {
                            let itemName = req.session.lang == 'Ar' ? _item.nameAr : _item.nameEn;
                            errBatchList.push(itemName);
                        }
                    }
                });
                // if (errBatchList.length > 0) {
                //     let error = errBatchList.map((m) => m).join('-');
                //     response.error = `The Batches Count is not correct in ( ${error} )`;
                //     res.json(response);
                //     return;
                // }

                _data.approvedUserInfo = req.getUserFinger();
                _data.approvedDate = new Date();
                _data.startStockTaking = false;
                app.update(_data, (err, result) => {
                    if (!err) {
                        response.done = true;
                        response.result = result;

                        result.doc.itemsList.forEach((_item) => {
                            if (_item.currentCount != _item.count) {
                                let item = { ..._item };
                                item.countType = item.count > item.currentCount ? 'in' : 'out';
                                item.count = item.count - item.currentCount;
                                item.count = Math.abs(item.count);
                                item.store = { ...result.doc.store };
                                site.editItemsBalance(item, app.name);
                                item.company = result.doc.company;
                                item.invoiceId = result.doc.id;
                                item.date = result.doc.date;
                                item.orderCode = result.doc.code;
                                site.setItemCard(item, app.name);
                            }
                        });
                    } else {
                        response.error = err.message;
                    }
                    res.json(response);
                });
            });
        }

        if (app.allowRouteUnapprove) {
            site.post({ name: `/api/${app.name}/unapprove`, require: { permissions: ['login'] } }, (req, res) => {
                let response = {
                    done: false,
                };

                let _data = req.data;
                _data.unapproveUserInfo = req.getUserFinger();
                _data.unapprovedDate = new Date();

                app.update(_data, (err, result) => {
                    if (!err) {
                        response.done = true;
                        response.result = result;
                    } else {
                        response.error = err.message;
                    }
                    res.json(response);
                });
            });
        }
        if (app.allowRouteDelete) {
            site.post({ name: `/api/${app.name}/delete`, require: { permissions: ['login'] } }, (req, res) => {
                let response = {
                    done: false,
                };
                let _data = req.data;

                app.delete(_data, (err, result) => {
                    if (!err && result.count === 1) {
                        response.done = true;
                        response.result = result;
                    } else {
                        response.error = err?.message || 'Deleted Not Exists';
                    }
                    res.json(response);
                });
            });
        }

        if (app.allowRouteView) {
            site.post({ name: `/api/${app.name}/view`, public: true }, (req, res) => {
                let response = {
                    done: false,
                };

                let _data = req.data;
                app.view(_data, (err, doc) => {
                    if (!err && doc) {
                        response.done = true;
                        response.doc = doc;
                    } else {
                        response.error = err?.message || 'Not Exists';
                    }
                    res.json(response);
                });
            });
        }

        if (app.allowRouteAll) {
            site.post({ name: `/api/${app.name}/all`, public: true }, (req, res) => {
                let where = req.body.where || {};
                let select = req.body.select || {
                    id: 1,
                    code: 1,
                    date: 1,
                    requestDate: 1,
                    startStockTaking: 1,
                    approvedDate: 1,
                    title: 1,
                    itemsList: 1,
                    store: 1,
                    approved: 1,
                };
                let list = [];
                if (app.allowMemory) {
                    app.memoryList
                        .filter((g) => g.company && g.company.id == site.getCompany(req).id)
                        .forEach((doc) => {
                            let obj = { ...doc };

                            for (const p in obj) {
                                if (!Object.hasOwnProperty.call(select, p)) {
                                    delete obj[p];
                                }
                            }
                            list.push(obj);
                        });
                    res.json({
                        done: true,
                        list: list,
                    });
                } else {
                    where['company.id'] = site.getCompany(req).id;
                    if (where && where.dateTo) {
                        let d1 = site.toDate(where.date);
                        let d2 = site.toDate(where.dateTo);
                        d2.setDate(d2.getDate() + 1);
                        where.date = {
                            $gte: d1,
                            $lt: d2,
                        };
                        delete where.dateTo;
                    } else if (where.date) {
                        let d1 = site.toDate(where.date);
                        let d2 = site.toDate(where.date);
                        d2.setDate(d2.getDate() + 1);
                        where.date = {
                            $gte: d1,
                            $lt: d2,
                        };
                    }
                    app.all({ where: where, select, sort: { id: -1 } }, (err, docs) => {
                        res.json({
                            done: true,
                            list: docs,
                        });
                    });
                }
            });
        }
    }

    site.getStockTakingHold = function (storeId, callback) {
        let ids = [];
        if (storeId) {
            app.all({ where: { 'store.id': storeId, startStockTaking: true } }, (err, docs) => {
                if (docs && docs.length > 0) {
                    docs.forEach((doc) => {
                        doc.itemsList.forEach((_item) => {
                            ids.push(_item.id);
                        });
                    });
                    callback(ids);
                } else {
                    callback(ids);
                }
            });
        } else {
            callback(ids);
        }
    };

    app.init();
    site.addApp(app);
};
