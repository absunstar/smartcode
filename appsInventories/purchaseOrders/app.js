module.exports = function init(site) {
  let app = {
    name: 'purchaseOrders',
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

  site.checkBatchesError = function (itemsList, lang, callBack) {
    let cb = {
      errBatchList: [],
      errBatchGtinList: [],
      errBatchDuplicateList: [],
    };

    itemsList.forEach((_item) => {
      if (_item.workByBatch || _item.workBySerial || _item.workByQrCode) {
        if (_item.batchesList && _item.batchesList.length > 0) {
          _item.$batchCount = _item.batchesList.reduce((a, b) => a + b.count, 0);
          let notCode = false;
          let duplicate = false;
          let notGtin = false;
          _item.batchesList.forEach((_b, i) => {
            if (_item.workByQrCode) {
              if (_item.gtinList && !_item.gtinList.some((g) => g.gtin == _b.gtin)) {
                notGtin = true;
              }
              let indx = _item.batchesList.findIndex((b) => b.sn == _b.sn);
              if (indx != i) {
                duplicate = true;
              }
              if (!_b.sn || !_b.gtin || !_b.batch || !_b.expiryDate) {
                notCode = true;
              }
            } else {
              let indx = _item.batchesList.findIndex((b) => b.code == _b.code);
              if (indx != i) {
                duplicate = true;
              }

              if (_item.workByBatch) {
                if (_item.hasColorsData && (!_b.code || !_b.color)) {
                  notCode;
                } else if (_item.hasSizesData && (!_b.code || !_b.size)) {
                  notCode;
                } else if (!_item.hasColorsData && !_item.hasSizesData) {
                  if (!_b.code || !_b.expiryDate || !_b.validityDays) {
                    notCode = true;
                  }
                }
              } else if (_item.workBySerial) {
                if (!_b.code || !_b.productionDate) {
                  notCode = true;
                }
              }
            }
          });
          if (_item.$batchCount != _item.count + (_item.bonusCount || 0) || notCode) {
            let itemName = lang == 'Ar' ? _item.nameAr : _item.nameEn;
            cb.errBatchList.push(itemName);
          } else if (duplicate) {
            let itemName = lang == 'Ar' ? _item.nameAr : _item.nameEn;
            cb.errBatchDuplicateList.push(itemName);
          } else if (notGtin) {
            let itemName = lang == 'Ar' ? _item.nameAr : _item.nameEn;
            cb.errBatchGtinList.push(itemName);
          }
        } else {
          let itemName = lang == 'Ar' ? _item.nameAr : _item.nameEn;
          cb.errBatchList.push(itemName);
        }
      }
    });

    callBack(cb);
  };

  if (app.allowRoute) {
    if (app.allowRouteGet) {
      site.get(
        {
          name: app.name,
        },
        (req, res) => {
          res.render(app.name + '/index.html', { title: app.name, appName: 'Purchase Orders', setting: site.getCompanySetting(req) }, { parser: 'html', compres: true });
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

        site.checkBatchesError(_data.itemsList, req.session.lang, (callbackErrorBatches) => {
          if (callbackErrorBatches.errBatchList.length > 0) {
            let error = callbackErrorBatches.errBatchList.map((m) => m).join('-');
            response.error = `The Batches is not correct in ( ${error} )`;
            res.json(response);
            return;
          } else if (callbackErrorBatches.errBatchGtinList.length > 0) {
            let error = callbackErrorBatches.errBatchGtinList.map((m) => m).join('-');
            response.error = `Found GTIN Error Batches in ( ${error} )`;
            res.json(response);
            return;
          } else if (callbackErrorBatches.errBatchDuplicateList.length > 0) {
            let error = callbackErrorBatches.errBatchDuplicateList.map((m) => m).join('-');
            response.error = `Found Duplication Batches in ( ${error} )`;
            res.json(response);
            return;
          }

          let cb = site.getNumbering(numObj);
          if (!_data.code && !cb.auto) {
            response.error = 'Must Enter Code';
            res.json(response);
            return;
          } else if (cb.auto) {
            _data.code = cb.code;
          }

          app.$collection.find({ code: _data.code }, (err, doc) => {
            if (doc) {
              response.done = false;
              response.error = 'There Is Order Exisit With Same Code';
              return res.json(response);
            }
            _data.addUserInfo = req.getUserFinger();

            app.add(_data, (err, doc) => {
              if (!err && doc) {
                if (_data.sourceType.id === 1 && _data.purchaseRequest && _data.purchaseRequest.id) {
                  const purchaseRequestsApp = site.getApp('purchaseRequests');
                  purchaseRequestsApp.$collection.update({ where: { id: _data.purchaseRequest.id }, set: { hasTransaction: true } });
                }
                response.done = true;
                response.doc = doc;
              } else {
                response.error = err.mesage;
              }
              res.json(response);
            });
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

        site.checkBatchesError(_data.itemsList, req.session.lang, (callbackErrorBatches) => {
          if (callbackErrorBatches.errBatchList.length > 0) {
            let error = callbackErrorBatches.errBatchList.map((m) => m).join('-');
            response.error = `The Batches is not correct in ( ${error} )`;
            res.json(response);
            return;
          } else if (callbackErrorBatches.errBatchGtinList.length > 0) {
            let error = callbackErrorBatches.errBatchGtinList.map((m) => m).join('-');
            response.error = `Found GTIN Error Batches in ( ${error} )`;
            res.json(response);
            return;
          } else if (callbackErrorBatches.errBatchDuplicateList.length > 0) {
            let error = callbackErrorBatches.errBatchDuplicateList.map((m) => m).join('-');
            response.error = `Found Duplication Batches in ( ${error} )`;
            res.json(response);
            return;
          }

          app.$collection.find({ code: _data.code, id: { $ne: _data.id } }, (err, doc) => {
            if (doc) {
              response.done = false;
              response.error = 'There Is Order Exisit With Same Code';
              res.json(response);
              return;
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
        });
      });
    }

    if (app.allowRouteApprove) {
      site.post({ name: `/api/${app.name}/approve`, require: { permissions: ['login'] } }, (req, res) => {
        let response = { done: false };
        let _data = req.data;
        if(!_data.id){
          response.error = 'No Id';
          res.json(response);
          return;
        }
        
        const accountsSetting = site.getCompanySetting(req).accountsSetting;

        site.checkBatchesError(_data.itemsList, req.session.lang, (callbackErrorBatches) => {
          if (callbackErrorBatches.errBatchList.length > 0) {
            let error = callbackErrorBatches.errBatchList.map((m) => m).join('-');
            response.error = `The Batches is not correct in ( ${error} )`;
            res.json(response);
            return;
          } else if (callbackErrorBatches.errBatchGtinList.length > 0) {
            let error = callbackErrorBatches.errBatchGtinList.map((m) => m).join('-');
            response.error = `Found GTIN Error Batches in ( ${error} )`;
            res.json(response);
            return;
          } else if (callbackErrorBatches.errBatchDuplicateList.length > 0) {
            let error = callbackErrorBatches.errBatchDuplicateList.map((m) => m).join('-');
            response.error = `Found Duplication Batches in ( ${error} )`;
            res.json(response);
            return;
          }

          _data.approvedUserInfo = req.getUserFinger();
          _data.approved = true;
          _data.approvedDate = new Date();

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
            let obj = {
              date: new Date(),
              voucherType: site.vouchersTypes[4],
              invoiceId: _data.id,
              vendor: _data.vendor,
              itemsList: _data.itemsList,
              invoiceCode: _data.code,
              total: _data.amountPaid,
              safe: _data.safe,
              paymentType: _data.paymentType,
              addUserInfo: _data.approvedUserInfo,
              company: _data.company,
              branch: _data.branch,
            };
            _data.remainPaid = _data.totalNet - _data.amountPaid;
            obj.session = req.session;
            site.addExpenseVouchers(obj);
          } else {
            _data.remainPaid = _data.totalNet;
          }

          app.update(_data, (err, result) => {
            if (!err) {
              response.done = true;
              let objJournal = {
                code: result.doc.code,
                store: result.doc.store,
                vendor: result.doc.vendor,
                user: result.doc.vendor,
                appName: app.name,
                totalNet: result.doc.totalNet,
                totalDiscounts: result.doc.totalDiscounts,
                totalVat: result.doc.totalVat,
                totalAverageCost: 0,
                userInfo: result.doc.addUserInfo,
              };

              result.doc.itemsList.forEach((_item) => {
                let item = { ..._item };
                item.store = { ...result.doc.store };
                site.editItemsBalance(item, app.name);
                item.invoiceId = result.doc.id;
                item.company = result.doc.company;
                item.date = result.doc.date;
                item.vendor = result.doc.vendor;
                item.countType = 'in';
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

              objJournal.nameAr = 'أمر شراء' + ' (' + result.doc.code + ' )';
              objJournal.nameEn = 'Purchase Order' + ' (' + result.doc.code + ' )';
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
        let select = req.body.select || {};
        let search = req.body.search || '';
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
          // if (where && where.dateTo) {
          //     let d1 = site.toDate(where.date);
          //     let d2 = site.toDate(where.dateTo);
          //     d2.setDate(d2.getDate() + 1);
          //     where.date = {
          //         $gte: d1,
          //         $lt: d2,
          //     };
          //     delete where.dateTo;
          // } else if (where.date) {
          //     let d1 = site.toDate(where.date);
          //     let d2 = site.toDate(where.date);
          //     d2.setDate(d2.getDate() + 1);
          //     where.date = {
          //         $gte: d1,
          //         $lt: d2,
          //     };
          // }
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
          app.all({ where: where, limit, select, sort: { id: -1 } }, (err, docs) => {
            res.json({
              done: true,
              list: docs,
            });
          });
        }
      });
    }

    if (app.allowRouteReport) {
      site.post({ name: `/api/${app.name}/report`, public: true }, (req, res) => {
        let where = req.body.where || {};
        let select = req.body.select || {};
        let search = req.body.search || '';
        let limit = req.body.limit || 50;
        let list = [];

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

        app.all({ where: where, limit, select, sort: { id: -1 } }, (err, docs) => {
          res.json({
            done: true,
            list: docs,
          });
        });
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

  site.changeRemainPaidPurchaseOrder = function (obj) {
    // app.$collection.edit({ id: obj.id }, { $inc: { quantity: -obj.total } }, (err, result) => {
    //   console.log(result);
    // });

    app.view({ id: obj.id }, (err, doc) => {
      if (!err && doc) {
        doc.remainPaid -= obj.total;
        app.update(doc, (err, result) => {});
      }
    });

    // app.$collection.updateOne(
    //   {
    //     id: obj.id,

    //     $inc: {
    //       remainPaid: -obj.total,
    //     },
    //   },
    //   (err, result) => {
    //     console.log(err, result.doc);
    //   }
    // );
  };

  app.init();
  site.addApp(app);
};
