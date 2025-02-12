module.exports = function init(site) {
    let app = {
        name: 'services',
        allowMemory: false,
        memoryList: [],
        allowCache: true,
        cacheList: [],
        allowRoute: true,
        allowRouteGet: true,
        allowRouteAdd: true,
        allowRouteUpdate: true,
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
                    res.render(app.name + '/index.html', { title: app.name, appName: req.word("Services"), setting: site.getCompanySetting(req) }, { parser: 'html', compres: true });
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
                let select = req.body.select || { id: 1, code: 1, nameEn: 1, nameAr: 1, image: 1 };
                let limit = req.body.limit || 50;
                if (where.search) {
                    search = where.search;
                    delete where.search;
                }
                if (search) {
                    where.$or = [];

                    where.$or.push({
                        code: search,
                    });

                    where.$or.push({
                        nameAr: site.get_RegExp(search, 'i'),
                    });

                    where.$or.push({
                        nameEn: site.get_RegExp(search, 'i'),
                    });
                }

                if (app.allowMemory) {
                    let list = [];

                    app.memoryList
                        .filter((g) => (!where['groupTypeId'] || where['groupTypeId'] == g.serviceGroup.type.id) && g.company && g.company.id == site.getCompany(req).id)
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
                } else {
                    where['company.id'] = site.getCompany(req).id;

                    if (where['groupTypeId']) {
                        where['serviceGroup.type.id'] = where['groupTypeId'];
                        delete where['groupTypeId'];
                    }

                    app.all({ where, select, limit }, (err, docs) => {
                        res.json({
                            done: true,
                            list: docs,
                        });
                    });
                }
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
                        docs.forEach((doc) => {
                            let newDoc = {
                                code: doc.code,
                                nameAr: doc.nameAr.trim(),
                                nameEn: doc.nameEn.trim(),
                                image: { url: '/images/services.png' },
                                active: true,
                                cashPriceOut: doc.CashPrice || 0,
                                creditPriceOut: doc.CreditPrice || 0,
                                cashPriceIn: doc.CashInPrice || 0,
                                creditPriceIn: doc.CreditInPrice || 0,
                                packagePrice: doc.PackagePrice || 0,
                                pharmacyPrice: doc.PharmacyPrice || 0,
                                vat: doc.VAT || 0,
                                cost: doc.Cost || 0,
                                servicesCategoriesList: [],
                            };
                            newDoc.serviceGroup = site.getApp('servicesGroups').memoryList.find((s) => s.code == doc.gCode);
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

            site.post(`api/${app.name}/importStandardService`, (req, res) => {
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
                        docs.forEach((doc) => {
                            let appServiceGroup = site.getApp('servicesGroups');
                            appServiceGroup.all({}, (err, serviceGroupDocs) => {
                                let serviceGroup;
                                if (doc['CATEGORY']) {
                                    serviceGroup = serviceGroupDocs.find((sg) => sg && sg.nameEn.toLowerCase().trim() == doc['CATEGORY'].toLowerCase().trim());

                                    let newDoc = {
                                        code: doc['CODE NO'].trim(),
                                        nameAr: doc['الوصف'].trim() || doc['الوصف '].trim(),
                                        nameEn: doc['DESCRIPTION'].trim(),
                                        image: { url: '/images/services.png' },
                                        serviceGroup,
                                        active: true,
                                        cashPriceOut: doc['Credit Standard'] || 0,
                                        creditPriceOut: doc['Credit Standard'] || 0,
                                        cashPriceIn: doc['Credit Standard'] || 0,
                                        creditPriceIn: doc['Credit Standard'] || 0,
                                        packagePrice: doc.PackagePrice || 0,
                                        pharmacyPrice: doc.PharmacyPrice || 0,
                                        // vat: doc.VAT || 0,
                                        cost: doc['Credit Standard'] || 0,
                                        servicesCategoriesList: [],
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
                                }
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

            site.post(`api/${app.name}/import-labs`, (req, res) => {
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
                        let list = [];
                        docs.forEach((doc) => {
                            let gender = null;
                            if (doc.gender === 'F') {
                                gender = {
                                    id: 1,
                                    nameEn: 'Male',
                                    nameAr: 'ذكر',
                                };
                            } else if (doc.gender === 'M') {
                                gender = {
                                    id: 2,
                                    nameEn: 'Female',
                                    nameAr: 'أنثى',
                                };
                            }

                            let index = list.findIndex((d) => d.code == doc.code);
                            if (index !== -1) {
                                list[index].normalRangeList.push({
                                    fromDays: doc.fromDays,
                                    toDays: doc.toDays,
                                    name: doc.itemName,
                                    gender: gender,
                                    unit: doc.unit,
                                    fromValue: doc.fromValue,
                                    toValue: doc.toValue,
                                });
                            } else {
                                let newDoc = {
                                    code: doc.code,
                                    nameEn: doc.nameEn.trim(),
                                    nameAr: doc.nameAr || doc.nameEn.trim(),
                                    image: { url: '/images/services.png' },
                                    active: true,
                                    normalRangeList: [
                                        {
                                            fromDays: doc.fromDays,
                                            toDays: doc.toDays,
                                            name: doc.itemName,
                                            gender: gender,
                                            unit: doc.unit,
                                            fromValue: doc.fromValue,
                                            toValue: doc.toValue,
                                        },
                                    ],
                                    cashPriceOut: doc.CashPrice || 0,
                                    creditPriceOut: doc.CreditPrice || 0,
                                    cashPriceIn: doc.CashInPrice || 0,
                                    creditPriceIn: doc.CreditInPrice || 0,
                                    packagePrice: doc.PackagePrice || 0,
                                    pharmacyPrice: doc.PharmacyPrice || 0,
                                    vat: doc.VAT || 0,
                                    cost: doc.Cost || 0,
                                    servicesCategoriesList: [],
                                };
                                newDoc.serviceGroup = site.getApp('servicesGroups').memoryList.find((s) => s.type.code == 'L');
                                newDoc.company = site.getCompany(req);
                                newDoc.branch = site.getBranch(req);
                                newDoc.addUserInfo = req.getUserFinger();
                                list.push(newDoc);
                            }
                        });
                        list.forEach((newDoc) => {
                            app.add(newDoc, (err, doc2) => {
                                if (!err && doc2) {
                                    site.dbMessage = `Importing ${app.name}-labs : ${doc2.id}`;
                                    console.log(site.dbMessage);
                                } else {
                                    site.dbMessage = err.message;
                                    console.log(site.dbMessage);
                                }
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

            site.post(`api/${app.name}/import-categories`, (req, res) => {
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
                        console.log(`Importing ${app.name} -categories : ${docs.length}`);
                        app.$collection.findMany({ limit: 100000 }, (err, list) => {
                            if (!err && list) {
                                list.forEach((s) => {
                                    let cs = docs.filter((d) => d.ServiceCode == s.code);
                                    cs.forEach((c) => {
                                        let c0 = site.getApp('servicesCategories').memoryList.find((c2) => c2.code == c.categoryCode);
                                        if (c0) {
                                            s.servicesCategoriesList.push(c0);
                                        }
                                    });
                                    app.update(s, () => {
                                        console.log('update service : ' + s.id);
                                    });
                                });
                            }
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

    site.getServices = function (where, callBack) {
        let select = {
            id: 1,
            code: 1,
            nameEn: 1,
            nameAr: 1,
            servicesCategoriesList: 1,
            normalRangeList: 1,
            vat: 1,
            serviceSpecialty : 1,
            cost: 1,
            serviceGroup: 1,
            cashPriceOut: 1,
            creditPriceOut: 1,
            cashPriceIn: 1,
            creditPriceIn: 1,
            sfdaCodeList: 1,
        };
        app.all({ where, select }, (err, docs) => {
            if (!err) {
                callBack(docs);
            }
        });
    };

    app.init();
    site.addApp(app);
};
