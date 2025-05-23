module.exports = function init(site) {
  let app = {
    name: 'returnPurchaseOrders',
    allowMemory: false,
    memoryList: [],
    allowCache: false,
    cacheList: [],
    allowRoute: true,
    allowRouteGet: true,
    allowRouteAdd: true,
    allowRouteUpdate: true,
    allowRouteApprove: true,
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
          res.render(app.name + '/index.html', { title: app.name, appName: req.word("Return Purchase Orders"), setting: site.getCompanySetting(req) }, { parser: 'html', compres: true });
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
        let setting = site.getCompanySetting(req);
        if(_data.invoiceType.id == 1 && setting.accountsSetting.linkAccountsToStores && setting.storesSetting.autoApprovePurchases){
          if (!_data.safe || !_data.safe.id) {
            response.error = 'Must Select Safe';
            res.json(response);
            return;
          }
        }
        app.$collection.find({ invoiceId: _data.invoiceId }, (err, doc) => {
          if (doc) {
            response.done = false;
            response.error = 'This Invoice Is Exisit';
            return res.json(response);
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
            if (!err) {
              response.done = true;
              response.doc = doc;
            } else {
              response.error = err.message;
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
        const accountsSetting = site.getCompanySetting(req).accountsSetting;

        let overDraftObj = {
          store: _data.store,
          items: _data.itemsList,
        };

        site.checkOverDraft(req, overDraftObj, (overDraftCb) => {
          if (!overDraftCb.done) {
            let error = '';
            error = overDraftCb.refuseList.map((m) => (req.session.lang == 'Ar' ? m.nameAr : m.nameEn)).join('-');
            response.error = `Item Balance Insufficient ( ${error} )`;
            res.json(response);
            return;
          }
          _data.addApprovedInfo = req.getUserFinger();
          if (_data.invoiceType.id == 1 && accountsSetting.linkAccountsToStores) {
            if (!_data.paymentType || !_data.paymentType.id) {
              response.error = 'Must Select Payment Type';
              res.json(response);
              return;
            } else if (!_data.safe || !_data.safe.id) {
              response.error = 'Must Select Safe';
              res.json(response);
              return;
            }
            if (_data.paymentType.id && _data.safe.id) {
              let obj = {
                date: new Date(),
                voucherType: site.vouchersTypes[3],
                vendor: _data.vendor,
                itemsList: _data.itemsList,
                invoiceId: _data.id,
                invoiceCode: _data.code,
                storeInvoiceId: _data.invoiceId,
                total: _data.amountPaid,
                safe: _data.safe,
                paymentType: _data.paymentType,
                addUserInfo: _data.addApprovedInfo,
                company: _data.company,
                branch: _data.branch,
              };
              _data.remainPaid = _data.totalNet - _data.amountPaid;
              obj.session = req.session;
              site.addReceiptVouchers(obj);
            } else {
              _data.remainPaid = _data.totalNet;
            }
          }
          app.update(_data, (err, result) => {
            if (!err) {
              response.done = true;

              const purchaseOrdersApp = site.getApp('purchaseOrders');
              purchaseOrdersApp.$collection.update({ where: { id: _data.invoiceId, code: _data.invoiceCode }, set: { hasReturnTransaction: true } });

              result.doc.itemsList.forEach((_item) => {
                let item = { ..._item };
                item.store = { ...result.doc.store };
                site.editItemsBalance(item, app.name);
                item.invoiceId = result.doc.id;
                item.company = result.doc.company;
                item.date = result.doc.date;
                item.vendor = result.doc.vendor;
                item.countType = 'out';
                item.orderCode = result.doc.code;
                site.setItemCard(item, app.name);
              });

              if (result.doc.store.linkWithRasd && result.doc.store.rasdUser && result.doc.store.rasdPass) {
                site.sendRasdData({
                  rasdUser: result.doc.store.rasdUser,
                  rasdPass: result.doc.store.rasdPass,
                  appName: app.name,
                  items: result.doc.itemsList,
                });
              }
              let objJournal = {
                code: result.doc.code,
                appName: app.name,
                store: result.doc.store,
                vendor: result.doc.vendor,
                user: result.doc.vendor,
                totalNet: result.doc.totalNet,
                totalDiscounts: result.doc.totalDiscounts,
                totalVat: result.doc.totalVat,
                userInfo: result.doc.addApprovedInfo,
              };
              objJournal.nameAr = 'مرتجع شراء' + ' (' + result.doc.code + ' )';
              objJournal.nameEn = 'Return Purchase' + ' (' + result.doc.code + ' )';
              objJournal.session = req.session;
              site.autoJournalEntry(objJournal);
              response.result = result;
            } else {
              response.error = err.message;
            }

            res.json(response);
          });
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
        let select = req.body.select || {
          id: 1,
          code: 1,
          invoiceCode: 1,
          invoiceId: 1,
          date: 1,
          vendor: 1,
          itemsList: 1,
          paymentType: 1,
          store: 1,
          active: 1,
          image: 1,
          approved: 1,
          remainPaid: 1,
          invoiceType: 1,
        };

        if (where && where.fromDate && where.toDate) {
          let d1 = site.toDate(where.fromDate);
          let d2 = site.toDate(where.toDate);
          d2.setDate(d2.getDate() + 1);
          where.date = {
            $gte: d1,
            $lte: d2,
          };
          delete where.fromDate;
          delete where.toDate;
        }

        if (app.allowMemory) {
          let list = app.memoryList.filter(
            (g) => g.company && g.company.id == site.getCompany(req).id && (typeof where.active != 'boolean' || g.active === where.active) && JSON.stringify(g).contains(where.search)
          );

          res.json({
            done: true,
            list: list.slice(-limit),
          });
        } else {
          where['company.id'] = site.getCompany(req).id;

          app.all({ where: where, limit, select, sort: { id: -1 } }, (err, docs) => {
            res.json({ done: true, list: docs });
          });
        }
      });
    }
  }

  site.post({ name: `/api/${app.name}/resetForCompany`, require: { permissions: ['login'] } }, (req, res) => {
    let response = {
      done: false,
    };

    app.$collection.removeMany(
      {
        where: {
          'company.id': req.data.id,
        },
      },
      (err, result) => {
        response.err = err;
        response.done = true;
        res.json(response);
      }
    );
  });

  site.post({ name: `/api/${app.name}/details`, public: true }, (req, res) => {
    let where = {};
    let date = new Date();
    let d1 = site.toDate(date);
    let d2 = site.toDate(date);
    d2.setMonth(d2.getMonth() + 1);
    d2.setDate(1);
    d1.setDate(1);
    where.date = {
      $gte: d1,
      $lt: d2,
    };
    where['approved'] = true;
    where['company.id'] = site.getCompany(req).id;
    let select = { id: 1, code: 1, date: 1 };

    app.all({ where, select }, (err, docs) => {
      let obj = {
        today: 0,
        yesterday: 0,
        week: 0,
        month: 0,
      };
      if (!err && docs) {
        let weekDate = site.weekDate();
        obj.month = docs.length;
        for (let i = 0; i < docs.length; i++) {
          docs[i].date = new Date(docs[i].date);

          if (docs[i].date.getDate() == new Date().getDate()) {
            obj.today += 1;
          }
          if (docs[i].date.getDate() == new Date().getDate() - 1) {
            obj.yesterday += 1;
          }
          if (weekDate.firstday.getDate() <= docs[i].date.getDate() && weekDate.lastday.getDate() >= docs[i].date.getDate()) {
            obj.week += 1;
          }
        }
      }
      res.json({
        done: true,
        doc: obj,
      });
    });
  });

  site.changeRemainPaidReturnPurchases = function (obj) {
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
