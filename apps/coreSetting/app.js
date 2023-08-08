module.exports = function init(site) {
  let app = {
    name: 'coreSetting',
    allowMemory: true,
    memoryList: [],
    allowCache: false,
    cacheList: [],
    allowRoute: true,
    allowRouteGet: true,
    allowRouteSave: true,
    allowRouteGetSetting: true,
  };

  site.setting = {
    siteLogo: { url: '/images/logo.png' },
    siteName: 'Smart Code',
    siteSeparator: '-',
    siteSlogan: 'SoftWare Solutions',
    core: true,
    siteColor1: '#bec011',
    siteColor2: '#245a40',
    siteColor3: '#f5f5f5',
  };

  app.$collection = site.connectCollection('coreSetting');
  app.init = function () {
    if (app.allowMemory) {
      app.$collection.findOne({ core: true }, (err, doc) => {
        if (!err) {
          if (doc && doc.id) {
            app.memoryList.push(doc);
            site.setting = doc;
          } else {
            app.$collection.add(site.setting, (err, doc) => {
              if (!err && doc) {
                app.memoryList.push(doc);
                site.setting = doc;
              }
            });
          }
        }
      });
    }
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
          res.render(app.name + '/index.html', { title: app.name, appName: 'Core Settings', setting: site.getCompanySetting(req) }, { parser: 'html', compres: true });
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
            site.setting = result.doc;
          } else if (err) {
            response.error = err?.message || 'Error In Core Setting';
          } else {
            app.$collection.add(_data, (err, doc) => {
              if (app.allowMemory && !err && doc) {
                app.memoryList.push(doc);
                site.setting = doc;
              }
            });
          }
          res.json(response);
        });
      });
    }

    if (app.allowRouteGetSetting) {
      site.post({ name: `/api/${app.name}/get`, public: true }, (req, res) => {
        res.json({
          done: true,
          doc: site.setting,
        });
      });
    }
  }

  app.init();

  site.addApp(app);
};
