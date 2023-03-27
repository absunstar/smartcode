module.exports = function init(site) {
  let app = {
    name: 'patients',
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

  app.$collection = site.connectCollection('users_info');

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
          res.render(app.name + '/index.html', { title: app.name, appName: 'Patients' }, { parser: 'html', compres: true });
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
        _data.branchList = [
          {
            company: _data.company,
            branch: _data.branch,
          },
        ];
        let numObj = {
          company: site.getCompany(req),
          screen: app.name,
          date: new Date(),
        };
        if (_data.mobileList.length > 0) {
          _data.mobile = _data.mobileList[0].mobile;
        } else {
          response.error = 'Must Add Mobile Number';
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

        _data.addUserInfo = req.getUserFinger();
        _data.type = site.usersTypesList[4];
        if (!_data.email) {
          _data.email = _data.nameEn + Math.floor(Math.random() * 1000 + 1).toString();
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
    }

    if (app.allowRouteUpdate) {
      site.post({ name: `/api/${app.name}/update`, require: { permissions: ['login'] } }, (req, res) => {
        let response = {
          done: false,
        };

        let _data = req.data;
        _data.editUserInfo = req.getUserFinger();
        if (_data.mobileList.length > 0) {
          _data.mobile = _data.mobileList[0].mobile;
        } else {
          response.error = 'Must Add Mobile Number';
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
            if (doc.dateOfBirth) {
              let birthYear = new Date(doc.dateOfBirth).getFullYear();
              doc.age = new Date().getFullYear() - birthYear;
            }
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
        let where = req.body.where || { 'type.id': 5 };
        let select = req.body.select || { id: 1, code: 1, fullNameEn: 1, fullNameAr: 1, image: 1 };
        let search = req.body.search || undefined;

        if (app.allowMemory) {
          let list = [];
          app.memoryList
            .filter((g) => (!where['type.id'] || (g.type && g.type.id == where['type.id'])) && g.company && g.company.id == site.getCompany(req).id)
            .forEach((doc) => {
              let obj = { ...doc };
              if (doc.dateOfBirth) {
                let birthYear = new Date(doc.dateOfBirth).getFullYear();
                obj.age = new Date().getFullYear() - birthYear;
              }
              for (const p in obj) {
                if (!Object.hasOwnProperty.call(select, p)) {
                  delete obj[p];
                }
              }
              if (!where.active || doc.active) {
                if (obj.expiryDate) {
                  if (new Date(obj.expiryDate) < new Date()) {
                    obj.expirePatient = true;
                  }
                }
                list.push(obj);
              }
            });
          res.json({
            done: true,
            list: list,
          });
        } else {
          where['company.id'] = site.getCompany(req).id;

          if (search) {
            where.$or = [];
  
            where.$or.push({
              id: site.get_RegExp(search, 'i'),
            });
            where.$or.push({
              code: site.get_RegExp(search, 'i'),
            });
            where.$or.push({
              fullNameAr: site.get_RegExp(search, 'i'),
            });
            where.$or.push({
              fullNameEn: site.get_RegExp(search, 'i'),
            });
            where.$or.push({
              'mobileList.mobile': site.get_RegExp(search, 'i'),
            });
            where.$or.push({
              motherNameEn: site.get_RegExp(search, 'i'),
            });
            where.$or.push({
              motherNameAr: site.get_RegExp(search, 'i'),
            });
            where.$or.push({
              email: site.get_RegExp(search, 'i'),
            });
          
          }

          app.all({ where, select, sort: { id: -1 }, limit: req.body.limit }, (err, docs) => {
          
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
