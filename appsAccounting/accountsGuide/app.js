module.exports = function init(site) {
  let app = {
    name: 'accountsGuide',
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
      let where = {};
      if (_item.id) {
        where = { id: _item.id };
      } else if (_item.parentId) {
        where = { parentId: _item.parentId };
      }
      app.$collection.find(where, (err, doc) => {
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
          res.render(app.name + '/index.html', { title: app.name, appName: 'Accounts Guide', setting: site.getCompanySetting(req) }, { parser: 'html', compres: true });
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

        _data.addUserInfo = req.getUserFinger();
        const accountsSetting = site.getCompanySetting(req).accountsSetting;

        // if (_data.costCenterType == 'mandatory') {
        //     if (!_data.costCentersList || _data.costCentersList.length < 1) {
        //         response.error = 'You Should Select Cost Center';
        //         res.json(response);
        //         return;
        //     }
        // }

        if (accountsSetting.linkGlWithIncomeStatementAndBudget == true && _data.type == 'detailed') {
          if (!_data.category) {
            response.error = 'You Should Select Category';
            res.json(response);
            return;
          }
        }

        if (_data.costCentersList && _data.costCentersList.length > 0) {
          let total = 0;
          _data.costCentersList.forEach((_costCenter) => {
            total += _costCenter.rate;
          });
          if (total != 100) {
            response.error = 'Total cost center ratios should be equal 100%';
            res.json(response);
            return;
          }
        }

        let where = {};
        where['company.id'] = site.getCompany(req).id;

        let exit = false;
        let code = 0;
        let l = 0;
        const accountingSetting = site.getCompanySetting(req).accountsSetting;

        if (accountingSetting) {
          l = _data.lengthLevel || 0;
          app.all(
            {
              where: where,
            },
            (err, docs, count) => {
              if (_data.topParentId) {
                docs.forEach((a) => {
                  if (a.id === _data.parentId) {
                    if (a.parentListId) {
                      _data.parentListId = [];
                      for (let i = 0; i < a.parentListId.length; i++) {
                        _data.parentListId.push(a.parentListId[i]);
                      }
                      _data.parentListId.push(_data.parentId);
                    } else {
                      _data.parentListId = [_data.parentId];
                    }
                  }
                });
              }

              if (accountingSetting.autoGenerateAccountsGuideAndCostCenterCode == true) {
                if (docs.length == 0) {
                  _data.code = site.addZero(1, l);
                } else {
                  docs.forEach((el) => {
                    if (_data.parentId) {
                      if (_data.parentId === el.id && _data.parentId != el.parentId) {
                        _data.code = _data.code + site.addZero(1, l);
                      } else {
                        exit = true;
                      }
                    } else if (!el.parentId) {
                      _data.code = site.addZero(site.toNumber(el.code) + site.toNumber(1), l);
                    }
                  });

                  if (exit) {
                    let c = 0;
                    let ss = '';
                    docs.forEach((itm) => {
                      if (itm.parentId === _data.parentId) {
                        c += 1;
                      }
                      if (itm.id === _data.parentId) {
                        ss = itm.code;
                      }
                    });
                    code = site.toNumber(c) + site.toNumber(1);
                    _data.code = ss + site.addZero(code, l);
                  }
                }

                app.add(_data, (err, doc) => {
                  if (!err) {
                    response.done = true;
                    response.doc = doc;
                  } else {
                    response.error = err.message;
                  }
                  res.json(response);
                });
              }

              if (accountingSetting.autoGenerateAccountsGuideAndCostCenterCode == false && !_data.code) {
                response.error = 'enter tree code';
                res.json(response);
              } else {
                app.add(_data, (err, doc) => {
                  if (!err) {
                    response.done = true;
                    response.doc = doc;
                  } else {
                    response.error = err.message;
                  }
                  res.json(response);
                });
              }
            }
          );
        }
      });
    }

    if (app.allowRouteUpdate) {
      site.post({ name: `/api/${app.name}/update`, require: { permissions: ['login'] } }, (req, res) => {
        let response = {
          done: false,
        };

        let _data = req.data;
        _data.editUserInfo = req.getUserFinger();
        const accountsSetting = site.getCompanySetting(req).accountsSetting;

        // if (_data.costCenterType == 'mandatory') {
        //     if (!_data.costCentersList || _data.costCentersList.length < 1) {
        //         response.error = 'You Should Select Cost Center';
        //         res.json(response);
        //         return;
        //     }
        // }

        if (accountsSetting.linkGlWithIncomeStatementAndBudget == true && _data.type == 'detailed') {
          if (!_data.category) {
            response.error = 'You Should Select Category';
            res.json(response);
            return;
          }
        }

        if (_data.costCentersList && _data.costCentersList.length > 0) {
          let total = 0;
          _data.costCentersList.forEach((_costCenter) => {
            total += _costCenter.rate;
          });
          if (total != 100) {
            response.error = 'Total cost center ratios should be equal 100%';
            res.json(response);
            return;
          }
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
        app.view({ parentId: _data.id }, (err, doc) => {
          if (doc && doc.id) {
            response.error = 'It cannot be deleted because it contains a sub accounts';
            res.json(response);
          } else {
            app.delete(_data, (err, result) => {
              if (!err && result.count === 1) {
                response.done = true;
                response.result = result;
              } else {
                response.error = err?.message || 'Deleted Not Exists';
              }
              res.json(response);
            });
          }
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
        let select = req.body.select || {
          id: 1,
          code: 1,
          nameEn: 1,
          nameAr: 1,
          type: 1,
          parentId: 1,
          status: 1,
          image: 1,
          side: 1,
          reportType: 1,
          cashFlow: 1,
          costCentersList: 1,
          category: 1,
          currency: 1,
          generalLedgerList: 1,
        };
        let list = [];
        if (!search) {
          search = 'id';
        }
        app.memoryList
          .filter((g) => (!where['type'] || g.type == where['type']) && g.company && g.company.id == site.getCompany(req).id && JSON.stringify(g).contains(search))
          .forEach((doc) => {
            let obj = { ...doc };

            for (const p in obj) {
              if (!Object.hasOwnProperty.call(select, p)) {
                delete obj[p];
              }
            }
            if (!where.status || doc.status == 'active') {
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

  site.post(`api/${app.name}/import`, (req, res) => {
    let response = {
      done: false,
      file: req.form.files.fileToUpload,
    };

    if (site.isFileExistsSync(response.file.filepath)) {
      let docs = [];
      if (response.file.originalFilename.like('*.xls*')) {
        let workbook = site.XLSX.readFile(response.file.filepath);
        docs = site.XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
      } else {
        docs = site.fromJson(site.readFileSync(response.file.filepath).toString());
      }
      const accountsSetting = site.getCompanySetting(req).accountsSetting;

      if (Array.isArray(docs)) {
        console.log(`Importing ${app.name} : ${docs.length}`);
        docs.forEach((doc, index) => {
          setTimeout(() => {
            let mainAcc = app.memoryList.find((itm) => itm.code == doc.__EMPTY_5);
            let newDoc = {
              status: 'active',
              image: { url: '/images/accountsGuide.png' },
              currency: accountsSetting.currency,
              code: doc.__EMPTY,
              nameEn: doc.__EMPTY_2,
              nameAr: doc.__EMPTY_2,
              side: doc.__EMPTY_6.contains('مدين') ? 'debtor' : 'creditor',
              type: doc.__EMPTY_4.contains('رئيسي') ? 'primary' : 'detailed',
              reportType: doc.__EMPTY_7.contains('المركز') ? 'budget' : 'incomeList',
            };

            if (doc.__EMPTY_8) {
              if (doc.__EMPTY_8.contains('استثماري')) {
                newDoc.cashFlow = 'investment';
              } else if (doc.__EMPTY_8.contains('تشغيلي')) {
                newDoc.cashFlow = 'operational';
              } else if (doc.__EMPTY_8.contains('تمويلي')) {
                newDoc.cashFlow = 'financing';
              }
            }

            if (mainAcc) {
              newDoc.parentId = mainAcc.id;
              newDoc.topParentId = mainAcc.topParentId || mainAcc.id;
              newDoc.parentListId = [];
              if (mainAcc.parentListId) {
                for (let i = 0; i < mainAcc.parentListId.length; i++) {
                  newDoc.parentListId.push(mainAcc.parentListId[i]);
                }
              }
              newDoc.parentListId.push(mainAcc.id);
            }

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
          }, 1000 * index);
        });
      } else {
        site.dbMessage = 'can not import unknown type : ' + site.typeof(docs);
        console.log(site.dbMessage);
      }
    } else {
      site.dbMessage = 'file not exists : ' + response.file.filepath;
      console.log(site.dbMessage);
    }

    res.json(response);
  });

  app.init();
  site.addApp(app);
};
