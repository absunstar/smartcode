module.exports = function init(site) {
    let app = {
        name: 'createVacations',
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
    site.getEmployeeGlobalVacation = function (paySlip, callback) {
        const d1 = site.toDate(paySlip.fromDate);
        const d2 = site.toDate(paySlip.toDate);

        app.$collection.findMany({ where: { fromDate: { $gte: d1 }, toDate: { $lte: d2 }, active: true, approved: true } }, (err, docs) => {
            if (docs && docs.length) {
                docs.forEach((doc) => {
                    const startDate = site.toDate(doc.fromDate);
                    const endDate = site.toDate(doc.toDate);
                    const diffTime = Math.abs(endDate - startDate) + 1;
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    const employeeIndex = doc.employeesList.findIndex((employee) => employee.id == paySlip.employeeId);

                    if (doc.vacationFor == 'all' || employeeIndex != -1) {
                        for (let i = 0; i < diffDays; i++) {
                            let date = new Date(doc.fromDate);
                            let day = new Date(date).getDate();
                            date.setDate(day + i);
                            const globalVacation = {
                                appName: app.name,
                                fromDate: doc.fromDate,
                                toDate: doc.toDate,
                                vacationFor: doc.vacationFor,
                                date,
                                employeesList: doc.employeesList,
                                vacationName: {
                                    id: doc.vacationName.id,
                                    code: doc.vacationName.code,
                                    nameAr: doc.vacationName.nameAr,
                                    nameEn: doc.vacationName.nameEn,
                                },
                            };
                            paySlip.globalVacationsDataList.push(globalVacation);
                        }
                    }
                });
            }
        });
        callback(paySlip);
    };
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
                    res.render(app.name + '/index.html', { title: app.name, appName: 'Create Vacations' }, { parser: 'html', compres: true });
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
                app.$collection.find({ where: { fromDate: { $eq: new Date(_data.fromDate) }, toDate: { $eq: new Date(_data.toDate) }, vacationFor: 'all' } }, (err, doc) => {
                    if (doc) {
                        response.done = false;
                        response.error = 'Global Vacation Exisit In Same Date';
                        res.json(response);
                        return;
                    } else {
                        app.add(_data, (err, doc) => {
                            if (!err && doc) {
                                response.done = true;
                                response.doc = doc;
                            } else {
                                response.error = err.mesage;
                            }
                            res.json(response);
                        });
                    }
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
                app.$collection.find({ where: { fromDate: { $eq: new Date(_data.fromDate) }, toDate: { $eq: new Date(_data.toDate) }, vacationFor: 'all' } }, (err, doc) => {
                    if (doc && doc.id !== _data.id) {
                        response.done = false;
                        response.error = 'Global Vacation Exisit In Same Date';
                        res.json(response);
                        return;
                    } else {
                        app.update(_data, (err, result) => {
                            if (!err) {
                                response.done = true;
                                response.result = result;
                            } else {
                                response.error = err.message;
                            }
                            res.json(response);
                        });
                    }
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
                _data['approveDate'] = new Date();
                _data.approvedUserInfo = req.getUserFinger();
                app.$collection.find({ where: { fromDate: { $eq: new Date(_data.fromDate) }, toDate: { $eq: new Date(_data.toDate) }, vacationFor: 'all' } }, (err, doc) => {
                    if (doc && doc.id !== _data.id) {
                        response.done = false;
                        response.error = 'Global Vacation Exisit In Same Date';
                        res.json(response);
                        return;
                    } else {
                        app.update(_data, (err, result) => {
                            if (!err) {
                                response.done = true;
                                response.result = result;
                            } else {
                                response.error = err.message;
                            }
                            res.json(response);
                        });
                    }
                });
            });
        }

        if (app.allowRouteUnapprove) {
            site.post({ name: `/api/${app.name}/unapprove`, require: { permissions: ['login'] } }, (req, res) => {
                let response = {
                    done: false,
                };

                let _data = req.data;

                _data['approved'] = false;
                _data['approveDate'] = null;
                _data.unapprovedUserInfo = req.getUserFinger();

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
                let search = req.body.search || '';
                let limit = req.body.limit || 10;
                let select = req.body.select || {
                    id: 1,
                    code: 1,
                    image: 1,
                    approveDate: 1,
                    vacationFor: 1,
                    employeesList: 1,
                    vacationName: 1,
                    approved: 1,
                    fromDate: 1,
                    toDate: 1,
                    active: 1,
                };
                if (search) {
                    where.$or = [];

                    where.$or.push({
                        'employee.id': site.get_RegExp(search, 'i'),
                    });

                    where.$or.push({
                        'employee.code': site.get_RegExp(search, 'i'),
                    });

                    where.$or.push({
                        'employee.nameAr': site.get_RegExp(search, 'i'),
                    });

                    where.$or.push({
                        'employee.nameEn': site.get_RegExp(search, 'i'),
                    });
                }
                if (where && where.fromDate && where.toDate) {
                    let d1 = site.toDate(where.fromDate);
                    let d2 = site.toDate(where.toDate);
                    d2.setDate(d2.getDate() + 1);
                    where.fromDate = {
                        $gte: d1,
                    };
                    where.toDate = {
                        $lte: d2,
                    };
                }

                if (app.allowMemory) {
                    if (!search) {
                        search = 'id';
                    }
                    let list = app.memoryList
                        .filter((g) => g.company && g.company.id == site.getCompany(req).id && (typeof where.active != 'boolean' || g.active === where.active) && JSON.stringify(g).contains(search))
                        .slice(0, limit);

                    res.json({
                        done: true,
                        list: list,
                    });
                } else {
                    where['company.id'] = site.getCompany(req).id;
                    app.all({ where, select, limit }, (err, docs) => {
                        res.json({
                            done: true,
                            list: docs,
                        });
                    });
                }
            });
        }
    }

    app.init();
    site.addApp(app);
};
