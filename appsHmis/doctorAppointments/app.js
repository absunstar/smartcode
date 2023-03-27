module.exports = function init(site) {
  let app = {
    name: 'doctorAppointments',
    allowMemory: false,
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
          res.render(app.name + '/index.html', { title: app.name, appName: 'Doctor Appointments' }, { parser: 'html', compres: true });
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
        let select = req.body.select || { id: 1, code: 1, patient: 1, doctor: 1, hasTransaction: 1, active: 1, date: 1, bookingDate: 1 };
        let list = [];
        if (app.allowMemory) {
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

          if (where && where.bookingDateTo) {
            let d1 = site.toDate(where.bookingDate);
            let d2 = site.toDate(where.bookingDateTo);
            d2.setDate(d2.getDate() + 1);
            where.bookingDate = {
              $gte: d1,
              $lt: d2,
            };
            delete where.bookingDateTo;
          } else if (where.bookingDate) {
            let d1 = site.toDate(where.bookingDate);
            let d2 = site.toDate(where.bookingDate);
            d2.setDate(d2.getDate() + 1);
            where.bookingDate = {
              $gte: d1,
              $lt: d2,
            };
          }

          app.all({ where, select, sort: { id: -1 } }, (err, docs) => {
            res.json({
              done: true,
              list: docs,
            });
          });
        }
      });
    }
  }

  site.post({ name: `/api/selectDoctorAppointment`, require: { permissions: ['login'] } }, (req, res) => {
    let _data = req.body;

    let insuranceCompanyId = 0;
    if (_data.patient.insuranceCompany && _data.patient.insuranceCompany.id) {
      insuranceCompanyId = _data.patient.insuranceCompany.id;
    }
    let insuranceClassId = 0;
    if (_data.patient.insuranceClass && _data.patient.insuranceClass.id) {
      insuranceClassId = _data.patient.insuranceClass.id;
    }
    let nationalityId = 0;
    if (_data.patient.nationality && _data.patient.nationality.id) {
      nationalityId = _data.patient.nationality.id;
    }
    let where = { insuranceCompanyId: insuranceCompanyId, insuranceClassId: insuranceClassId };

    site.mainInsurancesFromSub(where, (insuranceCallback) => {
      site.nphisElig(req.data, (nphisCallback) => {
        let payment = '';
        if (nphisCallback.elig) {
          nphis = 'elig';
          payment = 'credit';
        } else {
          nphis = 'nElig';
          payment = 'cash';
        }
        site.serviceMainInsurance(
          {
            nationalityId,
            mainInsuranceCompany: insuranceCallback.mainInsuranceCompany,
            insuranceContract: insuranceCallback.insuranceContract,
            patientClass: _data.patient.insuranceClass,
            servicesList: [_data.doctor.consItem],
            payment: payment,
            hospitalResponsibility: _data.doctor.hospitalResponsibility,
            type: 'out',
            session: req.session
          },
          (serviceCallback) => {
            serviceCallback.elig = nphisCallback.elig;
            serviceCallback.mainInsuranceCompany = insuranceCallback.mainInsuranceCompany;
            serviceCallback.insuranceContract = insuranceCallback.insuranceContract;
            res.json(serviceCallback);
          }
        );
      });
    });
  });

  site.post(`/api/${app.name}/datesDay`, (req, res) => {
    let response = {};
    req.headers.language = req.headers.language || 'en';
    if (!req.session.user) {
      response.message = site.word('loginFirst')[req.headers.language];
      response.done = false;
      res.json(response);
      return;
    }

    let day = req.body.day || {};
    let doctorId = req.body.doctorId || 0;

    let nD = new Date();
    if (day.code > nD.getDay()) {
      nD.setTime(nD.getTime() + (day.code - nD.getDay()) * 24 * 60 * 60 * 1000);
    } else if (day.code < nD.getDay()) {
      nD.setTime(nD.getTime() + (7 - nD.getDay() + day.code) * 24 * 60 * 60 * 1000);
    }

    let fD = new Date(nD);
    let datesList = [{ date: fD, previousBooking: 0 }];

    for (let i = 0; i < 12; i++) {
      nD.setTime(nD.getTime() + 7 * 24 * 60 * 60 * 1000);
      let d = new Date(nD);
      datesList.push({ date: d, previousBooking: 0 });
    }

    where = {};
    let d1 = site.toDate(datesList[0].date);
    let d2 = site.toDate(datesList[datesList.length - 1].date);
    d2.setDate(d2.getDate() + 1);
    where.bookingDate = {
      $gte: d1,
      $lt: d2,
    };
    where['doctor.id'] = doctorId;
    let select = { id: 1, bookingDate: 1 };
    app.all({ where, select }, (err, docs) => {
      if (docs) {
        docs.forEach((_doc) => {
          let index = datesList.findIndex(
            (itm) =>
              site.toDate(itm.date).getDate() == site.toDate(_doc.bookingDate).getDate() &&
              site.toDate(itm.date).getMonth() == site.toDate(_doc.bookingDate).getMonth() &&
              site.toDate(itm.date).getFullYear() == site.toDate(_doc.bookingDate).getFullYear()
          );
          if (index !== -1) {
            datesList[index].previousBooking += 1;
          }
        });
      }
      res.json({
        done: true,
        list: datesList,
      });
    });
  });

  site.hasTransactionDoctorAppointment = function (where) {
    app.$collection.update({ where, set: { hasTransaction: true } });
  };

  app.init();
  site.addApp(app);
};
