module.exports = function init(site) {
  let app = {
    name: 'expenseVouchers',

    allowMemory: false,
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

      let where = {};
      if (_item.invoiceId) {
        where = { invoiceId: _item.invoiceId };
      } else {
        where = { id: _item.id };
      }

      app.$collection.find(where, (err, doc) => {
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
          res.render(app.name + '/index.html', { title: app.name, appName: 'Expense Vouchers', setting: site.getSystemSetting(req) }, { parser: 'html', compres: true });
        }
      );
    }

    if (app.allowRouteAdd) {
      site.post({ name: `/api/${app.name}/add`, require: { permissions: ['login'] } }, (req, res) => {
        let response = {
          done: false,
        };

        let _data = req.data;
        if (!_data.date) {
          _data.date = new Date();
        }
        if (_data.voucherType.id == 'purchaseInvoice' || _data.voucherType.id == 'salesReturn') {
          if (site.toMoney(_data.total) > site.toMoney(_data.$remainPaid)) {
            response.error = 'The amount paid is greater than the remaining invoice amount ';
            res.json(response);
            return;
          }
        }

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
            let obj = {
              id: doc.invoiceId,
              total: doc.total,
            };
            if (doc.voucherType.id == 'purchaseInvoice') {
              site.changeRemainPaidPurchaseOrder(obj);
            } else if (doc.voucherType.id == 'salesReturn') {
              site.changeRemainPaidReturnSales(obj);
            }
            site.changeSafeBalance({ company: doc.company, safe: doc.safe, total: doc.total, invoiceCode:doc.invoiceCode, invoiceId:doc.invoiceId, voucherType: doc.voucherType, type: 'min' });
            
            let objJournal = {
              code: doc.code,
              appName: app.name,
              totalNet: doc.total,
              safe: doc.safe,
              userInfo: doc.addUserInfo,
            };
            objJournal.nameAr = 'سند صرف' + ' ' + doc.voucherType.nameAr + ' (' + doc.code + ' )';
            objJournal.nameEn = 'Expense Vouchers' + ' ' + doc.voucherType.nameEn + ' (' + doc.code + ' )';
            objJournal.session = req.session;
            objJournal.voucherType = doc.voucherType;
            site.autoJournalEntryVoucher(objJournal);
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
        let limit = req.body.limit || 50;
        let select = req.body.select || { id: 1, code: 1, date: 1, voucherType: 1, safe: 1, currency: 1, total: 1 };
        if (app.allowMemory) {
          if (!search) {
            search = 'id';
          }
          let list = app.memoryList.filter((g) => g.company && g.company.id == site.getCompany(req).id && JSON.stringify(g).contains(search)).slice(0, limit);

          res.json({
            done: true,
            list: list,
          });
        } else {
          where['company.id'] = site.getCompany(req).id;

          app.all({ where, select, limit, sort: { id: -1 } }, (err, docs) => {
            res.json({
              done: true,
              list: docs,
            });
          });
        }
      });
    }
  }

  site.addExpenseVouchers = function (obj) {
    let numObj = {
      company: obj.company,
      screen: app.name,
      date: new Date(),
    };

    let cb = site.getNumbering(numObj);
    obj.code = cb.code;
    if (obj.code) {
      app.add(obj, (err, doc) => {
        let objJournal = {
          code: doc.code,
          appName: app.name,
          totalNet: doc.total,
          safe: doc.safe,
          userInfo: doc.addUserInfo,
        };
        objJournal.nameAr = 'سند صرف' + ' ' + doc.voucherType.nameAr + ' (' + doc.code + ' )';
        objJournal.nameEn = 'Expense Vouchers'  + ' ' + doc.voucherType.nameEn + ' (' + doc.code + ' )';
        objJournal.voucherType = doc.voucherType;
        objJournal.session = {company : obj.company};
        site.autoJournalEntryVoucher(objJournal);

        site.changeSafeBalance({company: doc.company, safe: doc.safe, voucherType: doc.voucherType, invoiceCode:doc.invoiceCode, invoiceId:doc.invoiceId, total: doc.total, type: 'min' });
      });
    }
  };

  app.init();
  site.addApp(app);
};
