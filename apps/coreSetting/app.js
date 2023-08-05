module.exports = function init(site) {
  let app = {
    name: 'coreSetting',
    allowMemory: true,
    memoryList: [],
    allowCache: false,
    cacheList: [],
    allowRoute: true,
    allowRouteGet: true,
    allowRouteDelete: true,
    allowRouteSave: true,
    allowRouteGetSetting: true,
  };

  site.coreSetting = {core : true};

  app.$collection = site.connectCollection('systemSetting');
  app.init = function () {
    if (app.allowMemory) {
      app.$collection.findOne({ core: true }, (err, doc) => {
        if (!err) {
          if (doc && doc.id) {
            app.memoryList.push(doc);
          } else {
            app.$collection.add(site.coreSetting, (err, doc) => {
              if (!err && doc) {
                app.memoryList.push(doc);
              }
            });
          }
        }
      });
    }
  };

  site.getCoreSetting = function (req) {
    site.coreSetting = app.memoryList.find((s) => s.core) || site.coreSetting;
    return site.coreSetting;
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
          let index = app.allowMemory.findIndex((a) => a.id === _item.id);
          if (index !== -1) {
            app.allowMemory.splice(index, 1);
          }
        }
      }
    );
  };

  app.save = function (_item, callback) {
    app.$collection.find({ where: { core: true } }, (err, doc) => {
      if (!doc) {
        app.$collection.add(_item, (err, doc) => {
          if (callback) {
            callback(err, doc);
          }
          if (app.allowMemory && !err && doc) {
            app.memoryList.push(doc);
          }
        });
      } else {
        doc = { ...doc, ..._item };
        app.$collection.edit(doc, (err, result) => {
          if (callback) {
            callback(err, result);
          }
          if (result && result.doc) {
          }

          if (app.allowMemory && !err && result) {
            let index = app.memoryList.findIndex((itm) => itm.id === result.doc.id);
            if (index !== -1) {
              app.memoryList[index] = result.doc;
            } else {
              app.memoryList.push(result.doc);
            }
          } else if (app.allowCache && !err && result) {
            let index = app.allowMemory.findIndex((itm) => itm.id === result.doc.id);
            if (index !== -1) {
              app.allowMemory[index] = result.doc;
            } else {
              app.allowMemory.push(result.doc);
            }
          }
        });
      }
    });
  };

  if (app.allowRoute) {
    if (app.allowRouteGet) {
      site.get(
        {
          name: app.name,
        },
        (req, res) => {
          res.render(app.name + '/index.html', { title: app.name, appName: 'Core Settings' }, { parser: 'html', compres: true });
        }
      );
    }

    if (app.allowRouteSave) {
      site.post({ name: `/api/${app.name}/save`, require: { permissions: ['login'] } }, (req, res) => {
        let response = {
          done: false,
        };

        let _data = req.data;
        _data.editUserInfo = req.getUserFinger();
        app.save(_data, (err, result) => {
          if (!err && result && result.doc) {
            response.done = true;
            response.result = result;
            site.coreSetting = result.doc;
          } else if (err) {
            response.error = err?.message || 'Error In Core Setting';
          } else {
            app.$collection.add(_data, (err, doc) => {
              if (app.allowMemory && !err && doc) {
                app.memoryList.push(doc);
                site.coreSetting = doc;
              }
            });
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
            app.memoryList = app.memoryList.filter((n) => n.core);
            response.doc = site.coreSetting;
          } else {
            response.error = err?.message || 'Deleted Not Exists';
          }
          res.json(response);
        });
      });
    }

    if (app.allowRouteGetSetting) {
      site.post({ name: `/api/${app.name}/get`, public: true }, (req, res) => {
        site.coreSetting = site.getCoreSetting(req);
        res.json({
          done: true,
          doc: site.coreSetting,
        });
      });
    }
  }

  app.init();

  site.addApp(app);
};
