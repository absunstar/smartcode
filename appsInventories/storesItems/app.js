module.exports = function init(site) {
  let app = {
    name: "storesItems",
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
    busyList: [],
    importHumanDrugsbusyList: [],
  };

  site.getBatchesToSalesAuto = function (obj, callback) {
    let itemIds = obj.items.map((_item) => _item.id);
    app.all({ where: { id: { $in: itemIds } } }, (err, docs) => {
      if (!err && docs) {
        let itemsDocs = [];
        for (let i = 0; i < obj.items.length; i++) {
          let item = { ...obj.items[i] };
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
                    .reverse();
                } else if (item.workBySerial) {
                  docs[indexDoc].unitsList[unitIndex].storesList[storeIndex].batchesList = docs[indexDoc].unitsList[unitIndex].storesList[storeIndex].batchesList
                    .sort((a, b) => new Date(b.productionDate) - new Date(a.productionDate))
                    .reverse();
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
    if (app.busyList.includes(_elm.id)) {
      setTimeout(() => {
        site.editItemsBalance(_elm, screenName);
      }, 200);
      return;
    }

    app.busyList.push(_elm.id);
    app.view({ id: _elm.id }, (err, doc) => {
      if (doc && doc.itemType.id == 1) {
        let index = doc.unitsList.findIndex((unt) => unt.unit.id == _elm.unit.id);
        if (index != -1) {
          let storeIndex = doc.unitsList[index].storesList.findIndex((s) => s.store && s.store.id === _elm.store.id);

          if (storeIndex == -1) {
            const newUitStore = site.setStoresItemsUnitStoreProperties();
            newUitStore.store = {
              id: _elm.store.id,
              nameAr: _elm.store.nameAr,
              nameEn: _elm.store.nameEn,
            };
            doc.unitsList[index].storesList.push(newUitStore);
            storeIndex = doc.unitsList[index].storesList.length - 1;
          }

          if (screenName === "purchaseOrders" || screenName === "storesOpeningBalances") {
            if (screenName === "purchaseOrders") {
              doc.unitsList[index].storesList[storeIndex].purchaseCount += _elm.count;
              doc.unitsList[index].storesList[storeIndex].bonusCount += _elm.bonusCount;
              doc.unitsList[index].storesList[storeIndex].bonusPrice += _elm.bonusPrice;
            } else {
              doc.unitsList[index].storesList[storeIndex].openingBalanceCount += _elm.count;
              doc.unitsList[index].storesList[storeIndex].openingBalancePrice += _elm.total;
            }

            if (_elm.price != doc.unitsList[index].purchasePrice) {
              doc.unitsList[index].purchasePriceList.push({
                price: _elm.price,
                date: new Date(),
              });
            }
            if (_elm.salesPrice != doc.unitsList[index].salesPrice) {
              doc.unitsList[index].salesPriceList.push({
                price: _elm.salesPrice,
                date: new Date(),
              });
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
          } else if (screenName === "returnPurchaseOrders") {
            doc.unitsList[index].storesList[storeIndex].purchaseReturnCost += _elm.cost;
            doc.unitsList[index].storesList[storeIndex].purchaseReturnCount += _elm.count;
            doc.unitsList[index].storesList[storeIndex].purchaseReturnPrice += _elm.total;
            doc.unitsList[index].storesList[storeIndex].bonusReturnCount += _elm.bonusCount;
            doc.unitsList[index].storesList[storeIndex].bonusReturnPrice += _elm.bonusPrice;
            if (_elm.workByBatch || _elm.workBySerial || _elm.workByQrCode) {
              doc.unitsList[index].storesList[storeIndex] = site.handelBalanceBatches(doc.unitsList[index].storesList[storeIndex], _elm.batchesList, "-");
            }
          } else if (screenName === "salesInvoices") {
            doc.unitsList[index].storesList[storeIndex].salesCount += _elm.count;
            doc.unitsList[index].storesList[storeIndex].salesPrice += _elm.total;
            doc.unitsList[index].storesList[storeIndex].lastSellingDate = new Date();
            if (_elm.workByBatch || _elm.workBySerial || _elm.workByQrCode) {
              doc.unitsList[index].storesList[storeIndex] = site.handelBalanceBatches(doc.unitsList[index].storesList[storeIndex], _elm.batchesList, "-");
            }
          } else if (screenName === "returnSalesInvoices") {
            doc.unitsList[index].storesList[storeIndex].salesReturnCount += _elm.count;
            doc.unitsList[index].storesList[storeIndex].salesReturnPrice += _elm.total;
            if (_elm.workByBatch || _elm.workBySerial || _elm.workByQrCode) {
              doc.unitsList[index].storesList[storeIndex] = site.handelBalanceBatches(doc.unitsList[index].storesList[storeIndex], _elm.batchesList, "+");
            }
          } else if (screenName === "convertUnits") {
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
              doc.unitsList[index].storesList[storeIndex] = site.handelBalanceBatches(doc.unitsList[index].storesList[storeIndex], _elm.batchesList, "-");
              doc.unitsList[unitToIndex].storesList[storeIndexTo] = site.handelAddBatches(doc.unitsList[unitToIndex].storesList[storeIndexTo], _elm.toBatchesList);
            }
          } else if (screenName === "transferItemsOrders") {
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
              doc.unitsList[index].storesList[storeIndex] = site.handelBalanceBatches(doc.unitsList[index].storesList[storeIndex], _elm.batchesList, "-");
              doc.unitsList[index].storesList[storeToIndex] = site.handelAddBatches(doc.unitsList[index].storesList[storeToIndex], _elm.batchesList);
            }
          } else if (screenName === "damageItems") {
            doc.unitsList[index].storesList[storeIndex].damagedCount += _elm.count;
            doc.unitsList[index].storesList[storeIndex].damagedPrice += _elm.total;
            if (_elm.workByBatch || _elm.workBySerial || _elm.workByQrCode) {
              doc.unitsList[index].storesList[storeIndex] = site.handelBalanceBatches(doc.unitsList[index].storesList[storeIndex], _elm.batchesList, "-");
            }
          } else if (screenName === "stockTaking") {
            if (_elm.countType == "in") {
              doc.unitsList[index].storesList[storeIndex].stockTakingInCount += _elm.count;
              doc.unitsList[index].storesList[storeIndex].stockTakingInPrice += _elm.total;
            } else if (_elm.countType == "out") {
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
        app.update(doc, () => {
          const itemIndex = app.busyList.findIndex(() => _elm.id);
          if (itemIndex != -1) {
            app.busyList.splice(itemIndex, 1);
          }
        });
      }
    });
  };

  site.checkBarcode = function (barcodes, callback) {
    app.all({ where: { "unitsList.barcode": { $in: barcodes } } }, (err, docs) => {
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

  site.getReorderItems = function (doc) {
    let count = 0;

    if (doc && doc.unitsList && doc.unitsList.length) {
      doc.unitsList.forEach((unt) => {
        count += unt.currentCount;
      });
      doc.reorderLimit >= count ? (doc.currentCount = count) : null;
      return doc.reorderLimit >= count ? doc : null;
    }
  };

  site.sendRasdData = function (rasdData) {
    let url = "";
    let productList = [];
    if (rasdData.appName == "purchaseOrders") {
      url = "https://api.juleb-dev.com/rasd/inventory_accept";
    } else if (rasdData.appName == "returnPurchaseOrders") {
      url = "https://api.juleb-dev.com/rasd/inventory_return";
    } else if (rasdData.appName == "salesInvoices") {
      url = "https://api.juleb-dev.com/rasd/pos_sale";
    } else if (rasdData.appName == "returnSalesInvoices") {
      url = "https://api.juleb-dev.com/rasd/pos_sale_cancel";
    }

    rasdData.items.forEach((_item) => {
      if (_item.workByQrCode && _item.batchesList && _item.batchesList.length > 0) {
        _item.batchesList.forEach((_batch) => {
          if (_batch.count > 0) {
            productList.push({
              gti_number: _batch.gtin,
              serial_number: _batch.sn,
              batch_number: _batch.batch,
              expiry_date: _batch.expiryDate,
            });
          }
        });
      }
    });
    if (productList.length > 0) {
      let body = {
        branch_user: rasdData.rasdUser,
        branch_pass: rasdData.rasdPass,
        product_list: productList,
      };
      site
        .fetch(url, {
          method: "POST",
          body: JSON.stringify(body),
          headers: { "Content-Type": "application/json" },
          agent: function (_parsedURL) {
            return new site.https.Agent({
              keepAlive: true,
            });
          },
        })
        .then((res) => {
          return res.json();
        })
        .then((body) => {
          console.log(body);
        })
        .catch((err) => {
          console.log(err);
        });
    }
  };

  site.checkOverDraft = function (req, obj, callback) {
    const systemSetting = site.getCompanySetting(req);

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
                  cb.refuseList.push({
                    nameAr: itemCb.nameAr,
                    nameEn: itemCb.nameEn,
                  });
                }
              } else {
                cb.refuseList.push({
                  nameAr: itemCb.nameAr,
                  nameEn: itemCb.nameEn,
                });
              }
            } else {
              cb.refuseList.push({
                nameAr: itemCb.nameAr,
                nameEn: itemCb.nameEn,
              });
            }
          } else {
            cb.refuseList.push({
              nameAr: itemCb.nameAr,
              nameEn: itemCb.nameEn,
            });
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

        if (str.currentCount <= item.reorderLimit) {
          str.storeNeedReorder = true;
        } else {
          str.storeNeedReorder = false;
        }
      });

      if (unt.currentCount <= item.reorderLimit) {
        unt.unitNeedReorder = true;
      } else {
        unt.unitNeedReorder = false;
      }
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
            let batchIndex = obj.batchesList.findIndex((_b) => (_b.sn ? _b.sn === b.sn : _b.code === b.code));
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
        let batchIndex = obj.batchesList.findIndex((_b) => (_b.sn && _b.sn === b.sn) || _b.code === b.code);
        if (batchIndex != -1) {
          if (type == "+") {
            obj.batchesList[batchIndex].count = obj.batchesList[batchIndex].count + b.count;
          } else if (type == "-") {
            obj.batchesList[batchIndex].count = obj.batchesList[batchIndex].count - b.count;
          }
        }
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

  app.validateExisitDrugInBusyList = function (doc) {
    if (app.importHumanDrugsbusyList.includes(doc)) {
      return false;
    } else {
      return true;
    }
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
      let item;
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
          res.render(
            app.name + "/index.html",
            {
              title: app.name,
              appName: "Stores Items",
              setting: site.getCompanySetting(req),
            },
            { parser: "html", compres: true }
          );
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

        let barcodes = [];
        let date = new Date();
        _data.unitsList.forEach((_u, i) => {
          if (!_u.barcode) {
            let generate = Math.random().toString(36).substr(2, 5);
            _u.barcode = date.getDate().toString() + date.getDay().toString() + date.getMinutes().toString() + date.getHours().toString() + i.toString() + generate;
          }
          barcodes.push(_u.barcode);
          _u.purchasePriceList.push({
            price: _u.purchasePrice,
            date: new Date(),
          });
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
              "unitsList.barcode": { $in: barcodes },
            },
          ],
        };
        where["company.id"] = site.getCompany(req).id;
        app.all(where, (err, docs) => {
          if (docs && docs.length > 0) {
            response.done = false;
            if (docs[0].nameAr == _data.nameAr) {
              response.error = "There is a pre-existing name arabic";
              return res.json(response);
            } else if (docs[0].nameEn == _data.nameEn) {
              response.error = "There is a pre-existing name english";
              return res.json(response);
            } else if (docs[0].code == _data.code) {
              response.error = "There is a pre-existing Code";
              return res.json(response);
            } else {
              let barcodesList = [];
              docs.forEach((_doc) => {
                _data.unitsList.forEach((_unit) => {
                  if (_doc.unitsList.some((u) => u.barcode == _unit.barcode)) {
                    barcodesList.push(_unit.barcode);
                  }
                });
              });
              if (barcodesList.length > 0) {
                let errorBarcode = "";
                errorBarcode = barcodesList.map((b) => b).join("-");
                response.error = `There is a pre-existing barcode ( ${errorBarcode} )`;
                res.json(response);
                return;
              }
            }
          }
          _data.addUserInfo = req.getUserFinger();
          let barcodesNotFoundList = [];
          _data.unitsList.forEach((_u) => {
            if (!_u.barcode) {
              let name = `name${req.session.lang}`;
              barcodesNotFoundList.push(_u.unit[name]);
            }
          });

          if (barcodesNotFoundList.length > 0) {
            let errorBarcode = "";
            errorBarcode = barcodesNotFoundList.map((b) => b).join("-");
            response.error = `Barcode Is not found ( ${errorBarcode} )`;
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
            response.error = "Must Enter Code";
            res.json(response);
            return;
          } else if (cb.auto) {
            _data.code = cb.code;
          }

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
      site.post(
        {
          name: `/api/${app.name}/update`,
          require: { permissions: ["login"] },
        },
        (req, res) => {
          let response = {
            done: false,
          };

          let _data = req.data;
          let barcodes = [];
          let date = new Date();
          _data.unitsList.forEach((_u, i) => {
            if (!_u.barcode) {
              let generate = Math.random().toString(36).substr(2, 5);
              _u.barcode = date.getDate().toString() + date.getDay().toString() + date.getMinutes().toString() + date.getHours().toString() + i.toString() + generate;
            }
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
                "unitsList.barcode": { $in: barcodes },
              },
            ],
          };
          where["company.id"] = site.getCompany(req).id;
          app.all(where, (err, docs) => {
            if (docs && docs.length > 0) {
              response.done = false;
              if (docs[0].nameAr == _data.nameAr) {
                response.error = "There is a pre-existing name arabic";
                return res.json(response);
              } else if (docs[0].nameEn == _data.nameEn) {
                response.error = "There is a pre-existing name english";
                return res.json(response);
              } else if (docs[0].code == _data.code) {
                response.error = "There is a pre-existing Code";
                return res.json(response);
              } else {
                let barcodesList = [];
                docs.forEach((_doc) => {
                  if (_doc.unitsList) {
                    _data.unitsList.forEach((_unit) => {
                      if (_doc.unitsList.some((u) => u.barcode == _unit.barcode)) {
                        barcodesList.push(_unit.barcode);
                      }
                    });
                  }
                });
                if (barcodesList.length > 0) {
                  let errorBarcode = "";
                  errorBarcode = barcodesList.map((b) => b).join("-");
                  response.error = `There is a pre-existing barcode ( ${errorBarcode} )`;
                  res.json(response);
                  return;
                }
              }
            }
            _data.editUserInfo = req.getUserFinger();
            let barcodesNotFoundList = [];
            _data.unitsList.forEach((_u) => {
              if (!_u.barcode) {
                let name = `name${req.session.lang}`;
                barcodesNotFoundList.push(_u.unit[name]);
              }
              _u.purchasePriceList.push({
                price: _u.purchasePrice,
                date: new Date(),
              });
              _u.salesPriceList.push({
                price: _u.salesPrice,
                date: new Date(),
              });
            });

            if (barcodesNotFoundList.length > 0) {
              let errorBarcode = "";
              errorBarcode = barcodesNotFoundList.map((b) => b).join("-");
              response.error = `Barcode Is not found ( ${errorBarcode} )`;
              res.json(response);
              return;
            }

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
                        _uDoc.purchasePriceList.push({
                          price: _uDoc.purchasePrice,
                          date: new Date(),
                        });
                      }
                      if (_uDoc.salesPrice != _uOldDoc.salesPrice) {
                        foundDif = true;
                        _uDoc.salesPriceList.push({
                          price: _uDoc.salesPrice,
                          date: new Date(),
                        });
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
        }
      );
    }

    if (app.allowRouteDelete) {
      site.post(
        {
          name: `/api/${app.name}/delete`,
          require: { permissions: ["login"] },
        },
        (req, res) => {
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
        }
      );
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
        let limit = req.body.limit || 100;
        let select = req.body.select || {
          id: 1,
          code: 1,
          nameEn: 1,
          nameAr: 1,
          image: 1,
          unitsList: 1,
          itemGroup: 1,
          reorderLimit: 1,
          hasMedicalData: 1,
          hasColorsData: 1,
          hasSizesData: 1,
          workByBatch: 1,
          workBySerial: 1,
          workByQrCode: 1,
          active: 1,
          workByBatch: 1,
          workBySerial: 1,
          workByQrCode: 1,
        };

        if (search) {
          where.$or = [];

          where.$or.push({
            code: site.get_RegExp(search, "i"),
          });

          where.$or.push({
            nameAr: site.get_RegExp(search, "i"),
          });

          where.$or.push({
            nameEn: site.get_RegExp(search, "i"),
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
          where["company.id"] = site.getCompany(req).id;
          site.getStockTakingHold(req.body.storeId, (stockTakingItemsIdsCb) => {
            if (stockTakingItemsIdsCb.length > 0) {
              where["id"] = { $nin: stockTakingItemsIdsCb };
            }
            //  sort: { id: -1 }
            let reportReorderLimits;
            if (where.reportReorderLimits) {
              reportReorderLimits = true;
              delete where.reportReorderLimits;
            }
            app.all({ where, select, limit, sort: { id: -1 } }, (err, docs) => {
              const selectedDocs = [];
              if (reportReorderLimits) {
                docs.forEach((doc) => {
                  let selectedDoc = site.getReorderItems(doc);

                  if (selectedDoc) {
                    selectedDocs.push(selectedDoc);
                  }
                });
              }

              res.json({
                done: true,
                list: selectedDocs.length ? selectedDocs : docs,
              });
            });
          });
        }
      });

      site.stores_items_import_busy = false;
      site.post("/api/stores_items/import", (req, res) => {
        let response = {
          done: false,
          busy: site.stores_items_import_busy,
        };

        res.json(response);

        $itemsFile.findMany(
          {
            where: {
              "company.id": site.get_company(req).id,
              "branch.id": site.get_branch(req).id,
            },
            sort: req.body.sort || {
              id: -1,
            },
          },
          (err, oldDocs) => {
            site.dbMessage = "Load ItemsFile : " + oldDocs.length;

            let unitsList = [];
            let itemsGroupList = [];

            $units.deleteMany({
              where: {
                "company.id": site.get_company(req).id,
                "branch.id": site.get_branch(req).id,
              },
            });
            $items_group.deleteMany({
              where: {
                "company.id": site.get_company(req).id,
                "branch.id": site.get_branch(req).id,
              },
            });
            $stores_items.deleteMany({
              where: {
                "company.id": site.get_company(req).id,
                "branch.id": site.get_branch(req).id,
              },
            });

            oldDocs.forEach((_oldDoc) => {
              let unitExists = unitsList.some((u) => u.name_ar === _oldDoc.unit);
              if (!unitExists) {
                unitsList.push({
                  name_en: _oldDoc.unit,
                  name_ar: _oldDoc.unit,
                });
              }

              let groupExists = itemsGroupList.some((g) => g.name_ar === _oldDoc.category_name_ar);
              if (!groupExists) {
                itemsGroupList.push({
                  name_en: _oldDoc.category_name_en,
                  name_ar: _oldDoc.category_name_ar,
                });
              }
            });

            unitsList.forEach((u, i) => {
              $units.add(
                {
                  name_en: u.name_en,
                  name_ar: u.name_ar,
                  company: site.get_company(req),
                  branch: site.get_branch(req),
                  code: i + 1,
                  image_url: "/images/unit.png",
                  active: true,
                },
                (err, doc) => {
                  if (!err && doc) {
                    unitsList[i] = doc;
                  }
                }
              );
            });

            itemsGroupList.forEach((g, i) => {
              $items_group.add(
                {
                  name_en: g.name_en,
                  name_ar: g.name_ar,
                  company: site.get_company(req),
                  branch: site.get_branch(req),
                  image_url: "/images/product_group.png",
                  active: true,
                  code: i + 1,
                },
                (err, doc) => {
                  itemsGroupList[i] = doc;
                }
              );
            });

            site.dbMessage = "Add UnitList : " + unitsList.length + " \n Add ItemsGroupsList : " + itemsGroupList.length;

            setTimeout(() => {
              oldDocs.forEach((_oldDoc, i) => {
                let itemGroup = itemsGroupList.find((g) => {
                  return g.name_ar === _oldDoc.category_name_ar;
                });
                let itemUnit = unitsList.find((u) => {
                  return u.name_ar === _oldDoc.unit;
                });

                $stores_items.add(
                  {
                    image_url: "/images/store_item.png",
                    allow_sell: true,
                    allow_buy: true,
                    is_pos: true,
                    with_discount: false,
                    item_type: {
                      id: 1,
                      name: "store_item",
                      en: "Store Item",
                      ar: "صنف مخزني",
                    },
                    main_unit: itemUnit,
                    name_en: _oldDoc.name_en,
                    name_ar: _oldDoc.name_ar,
                    item_group: itemGroup,
                    units_list: [
                      {
                        id: itemUnit.id,
                        name_ar: itemUnit.name_ar,
                        name_en: itemUnit.name_en,
                        convert: 1,
                        start_count: 0,
                        current_count: 0,
                        cost: _oldDoc.cost,
                        price: _oldDoc.price,
                        average_cost: 0,
                        discount: {
                          value: 0,
                          max: 0,
                          type: "number",
                        },
                        barcode: _oldDoc.barcode,
                      },
                    ],
                    sizes: [
                      {
                        cost: 0,
                        price: _oldDoc.price,
                        discount: {
                          value: 0,
                          max: 0,
                          type: "number",
                        },
                        image_url: "/images/item_sizes.png",
                        barcode: _oldDoc.barcode,
                        size_ar: _oldDoc.name_ar,
                        size_en: _oldDoc.name_en,
                        start_count: 0,
                        current_count: 0,
                        total_sell_price: 0,
                        total_sell_count: 0,
                        total_buy_cost: 0,
                        total_buy_count: 0,
                        unitsList: [
                          {
                            id: itemUnit.id,
                            name_ar: itemUnit.name_ar,
                            name_en: itemUnit.name_en,
                            convert: 1,
                            start_count: 0,
                            current_count: 0,
                            cost: 0,
                            price: _oldDoc.price,
                            average_cost: 0,
                            discount: {
                              value: 0,
                              max: 0,
                              type: "number",
                            },
                            barcode: _oldDoc.barcode,
                          },
                        ],
                        item_type: {
                          id: 1,
                          name: "store_item",
                          en: "Store Item",
                          ar: "صنف مخزني",
                        },
                      },
                    ],
                    company: site.get_company(req),
                    branch: site.get_branch(req),
                    add_user_info: site.security.getUserFinger({
                      $req: req,
                      $res: res,
                    }),
                    code: _oldDoc.id,
                  },
                  (err, doc) => {
                    if (!err && doc) {
                      site.dbMessage = "Add Item :" + doc.id;
                    } else {
                      site.dbMessage = err.message;
                    }
                  }
                );
              });
            }, 1000 * 5);
          }
        );
      });

      site.post(`api/${app.name}/importIdfList`, (req, res) => {
        let response = {
          done: false,
          file: req.form.files.fileToUpload,
        };

        if (site.isFileExistsSync(response.file.filepath)) {
          let docs = [];
          if (response.file.originalFilename.like("*.xls*")) {
            let workbook = site.XLSX.readFile(response.file.filepath);
            docs = site.XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
          } else {
            docs = site.fromJson(site.readFileSync(response.file.filepath).toString());
          }

          if (Array.isArray(docs)) {
            console.log(`Importing IDF List : ${docs.length}`);
            let systemCode = 0;
            docs.forEach((doc) => {
              app.$collection.find({ where: { nameEn: String(doc["Trade Name"]).trim() } }, (err, exisitDoc) => {
                if (!exisitDoc) {
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

                  let gtinList = [];

                  if (doc.GTIN1 && String(doc.GTIN1).length > 7) {
                    gtinList.push({ gtin: doc.GTIN1 });
                  }
                  if (doc.GTIN2 && String(doc.GTIN2).length > 7) {
                    gtinList.push({ gtin: doc.GTIN2 });
                  }
                  if (doc.GTIN3 && String(doc.GTIN3).length > 7) {
                    gtinList.push({ gtin: doc.GTIN3 });
                  }
                  if (doc.GTIN4 && String(doc.GTIN4).length > 7) {
                    gtinList.push({ gtin: doc.GTIN4 });
                  }
                  if (doc.GTIN5 && String(doc.GTIN5).length > 7) {
                    gtinList.push({ gtin: doc.GTIN5 });
                  }
                  if (doc.GTIN6 && String(doc.GTIN6).length > 7) {
                    gtinList.push({ gtin: doc.GTIN6 });
                  }
                  if (doc.GTIN7 && String(doc.GTIN7).length > 7) {
                    gtinList.push({ gtin: doc.GTIN7 });
                  }
                  if (doc.GTIN8 && String(doc.GTIN8).length > 7) {
                    gtinList.push({ gtin: doc.GTIN8 });
                  }
                  if (doc.GTIN9 && String(doc.GTIN9).length > 7) {
                    gtinList.push({ gtin: doc.GTIN9 });
                  }
                  if (doc.GTIN10 && String(doc.GTIN10).length > 7) {
                    gtinList.push({ gtin: doc.GTIN10 });
                  }

                  // let activeSubstancesList = [];

                  // if (doc['Scientific Name']) {
                  //     const elementsList = doc['Scientific Name'].split(',');
                  // const strengthList = doc['Strength'].split(',');
                  // elementsList.forEach((elem) => {
                  //     activeSubstancesList.push({
                  //         activeSubstance: {
                  //             nameAr: elem.trim(),
                  //             nameEn: elem.trim(),
                  //             image: { url: '/images/activeSubstances.png' },
                  //             active: true,
                  //         },
                  //     });

                  // if (!ingredientList.includes(elem.trim())) {
                  //     ingredientList.push(elem.trim());
                  // }
                  // });

                  // strengthList.forEach((elm) => {
                  //     activeSubstancesList.push({
                  //         concentration: elm,
                  //     });
                  // if (!ingredientList.includes(elm.trim())) {
                  //     ingredientList.push(elm.trim());
                  // }
                  // });

                  // activeSubstancesList.push({
                  //     activeSubstance:{
                  //         nameAr:
                  //     },
                  // });
                  // }
                  // console.log('activeSubstancesList', activeSubstancesList);

                  let newDoc = {
                    code: systemCode,
                    nameAr: String(doc["Trade Name"]).trim(),
                    nameEn: String(doc["Trade Name"]).trim(),
                    scientificName: String(doc["Scientific Name"]).trim(),
                    hasMedicalData: true,
                    collectionItem: false,
                    itemType: site.itemsTypes.find((type) => type.id === 1),
                    sfdaCodeList: [{ sfdaCode: String(doc["Register Number"]).trim() }],
                    gtinList,
                    unitsList: [],
                    medicalInformations: {},
                    workByQrCode: true,
                    allowSale: true,
                    allowBuy: true,
                    reorderLimit: 0,
                    image: { url: "/images/storesItems.png" },
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
                }
              });
            });
          } else {
            site.dbMessage = "can not import unknown type : " + site.typeof(docs);
            console.log(site.dbMessage);
          }
        } else {
          site.dbMessage = "file not exists : " + response.file.filepath;
          console.log(site.dbMessage);
        }

        res.json(response);
      });

      site.post(`api/${app.name}/importHumanDrugs`, (req, res) => {
        let response = {
          done: false,
          file: req.form.files.fileToUpload,
        };

        if (site.isFileExistsSync(response.file.filepath)) {
          let docs = [];
          if (response.file.originalFilename.like("*.xls*")) {
            let workbook = site.XLSX.readFile(response.file.filepath);
            docs = site.XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
          } else {
            docs = site.fromJson(site.readFileSync(response.file.filepath).toString());
          }

          if (Array.isArray(docs)) {
            console.log(`Importing Human Drugs : ${docs.length}`);
            docs.forEach((doc) => {
              app.$collection.find({ where: { nameEn: String(doc["Trade Name"]).trim() } }, (err, exisitDoc) => {
                if (exisitDoc) {
                  app.importHumanDrugsbusyList.push(exisitDoc.id);
                  const valid = app.validateExisitDrugInBusyList(exisitDoc.id);
                  if (valid) {
                    setTimeout(() => {
                      app.validateExisitDrugInBusyList(exisitDoc.id);
                    }, 200);
                    return;
                  }
                  const sfdaIndex = exisitDoc.sfdaCodeList.findIndex((sfda) => sfda.sfdaCode == String(doc["RegisterNumber"]).trim());

                  if (sfdaIndex !== -1) {
                    const elementsList = String(doc["Scientific Name"]).split(",");
                    const strengthList = doc["Strength"].split(",");
                    let activeSubstancesList = [];

                    let activeSubstanceItem = {};
                    if (elementsList.length == 1) {
                      activeSubstanceItem = {
                        activeSubstance: {
                          nameAr: elementsList[0].trim(),
                          nameEn: elementsList[0].trim(),
                          image: { url: "/images/activeSubstances.png" },
                          active: true,
                        },
                      };
                      activeSubstanceItem.concentration = strengthList[0] + " " + String(doc["StrengthUnit"]).trim();
                    } else {
                      elementsList.forEach((elem, index) => {
                        activeSubstanceItem = {
                          activeSubstance: {
                            nameAr: elem.trim(),
                            nameEn: elem.trim(),
                            image: { url: "/images/activeSubstances.png" },
                            active: true,
                          },
                        };

                        if (strengthList.length == 1) {
                          activeSubstanceItem.concentration = strengthList[0] + " " + String(doc["StrengthUnit"]).trim();
                        } else if (strengthList.length > 1) {
                          let item = strengthList.findIndex(() => strengthList.indexOf(index));
                          activeSubstanceItem.concentration = strengthList[item] + " " + String(doc["StrengthUnit"]).trim();
                        }
                        activeSubstancesList.push(activeSubstanceItem);

                        exisitDoc.medicalInformations.activeSubstancesList = activeSubstancesList;
                      });
                    }
                    const storesUnitsApp = site.getApp("storesUnits");
                    storesUnitsApp.$collection.find(
                      {
                        where: { nameEn: String(doc["PackageTypes"]).trim() },
                      },
                      (err, foundUnit) => {
                        const unit = {
                          _id: foundUnit?._id,
                          id: foundUnit?.id,
                          nameAr: foundUnit.nameAr ? foundUnit?.nameAr.trim() : "",
                          nameEn: foundUnit.nameEn ? foundUnit?.nameEn.trim() : "",
                          image: foundUnit?.image,
                        };
                        const conversion = Number(String(doc["PackageSize"]).trim());
                        const salesPrice = Number(String(doc["Public price"]).trim());
                        exisitDoc.unitsList = [
                          {
                            unit,
                            conversion,
                            salesPrice,
                            barcode: "",
                            purchasePrice: 0,
                            purchasePrice: 0,
                            averageCost: 0,
                            discount: 0,
                            maxDiscount: 0,
                            currentCount: 0,
                            purchasePriceList: [],
                            salesPriceList: [{ price: salesPrice, date: new Date() }],
                            discountType: "value",
                            storesList: [],
                            active: true,
                          },
                        ];

                        app.update(exisitDoc, () => {
                          site.dbMessage = `Importing Human Drugs : ${exisitDoc.id}`;

                          const itemIndex = app.importHumanDrugsbusyList.findIndex(() => exisitDoc.id);
                          if (itemIndex != -1) {
                            app.importHumanDrugsbusyList.splice(itemIndex, 1);
                          }
                        });
                      }
                    );
                  }
                }
              });
            });
          } else {
            site.dbMessage = "can not import unknown type : " + site.typeof(docs);
            console.log(site.dbMessage);
          }
        } else {
          site.dbMessage = "file not exists : " + response.file.filepath;
          console.log(site.dbMessage);
        }

        res.json(response);
      });
    }
  }
  site.post({ name: `/api/${app.name}/getBatch`, require: { permissions: ["login"] } }, (req, res) => {
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
            let batchIndex = doc.unitsList[unitIndex].storesList[storeIndex].batchesList.findIndex((b) => (where.sn ? b.sn == where.sn : b.code == where.code));
            if (batchIndex != -1) {
              doc.unitsList[unitIndex].storesList[storeIndex].batchesList[batchIndex];
              let batch = {
                ...doc.unitsList[unitIndex].storesList[storeIndex].batchesList[batchIndex],
              };

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
                  error: "Not Found Count",
                });
              }
            } else {
              let batchesList = [];
              for (let i = 0; i < doc.unitsList[unitIndex].storesList[storeIndex].batchesList.length; i++) {
                let element = doc.unitsList[unitIndex].storesList[storeIndex].batchesList[i];
                if (element.count > 0) {
                  batchesList.push(element);
                }
              }

              if (doc.workByBatch || doc.workByQrCode) {
                batchesList = batchesList.sort((a, b) => new Date(b.expiryDate) - new Date(a.expiryDate)).reverse();
              } else if (doc.workBySerial) {
                batchesList = batchesList.sort((a, b) => new Date(b.productionDate) - new Date(a.productionDate)).reverse();
              }
              res.json({
                done: true,
                docs: batchesList.slice(0, 50),
              });
            }
          } else {
            res.json({
              done: false,
              error: "Not Found",
            });
          }
        } else {
          res.json({
            done: false,
            error: "Not Found",
          });
        }
      } else {
        res.json({
          done: false,
          error: "Not Found",
        });
      }
    });
  });

  site.post(
    {
      name: `/api/${app.name}/handelItemsData`,
      require: { permissions: ["login"] },
    },
    (req, res) => {
      let items = req.body.items;
      let storeId = req.body.storeId;
      let itemIds = items.map((_item) => _item.id);
      const storesSetting = site.getCompanySetting(req).storesSetting;

      app.all({ where: { id: { $in: itemIds } } }, (err, docs) => {
        site.getSalesInvoice({ "doctorDeskTop.id": req.body.doctorDeskTopId }, (salesInvoicesData) => {
          let obj = { done: true };
          let appInsuranceContract = site.getApp("insuranceContracts");
          let insuranceContract = appInsuranceContract.memoryList.find((_c) => _c.id == req.body.insuranceCompanyId);

          if (insuranceContract && new Date(insuranceContract.startDate) <= new Date() && new Date(insuranceContract.endDate) >= new Date()) {
            let insuranceClass = insuranceContract.insuranceClassesList.find((_c) => _c.id == _data.insuranceClassId);
            if (insuranceClass) {
              obj.insuranceContract = {
                serviceDeduct: insuranceClass.serviceDeduct,
                serviceType: insuranceClass.serviceType,
                maxDeductAmount: insuranceClass.maxDeductAmount,
                appliesMedicalDevice: insuranceClass.appliesMedicalDevice,
                deductMedicalDevice: insuranceClass.deductMedicalDevice,
                maxAmountMedicalDevice: insuranceClass.maxAmountMedicalDevice,
                appliesBrand: insuranceClass.appliesBrand,
                deductBrand: insuranceClass.deductBrand,
                maxAmountBrand: insuranceClass.maxAmountBrand,
                appliesGeneric: insuranceClass.appliesGeneric,
                deductGeneric: insuranceClass.deductGeneric,
                maxAmountGeneric: insuranceClass.maxAmountGeneric,
              };
            }
          }
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
                item.discountType = unitDoc.discountType;
                item.discount = unitDoc.discount;
                item.averageCost = unitDoc.averageCost;
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
              item.totalVat = 0;
              item.noVat = itemDoc.noVat;
              item.totalPrice = unitDoc.price * item.count;
              item.hasMedicalData = itemDoc.hasMedicalData;
              item.hasColorsData = itemDoc.hasColorsData;
              item.hasSizesData = itemDoc.hasSizesData;
              item.itemsMedicalTypes = itemDoc.itemsMedicalTypes;
              item.totalDiscounts = item.discountType === "value" ? item.discount : (item.totalPrice * item.discount) / 100;
              item.totalAfterDiscounts = item.totalPrice - item.totalDiscounts;
              if (!item.noVat) {
                item.vat = storesSetting.storesSetting && storesSetting.storesSetting.vat ? storesSetting.storesSetting.vat : 0;
                item.totalVat = (item.totalAfterDiscounts * item.vat) / 100;
                item.totalVat = site.toNumber(item.totalVat);
              } else {
                item.vat = 0;
              }
              item.total = item.totalAfterDiscounts + item.totalVat;

              if (item.itemsMedicalTypes && obj.insuranceContract) {
                if (item.itemsMedicalTypes.id == 1 && obj.insuranceContract.appliesGeneric == "yes") {
                  item.deduct = (total * obj.insuranceContract.deductGeneric) / 100;
                  item.maxDeduct = obj.insuranceContract.maxAmountGeneric;
                  if (item.deduct + salesInvoicesData.totalGeneric > obj.insuranceContract.maxAmountGeneric) {
                    let remain = item.deduct + salesInvoicesData.totalGeneric - obj.insuranceContract.maxAmountGeneric;
                    item.companyCash = item.total - (item.deduct + remain);
                    item.total = item.deduct - remain;
                  } else {
                    item.companyCash = item.total - item.deduct;
                    item.total = item.deduct;
                  }
                } else if (item.itemsMedicalTypes.id == 2 && obj.insuranceContract.appliesBrand == "yes") {
                  item.deduct = (total * obj.insuranceContract.deductBrand) / 100;
                  item.maxDeduct = obj.insuranceContract.maxAmountBrand;
                  if (item.deduct + salesInvoicesData.totalBrand > obj.insuranceContract.maxAmountBrand) {
                    let remain = item.deduct + salesInvoicesData.totalBrand - obj.insuranceContract.maxAmountBrand;
                    item.companyCash = item.total - (item.deduct + remain);
                    item.total = item.deduct - remain;
                  } else {
                    item.companyCash = item.total - item.deduct;
                    item.total = item.deduct;
                  }
                } else if (item.itemsMedicalTypes.id == 3 && obj.insuranceContract.appliesMedicalDevice == "yes") {
                  item.deduct = (total * obj.insuranceContract.deductMedicalDevice) / 100;
                  item.maxDeduct = obj.insuranceContract.maxAmountMedicalDevice;
                  if (item.deduct + salesInvoicesData.totalMedicalDevice > obj.insuranceContract.maxAmountMedicalDevice) {
                    let remain = item.deduct + salesInvoicesData.totalMedicalDevice - obj.insuranceContract.maxAmountMedicalDevice;
                    item.companyCash = item.total - (item.deduct + remain);
                    item.total = item.deduct - remain;
                  } else {
                    item.companyCash = item.total - item.deduct;
                    item.total = item.deduct;
                  }
                }
              }
              item.totalDiscounts = site.toNumber(item.totalDiscounts);
              item.totalAfterDiscounts = site.toNumber(item.totalAfterDiscounts);
              item.totalVat = site.toNumber(item.totalVat);
              item.total = site.toNumber(item.total);

              // if (insuranceContract) {
              //   if (item.itemsMedicalTypes && item.itemsMedicalTypes.id == 1) {
              //     if (insuranceContract.appliesGeneric == 'yes') {
              //       item.insurance = true;
              //       item.serviceDeduct = insuranceContract.serviceDeduct;
              //       item.serviceType = insuranceContract.serviceType;
              //       item.maxDeductAmount = insuranceContract.maxDeductAmount;
              //     } else {
              //       item.insurance = false;
              //     }
              //   } else if (item.itemsMedicalTypes && item.itemsMedicalTypes.id == 2) {
              //     if (insuranceContract.appliesBrand == 'yes') {
              //       item.insurance = true;
              //       item.serviceDeduct = insuranceContract.serviceDeduct;
              //       item.serviceType = insuranceContract.serviceType;
              //       item.maxDeductAmount = insuranceContract.maxDeductAmount;
              //     } else {
              //       item.insurance = false;
              //     }
              //   } else if (item.itemsMedicalTypes && item.itemsMedicalTypes.id == 3) {
              //     if (insuranceContract.appliesMedicalDevice == 'yes') {
              //       item.insurance = true;
              //       item.serviceDeduct = insuranceContract.serviceDeduct;
              //       item.serviceType = insuranceContract.serviceType;
              //       item.maxDeductAmount = insuranceContract.maxDeductAmount;
              //     } else {
              //       item.insurance = false;
              //     }
              //   }
              // }
            }
          }

          obj.list = items;

          res.json(obj);
        });
      });
    }
  );

  site.post(
    {
      name: `/api/${app.name}/resetForCompany`,
      require: { permissions: ["login"] },
    },
    (req, res) => {
      let response = {
        done: false,
      };

      app.$collection.findMany(
        {
          where: {
            "company.id": req.data.id,
          },
        },
        (err, docs) => {
          for (let i = 0; i < docs.length; i++) {
            docs[i].unitsList.forEach((_unit) => {
              _unit.purchasePriceList = [{ price: _unit.purchasePrice, date: new Date() }];
              _unit.salesPriceList = [{ price: _unit.salesPrice, date: new Date() }];
              _unit.storesList = [];
              _unit.currentCount = 0;
            });
            app.$collection.update(docs[i]);
          }
          response.err = err;
          response.done = true;
          res.json(response);
        }
      );
    }
  );

  app.init();
  site.addApp(app);
};
