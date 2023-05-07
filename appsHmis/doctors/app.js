module.exports = function init(site) {
    let app = {
        name: 'doctors',
        allowMemory: true,
        memoryList: [],
        allowCache: false,
        cacheList: [],
        allowRoute: true,
        allowRouteGet: true,
        allowRouteAdd: true,
        allowRouteUpdate: true,
        allowRouteDelete: true,
        allowRouteView: true,
        allowRouteAll: true,
    };

    app.$collection = site.connectCollection('users_info');

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
                    res.render(app.name + '/index.html', { title: app.name, appName: 'Doctors' }, { parser: 'html', compres: true });
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
                _data.branch = site.getBranch(req);
                _data.branchList = [
                    {
                        company: _data.company,
                        branch: _data.branch,
                    },
                ];
                let numObj = {
                    company: site.getCompany(req),
                    screen: app.name,
                    date: new Date(),
                };

                _data.roles = [
                    {
                        moduleName: 'public',
                        name: 'doctorPermissions',
                        En: 'Doctor Permissions',
                        Ar: 'صلاحيات الطبيب',
                    },
                ];

                let cb = site.getNumbering(numObj);
                if (!_data.code && !cb.auto) {
                    response.error = 'Must Enter Code';
                    res.json(response);
                    return;
                } else if (cb.auto) {
                    _data.code = cb.code;
                }

                _data.addUserInfo = req.getUserFinger();
                _data.type = site.usersTypesList[7];

                if (!_data.email) {
                    const splitName = _data.nameEn.split(' ');
                    _data.email = splitName[0] + Math.floor(Math.random() * 1000 + 1).toString();
                }
                app.add(_data, (err, doc) => {
                    if (!err && doc) {
                        response.done = true;
                        response.doc = doc;
                    } else {
                        response.error = err?.message || 'Add Not Exists';
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
                        response.error = err?.message || 'Update Not Exists';
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
                let where = req.body.where || { 'type.id': 8 };
                let search = req.body.search || undefined;
                let select = req.body.select || { id: 1, code: 1, nameEn: 1, nameAr: 1, image: 1 , gender: 1 , consItem: 1 };
                let limit = req.body.limit || 10;
                let list = [];
                app.memoryList
                    .slice(-limit)
                    .filter(
                        (g) =>
                            (!search || JSON.stringify(g).contains(search)) && (!where['type.id'] || (g.type && g.type.id == where['type.id'])) && g.company && g.company.id == site.getCompany(req).id
                    )
                    .forEach((doc) => {
                        let obj = { ...doc };
                        for (const p in obj) {
                            if (!Object.hasOwnProperty.call(select, p)) {
                                delete obj[p];
                            }
                        }
                        if (!where.active || doc.active) {
                            list.push(obj);
                        }
                    });
                res.json({
                    done: true,
                    list: list,
                });
            });

            site.post(`api/${app.name}/import`, (req, res) => {
                let response = {
                    done: false,
                    file: req.form.files.fileToUpload,
                };

                if (site.isFileExistsSync(response.file.filepath)) {
                    let docs = [];
                    if (response.file.originalFilename.like('*.xls*')) {
                        let workbook = site.XLSX.readFile(response.file.filepath);
                        docs = site.XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
                    } else {
                        docs = site.fromJson(site.readFileSync(response.file.filepath).toString());
                    }

                    if (Array.isArray(docs)) {
                        console.log(`Importing ${app.name} : ${docs.length}`);
                        let systemCode = 0;
                        docs.forEach((doc) => {
                            let numObj = {
                                company: site.getCompany(req),
                                screen: app.name,
                                date: new Date(),
                            };
                            let cb = site.getNumbering(numObj);

                            if (cb.auto) {
                                systemCode = cb.code || ++systemCode;
                            } else {
                                systemCode++;
                            }

                            if (!doc.code) {
                                doc.code = systemCode;
                            }
                            let newDoc = {};
                            const specialtyApp = site.getApp('specialties');

                            specialtyApp.all({}, (err, specialtiesDocs) => {
                                const nationalityApp = site.getApp('nationalities');
                                let selectedSpecialty;
                                let specialty;
                                if (specialtiesDocs.length) {
                                    selectedSpecialty = specialtiesDocs.find((s) => s.nameEn.toLowerCase().trim() == doc.specialty.toLowerCase().trim());

                                    if (selectedSpecialty) {
                                        specialty = {
                                            _id: selectedSpecialty._id,
                                            id: selectedSpecialty.id,
                                            code: selectedSpecialty.code,
                                            nameAr: selectedSpecialty.nameAr,
                                            nameEn: selectedSpecialty.nameEn,
                                        };
                                    }
                                }

                                nationalityApp.all({}, (err, nationalitiesDocs) => {
                                    let selectedNationality;
                                    let nationality;
                                    if (nationalitiesDocs.length) {
                                        selectedNationality = nationalitiesDocs.find((n) => n.nameEn.toLowerCase().trim() == doc.nationality.toLowerCase().trim());
                                    }

                                    if (selectedNationality) {
                                        nationality = {
                                            _id: selectedNationality._id,
                                            id: selectedNationality.id,
                                            code: selectedNationality.code,
                                            nameAr: selectedNationality.nameAr,
                                            nameEn: selectedNationality.nameEn,
                                        };
                                    }

                                    if (!doc.email) {
                                        const splitName = doc.nameEn.split(' ');
                                        doc.email = splitName[0] + Math.floor(Math.random() * 1000 + 1).toString();
                                    }
                                    newDoc = {
                                        code: doc.code,
                                        nameAr: doc.nameAr,
                                        nameEn: doc.nameEn,
                                        gender: site.genders.find((t) => t.nameEn.toLowerCase().trim() == doc.gender.toLowerCase().trim()),
                                        email: doc.email,
                                        password: doc.password || doc.mobile || doc.email,
                                        mobile: doc.mobile,
                                        homeTel: doc.homeTel,
                                        specialty,
                                        nationality,
                                        roles: [
                                            {
                                                moduleName: 'public',
                                                name: 'doctorPermissions',
                                                En: 'Doctor Permissions',
                                                Ar: 'صلاحيات الطبيب',
                                            },
                                        ],
                                        type: site.usersTypesList[7],
                                        image: { url: '/images/doctors.png' },
                                        active: true,
                                    };

                                    newDoc.company = site.getCompany(req);
                                    newDoc.branch = site.getBranch(req);
                                    newDoc.addUserInfo = req.getUserFinger();

                                    app.add(newDoc, (err, doc2) => {
                                        if (!err && doc2) {
                                            site.dbMessage = `Importing ${app.name} : ${doc2.id}`;
                                            console.log(site.dbMessage);
                                        } else {
                                            site.dbMessage = err.message;
                                            console.log(site.dbMessage);
                                        }
                                    });
                                });
                            });
                        });
                    } else {
                        site.dbMessage = 'can not import unknown type : ' + site.typeof(docs);
                        console.log(site.dbMessage);
                    }
                } else {
                    site.dbMessage = 'file not exists : ' + response.file.filepath;
                    console.log(site.dbMessage);
                }

                res.json(response);
            });
        }
    }

    site.post('/api/dates/day', (req, res) => {
        let response = {};
        req.headers.language = req.headers.language || 'en';
        if (!req.session.user) {
            response.message = site.word('loginFirst')[req.headers.language];
            response.done = false;
            res.json(response);
            return;
        }

        let day = req.body.day || {};

        let nD = new Date();
        if (day.code > nD.getDay()) {
            nD.setTime(nD.getTime() + (day.code - nD.getDay()) * 24 * 60 * 60 * 1000);
        } else if (day.code < nD.getDay()) {
            nD.setTime(nD.getTime() + (7 - nD.getDay() + day.code) * 24 * 60 * 60 * 1000);
        }

        let fD = new Date(nD);
        let datesList = [fD];

        for (let i = 0; i < 12; i++) {
            nD.setTime(nD.getTime() + 7 * 24 * 60 * 60 * 1000);
            let d = new Date(nD);
            datesList.push(d);
        }

        response.done = true;
        response.list = datesList;
        res.json(response);
    });

    app.init();
    site.addApp(app);
};
