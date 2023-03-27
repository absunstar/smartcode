module.exports = function init(site) {
    let app = {
        name: 'employeesAdvances',
        allowMemory: false,
        memoryList: [],
        allowCache: false,
        cacheList: [],
        allowRoute: true,
        allowRouteGet: true,
        allowRouteAdd: true,
        allowRouteUpdate: true,
        allowRouteAccept: true,
        allowRouteRejected: true,
        allowRouteDelete: true,
        allowRouteView: true,
        allowRouteAll: true,
    };

    app.$collection = site.connectCollection(app.name);

    site.getEmployeeAdvances = function (paySlip, callback) {
        const d1 = site.toDate(paySlip.fromDate);
        const d2 = site.toDate(paySlip.toDate);

        app.$collection.findMany({ where: { 'employee.id': paySlip.employeeId, date: { $gte: d1, $lte: d2 }, active: true, requestStatus: 'accepted' } }, (err, docs) => {
            if (docs && docs.length) {
                docs.forEach((doc) => {
                    const index = doc.installmentsList.findIndex(
                        (installment) => !installment.paid && new Date(installment.date).getTime() >= d1.getTime() && new Date(installment.date).getTime() <= d2.getTime()
                    );

                    if (index != -1) {
                        const advance = {
                            date: doc.installmentsList[index].date,
                            amount: doc.installmentsList[index].amount,
                        };
                        paySlip.employeeAdvancesCount += 1;
                        paySlip.employeeAdvancesValue += doc.installmentsList[index].amount || 0;
                        paySlip.employeeAdvancesList.push(advance);
                    }
                });
            }
            callback(paySlip);
        });
    };

    site.payEmployeeAdvance = function (data) {
        app.$collection.find({ where: { 'employee.id': data.employeeId }, active: true }, (err, doc) => {
            if (doc) {
                const index = doc.installmentsList.findIndex((installment) => !installment.paid && new Date(installment.date).getTime() == new Date(data.date).getTime());
                if (index !== -1) {
                    doc.installmentsList[index].paid = true;
                    doc.installmentsList[index].paidDate = new Date();
                    doc.installmentsList[index].approved = true;
                    app.update(doc);
                }
            }
        });
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
                    res.render(app.name + '/index.html', { title: app.name, appName: 'Employees Advances' }, { parser: 'html', compres: true });
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

                app.$collection.findMany({ where: { 'employee.id': _data.employee.id, requestStatus: { $nin: ['rejected', 'canceled'] } } }, (err, docs) => {
                    const d1 = site.toDate(_data.date);
                    const exisitIndex = docs.findIndex((doc) => d1.getTime() == site.toDate(doc.date).getTime());

                    if (exisitIndex !== -1) {
                        response.done = false;
                        response.error = 'Employee Has Request In Same Date';
                        res.json(response);
                        return;
                    }

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
            });
        }

        if (app.allowRouteUpdate) {
            site.post({ name: `/api/${app.name}/update`, require: { permissions: ['login'] } }, (req, res) => {
                let response = {
                    done: false,
                };

                let _data = req.data;
                _data.editUserInfo = req.getUserFinger();

                app.$collection.findMany({ where: { 'employee.id': _data.employee.id, requestStatus: { $nin: ['rejected', 'canceled'] } } }, (err, docs) => {
                    const d1 = site.toDate(_data.date);

                    const exisitIndex = docs.findIndex((doc) => d1.getTime() == site.toDate(doc.date).getTime());

                    if (exisitIndex == -1 || (exisitIndex !== -1 && docs[exisitIndex].id == _data.id)) {
                        app.update(_data, (err, result) => {
                            if (!err) {
                                response.done = true;
                                response.result = result;
                            } else {
                                response.error = err.message;
                            }
                            res.json(response);
                        });
                    } else {
                        response.done = false;
                        response.error = 'Employee Has Request In Same Date';
                        res.json(response);
                        return;
                    }
                });
            });
        }

        if (app.allowRouteAccept) {
            site.post({ name: `/api/${app.name}/accept`, require: { permissions: ['login'] } }, (req, res) => {
                let response = {
                    done: false,
                };

                let _data = req.data;

                _data['requestStatus'] = 'accepted';
                _data['acceptDate'] = new Date();
                _data['approved'] = true;
                _data['approveDate'] = new Date();
                _data.acceptUserInfo = req.getUserFinger();

                app.$collection.findMany({ where: { 'employee.id': _data.employee.id, requestStatus: { $nin: ['rejected', 'canceled'] } } }, (err, docs) => {
                    const d1 = site.toDate(_data.date);

                    const exisitIndex = docs.findIndex((doc) => d1.getTime() == site.toDate(doc.date).getTime());

                    if (exisitIndex == -1 || (exisitIndex !== -1 && docs[exisitIndex].id == _data.id)) {
                        app.update(_data, (err, result) => {
                            if (!err) {
                                response.done = true;
                                response.result = result;
                            } else {
                                response.error = err.message;
                            }
                            res.json(response);
                        });
                    } else {
                        response.done = false;
                        response.error = 'Employee Has Request In Same Date';
                        res.json(response);
                        return;
                    }
                });
            });
        }

        if (app.allowRouteRejected) {
            site.post({ name: `/api/${app.name}/reject`, require: { permissions: ['login'] } }, (req, res) => {
                let response = {
                    done: false,
                };

                let _data = req.data;

                _data['requestStatus'] = 'rejected';
                _data['rejectDate'] = new Date();
                _data['approved'] = true;
                _data.rejectUserInfo = req.getUserFinger();

                app.$collection.findMany({ where: { 'employee.id': _data.employee.id, requestStatus: { $nin: ['rejected', 'canceled'] } } }, (err, docs) => {
                    const d1 = site.toDate(_data.date);

                    const exisitIndex = docs.findIndex((doc) => d1.getTime() == site.toDate(doc.date).getTime());

                    if (exisitIndex == -1 || (exisitIndex !== -1 && docs[exisitIndex].id == _data.id)) {
                        app.update(_data, (err, result) => {
                            if (!err) {
                                response.done = true;
                                response.result = result;
                            } else {
                                response.error = err.message;
                            }
                            res.json(response);
                        });
                    } else {
                        response.done = false;
                        response.error = 'Employee Has Request In Same Date';
                        res.json(response);
                        return;
                    }
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
                let search = req.body.search || {};
                let limit = req.body.limit || 10;
                let select = req.body.select || {
                    id: 1,
                    code: 1,
                    employee: 1,
                    vacationType: 1,
                    days: 1,
                    date: 1,
                    fromDate: 1,
                    approved: 1,
                    reason: 1,
                    file: 1,
                    requestStatus: 1,
                    approveDate: 1,
                    rejectDate: 1,
                    installmentsList: 1,
                    hasPaidtransaction: 1,
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
                    where.$or.push({
                        requestStatus: site.get_RegExp(search, 'i'),
                    });
                }
                if (where && where.fromDate && where.toDate) {
                    let d1 = site.toDate(where.fromDate);
                    let d2 = site.toDate(where.toDate);
                    d2.setDate(d2.getDate() + 1);
                    where.date = {
                        $gte: d1,
                        $lt: d2,
                    };
                    delete where.fromDate;
                    delete where.toDate;
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
