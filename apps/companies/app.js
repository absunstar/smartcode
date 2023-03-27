module.exports = function init(site) {
  const $companies = site.connectCollection('companies');

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

  $companies.findOne({}, (err, doc) => {
    if (!err && doc) {
      site.defaultCompany = doc;
    } else {
      $companies.add(site.defaultCompany, (err, doc) => {
        if (!err && doc) {
          site.defaultCompany = doc;
          site.call('[company][created]', doc);

          site.call('please add user', {
            isCompany: true,
            companyId: doc.id,
            email: doc.username,
            password: doc.password,
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
            image: doc.image,
          });
        }
      });
    }
  });

  // site.on('[register][company][add]', doc => {

  //   $companies.add({
  //     nameAr: doc.name,
  //     branchList: [{
  //       code: 1,
  //       nameAr: "فرع" + " " + doc.name
  //     }],
  //     active: true,
  //     username: doc.username,
  //     password: doc.password,
  //     image: doc.image
  //   }, (err, doc) => {
  //     if (!err && doc) {
  //       site.call('[company][created]', doc)

  //       site.call('please add user', {
  //         isCompany: true,
  //         email: doc.username,
  //         password: doc.password,
  //         roles: [{
  //           name: "companiesAdmin"
  //         }],
  //         branchList: [{
  //           company: doc,
  //           branch: doc.branchList[0]
  //         }],
  //         companyId: doc.id,
  //         profile: {
  //           name: doc.nameAr,
  //           image: doc.image
  //         }
  //       })
  //     }
  //   })
  // })

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

  site.get({
    name: 'images',
    path: __dirname + '/site_files/images/',
    public: true,
  });

  site.get({
    name: 'companies',
    path: __dirname + '/site_files/html/index.html',
    parser: 'html',
    compress: true,
  });
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

  site.post('/api/companies/add', (req, res) => {
    let response = {
      done: false,
    };

    // if (!req.session.user) {
    //   response.error = 'Please Login First';
    //   res.json(response)
    //   return
    // }

    let companiesDoc = req.body;
    companiesDoc.$req = req;
    companiesDoc.$res = res;
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

      if (!companiesDoc.host.includes('.')) {
        response.error = 'Host must be typed correctly';
        res.json(response);
        return;
      }

      let existDomain = companiesDoc.username.includes('@');
      if (!existDomain) {
        companiesDoc.username = companiesDoc.username + '@' + companiesDoc.host;
      }

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

      $companies.findMany(
        {
          where: {
            feature: companiesDoc.feature,

            $or: [{ nameAr: companiesDoc.nameAr }, { nameEn: companiesDoc.nameEn }, { host: companiesDoc.host }, { username: companiesDoc.username }],
          },
        },
        (err, docs) => {
          if (!err && docs && docs.length > 0) {
            let existNameAr = false;
            let existNameEn = false;
            let existHost = false;
            let existUsername = false;
            docs.forEach((_docs) => {
              if (_docs.nameAr == companiesDoc.nameAr) existNameAr = true;
              else if (_docs.nameEn == companiesDoc.nameEn) existNameEn = true;
              else if (_docs.host == companiesDoc.host) existHost = true;
              else if (_docs.username == companiesDoc.username) existUsername = true;
            });

            if (existNameAr) {
              response.error = 'Arabic Name Is Exists';
              res.json(response);
              return;
            } else if (existNameEn) {
              response.error = 'English Name Is Exists';
              res.json(response);
              return;
            } else if (existHost) {
              response.error = 'Host Name Is Exists';
              res.json(response);
              return;
            } else if (existUsername) {
              response.error = 'User Name Is Exists';
              res.json(response);
              return;
            }
          } else {
            companiesDoc.type = site.usersTypesList[1];
            $companies.add(companiesDoc, (err, doc) => {
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
                      $companies.update(doc);
                      site.call('[company][created]', doc);
                    }
                    res.json(response);
                  });
                });

                // site.call(
                //   '[user][add]',
                //   {
                //     isCompany: true,
                //     companyId: doc.id,
                //     email: doc.username,
                //     password: doc.password,
                //     roles: [
                //       {
                //         name: 'companiesAdmin',
                //       },
                //     ],
                //     branchList: [
                //       {
                //         company: doc,
                //         branch: doc.branchList[0],
                //       },
                //     ],
                //     profile: {
                //       nameAr: doc.nameAr,
                //       nameEn: doc.nameEn,
                //       mobile: doc.mobile,
                //       image: companiesDoc.image,
                //     },
                //   },
                //   (err, userDoc) => {
                //     if (!err && userDoc) {
                //       doc.userInfo = { id: userDoc.id };
                //       $companies.update(doc);
                //       site.call('[company][created]', doc);
                //     }
                //   }
                // );
              } else {
                response.error = err.message;
                res.json(response);
              }
            });
          }
        }
      );
    });
  });

  site.post('/api/companies/update', (req, res) => {
    let response = {
      done: false,
    };

    if (!req.session.user) {
      response.error = 'Please Login First';
      res.json(response);
      return;
    }

    let companiesDoc = req.body;

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

        if (!companiesDoc.host.includes('.')) {
          response.error = 'Host must be typed correctly';
          res.json(response);
          return;
        }

        let existDomain = companiesDoc.username.includes('@');
        if (!existDomain) {
          companiesDoc.username = companiesDoc.username + '@' + companiesDoc.host;
        }

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

        $companies.update(
          {
            where: {
              id: companiesDoc.id,
            },
            set: companiesDoc,
            $req: req,
            $res: res,
          },
          (err, result) => {
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
                      $companies.update(result.doc);
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
          }
        );
      });
    } else {
      response.error = 'no id';
      res.json(response);
    }
  });

  site.post('/api/companies/view', (req, res) => {
    let response = {
      done: false,
    };

    if (!req.session.user) {
      response.error = 'Please Login First';
      res.json(response);
      return;
    }

    $companies.findOne(
      {
        where: {
          id: req.body.id,
        },
      },
      (err, doc) => {
        if (!err) {
          response.done = true;
          response.doc = doc;
        } else {
          response.error = err.message;
        }
        res.json(response);
      }
    );
  });

  site.post('/api/companies/delete', (req, res) => {
    let response = {
      done: false,
    };

    if (!req.session.user) {
      response.error = 'Please Login First';
      res.json(response);
      return;
    }

    let id = req.body.id;

    if (id) {
      $companies.delete(
        {
          id: id,
          $req: req,
          $res: res,
        },
        (err, result) => {
          if (!err) {
            response.done = true;
            response.doc = result.doc;
          } else {
            response.error = err.message;
          }
          res.json(response);
        }
      );
    } else {
      response.error = 'no id';
      res.json(response);
    }
  });

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

    $companies.findOne(
      {
        select: req.body.select || {},
        where: where,
        sort: req.body.sort || {
          id: -1,
        },
        limit: req.body.limit,
      },
      (err, doc) => {
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
      }
    );
  });

  site.post(['/api/companies/all'], (req, res) => {
    let response = {
      done: false,
    };

    let where = req.body.where || {};
    // if (req.session.user && req.session.user.isAdmin) {
    // } else if (req.session.user && req.session.user.isCompany) {
    //   where['id'] = req.session.user.companyId;
    // } else if (site.getCompany(req) && site.getCompany(req).id) {
    //   where['company.id'] = site.getCompany(req).id;
    //   where['branch.code'] = site.getBranch(req).code;
    // }
    $companies.findMany(
      {
        select: req.body.select || {},
        where: where,
        sort: req.body.sort || {
          id: -1,
        },
        limit: req.body.limit,
      },
      (err, docs, count) => {
        if (!err) {
          response.done = true;
          response.list = docs;
          response.count = count;
        } else {
          response.error = err.message;
        }
        res.json(response);
      }
    );
  });

  site.getStopProject = function () {
    $companies.findMany({}, (err, docs) => {
      if (!err) {
        docs.forEach((_doc) => {
          if (_doc.shutdownDate) {
            if (new Date(_doc.shutdownDate) < new Date()) {
              process.exit(1);
            }
          }
        });
      }
    });
  };

  setInterval(() => {
    site.getStopProject();
  }, 1000 * 60 * 2);
};
