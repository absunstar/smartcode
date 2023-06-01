module.exports = function init(site) {
  let app = {
    name: 'offersOrders',
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
          res.render(app.name + '/index.html', { title: app.name, appName: 'Offers Orders', setting: site.getSystemSetting(req) }, { parser: 'html', compres: true });
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

        if (_data.invoiceType.id == 1) {
          if (_data.amountPaid != _data.totalNet) {
            response.error = 'The full amount must be paid in case of cash';
            res.json(response);
            return;
          }
        }

        if (_data.amountPaid && (!_data.safe || !_data.safe.id)) {
          response.error = 'Payment safe must be selected';
          res.json(response);
          return;
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
        let objJournal = {
          code: _data.code,
          appName: app.name,
          totalNet: _data.totalNet,
          totalDiscounts: _data.medicalOffer.totalDiscount,
          totalVat: _data.medicalOffer.totalVat,
          totalAverageCost: 0,
          userInfo: _data.addUserInfo,
        };

        _data.remainPaid = _data.totalNet - (_data.amountPaid || 0);
        _data.addUserInfo = req.getUserFinger();
        _data.medicalOffer.servicesList.forEach((_s) => {
          objJournal.totalAverageCost += _s.cost || 0;
          _s.qtyAvailable = _s.qty;
        });
        objJournal.nameAr = 'طلب عرض' + ' ' + _data.code;
        objJournal.nameEn = 'Offer Order' +' ' + _data.code;
        objJournal.session = req.session;
        site.autoJournalEntry(objJournal);

        _data.availableAttend = true;
        app.add(_data, (err, doc) => {
          if (!err && doc) {
            response.done = true;
            response.doc = doc;
            if (doc.amountPaid) {
              let obj = {
                date: new Date(),
                patient: doc.patient,
                voucherType: site.vouchersTypes[4],
                invoiceId: doc.id,
                invoiceCode: doc.code,
                total: doc.amountPaid,
                safe: doc.safe,
                paymentType: doc.paymentType,
                addUserInfo: doc.addUserInfo,
                company: doc.company,
                branch: doc.branch,
              };
              obj.session = req.session;
              site.addReceiptVouchers(obj);
            }
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
        let date = new Date();
        let expiry = new Date(_data.expiryDate);
        date = date.setHours(0, 0, 0, 0);
        expiry = expiry.setHours(0, 0, 0, 0);
        if (_data.medicalOffer.servicesList.some((n) => n.qtyAvailable != n.qty) && date <= expiry) {
          _data.availableAttend = true;
        } else {
          _data.availableAttend = false;
        }
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
        let select = req.body.select || { id: 1, code: 1, date: 1, patient: 1, medicalOffer: 1, availableAttend: 1,remainPaid : 1,invoiceType : 1 };
        let limit = req.body.limit || 50;

        if (app.allowMemory) {
          let list = [];
          app.memoryList
            .filter((g) => g.company && g.company.id == site.getCompany(req).id)
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

          if (where && where.fromDate && where.toDate) {
            let d1 = site.toDate(where.fromDate);
            let d2 = site.toDate(where.toDate);
            d2.setDate(d2.getDate() + 1);
            where.requestDate = {
              $gte: d1,
              $lte: d2,
            };
            delete where.fromDate;
            delete where.toDate;
          }
          app.all({ where: where, limit, select, sort: { id: -1 } }, (err, docs) => {
            if (docs && docs.length > 0) {
              docs.forEach((_doc) => {
                if (_doc.medicalOffer) {
                  let date = new Date();
                  let expiry = new Date(_doc.medicalOffer.expiryDate);
                  date = date.setHours(0, 0, 0, 0);
                  expiry = expiry.setHours(0, 0, 0, 0);
                  if (_doc.medicalOffer.servicesList.every((n) => n.qtyAvailable > 0) && new Date(date) <= new Date(expiry)) {
                    _doc.availableAttend = true;
                  } else {
                    _doc.availableAttend = false;
                  }
                }
              });
            }
            res.json({
              done: true,
              list: docs,
            });
          });
        }
      });
    }
  }

  site.changeRemainPaidOffersOrders = function (obj) {
    app.view({ id: obj.id }, (err, doc) => {
      if (!err && doc) {
        doc.remainPaid -= obj.total;
        app.update(doc, (err, result) => {});
      }
    });
  };

  app.init();
  site.addApp(app);
};
