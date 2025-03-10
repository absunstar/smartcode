module.exports = function init(site) {
  let app = {
    name: 'receiptVouchers',
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
        where['invoiceId'] = _item.invoiceId;
      }
      if (_item.id) {
        where['id'] = _item.id;
      }
      if (_item['voucherType.id']) {
        where['voucherType.id'] = _item['voucherType.id'];
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
      site.get([{ name: app.name }, { name: 'generalSalesInvoices' }, { name: 'cashers' }], (req, res) => {
        let appName = 'Receipt Vouchers';
        if (req.url === '/generalSalesInvoices') {
          appName = 'General Sales Invoices';
        }
        res.render(app.name + '/index.html', { title: app.name, appName, setting: site.getCompanySetting(req) }, { parser: 'html', compres: true });
      });
    }

    if (app.allowRouteAdd) {
      site.post({ name: `/api/${app.name}/add`, require: { permissions: ['login'] } }, (req, res) => {
        let response = {
          done: false,
        };

        let _data = req.data;
        _data.company = site.getCompany(req);

        if (!_data.date) {
          _data.date = new Date();
        }
        _data.remainPaid = site.toNumber(_data.remainPaid);

        if (_data.voucherType.id == 'salesInvoice' || _data.voucherType.id == 'purchaseReturn' || _data.voucherType.id == 'offersOrders') {
          if (site.toNumber(_data.total) > site.toNumber(_data.remainPaid)) {
            response.error = 'The amount paid is greater than the remaining invoice amount ';
            res.json(response);
            return;
          }
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
            let obj = {
              id: doc.invoiceId,
              total: doc.total,
              installment: doc.installment,
            };
            if (doc.voucherType.id == 'salesInvoice') {
              site.changeRemainPaidSalesInvoices(obj);
            } else if (doc.voucherType.id == 'purchaseReturn') {
              site.changeRemainPaidReturnPurchases(obj);
            } else if (doc.voucherType.id == 'offersOrders') {
              site.changeRemainPaidOffersOrders(obj);
            }

            site.changeSafeBalance({ company: doc.company, safe: doc.safe, total: doc.total, invoiceCode: doc.invoiceCode, invoiceId: doc.invoiceId, voucherType: doc.voucherType, type: 'sum' });

            let objJournal = {
              code: doc.code,
              appName: app.name,
              safe: doc.safe,
              totalNet: doc.total,
              userInfo: doc.addUserInfo,
            };
            objJournal.nameAr = 'سند قبض' + ' ' + doc.voucherType.nameAr + ' (' + doc.code + ' )';
            objJournal.nameEn = 'Receipt Vouchers' + ' ' + doc.voucherType.nameEn + ' (' + doc.code + ' )';
            objJournal.session = req.session;
            objJournal.voucherType = doc.voucherType;
            if (doc.customer && doc.customer.id) {
              objJournal.user = doc.customer;
            } else if (doc.patient && doc.patient.id) {
              objJournal.user = doc.patient;
            } else if (doc.vendor && doc.vendor.id) {
              objJournal.user = doc.vendor;
            }
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

  site.post({ name: `/api/${app.name}/vat`, public: true }, (req, res) => {
    let where = req.body.where || {};
    let search = req.body.search || '';
    let limit = req.body.limit || 100000;
    let select = req.body.select || { id: 1, invoiceCode: 1, code: 1, date: 1, customer: 1, paymentType: 1, voucherType: 1, itemsList: 1, safe: 1, total: 1 };

    where['company.id'] = site.getCompany(req).id;
    where.$or = [{ 'voucherType.id': 'generalSalesInvoice' }, { 'voucherType.id': 'salesInvoice' }];
    where['hasReturnStore'] = { $ne: true };

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

    app.all({ where, select, limit, sort: { id: -1 } }, (err, docs) => {
      if (!err && docs) {
        let totals = { totalNet: 0, totalVat: 0, total: 0 };
        for (let i = 0; i < docs.length; i++) {
          docs[i].$type = 'receipt';
          docs[i].$totalNetByVat = 0;
          docs[i].$totalVatByVat = 0;
          docs[i].$totalByVat = 0;
          if (docs[i].itemsList && docs[i].itemsList.length > 0) {
            docs[i].itemsList.forEach((_item) => {
              if (!_item.noVat) {
                totals.totalNet += _item.totalAfterDiscounts;
                totals.totalVat += _item.totalVat;
                totals.total += _item.total;
                docs[i].$totalNetByVat += _item.totalAfterDiscounts;
                docs[i].$totalVatByVat += _item.totalVat;
                docs[i].$totalByVat += _item.total;
              }
            });
          }
        }
        res.json({
          done: true,
          list: docs,
          totals,
        });
      } else {
        response.error = err ? err.mesage : 'Data Not Found';
        res.json(response);
      }
    });
  });

  site.post({ name: `/api/${app.name}/dailyCashiers`, public: true }, (req, res) => {
    let where = req.body.where || {};
    let search = req.body.search || '';
    let limit = req.body.limit || 100000;
    let select = req.body.select || { id: 1, invoiceCode: 1, code: 1, date: 1, vendor: 1, customer: 1, paymentType: 1, voucherType: 1, safe: 1, total: 1 };

    where['company.id'] = site.getCompany(req).id;

    if (where['safe']) {
      where['safe.id'] = where['safe.id'];
      delete where['safe'];
    }

    if (where['employee']) {
      where['addUserInfo.id'] = where['employee.id'];
      delete where['employee'];
    }

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

    app.all({ where, select, limit, sort: { id: -1 } }, (err, docs) => {
      if (!err && docs) {
        let receiptVouchers = {
          returnPurchaseList: [],
          salesList: [],
          cashSales: 0,
          creditCardSales: 0,
          chequeSales: 0,
          spanCardSales: 0,
          bankDepositSales: 0,
          totalSales: 0,
          cashReturnPurchase: 0,
          creditCardReturnPurchase: 0,
          chequeReturnPurchase: 0,
          spanCardReturnPurchase: 0,
          bankDepositReturnPurchase: 0,
          totalReturnPurchase: 0,
        };
        for (let i = 0; i < docs.length; i++) {
          if (docs[i].voucherType.id == 'generalSalesInvoice' || docs[i].voucherType.id == 'salesInvoice') {
            receiptVouchers.salesList.push(docs[i]);
            if (docs[i].paymentType) {
              if (docs[i].paymentType.id == 1) {
                receiptVouchers.cashSales += docs[i].total;
              } else if (docs[i].paymentType.id == 2) {
                receiptVouchers.chequeSales += docs[i].total;
              } else if (docs[i].paymentType.id == 3) {
                receiptVouchers.creditCardSales += docs[i].total;
              } else if (docs[i].paymentType.id == 4) {
                receiptVouchers.spanCardSales += docs[i].total;
              } else if (docs[i].paymentType.id == 5) {
                receiptVouchers.bankDepositSales += docs[i].total;
              }
            }
            receiptVouchers.totalSales += docs[i].total;
          } else if (docs[i].voucherType.id == 'purchaseReturn') {
            receiptVouchers.returnPurchaseList.push(docs[i]);
            if (docs[i].paymentType) {
              if (docs[i].paymentType.id == 1) {
                receiptVouchers.cashReturnPurchase += docs[i].total;
              } else if (docs[i].paymentType.id == 2) {
                receiptVouchers.chequeReturnPurchase += docs[i].total;
              } else if (docs[i].paymentType.id == 3) {
                receiptVouchers.creditCardReturnPurchase += docs[i].total;
              } else if (docs[i].paymentType.id == 4) {
                receiptVouchers.spanCardReturnPurchase += docs[i].total;
              } else if (docs[i].paymentType.id == 5) {
                receiptVouchers.bankDepositReturnPurchase += docs[i].total;
              }
            }
            receiptVouchers.totalReturnPurchase += docs[i].total;
          }
        }
        res.json({
          done: true,
          receiptVouchers,
        });
      } else {
        response.error = err ? err.mesage : 'Data Not Found';
        res.json(response);
      }
    });
  });

  site.addReceiptVouchers = function (obj, callback) {
    let numObj = {
      company: obj.company,
      screen: app.name,
      date: new Date(),
    };

    let cb = site.getNumbering(numObj);
    obj.code = cb.code;
    if (obj.code) {
      obj.hasReturnStore = false;
      app.add(obj, (err, doc) => {
        if (!err) {
          const expenseVouchersApp = site.getApp('expenseVouchers');
          expenseVouchersApp.$collection.update({ where: { invoiceId: doc.storeInvoiceId }, set: { hasReturnStore: true } });
          let objJournal = {
            code: doc.code,
            appName: app.name,
            safe: doc.safe,
            totalNet: doc.total,
            userInfo: doc.addUserInfo,
          };
          objJournal.nameAr = 'سند قبض' + ' ' + doc.voucherType.nameAr + ' (' + doc.code + ' )';
          objJournal.nameEn = 'Receipt Vouchers' + ' ' + doc.voucherType.nameEn + ' (' + doc.code + ' )';
          objJournal.voucherType = doc.voucherType;
          objJournal.session = { company: obj.company };
          objJournal.user = doc.user;
          if (doc.patient && doc.patient.id) {
            objJournal.user = doc.patient;
          } else if (doc.customer && doc.customer.id) {
            objJournal.user = doc.customer;
          } else if (doc.vendor && doc.vendor.id) {
            objJournal.user = doc.vendor;
          }
          site.autoJournalEntryVoucher(objJournal);

          site.changeSafeBalance({ company: doc.company, safe: doc.safe, total: doc.total, invoiceCode: doc.invoiceCode, invoiceId: doc.invoiceId, voucherType: doc.voucherType, type: 'sum' });
          if (callback) {
            callback(doc);
          }
        } else {
          if (callback) {
            callback(err);
          }
        }
      });
    } else {
      if (callback) {
        callback(false);
      }
    }
  };

  site.post({ name: `/api/${app.name}/generalSalesDetails`, public: true }, (req, res) => {
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
    let select = { id: 1, code: 1, date: 1 };
    where['voucherType.id'] = 'generalSalesInvoice';
    where['company.id'] = site.getCompany(req).id;
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

  app.init();
  site.addApp(app);
};
