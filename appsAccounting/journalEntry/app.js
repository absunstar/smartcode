module.exports = function init(site) {
  let app = {
    name: 'journalEntry',
    allowMemory: true,
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
            if (_ac.costCentersList.reduce((a, b) => +a + +b.rate, 0) != 100) {
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
        let select = req.body.select || { id: 1, code: 1, nameEn: 1, nameAr: 1, image: 1 };
        let list = [];
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
      });
    }
  }

  site.autoJournalEntry = function (session, obj) {
    let setting = site.getSystemSetting({ session });
    let index = setting.establishingAccountsList.findIndex((itm) => itm.screen.name === obj.appName);
    if (index !== -1) {
      let establish = setting.establishingAccountsList[index];

      if (establish.screen.active) {
        let numObj = {
          company: site.getCompany({ session }),
          screen: app.name,
          date: new Date(),
        };
        let journalEntry = {
          date: new Date(),
          image: obj.image,
          active: true,
          totalDebtor: 0,
          totalCreditor: 0,
          accountsList: [],
          company: site.getCompany({ session }),
          branch: site.getBranch({ session }),
          addUserInfo: obj.userInfo,
          nameAr: setting.establishingAccountsList[index].screen.nameAr + ' ' + obj.code,
          nameEn: setting.establishingAccountsList[index].screen.nameEn + ' ' + obj.code,
        };

        let cb = site.getNumbering(numObj);
        if (!journalEntry.code && !cb.auto) {
          response.error = 'Must Enter Code';
          return;
        } else if (cb.auto) {
          journalEntry.code = cb.code;
        }

        establish.list.forEach((_l) => {
          if (_l.active && obj[_l.name] > 0) {
            if (_l.debtorAccountGuide && _l.debtorAccountGuide.id) {
              journalEntry.accountsList.push({
                id: _l.debtorAccountGuide.id,
                code: _l.debtorAccountGuide.code,
                nameAr: _l.debtorAccountGuide.nameAr,
                nameEn: _l.debtorAccountGuide.nameEn,
                side: 'debtor',
                debtor: obj[_l.name],
                creditor: 0,
              });
              journalEntry.totalDebtor += obj[_l.name];
            }

            if (_l.creditorAccountGuide && _l.creditorAccountGuide.id) {
              journalEntry.accountsList.push({
                id: _l.creditorAccountGuide.id,
                code: _l.creditorAccountGuide.code,
                nameAr: _l.creditorAccountGuide.nameAr,
                nameEn: _l.creditorAccountGuide.nameEn,
                side: 'creditor',
                creditor: obj[_l.name],
                debtor: 0,
              });
              journalEntry.totalCreditor += obj[_l.name];
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
