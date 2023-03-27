module.exports = function init(site) {
  let app = {
    name: 'radiologyDeskTop',
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
          res.render(app.name + '/index.html', { title: app.name, appName: 'Radiology DeskTop' }, { parser: 'html', compres: true });
        }
      );
    }

    if (app.allowRouteAdd) {
      site.post({ name: `/api/${app.name}/add`, require: { permissions: ['login'] } }, (req, res) => {
        let response = {
          done: false,
        };

        let _data = req.data;

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
            let newDate = new Date();
            doc.$hours = parseInt((Math.abs(new Date(doc.date) - newDate) / (1000 * 60 * 60)) % 24);
            doc.$minutes = parseInt((Math.abs(new Date(doc.date).getTime() - newDate.getTime()) / (1000 * 60)) % 60);
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
        let select = req.body.select || { id: 1, patient: 1, doctor: 1, code: 1, service: 1, mainInsuranceCompany: 1, date: 1, status: 1 };
        let list = [];
        if (app.allowMemory) {
          app.memoryList
            .filter((g) => !where['doctor.id'] || g.doctor.id == where['doctor.id'])
            .forEach((doc) => {
              let obj = { ...doc };
              for (const p in obj) {
                if (!Object.hasOwnProperty.call(select, p)) {
                  delete obj[p];
                }
              }
              list.push(obj);
            });
          res.json({
            done: true,
            list: list,
          });
        } else {
          where['company.id'] = site.getCompany(req).id;

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
          if (where['doctor']) {
            where['doctor.id'] = where['doctor'].id;
            delete where['doctor'];
          }
          app.all({ where, select, sort: { code: -1 }, limit: req.body.limit }, (err, docs) => {
            let newDate = new Date();
            docs.forEach((_d) => {
              _d.$hours = parseInt((Math.abs(new Date(_d.date) - newDate) / (1000 * 60 * 60)) % 24);
              _d.$minutes = parseInt((Math.abs(new Date(_d.date).getTime() - newDate.getTime()) / (1000 * 60)) % 60);
            });
            res.json({
              done: true,
              list: docs,
            });
          });
        }
      });
    }
  }

  site.post({ name: `/api/selectRadiologyDeskTop`, require: { permissions: ['login'] } }, (req, res) => {
    let appServices = site.getApp('services');
    let response = { done: false };
    let _data = req.body;
    let service = appServices.memoryList.find((_c) => _c.id == _data.doctor.consItem.id);
    if (_data.patient.insuranceCompany && _data.patient.insuranceCompany.id) {
      site.mainInsurancesFromSub({ insuranceCompanyId: _data.patient.insuranceCompany.id }, (callback) => {
        callback.service = service;

        res.json(callback);
      });
    } else {
      response.error = 'There is no insurance company for the patient';
      res.json(response);
      return;
    }
  });

  site.addRadiologyDeskTop = function (obj) {
    let date = new Date();
    let d1 = site.toDate(date);
    let d2 = site.toDate(date);
    d2.setDate(d2.getDate() + 1);
    let where = {};
    where.date = {
      $gte: d1,
      $lt: d2,
    };
    // if (obj.doctor && obj.doctor.id) {
    //   where['doctor.id'] = obj.doctor.id;
    // }
    app.all(
      {
        where,
        limit: 1,
        sort: {
          id: -1,
        },
      },
      (err, docs) => {
        if (!err) {
          obj.code = docs && docs.length > 0 ? docs[0].code + 1 : 1;
          obj.filesList = [{}];
          app.add(obj, (err, doc1) => {});
        }
      }
    );
  };

  app.init();
  site.addApp(app);
};
