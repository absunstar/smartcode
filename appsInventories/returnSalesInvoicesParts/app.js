module.exports = function init(site) {
  let app = {
    name: "returnSalesInvoicesParts",
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
    allowRouteReport: true,
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
          res.render(app.name + "/index.html", { title: app.name, appName: req.word("Return Sales Invoices Parts"), setting: site.getCompanySetting(req) }, { parser: "html", compres: true });
        }
      );
    }

    if (app.allowRouteAdd) {
      site.post({ name: `/api/${app.name}/add`, require: { permissions: ["login"] } }, (req, res) => {
        let response = {
          done: false,
        };

        let _data = req.data;
        _data.company = site.getCompany(req);
        let setting = site.getCompanySetting(req);
        if (_data.invoiceType.id == 1 && setting.accountsSetting.linkAccountsToStores && setting.storesSetting.autoApprovePurchases) {
          if (!_data.safe || !_data.safe.id) {
            response.error = "Must Select Safe";
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
          response.error = "Must Enter Code";
          res.json(response);
          return;
        } else if (cb.auto) {
          _data.code = cb.code;
        }

        let errorCount = false;
        let errorCountItemName = "";
        for (let i = 0; i < _data.itemsList.length; i++) {
          let element = _data.itemsList[i];

          if (element.count > element.mainCount) {
            let name = "nameAr";
            if (req.session.lang == "En") {
              name = "nameEn";
            }
            errorCount = true;
            errorCountItemName = element[name];
            break;
          }
        }
        if (errorCount) {
          response.error = `This Item Is Not Available In Return Sales Invoice ${errorCountItemName}`;
          res.json(response);
          return;
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
    }

    if (app.allowRouteUpdate) {
      site.post({ name: `/api/${app.name}/update`, require: { permissions: ["login"] } }, (req, res) => {
        let response = {
          done: false,
        };

        let _data = req.data;
        _data.editUserInfo = req.getUserFinger();
        let errorCount = false;
        let errorCountItemName = "";
        for (let i = 0; i < _data.itemsList.length; i++) {
          let element = _data.itemsList[i];

          if (element.count > element.mainCount) {
            let name = "nameAr";
            if (req.session.lang == "En") {
              name = "nameEn";
            }
            errorCount = true;
            errorCountItemName = element[name];
            break;
          }
        }
        if (errorCount) {
          response.error = `This Item Is Not Available In Return Sales Invoice ${errorCountItemName}`;
          res.json(response);
          return;
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

    if (app.allowRouteApprove) {
      site.post({ name: `/api/${app.name}/approve`, require: { permissions: ["login"] } }, (req, res) => {
        let response = {
          done: false,
        };
        const accountsSetting = site.getCompanySetting(req).accountsSetting;

        let _data = req.data;
        if (!_data.id) {
          response.error = "No Id";
          res.json(response);
          return;
        }
        _data.approved = true;
        _data.approvedDate = new Date();
        let overDraftObj = {
          store: _data.store,
          items: _data.itemsList,
        };
        _data.addApprovedInfo = req.getUserFinger();

        if (_data.invoiceType.id == 1 && accountsSetting.linkAccountsToStores) {
          if (!_data.paymentType || !_data.paymentType.id) {
            response.error = "Must Select Payment Type";
            res.json(response);
            return;
          } else if (!_data.safe || !_data.safe.id) {
            response.error = "Must Select Safe";
            res.json(response);
            return;
          }
          _data.remainPaid = _data.totalNet - _data.amountPaid;
        } else {
          _data.remainPaid = _data.totalNet;
        }
        const salesInvoicesApp = site.getApp("salesInvoices");

        salesInvoicesApp.$collection.findOne({ where: { id: _data.invoiceId, code: _data.invoiceCode } }, (err, salesInvoiceDoc) => {
          if (!err && salesInvoiceDoc) {
            let errorCount = false;
            let errorCountItemName = "";
            salesInvoiceDoc.returnSalesInvoice = salesInvoiceDoc.returnSalesInvoice || {
              itemsList: [...salesInvoiceDoc.itemsList],
              totalDiscounts: salesInvoiceDoc.totalDiscounts,
              totalItemsDiscounts: salesInvoiceDoc.totalItemsDiscounts,
              totalExtraDiscounts: salesInvoiceDoc.totalExtraDiscounts,
              totalTaxes: salesInvoiceDoc.totalTaxes,
              discountType: salesInvoiceDoc.discountType,
              totalBeforeVat: salesInvoiceDoc.totalBeforeVat,
              totalVat: salesInvoiceDoc.totalVat,
              totalAfterVat: salesInvoiceDoc.totalAfterVat,
              totalNet: salesInvoiceDoc.totalNet,
              amountPaid: salesInvoiceDoc.totalNet,
              totalPrice: salesInvoiceDoc.totalPrice,
            };
            for (let i = 0; i < salesInvoiceDoc.returnSalesInvoice.itemsList.length; i++) {
              let element = salesInvoiceDoc.returnSalesInvoice.itemsList[i];

              let index = _data.itemsList.findIndex((a) => a.id === element.id);
              if (index !== -1) {
                if (_data.itemsList[index].count > element.count) {
                  let name = "nameAr";
                  if (req.session.lang == "En") {
                    name = "nameEn";
                  }
                  errorCount = true;
                  errorCountItemName = _data.itemsList[index][name];
                  break;
                } else {
                  element.count -= site.toNumber(_data.itemsList[index].count);
                }
              }
            }
            let every = salesInvoiceDoc.returnSalesInvoice.itemsList.every((a) => a.count == 0);
            if (every) {
              salesInvoiceDoc.isReturnParts = true;
            }
            if (errorCount) {
              response.error = `This Item Is Not Available In Return Sales Invoice ${errorCountItemName}`;
              res.json(response);
              return;
            }
            _data.hasReturnPartsTransaction = true;
            _data.itemsList = _data.itemsList.filter((item) => item.count > 0);
            app.update(_data, (err, result) => {
              if (!err) {
                response.done = true;
                salesInvoicesApp.$collection.update(salesInvoiceDoc, (err1, resul1) => {});

                let objJournal = {
                  code: result.doc.code,
                  appName: app.name,
                  store: result.doc.store,
                  customer: result.doc.customer,
                  patient: result.doc.patient,
                  totalNet: result.doc.totalNet,
                  totalDiscounts: result.doc.totalDiscounts,
                  totalVat: result.doc.totalVat,
                  totalAverageCost: 0,
                  userInfo: result.doc.addApprovedInfo,
                };

                if (result.doc.salesType.code == "patient" || result.doc.salesType.code == "er") {
                  objJournal.user = result.doc.patient;
                } else {
                  objJournal.user = result.doc.customer;
                }

                result.doc.itemsList.forEach((_item) => {
                  objJournal.totalAverageCost += _item.averageCost || 0;
                  let item = { ..._item };
                  item.store = { ...result.doc.store };
                  site.editItemsBalance(item, app.name);
                  item.invoiceId = result.doc.id;
                  item.company = result.doc.company;
                  item.date = result.doc.date;
                  item.customer = result.doc.customer;
                  item.patient = result.doc.patient;
                  item.countType = "in";
                  item.orderCode = result.doc.code;
                  site.setItemCard(item, app.name);
                });
                if (result.doc.invoiceType.id == 1 && accountsSetting.linkAccountsToStores) {
                  let objVoucher = {
                    date: new Date(),
                    voucherType: site.vouchersTypes[5],
                    invoiceId: result.doc.id,
                    storeInvoiceId: result.doc.invoiceId,
                    doctorDeskTop: result.doc.doctorDeskTop,
                    itemsList: result.doc.itemsList,
                    customer: result.doc.customer,
                    patient: result.doc.patient,
                    invoiceCode: result.doc.code,
                    total: result.doc.amountPaid,
                    safe: result.doc.safe,
                    paymentType: result.doc.paymentType,
                    addUserInfo: result.doc.addApprovedInfo,
                    company: result.doc.company,
                    branch: result.doc.branch,
                  };

                  site.addExpenseVouchers(objVoucher);
                }
                if (result.doc.store.linkWithRasd && result.doc.store.rasdUser && result.doc.store.rasdPass) {
                  site.sendRasdData({
                    rasdUser: result.doc.store.rasdUser,
                    rasdPass: result.doc.store.rasdPass,
                    appName: app.name,
                    items: result.doc.itemsList,
                  });
                }
                if (result.doc.salesType.code == "patient") {
                  site.hasSalesDoctorDeskTop({ id: result.doc.doctorDeskTop.id, items: result.doc.itemsList });
                }
                if (result.doc.salesType.code == "er") {
                  site.hasErDoctorDeskTop({ id: result.doc.doctorDeskTop.id, items: result.doc.itemsList });
                }
                objJournal.nameAr = "مرتجع مبيعات" + " (" + result.doc.code + " )";
                objJournal.nameEn = "Return sales Invoice" + " (" + result.doc.code + " )";
                objJournal.session = req.session;
                site.autoJournalEntry(objJournal);
                response.result = result;
              } else {
                response.error = err.message;
              }

              res.json(response);
            });
          } else {
            response.error = err.message || "Not Exist Invoice";
            res.json(response);
            return;
          }
        });
      });
    }

    if (app.allowRouteDelete) {
      site.post({ name: `/api/${app.name}/delete`, require: { permissions: ["login"] } }, (req, res) => {
        let response = {
          done: false,
        };
        let _data = req.data;

        app.delete(_data, (err, result) => {
          if (!err && result.count === 1) {
            response.done = true;
            response.result = result;
          } else {
            response.error = err?.message || "Deleted Not Exists";
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
            response.error = err?.message || "Not Exists";
          }
          res.json(response);
        });
      });
    }

    if (app.allowRouteAll) {
      site.post({ name: `/api/${app.name}/all`, public: true }, (req, res) => {
        let where = req.body.where || {};
        let search = req.body.search || "";
        let limit = req.body.limit || 50;
        let select = req.body.select || { id: 1, code: 1, invoiceCode: 1, invoiceId: 1, date: 1, customer: 1, paymentType: 1, store: 1, active: 1, approved: 1, remainPaid: 1, invoiceType: 1 };

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
            (g) => g.company && g.company.id == site.getCompany(req).id && (typeof where.active != "boolean" || g.active === where.active) && JSON.stringify(g).contains(where.search)
          );

          res.json({
            done: true,
            list: list.slice(-limit),
          });
        } else {
          where["company.id"] = site.getCompany(req).id;

          app.all({ where: where, limit, select, sort: { id: -1 } }, (err, docs) => {
            res.json({ done: true, list: docs });
          });
        }
      });
    }

    if (app.allowRouteReport) {
      site.post({ name: `/api/${app.name}/report`, public: true }, (req, res) => {
        let where = req.body.where || {};
        let search = req.body.search || "";
        let limit = req.body.limit || 50;
        let select = req.body.select || { id: 1, code: 1, invoiceCode: 1, invoiceId: 1, date: 1, customer: 1, paymentType: 1, store: 1, active: 1, approved: 1, remainPaid: 1, invoiceType: 1 };

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

        where["company.id"] = site.getCompany(req).id;

        app.all({ where: where, limit, select, sort: { id: -1 } }, (err, docs) => {
          res.json({ done: true, list: docs });
        });
      });
    }
  }

  site.post({ name: `/api/${app.name}/resetForCompany`, require: { permissions: ["login"] } }, (req, res) => {
    let response = {
      done: false,
    };

    app.$collection.removeMany(
      {
        where: {
          "company.id": req.data.id,
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
    where["approved"] = true;
    where["company.id"] = site.getCompany(req).id;
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

  site.changeRemainPaidReturnSales = function (obj) {
    app.view({ id: obj.id }, (err, doc) => {
      if (!err && doc) {
        doc.remainPaid -= obj.total;
        app.update(doc, (err, result) => {});
      }
    });
  };

  site.getSalesInvoicesReturnPartsFilter = function (where, callback) {
    app.all({ where, sort: { id: -1 } }, (err, docs) => {
      if (!err && docs) {
        callback(docs);
      } else {
        callback(null);
      }
    });
  };

  app.init();
  site.addApp(app);
};
