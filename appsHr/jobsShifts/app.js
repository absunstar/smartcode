module.exports = function init(site) {
    let app = {
        name: 'jobsShifts',
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

    site.checkShiftWorkDays = function (_data, callback) {
        const day = new Date(_data.date).getDay();
        let response = { done: false };
        app.$collection.find({ id: _data.id }, (err, doc) => {
            let dayIndex;

            if (doc) {
                if (!doc.approved) {
                    response.done = false;
                    response.error = 'Shift Not Approved';
                } else {
                    dayIndex = doc.worktimesList.findIndex((_d) => _d.day.index == day);

                    if (doc.worktimesList[dayIndex].active && dayIndex !== -1) {
                        const day = doc.worktimesList[dayIndex].day;
                        const start = new Date(
                            new Date(_data.date).getFullYear(),
                            new Date(_data.date).getMonth(),
                            new Date(_data.date).getDate(),
                            new Date(doc.worktimesList[dayIndex].start).getHours(),
                            new Date(doc.worktimesList[dayIndex].start).getMinutes()
                        );

                        const nightTime = doc.worktimesList[dayIndex].nightTime;
                        let end;

                        if (nightTime) {
                            end = new Date(
                                new Date(_data.date).getFullYear(),
                                new Date(_data.date).getMonth(),
                                new Date(new Date(_data.date).getDate() + 1),
                                new Date(doc.worktimesList[dayIndex].end).getHours(),
                                new Date(doc.worktimesList[dayIndex].end).getMinutes()
                            );
                        } else {
                            end = new Date(
                                new Date(_data.date).getFullYear(),
                                new Date(_data.date).getMonth(),
                                new Date(_data.date).getDate(),
                                new Date(doc.worktimesList[dayIndex].end).getHours(),
                                new Date(doc.worktimesList[dayIndex].end).getMinutes()
                            );
                        }
                        response.done = true;
                        response.doc = { id: doc.id, day, start, end, nightTime };
                    }

                    if (!doc.worktimesList[dayIndex].active || dayIndex == -1) {
                        response.done = false;
                        response.error = 'Selected Day Not Set As Work Day';
                    }
                }
            }

            callback(response);
        });
    };

    site.checkShiftApprove = function (_data, callback) {
        let response = { done: false };
        app.$collection.find({ id: _data.id }, (err, doc) => {
            if (doc && doc.approved) {
                response.done = true;
                // response.error = 'Shift Not Approved';
            } else {
                // response.done = false;
                response.error = 'Shift Not Approved';
            }
            callback(response);
        });
        // checkShiftWorkDays;
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
                    res.render(app.name + '/index.html', { title: app.name, appName: req.word("Jobs Shifts"), setting: site.getCompanySetting(req) }, { parser: 'html', compres: true });
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
                if(!_data.id){
                    response.error = 'No Id';
                    res.json(response);
                    return;
                  }
                _data['approved'] = true;
                _data['approvedDate'] = new Date();
                _data.approvedUserInfo = req.getUserFinger();

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

        if (app.allowRouteUnapprove) {
            site.post({ name: `/api/${app.name}/unapprove`, require: { permissions: ['login'] } }, (req, res) => {
                let response = {
                    done: false,
                };

                let _data = req.data;

                _data['approved'] = false;
                _data['approvedDate'] = null;
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

        if (app.allowRouteGet) {
            site.post({ name: `/api/${app.name}/get`, require: { permissions: ['login'] } }, (req, res) => {
                let _data = req.data;

                if (!_data.date) {
                    return;
                }
                if (!_data.id) {
                    return;
                }

                site.checkShiftWorkDays(_data, (result) => {
                    res.json(result);
                });

                // app.$collection.find({ id: _data.id }, (err, doc) => {
                //     if (doc) {
                //         const dayIndex = doc.worktimesList.findIndex((_d) => _d.active && _d.day.index == day);
                //         if (dayIndex !== -1) {
                //             const day = doc.worktimesList[dayIndex].day;
                //             const start = doc.worktimesList[dayIndex].start;
                //             const end = doc.worktimesList[dayIndex].end;
                //             response.done = true;
                //             response.doc = { day, start, end };
                //         } else {
                //             response.done = false;
                //             response.error = 'Selected Day Not Set As Work Day';
                //         }
                //         res.json(response);
                //     }
                // });
            });
        }

        if (app.allowRouteAll) {
            site.post({ name: `/api/${app.name}/all`, public: true }, (req, res) => {
                let where = req.body.where || {};
                let search = req.body.search || '';
                let limit = req.body.limit || 50;
                let select = req.body.select || {
                    id: 1,
                    code: 1,
                    nameEn: 1,
                    nameAr: 1,
                    approved: 1,
                    fingerprintMethod: 1,
                    // availableDelayTime: 1,
                    // worktimesList: 1,
                    // penaltiesList: 1,
                    active: 1,
                };

                if (search) {
                    where.$or = [];

                    where.$or.push({
                        id: site.get_RegExp(search, 'i'),
                    });

                    where.$or.push({
                        code: site.get_RegExp(search, 'i'),
                    });

                    where.$or.push({
                        nameAr: site.get_RegExp(search, 'i'),
                    });

                    where.$or.push({
                        nameEn: site.get_RegExp(search, 'i'),
                    });
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
