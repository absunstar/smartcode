module.exports = function init(site) {
  let app = {
    name: 'companies',
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

  site.defaultCompany = {
    nameAr: 'الشركة الرئيسية',
    nameEn: 'Main Company',
    host: 'company.com',
    username: 'admin@company.com',
    password: 'admin',
    image: '/imags/company.png',
    active: true,
    branchList: [
      {
        code: 1,
        nameAr: 'الفرع الرئيسى',
        nameEn: 'Main Branch',
        charge: [{}],
      },
    ],
  };

  // site.onGET('/api/languages/ar-sa', (req, res) => {
  //   site.words.addList(site.dir + '/site_files/json/words-sa.json', true);

  //   res.json({
  //     done: true,
  //   });
  // });

  // app.view({}, (err, doc) => {
  //   if (!err && doc) {
  //     site.defaultCompany = doc;
  //     if (!site.defaultCompany.branchList) {
  //       site.defaultCompany.branchList = site.defaultCompany.branch_list;
  //     }
  //   } else {
  //     app.add(site.defaultCompany, (err, doc) => {
  //       if (!err && doc) {
  //         site.defaultCompany = doc;
  //         site.call('[company][created]', doc);

  //         site.call('please add user', {
  //           isCompany: true,
  //           companyId: doc.id,
  //           email: doc.username,
  //           password: doc.password,
  //           roles: [
  //             {
  //               name: 'companiesAdmin',
  //             },
  //           ],
  //           branchList: [
  //             {
  //               company: doc,
  //               branch: doc.branchList[0],
  //             },
  //           ],
  //           nameAr: doc.nameAr,
  //           nameEn: doc.nameEn,
  //           image: doc.image,
  //         });
  //       }
  //     });
  //   }
  // });

  site.get({
    name: 'qrcode',
    path: __dirname + '/site_files/html/qrcode.html',
    parser: 'html',
    compress: true,
  });

  site.validateEmail = function (email) {
    let re = new RegExp(/^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/);
    return re.test(email);
  };

  site.validatePassword = function (password) {
    let re = new RegExp(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/);
    return re.test(password);
  };

  site.getCompany = function (req) {
    let company = req.session.company;
    return company || site.defaultCompany;
  };

  site.getBranch = function (req) {
    let branch = req.session.branch;
    return branch || site.defaultCompany.branchList[0];
  };

  site.post({
    name: '/api/posting/all',
    path: __dirname + '/site_files/json/posting.json',
  });

  site.defaultCompany = {
    nameAr: 'الشركة الرئيسية',
    nameEn: 'Main Company',
    host: 'company.com',
    username: 'admin@company.com',
    password: 'admin',
    image: '/imags/company.png',
    active: true,
    branchList: [
      {
        code: 1,
        nameAr: 'الفرع الرئيسى',
        nameEn: 'Main Branch',
        charge: [{}],
      },
    ],
  };

  // site.onGET('/api/languages/ar-sa', (req, res) => {
  //   site.words.addList(site.dir + '/site_files/json/words-sa.json', true);

  //   res.json({
  //     done: true,
  //   });
  // });

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
          res.render(app.name + '/index.html', { title: app.name, appName: 'Companies', setting: site.getCompanySetting(req) }, { parser: 'html', compres: true });
        }
      );
    }

    if (app.allowRouteAdd) {
      site.post({ name: `/api/${app.name}/add`, require: { permissions: ['login'] } }, (req, res) => {
        let response = {
          done: false,
        };

        let companiesDoc = req.data;

        companiesDoc.company = site.getCompany(req);
        companiesDoc.branch = site.getBranch(req);

        if (!companiesDoc.code) companiesDoc.code = companiesDoc.nameEn + '-' + '1';

        let userExist = {
          email: undefined,
          password: undefined,
        };

        if (companiesDoc.username && companiesDoc.password) {
          // if(!site.validatePassword(companiesDoc.password)) {
          //   response.error = 'Must be not less than 8 characters or numbers and must contain at least one character capital, one number and one special character'
          //   res.json(response)
          //   return;
          // }
          if (companiesDoc.username.includes('@') && !companiesDoc.username.includes('.')) {
            response.error = 'Username must be typed correctly';
            res.json(response);
            return;
          } else if (!companiesDoc.username.includes('@') && companiesDoc.username.includes('.')) {
            response.error = 'Username must be typed correctly';
            res.json(response);
            return;
          }

          // if (!companiesDoc.host.includes('.') || companiesDoc.host.includes('@')) {
          //   response.error = 'Host must be typed correctly';
          //   res.json(response);
          //   return;
          // } else if (companiesDoc.host.includes('.')) {
          // }

          // let existDomain = companiesDoc.username.includes('@');
          // if (!existDomain) {
          //   companiesDoc.username = companiesDoc.username + '@' + companiesDoc.host;
          // }

          if (!site.validateEmail(companiesDoc.username)) {
            response.error = 'Username must be typed correctly';
            res.json(response);
            return;
          }

          if (companiesDoc.username) {
            userExist = {
              email: companiesDoc.username,
              password: companiesDoc.password,
            };
          }
        }

        site.security.isUserExists(userExist, function (err, userFound) {
          if (userFound) {
            response.error = 'User Is Exist';
            res.json(response);
            return;
          }

          let duplicateCompany = app.memoryList.find(
            (itm) => itm.nameAr == companiesDoc.nameAr || itm.nameEn == companiesDoc.nameEn || itm.host == companiesDoc.host || itm.username == companiesDoc.username
          );
          if (duplicateCompany) {
            if (duplicateCompany.nameAr === companiesDoc.nameAr) {
              response.error = 'Arabic Name Is Exists';
            } else if (duplicateCompany.nameEn === companiesDoc.nameEn) {
              response.error = 'English Name Is Exists';
            } else if (duplicateCompany.host === companiesDoc.host) {
              response.error = 'Host Name Is Exists';
            } else if (duplicateCompany.username === companiesDoc.username) {
              response.error = 'User Name Is Exists';
            } else {
              response.error = 'Error while adding';
            }
            res.json(response);
            return;
          } else {
            companiesDoc.type = site.usersTypesList[1];
            companiesDoc = { ...site.defaultCompanySetting, ...companiesDoc };
            app.add(companiesDoc, (err, doc) => {
              if (!err) {
                response.done = true;
                response.doc = doc;
                let user = {
                  isCompany: true,
                  companyId: doc.id,
                  email: doc.username,
                  password: doc.password,
                  refInfo: { id: companiesDoc.id },
                  roles: [
                    {
                      name: 'companiesAdmin',
                    },
                  ],
                  branchList: [
                    {
                      company: doc,
                      branch: doc.branchList[0],
                    },
                  ],
                  nameAr: doc.nameAr,
                  nameEn: doc.nameEn,
                  mobile: doc.mobile,
                  image: companiesDoc.image,
                };
                site.security.isUserExists(user, function (err, userFound) {
                  if (userFound) {
                    response.error = 'User Is Exist';
                    res.json(response);
                    return;
                  }
                  site.security.addUser(user, (err, userDoc) => {
                    if (!err) {
                      delete user._id;
                      delete user.id;
                      doc.userInfo = {
                        id: userDoc.id,
                      };
                      app.update(doc);
                      site.call('[company][created]', doc);
                    }
                    res.json(response);
                  });
                });
              } else {
                response.error = err.message;
                res.json(response);
              }
            });
          }
        });
      });
    }

    if (app.allowRouteUpdate) {
      site.post({ name: `/api/${app.name}/update`, require: { permissions: ['login'] } }, (req, res) => {
        let response = {
          done: false,
        };

        if (!req.session.user) {
          response.error = 'Please Login First';
          res.json(response);
          return;
        }

        let companiesDoc = req.body;

        companiesDoc.editUserInfo = req.getUserFinger();

        if (companiesDoc.id) {
          let userExist = {
            email: undefined,
            password: undefined,
          };

          if (companiesDoc.username && companiesDoc.password) {
            if (companiesDoc.username.includes('@') && !companiesDoc.username.includes('.')) {
              response.error = 'Username must be typed correctly';
              res.json(response);
              return;
            } else if (!companiesDoc.username.includes('@') && companiesDoc.username.includes('.')) {
              response.error = 'Username must be typed correctly';
              res.json(response);
              return;
            }

            // if (!companiesDoc.host.includes('.')) {
            //   response.error = 'Host must be typed correctly';
            //   res.json(response);
            //   return;
            // }

            // let existDomain = companiesDoc.username.includes('@');
            // if (!existDomain) {
            //   companiesDoc.username = companiesDoc.username + '@' + companiesDoc.host;
            // }

            if (companiesDoc.username)
              userExist = {
                email: companiesDoc.username,
                password: companiesDoc.password,
              };
          }

          site.security.getUsers({}, (err, usersDocs, count) => {
            if (!err) {
              userFound = false;
              for (let i = 0; i < usersDocs.length; i++) {
                let u = usersDocs[i];
                if (u.email === companiesDoc.username && u.companyId != companiesDoc.id) {
                  userFound = true;
                }
              }

              if (userFound) {
                response.error = 'User Is Exist';
                res.json(response);
                return;
              }
            }
            app.update(companiesDoc, (err, result) => {
              if (!err) {
                response.done = true;
                response.doc = result.doc;
                let branchList = [];
                companiesDoc.branchList.forEach((b) => {
                  branchList.push({
                    company: companiesDoc,
                    branch: b,
                  });
                });

                if (companiesDoc.userInfo) {
                  site.call(
                    '[user][update]',
                    {
                      email: companiesDoc.username,
                      password: companiesDoc.password,
                      companyId: companiesDoc.id,
                      refInfo: { id: companiesDoc.id },
                      id: companiesDoc.userInfo.id,
                      isCompany: true,
                      branchList: branchList,
                      nameAr: companiesDoc.nameAr,
                      nameEn: companiesDoc.nameEn,
                      mobile: companiesDoc.mobile,
                      image: companiesDoc.image,
                    },
                    (err, userResult) => {}
                  );
                } else {
                  site.call(
                    '[user][add]',
                    {
                      email: companiesDoc.username,
                      password: companiesDoc.password,
                      companyId: companiesDoc.id,
                      refInfo: { id: companiesDoc.id },
                      isCompany: true,
                      roles: [
                        {
                          name: 'companiesAdmin',
                        },
                      ],
                      branchList: branchList,
                      nameAr: companiesDoc.nameAr,
                      nameEn: companiesDoc.nameEn,
                      mobile: companiesDoc.mobile,
                      image: companiesDoc.image,
                    },
                    (err, userDoc) => {
                      if (!err && userDoc) {
                        result.doc.userInfo = { id: userDoc.id };
                        app.update(result.doc);
                      } else {
                        console.log(err);
                      }
                    }
                  );
                }
              } else {
                response.error = err.message;
              }
              res.json(response);
            });
          });
        } else {
          response.error = 'no id';
          res.json(response);
        }
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
        if (!_data.id) {
          _data.id = site.getCompany(req).id;
        }
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
        let select = req.body.select;

        if (app.allowMemory) {
          if (!search) {
            search = 'id';
          }
          let list = app.memoryList.filter((g) => (typeof where.active != 'boolean' || g.active === where.active) && JSON.stringify(g).contains(search)).slice(0, limit);
          let docs = [];
          list.forEach((_c) => {
            if (req.session.user) {
              if (req.session.user.is_admin) {
                docs.push(_c);
              } else if (req.session.user.isCompany && _c.id == req.session.user.companyId) {
                docs.push(_c);
              } else if (_c.id == site.getCompany(req).id) {
                docs.push(_c);
              }
            }
          });

          res.json({
            done: true,
            list: list,
            count: list.length,
          });
        } else {
          g.id == site.geetCompany(rq).id;
          let where = req.body.where || {};
          if (req.session.user && req.session.user.is_admin) {
          } else if (req.session.user && req.session.user.isCompany) {
            where['id'] = req.session.user.companyId;
          } else if (site.getCompany(req) && site.getCompany(req).id) {
            where['company.id'] = site.getCompany(req).id;
            // where['branch.code'] = site.getBranch(req).code;
          }

          app.all({ where, select, limit }, (err, docs) => {
            res.json({
              done: true,
              list: docs,
            });
          });
        }
      });
    }

    site.post('/api/branches/all', (req, res) => {
      let response = {
        done: false,
      };

      if (!req.session.user) {
        response.error = 'Please Login First';
        res.json(response);
        return;
      }

      let where = req.body.where || {};
      if (site.getCompany(req) && site.getCompany(req).id) {
        where['id'] = site.getCompany(req).id;
      }

      app.view({ where: where }, (err, doc) => {
        if (!err && doc) {
          response.done = true;
          if (doc.branchList && doc.branchList.length > 0) {
            response.list = doc.branchList;
            response.branch = {};
            response.list.forEach((_list) => {
              if (_list.code == site.getBranch(req).code) response.branch = _list;
            });
          }
        } else {
          response.error = err.message;
        }
        res.json(response);
      });
    });
  }

  app.init();
  site.addApp(app);
};
