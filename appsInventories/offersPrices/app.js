module.exports = function init(site) {
  let app = {
    name: 'offersPrices',
    allowMemory: false,
    memoryList: [],
    allowCache: false,
    cacheList: [],
    allowRoute: true,
    allowRouteGet: true,
    allowRouteAdd: true,
    allowRouteUpdate: true,
    allowRouteApprove: true,
    allowRouteUnapprove: true,
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
          res.render(app.name + '/index.html', { title: app.name, appName: 'Offers Prices', setting: site.getCompanySetting(req) }, { parser: 'html', compres: true });
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
        app.$collection.find({ code: _data.code }, (err, doc) => {
          if (doc) {
            response.error = 'Code Exisit';
            res.json(response);
            return;
          }
          _data.addUserInfo = req.getUserFinger();
          const storesSetting = site.getCompanySetting(req).storesSetting;
          if (storesSetting.autoApprovedOffersOrders) {
            _data.approved = true;
          } else {
            _data.approved = false;
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
      site.post({ name: `/api/${app.name}/update`, require: { permissions: ['login'] } }, (req, res) => {
        let response = {
          done: false,
        };

        let _data = req.data;
        app.$collection.find({ id: _data.id, code: { $ne: _data.code } }, (err, doc) => {
          if (doc) {
            response.error = 'Code Exisit';
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
    }

    if (app.allowRouteApprove) {
      site.post({ name: `/api/${app.name}/approve`, require: { permissions: ['login'] } }, (req, res) => {
        let response = {
          done: false,
        };

        let _data = req.data;
        if (!_data.id) {
          response.error = 'No Id';
          res.json(response);
          return;
        }
        _data.approvedUserInfo = req.getUserFinger();
        _data.approvedDate = new Date();

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

    if (app.allowRouteUnapprove) {
      site.post({ name: `/api/${app.name}/unapprove`, require: { permissions: ['login'] } }, (req, res) => {
        let response = {
          done: false,
        };

        let _data = req.data;
        _data.unapprovedUserInfo = req.getUserFinger();
        _data.unapprovedDate = new Date();

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

        let select = req.body.select || { id: 1, code: 1, title: 1, requestDate: 1, approvedDate: 1, itemsList: 1, approved: 1, active: 1, date: 1, hasTransaction: 1, customer: 1 };
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
              if ((!where.active || doc.active) && !doc.approved) {
                list.push(obj);
              }
            });
          res.json({
            done: true,
            list: code,
          });
        } else {
          where['company.id'] = site.getCompany(req).id;

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
        let search = req.body.search || '';
        let limit = req.body.limit || 50;

        let select = req.body.select || { id: 1, code: 1, title: 1, requestDate: 1, approvedDate: 1, itemsList: 1, approved: 1, active: 1, hasTransaction: 1 };
        let list = [];

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

  app.init();
  site.addApp(app);
};
