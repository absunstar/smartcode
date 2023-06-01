module.exports = function init(site) {
  let app = {
    name: 'journalEntry',
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
          res.render(app.name + '/index.html', { title: app.name, appName: 'Journal Entry' }, { parser: 'html', compres: true });
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

        if (_data.accountsList.length < 1) {
          response.error = 'Must Add Accounts';
          res.json(response);
          return;
        }

        if (_data.totalDebtor !== _data.totalCreditor) {
          response.error = 'The ends of the journal entry are not equal';
          res.json(response);
          return;
        }

        if (_data.totalDebtor == 0 || _data.totalCreditor == 0) {
          response.error = 'Values must be entered in the accounts';
          res.json(response);
          return;
        }

        let errAccountEmptyList = [];
        let errAccountAllValuesList = [];
        let errCostCentersRateList = [];
        _data.accountsList.forEach((_ac) => {
          if (_ac.debtor == 0 && _ac.creditor == 0) {
            let itemName = req.session.lang == 'Ar' ? _ac.nameAr : _ac.nameEn;
            errAccountEmptyList.push(itemName);
          } else if (_ac.debtor > 0 && _ac.creditor > 0) {
            let itemName = req.session.lang == 'Ar' ? _ac.nameAr : _ac.nameEn;
            errAccountAllValuesList.push(itemName);
          }
          if (_ac.costCentersList && _ac.costCentersList.length > 0) {
            if (_ac.costCentersList.reduce((a, b) => a + b.rate, 0) != 100) {
              let itemName = req.session.lang == 'Ar' ? _ac.nameAr : _ac.nameEn;
              errCostCentersRateList.push(itemName);
            }
          }
        });

        if (errAccountEmptyList.length > 0) {
          let error = errAccountEmptyList.map((m) => m).join('-');
          response.error = `Values must be entered in the Accounts ( ${error} )`;
          res.json(response);
          return;
        }

        if (errAccountAllValuesList.length > 0) {
          let error = errAccountAllValuesList.map((m) => m).join('-');
          response.error = `There are wrong values in ( ${error} )`;
          res.json(response);
          return;
        }

        if (errAccountAllValuesList.length > 0) {
          let error = errAccountAllValuesList.map((m) => m).join('-');
          response.error = `Cost center rates do not equal 100 in the Accounts ( ${error} )`;
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
        let select = req.body.select || { id: 1, code: 1, nameEn: 1, nameAr: 1, totalDebtor: 1, totalCreditor: 1 , date: 1 };
        let limit = req.body.limit || 50;
        let list = [];
        if (app.allowMemory) {
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
            res.json({
              done: true,
              list: docs,
            });
          });
        }
      });
    }
  }

  site.autoJournalEntry = function (obj) {
    let autoJournal = site.getSystemSetting({ session: obj.session }).autoJournal;
    if (autoJournal) {
      let establishingAccountsList = site.getSystemSetting({ session: obj.session }).establishingAccountsList;
      if (establishingAccountsList) {
        let numObj = {
          company: site.getCompany({ session: obj.session }),
          screen: app.name,
          date: new Date(),
        };

        let journalEntry = {
          date: new Date(),
          active: true,
          totalDebtor: 0,
          totalCreditor: 0,
          accountsList: [],
          nameAr: obj.nameAr,
          nameEn: obj.nameEn,
          company: site.getCompany({ session: obj.session }),
          branch: site.getBranch({ session: obj.session }),
          addUserInfo: obj.userInfo,
        };

        let cb = site.getNumbering(numObj);
        if (!journalEntry.code && !cb.auto) {
          response.error = 'Must Enter Code';
          return;
        } else if (cb.auto) {
          journalEntry.code = cb.code;
        }

        establishingAccountsList.forEach((_acc) => {
          if (_acc.accountGuide && _acc.accountGuide.id) {
            if (obj.appName === 'purchaseOrders' || obj.appName === 'returnPurchaseOrders') {
              if (_acc.id == 'stores') {
                let total = obj.totalNet + obj.totalDiscounts - (obj.totalVat || 0);
                let acc = {
                  id: _acc.accountGuide.id,
                  code: _acc.accountGuide.code,
                  nameAr: _acc.accountGuide.nameAr,
                  nameEn: _acc.accountGuide.nameEn,
                  side: obj.appName === 'purchaseOrders' ? 'debtor' : 'creditor',
                  debtor: obj.appName === 'purchaseOrders' ? total : 0,
                  creditor: obj.appName === 'purchaseOrders' ? 0 : total,
                };
                if (obj.appName === 'purchaseOrders') {
                  journalEntry.totalDebtor += total;
                } else {
                  journalEntry.totalCreditor += total;
                }
                journalEntry.accountsList.push(acc);
              } else if (_acc.id == 'purchaseTax' && obj.totalVat > 0) {
                let acc = {
                  id: _acc.accountGuide.id,
                  code: _acc.accountGuide.code,
                  nameAr: _acc.accountGuide.nameAr,
                  nameEn: _acc.accountGuide.nameEn,
                  side: obj.appName === 'purchaseOrders' ? 'debtor' : 'creditor',
                  debtor: obj.appName === 'purchaseOrders' ? obj.totalVat : 0,
                  creditor: obj.appName === 'purchaseOrders' ? 0 : obj.totalVat,
                };
                if (obj.appName === 'purchaseOrders') {
                  journalEntry.totalDebtor += obj.totalVat;
                } else {
                  journalEntry.totalCreditor += obj.totalVat;
                }
                journalEntry.accountsList.push(acc);
              } else if (_acc.id == 'vendors') {
                let acc = {
                  id: _acc.accountGuide.id,
                  code: _acc.accountGuide.code,
                  nameAr: _acc.accountGuide.nameAr,
                  nameEn: _acc.accountGuide.nameEn,
                  side: obj.appName === 'purchaseOrders' ? 'creditor' : 'debtor',
                  creditor: obj.appName === 'purchaseOrders' ? obj.totalNet : 0,
                  debtor: obj.appName === 'purchaseOrders' ? 0 : obj.totalNet,
                };
                if (obj.appName === 'purchaseOrders') {
                  journalEntry.totalCreditor += obj.totalNet;
                } else {
                  journalEntry.totalDebtor += obj.totalNet;
                }
                journalEntry.accountsList.push(acc);
              } else if (_acc.id == 'purshaseDiscount' && obj.totalDiscounts > 0) {
                let acc = {
                  id: _acc.accountGuide.id,
                  code: _acc.accountGuide.code,
                  nameAr: _acc.accountGuide.nameAr,
                  nameEn: _acc.accountGuide.nameEn,
                  side: obj.appName === 'purchaseOrders' ? 'creditor' : 'debtor',
                  creditor: obj.appName === 'purchaseOrders' ? obj.totalDiscounts : 0,
                  debtor: obj.appName === 'purchaseOrders' ? 0 : obj.totalDiscounts,
                };
                if (obj.appName === 'purchaseOrders') {
                  journalEntry.totalCreditor += obj.totalDiscounts;
                } else {
                  journalEntry.totalDebtor += obj.totalDiscounts;
                }
                journalEntry.accountsList.push(acc);
              }
            } else if (obj.appName === 'salesInvoices' || obj.appName === 'returnSalesInvoices' || obj.appName === 'servicesOrders' || obj.appName === 'offersOrders') {
              if (_acc.id == 'customers') {
                let acc = {
                  id: _acc.accountGuide.id,
                  code: _acc.accountGuide.code,
                  nameAr: _acc.accountGuide.nameAr,
                  nameEn: _acc.accountGuide.nameEn,
                  side: obj.appName === 'returnSalesInvoices' ? 'creditor' : 'debtor',
                  debtor: obj.appName === 'returnSalesInvoices' ? 0 : obj.totalNet,
                  creditor: obj.appName === 'returnSalesInvoices' ? obj.totalNet : 0,
                };
                if (obj.appName === 'returnSalesInvoices') {
                  journalEntry.totalCreditor += obj.totalNet;
                } else {
                  journalEntry.totalDebtor += obj.totalNet;
                }
                journalEntry.accountsList.push(acc);
              }
              if (_acc.id == 'salesDiscount' && obj.totalDiscounts > 0) {
                let acc = {
                  id: _acc.accountGuide.id,
                  code: _acc.accountGuide.code,
                  nameAr: _acc.accountGuide.nameAr,
                  nameEn: _acc.accountGuide.nameEn,
                  side: obj.appName === 'returnSalesInvoices' ? 'creditor' : 'debtor',
                  debtor: obj.appName === 'returnSalesInvoices' ? 0 : obj.totalDiscounts,
                  creditor: obj.appName === 'returnSalesInvoices' ? obj.totalDiscounts : 0,
                };
                if (obj.appName === 'returnSalesInvoices') {
                  journalEntry.totalCreditor += obj.totalDiscounts;
                } else {
                  journalEntry.totalDebtor += obj.totalDiscounts;
                }
                journalEntry.accountsList.push(acc);
              } else if (_acc.id == 'sales' && (obj.appName === 'salesInvoices' || obj.appName === 'servicesOrders' || obj.appName === 'offersOrders')) {
                let total = obj.totalNet + obj.totalDiscounts - (obj.totalVat || 0);
                let acc = {
                  id: _acc.accountGuide.id,
                  code: _acc.accountGuide.code,
                  nameAr: _acc.accountGuide.nameAr,
                  nameEn: _acc.accountGuide.nameEn,
                  side: 'creditor',
                  creditor: total,
                  debtor: 0,
                };
                journalEntry.totalCreditor += total;

                journalEntry.accountsList.push(acc);
              } else if (_acc.id == 'service' && (obj.appName === 'servicesOrders' || obj.appName === 'offersOrders')) {
                let acc = {
                  id: _acc.accountGuide.id,
                  code: _acc.accountGuide.code,
                  nameAr: _acc.accountGuide.nameAr,
                  nameEn: _acc.accountGuide.nameEn,
                  side: 'creditor',
                  creditor: obj.totalAverageCost,
                  debtor: 0,
                };
                journalEntry.totalCreditor += obj.totalAverageCost;

                journalEntry.accountsList.push(acc);
              } else if (_acc.id == 'reSales' && obj.appName === 'returnSalesInvoices') {
                let total = obj.totalNet + obj.totalDiscounts - (obj.totalVat || 0);

                let acc = {
                  id: _acc.accountGuide.id,
                  code: _acc.accountGuide.code,
                  nameAr: _acc.accountGuide.nameAr,
                  nameEn: _acc.accountGuide.nameEn,
                  side: 'creditor',
                  debtor: total,
                  creditor: 0,
                };
                journalEntry.totalDebtor += total;

                journalEntry.accountsList.push(acc);
              } else if (_acc.id == 'salesTax' && obj.totalVat > 0) {
                let acc = {
                  id: _acc.accountGuide.id,
                  code: _acc.accountGuide.code,
                  nameAr: _acc.accountGuide.nameAr,
                  nameEn: _acc.accountGuide.nameEn,
                  side: obj.appName === 'returnSalesInvoices' ? 'debtor' : 'creditor',
                  creditor: obj.appName === 'returnSalesInvoices' ? 0 : obj.totalVat,
                  debtor: obj.appName === 'returnSalesInvoices' ? obj.totalVat : 0,
                };
                if (obj.appName === 'returnSalesInvoices') {
                  journalEntry.totalDebtor += obj.totalVat;
                } else {
                  journalEntry.totalCreditor += obj.totalVat;
                }
                journalEntry.accountsList.push(acc);
              } else if (_acc.id == 'inventorySalesCost') {
                let acc = {
                  id: _acc.accountGuide.id,
                  code: _acc.accountGuide.code,
                  nameAr: _acc.accountGuide.nameAr,
                  nameEn: _acc.accountGuide.nameEn,
                  side: obj.appName === 'returnSalesInvoices' ? 'creditor' : 'debtor',
                  debtor: obj.appName === 'returnSalesInvoices' ? 0 : obj.totalAverageCost,
                  creditor: obj.appName === 'returnSalesInvoices' ? obj.totalAverageCost : 0,
                };
                if (obj.appName === 'returnSalesInvoices') {
                  journalEntry.totalCreditor += obj.totalAverageCost;
                } else {
                  journalEntry.totalDebtor += obj.totalAverageCost;
                }
                journalEntry.accountsList.push(acc);
              } else if (_acc.id == 'stores' && (obj.appName === 'returnSalesInvoices' || obj.appName === 'salesInvoices')) {
                let acc = {
                  id: _acc.accountGuide.id,
                  code: _acc.accountGuide.code,
                  nameAr: _acc.accountGuide.nameAr,
                  nameEn: _acc.accountGuide.nameEn,
                  side: obj.appName === 'returnSalesInvoices' ? 'creditor' : 'debtor',
                  creditor: obj.appName === 'returnSalesInvoices' ? 0 : obj.totalAverageCost,
                  debtor: obj.appName === 'returnSalesInvoices' ? obj.totalAverageCost : 0,
                };
                if (obj.appName === 'returnSalesInvoices') {
                  journalEntry.totalDebtor += obj.totalAverageCost;
                } else {
                  journalEntry.totalCreditor += obj.totalAverageCost;
                }
                journalEntry.accountsList.push(acc);
              }
            }
          }
        });
        app.add(journalEntry, (err, doc) => {});
      }
    }
  };

  site.autoJournalEntryVoucher = function (obj) {
    let autoJournal = site.getSystemSetting({ session: obj.session }).autoJournal;
    if (autoJournal) {
      let establishingAccountsList = site.getSystemSetting({ session: obj.session }).establishingAccountsList;
      if (establishingAccountsList) {
        let numObj = {
          company: site.getCompany({ session: obj.session }),
          screen: app.name,
          date: new Date(),
        };

        let journalEntry = {
          date: new Date(),
          active: true,
          totalDebtor: 0,
          totalCreditor: 0,
          accountsList: [],
          company: site.getCompany({ session: obj.session }),
          branch: site.getBranch({ session: obj.session }),
          nameAr: obj.nameAr,
          nameEn: obj.nameEn,
          addUserInfo: obj.userInfo,
        };

        let cb = site.getNumbering(numObj);
        if (!journalEntry.code && !cb.auto) {
          response.error = 'Must Enter Code';
          return;
        } else if (cb.auto) {
          journalEntry.code = cb.code;
        }
        establishingAccountsList.forEach((_acc) => {
          if (_acc.accountGuide && _acc.accountGuide.id) {
            if (obj.voucherType.id === 'salesInvoice' || obj.voucherType.id === 'serviceOrder' || obj.voucherType.id === 'offersOrders' || obj.voucherType.id === 'salesReturn') {
              if (obj.safe && obj.safe.type) {
                if (obj.safe.type.id == 1) {
                  if (_acc.id == 'box') {
                    let ac = {
                      id: _acc.accountGuide.id,
                      code: _acc.accountGuide.code,
                      nameAr: _acc.accountGuide.nameAr,
                      nameEn: _acc.accountGuide.nameEn,
                      side: obj.voucherType.id === 'salesReturn' ? 'creditor' : 'debtor',
                      debtor: obj.voucherType.id === 'salesReturn' ? 0 : obj.totalNet,
                      creditor: obj.voucherType.id === 'salesReturn' ? obj.totalNet : 0,
                    };
                    if (obj.voucherType.id === 'salesReturn') {
                      journalEntry.totalCreditor += obj.totalNet;
                    } else {
                      journalEntry.totalDebtor += obj.totalNet;
                    }
                    journalEntry.accountsList.push(ac);
                  }
                } else if (obj.safe.type.id == 2) {
                  if (_acc.id == 'bank') {
                    let ac = {
                      id: _acc.accountGuide.id,
                      code: _acc.accountGuide.code,
                      nameAr: _acc.accountGuide.nameAr,
                      nameEn: _acc.accountGuide.nameEn,
                      side: obj.voucherType.id === 'salesReturn' ? 'creditor' : 'debtor',
                      debtor: obj.voucherType.id === 'salesReturn' ? 0 : obj.totalNet,
                      creditor: obj.voucherType.id === 'salesReturn' ? obj.totalNet : 0,
                    };
                    if (obj.voucherType.id === 'salesReturn') {
                      journalEntry.totalCreditor += obj.totalNet;
                    } else {
                      journalEntry.totalDebtor += obj.totalNet;
                    }
                    journalEntry.accountsList.push(ac);
                  }
                }
                if (_acc.id == 'customers') {
                  let ac = {
                    id: _acc.accountGuide.id,
                    code: _acc.accountGuide.code,
                    nameAr: _acc.accountGuide.nameAr,
                    nameEn: _acc.accountGuide.nameEn,
                    side: obj.voucherType.id === 'salesReturn' ? 'debtor' : 'creditor',
                    creditor: obj.voucherType.id === 'salesReturn' ? 0 : obj.totalNet,
                    debtor: obj.voucherType.id === 'salesReturn' ? obj.totalNet : 0,
                  };
                  if (obj.voucherType.id === 'salesReturn') {
                    journalEntry.totalDebtor += obj.totalNet;
                  } else {
                    journalEntry.totalCreditor += obj.totalNet;
                  }
                  journalEntry.accountsList.push(ac);
                }
              }
            } else if (obj.voucherType.id === 'purchaseInvoice' || obj.voucherType.id === 'purchaseReturn') {
              if (obj.safe && obj.safe.type) {
                if (obj.safe.type.id == 1) {
                  if (_acc.id == 'box') {
                    let ac = {
                      id: _acc.accountGuide.id,
                      code: _acc.accountGuide.code,
                      nameAr: _acc.accountGuide.nameAr,
                      nameEn: _acc.accountGuide.nameEn,
                      side: obj.voucherType.id === 'purchaseReturn' ? 'debtor' : 'creditor',
                      debtor: obj.voucherType.id === 'purchaseReturn' ? obj.totalNet : 0,
                      creditor: obj.voucherType.id === 'purchaseReturn' ? 0 : obj.totalNet,
                    };
                    if (obj.voucherType.id === 'purchaseReturn') {
                      journalEntry.totalDebtor += obj.totalNet;
                    } else {
                      journalEntry.totalCreditor += obj.totalNet;
                    }
                    journalEntry.accountsList.push(ac);
                  }
                } else if (obj.safe.type.id == 2) {
                  if (_acc.id == 'bank') {
                    let ac = {
                      id: _acc.accountGuide.id,
                      code: _acc.accountGuide.code,
                      nameAr: _acc.accountGuide.nameAr,
                      nameEn: _acc.accountGuide.nameEn,
                      side: obj.voucherType.id === 'purchaseReturn' ? 'debtor' : 'creditor',
                      debtor: obj.voucherType.id === 'purchaseReturn' ? obj.totalNet : 0,
                      creditor: obj.voucherType.id === 'purchaseReturn' ? 0 : obj.totalNet,
                    };
                    if (obj.voucherType.id === 'purchaseReturn') {
                      journalEntry.totalDebtor += obj.totalNet;
                    } else {
                      journalEntry.totalCreditor += obj.totalNet;
                    }
                    journalEntry.accountsList.push(ac);
                  }
                }
                if (_acc.id == 'vendors') {
                  let ac = {
                    id: _acc.accountGuide.id,
                    code: _acc.accountGuide.code,
                    nameAr: _acc.accountGuide.nameAr,
                    nameEn: _acc.accountGuide.nameEn,
                    side: obj.voucherType.id === 'purchaseReturn' ? 'creditor' : 'debtor',
                    creditor: obj.voucherType.id === 'purchaseReturn' ? obj.totalNet : 0,
                    debtor: obj.voucherType.id === 'purchaseReturn' ? 0 : obj.totalNet,
                  };
                  if (obj.voucherType.id === 'purchaseReturn') {
                    journalEntry.totalCreditor += obj.totalNet;
                  } else {
                    journalEntry.totalDebtor += obj.totalNet;
                  }
                  journalEntry.accountsList.push(ac);
                }
              }
            }
          }
        });
        app.add(journalEntry, (err, doc) => {});
      }
    }
  };

  app.init();
  site.addApp(app);
};
