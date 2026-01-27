module.exports = function init(site) {
  let app = {
    name: 'safes',
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

  app.$collection = site.connectCollection(app.name);

  site.changeSafeBalance = function (obj) {
    app.view({ id: obj.safe.id }, (err, doc) => {
      if (!err && doc) {
        if (obj.type == 'sum') {
          if (obj.voucherType.id == 'transferSafes') {
            doc.receiptBalanceTransfer += obj.total;
          } else {
            doc.receiptBalance += obj.total;
          }
          doc.totalReceiptBalance = doc.receiptBalance + doc.receiptBalanceTransfer;
          site.setSafesTransactions(obj);
        } else if (obj.type == 'min') {
          if (obj.voucherType.id == 'transferSafes') {
            doc.expenseBalanceTransfer += obj.total;
          } else {
            doc.expenseBalance += obj.total;
          }
          doc.totalExpenseBalance = doc.expenseBalance + doc.expenseBalanceTransfer;
          site.setSafesTransactions(obj);
        }

        doc.totalBalance = doc.totalReceiptBalance - doc.totalExpenseBalance;
        app.update(doc, (err, result) => {});
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
          res.render(app.name + '/index.html', { title: app.name, appName: req.word("Safes"), setting: site.getCompanySetting(req) }, { parser: 'html', compres: true });
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
        if (_data.paymentType.id == 1) {
          _data.type = site.safesTypes[0];
        } else {
          _data.type = site.safesTypes[1];
        }
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
        if (_data.paymentType.id == 1) {
          _data.type = site.safesTypes[0];
        } else {
          _data.type = site.safesTypes[1];
        }
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
        let limit = req.body.limit || 50;
        where['company.id'] = site.getCompany(req).id;

        let select = req.body.select || { id: 1, code: 1, type: 1, nameEn: 1, nameAr: 1, image: 1, active: 1, totalBalance: 1 };

        if (app.allowMemory) {
          if (!search) {
            search = 'id';
          }
          let list = app.memoryList
            .filter(
              (g) =>
                g.company &&
                g.company.id == site.getCompany(req).id &&
                (!where.active || g.active === where.active) &&
                (!where['type.id'] || (g.type && g.type.id === where['type.id'])) &&
                (!where['paymentType.id'] || (g.paymentType && g.paymentType.id === where['paymentType.id'])) &&
                JSON.stringify(g).contains(search)
            )
            .slice(0, limit).map((item) => {
              if (select && Object.keys(select).length > 0) {
                let filtered = {};
                for (let key in select) {
                  if (select[key] && item[key] !== undefined) {
                    filtered[key] = item[key];
                  }
                }
                return filtered;
              }
              return item;
            });

          res.json({
            done: true,
            list: list,
          });
        } else {
          where['company.id'] = site.getCompany(req).id;
          app.all({ where: where, select: select, limit }, (err, docs) => {
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

              let newDoc = {
                code: doc.code,
                nameAr: doc.nameAr ? doc.nameAr.trim() : '',
                nameEn: doc.nameEn ? doc.nameEn.trim() : '',
                image: { url: '/images/safes.png' },
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

  site.post({ name: `/api/${app.name}/resetForCompany`, require: { permissions: ['login'] } }, (req, res) => {
    let response = {
      done: false,
    };

    app.$collection.findMany(
      {
        where: {
          'company.id': req.data.id,
        },
      },
      (err, docs) => {
        for (let i = 0; i < docs.length; i++) {
          docs[i].receiptBalance = 0;
          docs[i].expenseBalance = 0;
          docs[i].receiptBalanceTransfer = 0;
          docs[i].expenseBalanceTransfer = 0;
          docs[i].totalReceiptBalance = 0;
          docs[i].totalExpenseBalance = 0;
          docs[i].totalBalance = 0;
          app.$collection.update(docs[i]);
        }
        response.err = err;
        response.done = true;
        res.json(response);
      }
    );
  });

  app.init();
  site.addApp(app);
};
