module.exports = function init(site) {
  let app = {
    name: 'storesItemsCard',
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
  };

  site.setItemCard = function (_elm, screenName) {
    app.all(
      {
        where: { id: _elm.id, 'unit.id': _elm.unit.id, 'store.id': _elm.store.id },
        sort: { id: -1 },
        limit: 1,
      },
      (err, docs) => {
        if (!err) {
          docs = docs || [];

          let count = _elm.count;
          if (_elm.countType == 'out') {
              -Math.abs(count);
          }

          let obj = {
            date: _elm.date,
            itemId: _elm.id,
            itemCode: _elm.code,
            orderCode: _elm.orderCode,
            nameAr: _elm.nameAr,
            nameEn: _elm.nameEn,
            unit: _elm.unit,
            itemGroup: _elm.itemGroup,
            store: _elm.store,
            vendor: _elm.vendor,
            customer: _elm.customer,
            invoiceId: _elm.invoiceId,
            transactionType: site.storesTransactionsTypes.find((t) => t.code === screenName),
            count: _elm.count,
            price: _elm.price,
            totalPrice: _elm.total,
            currentCount: docs[0] ? docs[0].currentCount + count : count,
            lastCount: docs[0] ? docs[0].lastCount + count : 0,
            company: _elm.company,
            countType: _elm.countType,
          };
          if (screenName === 'transferItemsOrders' && _elm.$type == 'transferItemsOrdersTo') {
            obj = {
              ...obj,
              store: _elm.toStore,
              countType: 'in',
            };
          } else if (screenName === 'convertUnits' && _elm.$type == 'convertUnitsTo') {
            obj = {
              ...obj,
              unit: _elm.toUnit,
              count: _elm.toCount,
              price: _elm.toPrice,
              total: _elm.toTotal,
              countType: 'in',
            };
          } else if (_elm.bonusCount) {
            obj.bonusCount = _elm.bonusCount;
            obj.count += obj.bonusCount;
            obj.purshaseCount = _elm.count;
          }
          app.$collection.add(obj);
          if (screenName === 'transferItemsOrders' && !_elm.$type) {
            site.setItemCard({ ..._elm, $type: 'transferItemsOrdersTo' }, screenName);
          } else if (screenName === 'convertUnits' && !_elm.$type) {
            site.setItemCard({ ..._elm, $type: 'convertUnitsTo' }, screenName);
          }
        }
      }
    );
  };

  app.$collection = site.connectCollection(app.name);
  //   where['name'] = site.get_RegExp(where['name'], 'i');

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
          res.render(app.name + '/index.html', { title: app.name, appName: 'Stores Items Card' }, { parser: 'html', compres: true });
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
        let select = req.body.select || {};
        let list = [];
        if (where.item) {
          where['itemId'] = where.item.id;
          delete where.item;
        }

        if (where.itemGroup) {
          where['itemGroup.id'] = where.itemGroup.id;
          delete where.itemGroup;
        }

        if (where.store) {
          where['store.id'] = where.store.id;
          delete where.store;
        }

        if (where.vendor) {
          where['vendor.id'] = where.vendor.id;
          delete where.vendor;
        }

        if (where.transactionType) {
          where['transactionType.id'] = where.transactionType.id;
          delete where.transactionType;
        }

        if (where && where.dateTo) {
          let d1 = site.toDate(where.date);
          let d2 = site.toDate(where.dateTo);
          d2.setDate(d2.getDate() + 1);
          where.date = {
            $gte: d1,
            $lt: d2,
          };
          delete where.dateTo;
        } else if (where.date) {
          let d1 = site.toDate(where.date);
          let d2 = site.toDate(where.date);
          d2.setDate(d2.getDate() + 1);
          where.date = {
            $gte: d1,
            $lt: d2,
          };
        }

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
          app.all({ where: where, select, sort: { id: -1 } }, (err, docs) => {
            res.json({
              done: true,
              list: docs,
            });
          });
        }
      });
    }
  }

  app.init();
  site.addApp(app);
};
