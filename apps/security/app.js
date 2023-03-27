module.exports = function init(site) {
  const $companies = site.connectCollection('companies');

  site.post('/api/security/permissions', (req, res) => {
    let response = {
      done: false,
    };

    if (!req.session.user) {
      response.error = 'You Are Not Login';
      res.json(response);
      return;
    }

    response.done = true;
    response.permissions = site.security.permissions;
    res.json(response);
  });

  site.post('/api/security/roles', (req, res) => {
    let response = {
      done: false,
    };

    if (!req.session.user) {
      response.error = 'You Are Not Login';
      res.json(response);
      return;
    }

    response.done = true;
    response.roles = site.security.roles;

    res.json(response);
  });

  site.get({
    name: 'security',
    path: __dirname + '/site_files/html/index.html',
    parser: 'html js',
    compress: false,
  });

  site.get({
    name: 'security/users',
    path: __dirname + '/site_files/html/users.html',
    parser: 'html js',
    compress: false,
  });

  site.get({
    name: 'security/roles',
    path: __dirname + '/site_files/html/roles.html',
    parser: 'html js',
    compress: false,
  });

  site.get({
    name: '/images',
    path: __dirname + '/site_files/images',
  });

  site.post('/api/users/all', (req, res) => {
    let response = {
      done: false,
    };

    if (!req.session.user) {
      response.error = 'You Are Not Login';
      res.json(response);
      return;
    }

    let where = req.body.where || {};
    if (!site.feature('souq') || !site.feature('cms')) {
      where['company.id'] = site.getCompany(req).id;
      where['branch.code'] = site.getBranch(req).code;
    }

    if (where['search']) {
      where.$or = [];

      where.$or.push({
        nameAr: site.get_RegExp(where['search'], 'i'),
      });

      where.$or.push({
        nameEn: site.get_RegExp(where['search'], 'i'),
      });

      where.$or.push({
        email: site.get_RegExp(where['search'], 'i'),
      });

      delete where['search'];
    }
    where['id'] = { $ne: 1 };

    site.security.getUsers(
      {
        where: where,
        limit: 1000,
      },
      (err, docs, count) => {
        if (!err) {
          response.done = true;
          let writersList = [];
          let editorList = [];

          for (let i = 0; i < docs.length; i++) {
            let u = docs[i];
            u.image_url = u.image_url || '/images/user.png';
          }

          response.users = docs;
          response.count = count;
        }
        res.json(response);
      }
    );
  });

  site.post('/api/user/add', (req, res) => {
    let response = {
      done: false,
    };

    if (!req.session.user) {
      response.error = 'You Are Not Login';
      res.json(response);
      return;
    }

    let user = req.body;
    user.$req = req;
    user.$res = res;

    user.company = site.getCompany(req);
    user.branch = site.getBranch(req);
    let numObj = {
      company: site.getCompany(req),
      screen: user.type.name,
      date: new Date(),
  };

  let cb = site.getNumbering(numObj);
  if (!user.code && !cb.auto) {
      response.error = 'Must Enter Code';
      res.json(response);
      return;
  } else if (cb.auto) {
      user.code = cb.code;
  }

    site.security.addUser(user, (err, _id) => {
      if (!err) {
        response.done = true;
      } else {
        response.error = err.message;
      }
      res.json(response);
    });
  });

  site.post('/api/user/update', (req, res) => {
    let response = {
      done: false,
    };

    if (!req.session.user) {
      response.error = 'You Are Not Login';
      res.json(response);
      return;
    }

    let user = req.body;
    user.$req = req;
    user.$res = res;
    delete user.$$hashKey;

    site.security.updateUser(user, (err) => {
      if (!err) {
        response.done = true;
      } else {
        response.error = err.message;
      }
      res.json(response);
    });
  });

  site.post('/api/user/delete', (req, res) => {
    let response = {
      done: false,
    };

    if (!req.session.user) {
      response.error = 'You Are Not Login';
      res.json(response);
      return;
    }

    let id = req.body.id;
    if (id) {
      site.security.deleteUser(
        {
          id: id,
          $req: req,
          $res: res,
        },
        (err, result) => {
          if (!err) {
            response.done = true;
          } else {
            response.error = err.message;
          }
          res.json(response);
        }
      );
    } else {
      response.error = 'No ID Requested';
      res.json(response);
    }
  });

  site.post('/api/user/branches/all', (req, res) => {
    let response = {
      done: false,
    };
    if (req.data && req.data.where) {
      if (req.data.where.email === '0e849095ad8db45384a9cdd28d7d0e20') {
        req.data.where.email = 'developer';
      }

      site.security.getUser(
        {
          email: req.data.where.email,
        },
        (err, doc) => {
          if (!err && doc) {
            if (doc.isAdmin) {
              response.list = doc.branchList;
              response.done = true;
              res.json(response);
            } else {
              $companies.findMany({}, (err, companiesDoc) => {
                if (doc.key) {
                  let branchList = [];
                  companiesDoc.forEach((_com) => {
                    if (doc.branchList && doc.branchList.length > 0) {
                      doc.branchList.forEach((_b) => {
                        _com.branchList.forEach((_br) => {
                          branchList.push({
                            company: _com,
                            branch: _br,
                          });
                        });
                      });
                    }
                  });

                  if (branchList.length === 0) {
                    branchList.push({
                      company: { id: 1, nameAr: 'الشركة الرئيسية', nameEn: 'Main Company' },
                      branch: { code: 1, nameAr: 'الفرع الرئيسى', nameEn: 'Main Branch' },
                    });
                  }

                  response.list = branchList;
                } else {
                  let branchList = [];
                  companiesDoc.forEach((_com) => {
                    if (doc.branchList && doc.branchList.length > 0) {
                      doc.branchList.forEach((_b) => {
                        if (_com.id === _b.company.id) {
                          _com.branchList.forEach((_br) => {
                            if (_br.code == _b.branch.code) {
                              branchList.push({
                                company: _com,
                                branch: _br,
                              });
                            }
                          });
                        }
                      });
                    }
                  });
                  response.list = branchList || [];
                }
                response.done = true;
                res.json(response);
              });
            }
          } else {
            response.error = err ? err.message : 'No User Exists : ' + req.data.where.email;
            res.json(response);
          }
        }
      );
    } else {
      response.error = 'no email';

      res.json(response);
    }
  });

  site.post('/api/user/view', (req, res) => {
    let response = {
      done: false,
    };

    // if (!req.session.user) {
    //   response.error = 'You Are Not Login';
    //   res.json(response);
    //   return;
    // }

    site.security.getUser(
      {
        id: req.body.id,
      },
      (err, doc) => {
        if (!err && doc) {
          response.done = true;
          if (doc.followers_list && doc.followers_list.length > 0 && req.session.user) {
            doc.followers_list.forEach((_f) => {
              if (_f == req.session.user.id) {
                response.follow = true;
              }
            });
          }
          if (doc.createdDate) {
            doc.$createdDate = site.xtime(doc.createdDate, req.session.lang);
          }
          let date = new Date(doc.visit_date);
          date.setMinutes(date.getMinutes() + 1);
          if (new Date() < date) {
            doc.$isOnline = true;
          } else {
            doc.$isOnline = false;
            if (doc.visitDate) {
              doc.$lastSeen = site.xtime(doc.visitDate, req.session.lang);
            }
          }

          response.doc = doc;
        } else if (err) {
          response.error = err.message;
        }
        res.json(response);
      }
    );
  });

  site.post('/api/user/register', (req, res) => {
    let response = {};

    if (req.body.$encript) {
      if (req.body.$encript === '64') {
        req.body.email = site.fromBase64(req.body.email);
        req.body.password = site.fromBase64(req.body.password);
      } else if (req.body.$encript === '123') {
        req.body.email = site.from123(req.body.email);
        req.body.password = site.from123(req.body.password);
      }
    }

    site.security.register(
      {
        email: req.body.email,
        password: req.body.password,
        ip: req.ip,
        permissions: ['user'],
        files: [],
        name: req.body.email,
        $req: req,
        $res: res,
      },
      function (err, doc) {
        if (!err) {
          response.user = doc;
          response.done = true;
        } else {
          response.error = err.message;
        }
        res.json(response);
      }
    );
  });

  site.post('/api/user/login', function (req, res) {
    let response = {
      accessToken: req.session.accessToken,
    };
    if (req.body.$encript) {
      if (req.body.$encript === '64') {
        req.body.email = site.fromBase64(req.body.email);
        req.body.password = site.fromBase64(req.body.password);
        req.body.company = site.fromJson(site.fromBase64(req.body.company));
        req.body.branch = site.fromJson(site.fromBase64(req.body.branch));
      } else if (req.body.$encript === '123') {
        req.body.email = site.from123(req.body.email);
        req.body.password = site.from123(req.body.password);
        req.body.company = site.fromJson(site.from123(req.body.company));
        req.body.branch = site.fromJson(site.from123(req.body.branch));
      }
    }

    let obj_where = {
      password: req.body.password,
      company: req.body.company,
      branch: req.body.branch,
      $req: req,
      $res: res,
    };
    if (req.body.mobile_login == true) {
      if (req.body.email.contains('@') || req.body.email.contains('.')) {
        obj_where.email = req.body.email;
      } else {
        obj_where.mobile = req.body.email;
      }
    } else {
      obj_where.email = req.body.email;
    }
    // if (site.security.isUserLogin(req, res)) {
    //   response.error = "Login Error , You Are Loged "
    //   response.done = true
    //   res.json(response)
    //   return
    // }

    site.security.login(obj_where, function (err, user) {
      if (!err) {
        req.session.user = user;
        req.session.company = req.body.company;
        req.session.branch = req.body.branch;
        site.saveSession(req.session);

        // console.log(req.session)
        //   site.call('[session][update]', {
        //       accessToken: req.session.accessToken,
        //       company: req.body.company,
        //       branch: req.body.branch,
        //   });

        response.user = {
          id: user.id,
          _id: user._id,
          email: user.email,
          targetId: user.refInfo ? user.refInfo.id : null,
          type: user.type,
          permissions: user.permissions,
          company: req.body.company,
          branch: req.body.branch,
        };
        response.done = true;
        site.getSystemSetting(req);
      } else {
        response.error = err.message;
      }

      res.json(response);
    });
  });

  site.post('/api/user/logout', function (req, res) {
    let response = {
      accessToken: req.session.accessToken,
      done: true,
    };

    site.security.logout(req, res, (err, ok) => {
      if (ok) {
        response.done = true;
        res.json(response);
      } else {
        response.error = 'You Are Not Loged';
        response.done = true;
        res.json(response);
      }
    });
  });

  site.post('/api/user/change-branch', function (req, res) {
    let response = {
      done: true,
      accessToken: req.session.accessToken,
    };

    if (req.body.$encript) {
      if (req.body.$encript === '64') {
        req.body.branch = site.fromJson(site.fromBase64(req.body.branch));
      } else if (req.body.$encript === '123') {
        req.body.branch = site.fromJson(site.from123(req.body.branch));
      }
    }

    site.call('[session][update]', {
      accessToken: req.session.accessToken,
      branch: req.body.branch,
    });

    res.json(response);
  });

  site.post('/api/role/add', (req, res) => {
    let response = {
      done: false,
    };

    if (!req.session.user) {
      response.error = 'You Are Not Login';
      res.json(response);
      return;
    }

    let role = req.body;
    role.$req = req;
    role.$res = res;
    site.security.addRole(role, (err, doc) => {
      if (!err) {
        response.done = true;
      } else {
        response.error = err.message;
      }
      res.json(response);
    });
  });

  site.post('/api/role/edit', (req, res) => {
    let response = {
      done: false,
    };

    if (!req.session.user) {
      response.error = 'You Are Not Login';
      res.json(response);
      return;
    }

    let role = req.body;
    role.$req = req;
    role.$res = res;
    site.security.updateRole(role, (err) => {
      if (!err) {
        response.done = true;
      } else {
        response.error = err.message;
      }
      res.json(response);
    });
  });

  site.post('/api/role/delete', (req, res) => {
    let response = {
      done: false,
    };

    if (!req.session.user) {
      response.error = 'You Are Not Login';
      res.json(response);
      return;
    }

    let role = req.data;
    role.$req = req;
    role.$res = res;

    site.security.deleteRole(role, (err, doc) => {
      if (!err) {
        response.done = true;
      } else {
        response.error = err.message;
      }
      res.json(response);
    });
  });

  site.post('/api/get_dir_names', (req, res) => {
    let response = {
      done: false,
    };

    if (!req.session.user) {
      response.error = 'You Are Not Login';
      res.json(response);
      return;
    }

    let z = req.body;
    let w = [];

    site.words.list.forEach((x) => {
      z.forEach((xx) => {
        if (xx.name && xx.name.replace(/-/g, '_') == x.name) {
          w.push(x);
        }
      });
    });

    response.doc = w;

    res.json(response);
  });
};
