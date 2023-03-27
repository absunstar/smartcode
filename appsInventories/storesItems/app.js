module.exports = function init(site) {
  let app = {
    name: 'storesItems',
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
    allowRouteActive: true,
  };

  site.getBatchesToSalesAuto = function (obj, callback) {
    let itemIds = obj.items.map((_item) => _item.id);
    app.all({ where: { id: { $in: itemIds } } }, (err, docs) => {
      if (!err && docs) {
        let itemsDocs = [];
        for (let i = 0; i < obj.items.length; i++) {
          let item = obj.items[i];
          let batchCount = { ...item }.count;
          item.batchesList = [];
          let indexDoc = docs.findIndex((itm) => itm.id === item.id);
          if (indexDoc != -1) {
            let unitIndex = docs[indexDoc].unitsList.findIndex((unt) => unt.unit.id === item.unit.id);
            if (unitIndex != -1) {
              let storeIndex = docs[indexDoc].unitsList[unitIndex].storesList.findIndex((st) => st.store.id === obj.store.id);
              if (storeIndex != -1) {
                docs[indexDoc].unitsList[unitIndex].storesList[storeIndex].batchesList = docs[indexDoc].unitsList[unitIndex].storesList[storeIndex].batchesList || [];
                let batchesList = [];
                if (item.workByBatch || item.workByQrCode) {
                  docs[indexDoc].unitsList[unitIndex].storesList[storeIndex].batchesList = docs[indexDoc].unitsList[unitIndex].storesList[storeIndex].batchesList
                    .sort((a, b) => new Date(b.expiryDate) - new Date(a.expiryDate))
                    .reverse()
                } else if (item.workBySerial) {
                  docs[indexDoc].unitsList[unitIndex].storesList[storeIndex].batchesList = docs[indexDoc].unitsList[unitIndex].storesList[storeIndex].batchesList
                    .sort((a, b) => new Date(b.productionDate) - new Date(a.productionDate))
                    .reverse()
                }
                docs[indexDoc].unitsList[unitIndex].storesList[storeIndex].batchesList.forEach((_b) => {
                  _b.currentCount = _b.count;
                  _b.count = 0;
                  if (_b.currentCount > 0 && batchCount > 0) {
                    if (batchCount > _b.currentCount || batchCount == _b.currentCount) {
                      _b.count = _b.currentCount;
                    } else if (batchCount < _b.currentCount && batchCount > 0) {
                      _b.count = batchCount;
                    }
                    batchCount -= _b.count;
                    batchesList.push(_b);
                  }
                });
                itemsDocs.push({
                  id: docs[indexDoc].id,
                  batchesList,
                });
              }
            }
          }
        }
        callback(itemsDocs);
      }
    });
  };

  site.editItemsBalance = function (_elm, screenName) {
    app.view({ id: _elm.id }, (err, doc) => {
      if (doc) {
        let index = doc.unitsList.findIndex((unt) => unt.unit.id === _elm.unit.id);
        if (index != -1) {
          let storeIndex = doc.unitsList[index].storesList.findIndex((s) => s.store && s.store.id === _elm.store.id);

          if (storeIndex == -1) {
            const newUitStore = site.setStoresItemsUnitStoreProperties();
            newUitStore.store = _elm.store;
            doc.unitsList[index].storesList.push(newUitStore);
            storeIndex = doc.unitsList[index].storesList.length - 1;
          }

          if (screenName === 'purchaseOrders') {
            doc.unitsList[index].storesList[storeIndex].purchaseCount += _elm.count;
            // doc.unitsList[index].storesList[storeIndex].purchasePrice += _elm.total;
            doc.unitsList[index].storesList[storeIndex].bonusCount += _elm.bonusCount;
            doc.unitsList[index].storesList[storeIndex].bonusPrice += _elm.bonusPrice;
            if (_elm.price != doc.unitsList[index].purchasePrice) {
              doc.unitsList[index].purchasePriceList.push({ price: _elm.price, date: new Date() });
            }
            if (_elm.salesPrice != doc.unitsList[index].salesPrice) {
              doc.unitsList[index].salesPriceList.push({ price: _elm.salesPrice, date: new Date() });
            }
            doc.unitsList[index].purchasePrice = _elm.price;
            doc.unitsList[index].salesPrice = _elm.salesPrice;

            const selectedUnit = doc.unitsList[index];
            const oldCost = selectedUnit.currentCount * selectedUnit.purchasePrice;
            const newCost = _elm.count * _elm.price;
            const totalCount = selectedUnit.currentCount + _elm.count;
            doc.unitsList[index].purchasePrice = (oldCost + newCost) / totalCount;
            doc.unitsList[index].purchasePrice = site.toNumber(doc.unitsList[index].purchasePrice);

            if (_elm.workByBatch || _elm.workBySerial || _elm.workByQrCode) {
              doc.unitsList[index].storesList[storeIndex] = site.handelAddBatches(doc.unitsList[index].storesList[storeIndex], _elm.batchesList);
            }
          } else if (screenName === 'returnPurchaseOrders') {
            doc.unitsList[index].storesList[storeIndex].purchaseReturnCost += _elm.cost;
            doc.unitsList[index].storesList[storeIndex].purchaseReturnCount += _elm.count;
            doc.unitsList[index].storesList[storeIndex].purchaseReturnPrice += _elm.total;
            doc.unitsList[index].storesList[storeIndex].bonusReturnCount += _elm.bonusCount;
            doc.unitsList[index].storesList[storeIndex].bonusReturnPrice += _elm.bonusPrice;
            if (_elm.workByBatch || _elm.workBySerial || _elm.workByQrCode) {
              doc.unitsList[index].storesList[storeIndex] = site.handelBalanceBatches(doc.unitsList[index].storesList[storeIndex], _elm.batchesList, '-');
            }
          } else if (screenName === 'salesInvoices') {
            doc.unitsList[index].storesList[storeIndex].salesCount += _elm.count;
            doc.unitsList[index].storesList[storeIndex].salesPrice += _elm.total;
            if (_elm.workByBatch || _elm.workBySerial || _elm.workByQrCode) {
              doc.unitsList[index].storesList[storeIndex] = site.handelBalanceBatches(doc.unitsList[index].storesList[storeIndex], _elm.batchesList, '-');
            }
          } else if (screenName === 'returnSalesInvoices') {
            doc.unitsList[index].storesList[storeIndex].salesReturnCount += _elm.count;
            doc.unitsList[index].storesList[storeIndex].salesReturnPrice += _elm.total;
            if (_elm.workByBatch || _elm.workBySerial || _elm.workByQrCode) {
              doc.unitsList[index].storesList[storeIndex] = site.handelBalanceBatches(doc.unitsList[index].storesList[storeIndex], _elm.batchesList, '+');
            }
          } else if (screenName === 'convertUnits') {
            doc.unitsList[index].storesList[storeIndex].convertUnitFromCount += _elm.count;
            doc.unitsList[index].storesList[storeIndex].convertUnitFromPrice += _elm.total;
            let unitToIndex = doc.unitsList.findIndex((s) => s.unit && s.unit.id === _elm.toUnit.id);
            if (unitToIndex != -1) {
              let storeIndexTo = doc.unitsList[unitToIndex].storesList.findIndex((s) => s.store && s.store.id === _elm.store.id);
              if (storeIndexTo == -1) {
                const newUitStore = site.setStoresItemsUnitStoreProperties();
                newUitStore.store = _elm.store;
                doc.unitsList[unitToIndex].storesList.push(newUitStore);
                storeIndexTo = doc.unitsList[unitToIndex].storesList.length - 1;
              }

              doc.unitsList[unitToIndex].storesList[storeIndexTo].convertUnitToCount += _elm.toCount;
              doc.unitsList[unitToIndex].storesList[storeIndexTo].convertUnitToPrice += _elm.toTotal;
              doc.unitsList[index].storesList[storeIndex] = site.handelBalanceBatches(doc.unitsList[index].storesList[storeIndex], _elm.batchesList, '-');
              doc.unitsList[unitToIndex].storesList[storeIndexTo] = site.handelAddBatches(doc.unitsList[unitToIndex].storesList[storeIndexTo], _elm.toBatchesList);
            }
          } else if (screenName === 'transferItemsOrders') {
            doc.unitsList[index].storesList[storeIndex].transferFromCount += _elm.count;
            doc.unitsList[index].storesList[storeIndex].transferFromPrice += _elm.total;

            let storeToIndex = doc.unitsList[index].storesList.findIndex((s) => s.store && s.store.id === _elm.toStore.id);
            if (storeToIndex == -1) {
              const newUitStore = site.setStoresItemsUnitStoreProperties();
              newUitStore.store = _elm.toStore;
              doc.unitsList[index].storesList.push(newUitStore);
              storeToIndex = doc.unitsList[index].storesList.length - 1;
            }
            doc.unitsList[index].storesList[storeToIndex].transferToCount += _elm.count;
            doc.unitsList[index].storesList[storeToIndex].transferToPrice += _elm.total;
            if (_elm.workByBatch || _elm.workBySerial || _elm.workByQrCode) {
              doc.unitsList[index].storesList[storeIndex] = site.handelBalanceBatches(doc.unitsList[index].storesList[storeIndex], _elm.batchesList, '-');
              doc.unitsList[index].storesList[storeToIndex] = site.handelAddBatches(doc.unitsList[index].storesList[storeToIndex], _elm.batchesList);
            }
          } else if (screenName === 'damageItems') {
            doc.unitsList[index].storesList[storeIndex].damagedCount += _elm.count;
            doc.unitsList[index].storesList[storeIndex].damagedPrice += _elm.total;
            if (_elm.workByBatch || _elm.workBySerial || _elm.workByQrCode) {
              doc.unitsList[index].storesList[storeIndex] = site.handelBalanceBatches(doc.unitsList[index].storesList[storeIndex], _elm.batchesList, '-');
            }
          } else if (screenName === 'storesOpeningBalances') {
            doc.unitsList[index].storesList[storeIndex].openingBalanceCount += _elm.count;
            doc.unitsList[index].storesList[storeIndex].openingBalancePrice += _elm.total;
            if (_elm.workByBatch || _elm.workBySerial || _elm.workByQrCode) {
              doc.unitsList[index].storesList[storeIndex] = site.handelAddBatches(doc.unitsList[index].storesList[storeIndex], _elm.batchesList);
            }
          } else if (screenName === 'stockTaking') {
            if (_elm.countType == 'in') {
              doc.unitsList[index].storesList[storeIndex].stockTakingInCount += _elm.count;
              doc.unitsList[index].storesList[storeIndex].stockTakingInPrice += _elm.total;
            } else if (_elm.countType == 'out') {
              doc.unitsList[index].storesList[storeIndex].stockTakingOutCount += _elm.count;
              doc.unitsList[index].storesList[storeIndex].stockTakingOutPrice += _elm.total;
            }

            if (_elm.workByBatch || _elm.workBySerial || _elm.workByQrCode) {
              doc.unitsList[index].storesList[storeIndex].batchesList = [];
              for (let b of _elm.batchesList) {
                doc.unitsList[index].storesList[storeIndex].batchesList.push(b);
              }
            }
          }
        }
        site.calculateStroeItemBalance(doc);
        app.update(doc);
      }
    });
  };

  site.checkBarcode = function (barcodes, callback) {
    app.all({ where: { 'unitsList.barcode': { $in: barcodes } } }, (err, docs) => {
      if (docs) {
        let list = [];
        docs.forEach((_doc) => {
          _doc.unitsList.forEach((_unit) => {
            if (barcodes.some((b) => b == _unit.barcode)) {
              list.push(_unit.barcode);
            }
          });
        });
        callback(list);
      } else {
        callback(false);
      }
    });
  };

  site.checkOverDraft = function (req, obj, callback) {
    const systemSetting = site.getSystemSetting(req);

    if (!systemSetting.storesSetting.allowOverdraft) {
      let itemIds = obj.items.map((_item) => _item.id);
      app.all({ where: { id: { $in: itemIds } } }, (err, docs) => {
        let cb = {
          done: false,
          refuseList: [],
        };
        for (let i = 0; i < obj.items.length; i++) {
          let itemCb = obj.items[i];

          let itemDoc = docs.find((_d) => {
            return _d.id == itemCb.id;
          });
          if (itemDoc) {
            let unitDoc = itemDoc.unitsList.find((_u) => {
              return _u.unit.id == itemCb.unit.id;
            });

            if (unitDoc) {
              let storeDoc = unitDoc.storesList.find((_store) => {
                return _store.store.id == obj.store.id;
              });

              if (storeDoc) {
                if (storeDoc.currentCount - itemCb.count < 0) {
                  cb.refuseList.push({ nameAr: itemCb.nameAr, nameEn: itemCb.nameEn });
                }
              } else {
                cb.refuseList.push({ nameAr: itemCb.nameAr, nameEn: itemCb.nameEn });
              }
            } else {
              cb.refuseList.push({ nameAr: itemCb.nameAr, nameEn: itemCb.nameEn });
            }
          } else {
            cb.refuseList.push({ nameAr: itemCb.nameAr, nameEn: itemCb.nameEn });
          }
        }

        cb.done = true ? !cb.refuseList.length : false;
        callback(cb);
        return;
      });
    } else {
      callback({ done: true });

      return;
    }
  };

  site.calculateStroeItemBalance = function (item) {
    item.unitsList.forEach((unt) => {
      unt.currentCount = 0;
      unt.storesList.forEach((str) => {
        let totalIncome =
          str.purchaseCount + str.bonusCount + str.openingBalanceCount + str.unassembledCount + str.salesReturnCount + str.stockTakingInCount + str.transferToCount + str.convertUnitToCount;
        let totalOut =
          str.salesCount + str.purchaseReturnCount + str.damagedCount + str.assembledCount + str.stockTakingOutCount + str.transferFromCount + str.convertUnitFromCount + str.bonusReturnCount;
        str.currentCount = totalIncome - totalOut;
        unt.currentCount += str.currentCount || 0;
      });
    });
    return item;
  };

  site.handelAddBatches = function (obj, batchesList) {
    obj.batchesList = obj.batchesList || [];
    if (batchesList && batchesList.length > 0) {
      for (let i = 0; i < batchesList.length; i++) {
        let b = batchesList[i];
        if (b.count > 0) {
          if (obj.batchesList.length > 0) {
            let batchIndex = obj.batchesList.findIndex((_b) => _b.code === b.code);
            if (batchIndex != -1) {
              obj.batchesList[batchIndex].count += b.count;
            } else {
              obj.batchesList.push(b);
            }
          } else {
            obj.batchesList.push(b);
          }
        }
      }
    }
    return obj;
  };

  site.handelBalanceBatches = function (obj, batchesList, type) {
    obj.batchesList = obj.batchesList || [];
    if (batchesList && batchesList.length > 0) {
      for (let i = 0; i < batchesList.length; i++) {
        let b = batchesList[i];
        obj.batchesList.forEach((_b) => {
          if (_b.code === b.code) {
            if (type == '+') {
              _b.count = _b.count + b.count;
            } else if (type == '-') {
              _b.count = _b.count - b.count;
            }
          }
        });
      }
    }
    return obj;
  };

  site.setStoresItemsUnitStoreProperties = function () {
    return {
      store: {},
      purchaseCount: 0,
      purchasePrice: 0,
      purchaseReturnPrice: 0,
      purchaseReturnCount: 0,
      salesCount: 0,
      salesReturnCount: 0,
      salesPrice: 0,
      salesReturnPrice: 0,
      bonusCount: 0,
      bonusReturnCount: 0,
      bonusPrice: 0,
      bonusReturnPrice: 0,
      damagedCount: 0,
      damagedPrice: 0,
      assembledCount: 0,
      assembledPrice: 0,
      unassembledCount: 0,
      unassembledPrice: 0,
      transferFromCount: 0,
      transferFromPrice: 0,
      transferToCount: 0,
      transferToPrice: 0,
      convertUnitFromCount: 0,
      convertUnitFromPrice: 0,
      convertUnitToCount: 0,
      convertUnitToPrice: 0,
      openingBalanceCount: 0,
      openingBalancePrice: 0,
      stockTakingInCount: 0,
      stockTakingInPrice: 0,
      stockTakingOutCount: 0,
      stockTakingOutPrice: 0,
    };
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
          res.render(app.name + '/index.html', { title: app.name, appName: 'Stores Items' }, { parser: 'html', compres: true });
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
        let barcodes = [];

        _data.unitsList.forEach((_u) => {
          barcodes.push(_u.barcode);
          _u.purchasePriceList.push({ price: _u.purchasePrice, date: new Date() });
          _u.salesPriceList.push({ price: _u.salesPrice, date: new Date() });
        });

        let where = {
          $or: [
            {
              code: _data.code,
            },
            {
              nameAr: _data.nameAr,
            },
            {
              nameEn: _data.nameEn,
            },
            {
              'unitsList.barcode': { $in: barcodes },
            },
          ],
        };
        app.all(where, (err, docs) => {
          if (docs && docs.length > 0) {
            response.done = false;
            if (docs[0].nameAr == _data.nameAr) {
              response.error = 'There is a pre-existing name arabic';
              return res.json(response);
            } else if (docs[0].nameEn == _data.nameEn) {
              response.error = 'There is a pre-existing name english';
              return res.json(response);
            } else if (docs[0].code == _data.code) {
              response.error = 'There is a pre-existing Code';
              return res.json(response);
            } else {
              let barcodesList = [];
              docs.forEach((_doc) => {
                _doc.unitsList.forEach((_unit) => {
                  if (_data.unitsList.some((u) => u.barcode == _unit.barcode)) barcodesList.push(_unit.barcode);
                });
              });
              if (barcodesList.length > 0) {
                let errorBarcode = '';
                errorBarcode = barcodesList.map((b) => b).join('-');
                response.error = `There is a pre-existing barcode ( ${errorBarcode} )`;
                res.json(response);
                return;
              }
            }
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
      });
    }

    if (app.allowRouteUpdate) {
      site.post({ name: `/api/${app.name}/update`, require: { permissions: ['login'] } }, (req, res) => {
        let response = {
          done: false,
        };

        let _data = req.data;
        let barcodes = [];
        _data.unitsList.forEach((_u) => {
          barcodes.push(_u.barcode);
        });

        let where = {
          id: { $ne: _data.id },
          $or: [
            {
              code: _data.code,
            },
            {
              nameAr: _data.nameAr,
            },
            {
              nameEn: _data.nameEn,
            },
            {
              'unitsList.barcode': { $in: barcodes },
            },
          ],
        };
        app.all(where, (err, docs) => {
          if (docs && docs.length > 0) {
            response.done = false;
            if (docs[0].nameAr == _data.nameAr) {
              response.error = 'There is a pre-existing name arabic';
              return res.json(response);
            } else if (docs[0].nameEn == _data.nameEn) {
              response.error = 'There is a pre-existing name english';
              return res.json(response);
            } else if (docs[0].code == _data.code) {
              response.error = 'There is a pre-existing Code';
              return res.json(response);
            } else {
              let barcodesList = [];
              docs.forEach((_doc) => {
                _doc.unitsList.forEach((_unit) => {
                  if (_data.unitsList.some((u) => u.barcode == _unit.barcode)) barcodesList.push(_unit.barcode);
                });
              });
              if (barcodesList.length > 0) {
                let errorBarcode = '';
                errorBarcode = barcodesList.map((b) => b).join('-');
                response.error = `There is a pre-existing barcode ( ${errorBarcode} )`;
                res.json(response);
                return;
              }
            }
          }
          _data.editUserInfo = req.getUserFinger();
          _data.unitsList.forEach((_u) => {
            _u.purchasePriceList.push({ price: _u.purchasePrice, date: new Date() });
            _u.salesPriceList.push({ price: _u.salesPrice, date: new Date() });
          });

          app.update(_data, (err, result) => {
            if (!err) {
              response.done = true;
              response.result = result;
              let foundDif = false;
              result.doc.unitsList.forEach((_uDoc) => {
                result.old_doc.unitsList.forEach((_uOldDoc) => {
                  if (_uOldDoc.unit.id == _uDoc.unit.id) {
                    if (_uDoc.purchasePrice != _uOldDoc.purchasePrice) {
                      foundDif = true;
                      _uDoc.purchasePriceList.push({ price: _uDoc.purchasePrice, date: new Date() });
                    }
                    if (_uDoc.salesPrice != _uOldDoc.salesPrice) {
                      foundDif = true;
                      _uDoc.salesPriceList.push({ price: _uDoc.salesPrice, date: new Date() });
                    }
                  }
                });
              });
              if (foundDif) {
                app.update(result.doc);
              }
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
        let search = req.body.search || undefined;
        let limit = req.body.limit || 10;
        let select = req.body.select || {
          id: 1,
          code: 1,
          nameEn: 1,
          nameAr: 1,
          image: 1,
          unitsList: 1,
          itemGroup: 1,
          active: 1,
        };
        if (search) {
          where.$or = [];

          where.$or.push({
            id: site.get_RegExp(search, 'i'),
          });

          where.$or.push({
            code: site.get_RegExp(search, 'i'),
          });

          where.$or.push({
            nameAr: site.get_RegExp(search, 'i'),
          });

          where.$or.push({
            nameEn: site.get_RegExp(search, 'i'),
          });
        }

        if (app.allowMemory) {
          let list = app.memoryList
            .filter((g) => g.company && g.company.id == site.getCompany(req).id && (!where.active || g.active === where.active) && JSON.stringify(g).contains(search))
            .slice(0, limit);
          res.json({
            done: true,
            list: list,
          });
        } else {
          where['company.id'] = site.getCompany(req).id;
          site.getStockTakingHold(req.body.storeId, (stockTakingItemsIdsCb) => {
            if (stockTakingItemsIdsCb.length > 0) {
              where['id'] = { $nin: stockTakingItemsIdsCb };
            }
            app.all({ where, select, limit }, (err, docs) => {
              res.json({
                done: true,
                list: docs,
              });
            });
          });
        }
      });
    }
  }
  site.post({ name: `/api/${app.name}/getBatch`, require: { permissions: ['login'] } }, (req, res) => {
    let where = req.body.where || {};
    app.view({ id: where.id }, (err, doc) => {
      if (err) {
        res.json({
          done: false,
          error: err,
        });
      } else if (doc) {
        let unitIndex = doc.unitsList.findIndex((unt) => unt.unit.id === where.unitId);
        if (unitIndex != -1) {
          let storeIndex = doc.unitsList[unitIndex].storesList.findIndex((st) => st.store.id === where.storeId);
          if (storeIndex != -1) {
            doc.unitsList[unitIndex].storesList[storeIndex].batchesList = doc.unitsList[unitIndex].storesList[storeIndex].batchesList || [];

            let batchIndex = doc.unitsList[unitIndex].storesList[storeIndex].batchesList.findIndex((b) => b.code === where.code || b.sn === where.code);
            if (batchIndex != -1) {
              doc.unitsList[unitIndex].storesList[storeIndex].batchesList[batchIndex];
              let batch = { ...doc.unitsList[unitIndex].storesList[storeIndex].batchesList[batchIndex] };
              if (batch.count > 0) {
                batch.currentCount = batch.count;
                batch.count = 1;
                res.json({
                  done: true,
                  doc: batch,
                });
              } else {
                res.json({
                  done: false,
                  error: 'Not Found Count',
                });
              }
            } else {
              res.json({
                done: false,
                error: 'Not Found',
              });
            }
          } else {
            res.json({
              done: false,
              error: 'Not Found',
            });
          }
        } else {
          res.json({
            done: false,
            error: 'Not Found',
          });
        }
      } else {
        res.json({
          done: false,
          error: 'Not Found',
        });
      }

      doc.unitsList.forEach((_u) => {});
    });
  });

  site.post({ name: `/api/${app.name}/handelItemsData`, require: { permissions: ['login'] } }, (req, res) => {
    let items = req.body.items;
    let storeId = req.body.storeId;
    let itemIds = items.map((_item) => _item.id);
    app.all({ where: { id: { $in: itemIds } } }, (err, docs) => {
      for (let item of items) {
        item.storesList = [];
        let itemDoc = docs.find((_item) => {
          return item.id == _item.id;
        });
        if (itemDoc) {
          let unitDoc = itemDoc.unitsList.find((_unit) => {
            return item.unit.id == _unit.unit.id;
          });
          if (unitDoc) {
            let storeDoc = unitDoc.storesList.find((_store) => {
              return storeId == _store.store.id;
            });
            if (storeDoc) {
              item.storeBalance = storeDoc.currentCount;
              if (itemDoc.workByBatch || itemDoc.workBySerial || itemDoc.workByQrCode) {
                item.workByQrCode = itemDoc.workByQrCode;
                item.workByBatch = itemDoc.workByBatch;
                item.workBySerial = itemDoc.workBySerial;
                item.gtin = itemDoc.gtin;
                item.validityDays = itemDoc.validityDays;
                if (req.body.getBatchesList) {
                  item.batchesList = storeDoc.batchesList || [];
                }
              }
            } else {
              if (itemDoc.workByBatch || itemDoc.workBySerial || itemDoc.workByQrCode) {
                item.batchesList = item.batchesList || [];
                item.workByQrCode = itemDoc.workByQrCode;
                item.workByBatch = itemDoc.workByBatch;
                item.workBySerial = itemDoc.workBySerial;
                item.gtin = itemDoc.gtin;
                item.validityDays = itemDoc.validityDays;
                item.storeBalance = 0;
              }
            }
          }
          item.hasMedicalData = itemDoc.hasMedicalData;
        }
      }
      res.json({
        done: true,
        list: items,
      });
    });
  });

  app.init();
  site.addApp(app);
};
