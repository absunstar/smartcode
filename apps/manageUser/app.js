module.exports = function init(site) {
  site.get({
    name: '/images',
    path: __dirname + '/site_files/images',
  });

  site.get(
    {
      name: 'manageUser',
    },
    (req, res) => {
      res.render('manageUser' + '/index.html', { title: 'manageUser', appName: 'Manage User' }, { parser: 'html', compres: true });
    }
  );

  site.get('/api/user/update-visit-date', (req, res) => {
    req.session.user.visitDate = new Date();

    site.security.updateUser(req.session.user, (err, result) => {});
    res.json({ done: true });
  });

  site.post('/api/manageUser/view', (req, res) => {
    let response = {
      done: false,
    };

    if (!req.session.user) {
      response.error = 'You Are Not Login';
      res.json(response);
      return;
    }

    site.security.getUser(
      {
        id: req.body.id,
      },
      (err, doc) => {
        if (!err) {
          response.done = true;
          let user = { ...doc };
          if (!req.body.all) {
            delete user.password;
          }
          response.doc = user;
        } else {
          response.error = err.message;
        }
        res.json(response);
      }
    );
  });

  site.post('/api/manageUser/updatePersonalInfo', (req, res) => {
    let response = {
      done: false,
    };

    if (!req.session.user) {
      response.error = 'Please Login First';
      res.json(response);
      return;
    }

    let type = req.body.type;
    site.security.getUser(
      {
        email: req.body.user.email,
      },
      (err, user) => {
        if (!err && user) {
          let _user = { ...user };
          if (type === 'email') {
            if (req.body.user.newEmail) {
              if (site.feature('souq')) {
                _user.email = req.body.user.newEmail;
              } else {
                if (!req.body.user.newEmail.contains('@') && !req.body.user.newEmail.contains('.')) {
                  _user.email = req.body.user.newEmail + '@' + site.getCompany(req).host;
                } else {
                  if (req.body.user.newEmail.contains('@') && !req.body.user.newEmail.contains('.')) {
                    response.error = 'Email must be typed correctly';
                    res.json(response);
                    return;
                  } else if (!req.body.user.newEmail.contains('@') && req.body.user.newEmail.contains('.')) {
                    response.error = 'Email must be typed correctly';
                    res.json(response);
                    return;
                  }
                }
              }
            } else {
              response.error = 'Email Not Set';
              res.json(response);
              return;
            }
          } else if (type === 'password') {
            if (req.body.user.currentPassword !== _user.password) {
              response.error = 'Current Password Error';
              res.json(response);
              return;
            } else if (req.body.user.rePassword !== req.body.user.newPassword) {
              response.error = 'Password does not match';
              res.json(response);
              return;
            } else {
              _user.password = req.body.user.newPassword;
            }
          } else if (type === 'nameAr' || type === 'nameEn' || type === 'logo' || type === 'birthDate' || type === 'gender' || type === 'name') {
            _user = req.body.user;
          } else if (type === 'mobile') {
            _user.mobile = req.body.user.mobile;
            _user.mobileList = req.body.user.mobileList;
          }

          site.security.isUserExists(_user, function (err, userFound) {
            if (userFound && type === 'email') {
              response.error = 'User Is Exist';
              res.json(response);
              return;
            }
            site.security.updateUser(_user, (err1, userDoc) => {
              response.done = true;
              if (!err1 && userDoc) {
                response.doc = userDoc.doc;
                response.doc.company = site.getCompany(req);
                response.doc.branch = site.getBranch(req);
                res.json(response);
              } else {
                response.error = 'Email is wrong';
                res.json(response);
              }
            });
          });
        } else {
          response.error = err ? err.message : 'no doc';
        }
      }
    );
  });

  site.post('/api/manageUser/forgetPassword', (req, res) => {
    let response = {
      done: false,
    };

    if (!req.session.user) {
      response.error = 'Please Login First';
      res.json(response);
      return;
    }

    site.security.getUser(
      {
        email: req.body.email,
      },
      (err, user) => {
        if (!err && user) {
          let where = {
            email: req.body.email,
            code: req.body.code,
            type: req.body.type,
          };
          site.getCheckMailer(where, (callBack) => {
            if (callBack) {
              user.password = req.body.newPassword;
              response.error = 'Code Is Not Correct';
              res.json(response);
              return;
            }
            site.security.updateUser(user, (err, userDoc) => {
              response.done = true;
              response.doc = userDoc.doc;
              response.doc.company = site.getCompany(req);
              response.doc.branch = site.getBranch(req);
              res.json(response);
            });
          });
        } else {
          response.error = err ? err.message : 'no doc';
        }
      }
    );
  });
};
