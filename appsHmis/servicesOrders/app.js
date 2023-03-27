module.exports = function init(site) {
  let app = {
    name: 'servicesOrders',
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
          res.render(app.name + '/index.html', { title: app.name, appName: 'Services Orders' }, { parser: 'html', compres: true });
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
            if (doc.approved) {
              doc.servicesList.forEach((_s, i) => {
                if (_s.serviceGroup && _s.serviceGroup.type && _s.serviceGroup.type.id) {
                  let obj = {
                    orderId: doc.id,
                    patient: { ...doc.patient },
                    date: doc.date,
                    type: doc.type,
                    company: doc.company,
                    branch: doc.branch,
                    source: doc.source,
                    mainInsuranceCompany: doc.mainInsuranceCompany,
                    insuranceContract: doc.insuranceContract,
                    payment: doc.payment,
                    addUserInfo: doc.addUserInfo,
                    service: { ..._s },
                    doctor: { ...doc.doctor },
                    status: { id: 1, nameEn: 'Pending', nameAr: 'قيد الإنتظار' },
                  };

                  if (_s.serviceGroup.type.id == 2) {
                    site.addDoctorDeskTop(obj);
                  } else if (_s.serviceGroup.type.id == 3) {
                    site.addLaboratoryDeskTop(obj);
                  } else if (_s.serviceGroup.type.id == 4) {
                    site.addRadiologyDeskTop(obj);
                  }
                }
              });
              if (doc.source.id == 1 && doc.bookingType && doc.bookingType.id == 2 && doc.doctorAppointment && doc.doctorAppointment.id) {
                site.hasTransactionDoctorAppointment({ id: doc.doctorAppointment.id });
              } else if (doc.source.id == 2 && doc.doctorDeskTop && doc.doctorDeskTop.id) {
                site.hasOrderDoctorDeskTop({ id: doc.doctorDeskTop.id });
              }
            }
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
        let select = req.body.select || { id: 1, code: 1, patient: 1, approved: 1 };
        let list = [];
        if (app.allowMemory) {
          app.memoryList
            .filter((g) => g.company && g.branch && g.company.id == site.getCompany(req).id && g.branch.code == site.getBranch(req).code)
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

          app.all({ where: where, select, sort: { id: -1 } }, (err, docs) => {
            res.json({
              done: true,
              list: docs,
            });
          });
        }
      });
    }
  }

  site.post({ name: `/api/${app.name}/approved`, require: { permissions: ['login'] } }, (req, res) => {
    let response = {
      done: false,
    };

    let _data = req.data;
    _data.editUserInfo = req.getUserFinger();
    _data.approved = true;
    app.update(_data, (err, result) => {
      if (!err) {
        response.done = true;
        response.result = result;
        result.doc.servicesList.forEach((_s, i) => {
          if (_s.serviceGroup && _s.serviceGroup.type && _s.serviceGroup.type.id) {
            let obj = {
              orderId: result.doc.id,
              patient: { ...result.doc.patient },
              date: result.doc.date,
              type: result.doc.type,
              company: result.doc.company,
              branch: result.doc.branch,
              source: result.doc.source,
              mainInsuranceCompany: result.doc.mainInsuranceCompany,
              insuranceContract: result.doc.insuranceContract,
              payment: result.doc.payment,
              addUserInfo: result.doc.addUserInfo,
              service: { ..._s },
              doctor: { ...result.doc.doctor },
              status: { id: 1, nameEn: 'Pending', nameAr: 'قيد الإنتظار' },
            };

            if (_s.serviceGroup.type.id == 2) {
              site.addDoctorDeskTop(obj);
            } else if (_s.serviceGroup.type.id == 3) {
              site.addLaboratoryDeskTop(obj);
            } else if (_s.serviceGroup.type.id == 4) {
              site.addRadiologyDeskTop(obj);
            }
          }
        });

        if (result.doc.source.id == 1 && result.doc.bookingType && result.doc.bookingType.id == 2 && result.doc.doctorAppointment && result.doc.doctorAppointment.id) {
          site.hasTransactionDoctorAppointment({ id: result.doc.doctorAppointment.id });
        } else if (result.doc.source.id == 2 && result.doc.doctorDeskTop && result.doc.doctorDeskTop.id) {
          site.hasOrderDoctorDeskTop({ id: result.doc.doctorDeskTop.id });
        }
      } else {
        response.error = err.message;
      }
      res.json(response);
    });
  });

  site.post({ name: `/api/${app.name}/needApprove`, public: true }, (req, res) => {
    let select = req.body.select || { id: 1, code: 1, patient: 1, date: 1, servicesList: 1, doctor: 1,mainInsuranceCompany:1 };

    app.all({ where: { approved: false }, select, sort: { id: -1 } }, (err, docs) => {
      let list = [];
      if (docs && docs.length > 0) {
        docs.forEach((_doc) => {
          _doc.servicesList.forEach((_s) => {
            if (!_s.approved) {
              list.push({
                id: _doc.id,
                service: _s,
                patient: _doc.patient,
                mainInsuranceCompany: _doc.mainInsuranceCompany,
                doctor: _doc.doctor,
                date: _doc.date,
              });
            }
          });
        });
      }
      res.json({
        done: true,
        list: list,
      });
    });
  });

  site.post({ name: `/api/${app.name}/approveService`, public: true }, (req, res) => {
    let response = {
      done: false,
    };

    let _data = req.data;
    app.$collection.find({ id: _data.orderId }, (err, doc) => {
      if (!err && doc) {
        response.done = true;
        doc.servicesList.forEach((_s) => {
          if (_s.id == _data.serviceId) {
            _s.approved = true;
          }
        });
        if (doc.servicesList.some((s) => !s.approved)) {
          doc.doneApproval = false;
        } else {
          doc.doneApproval = true;
        }
        app.update(doc);
      } else {
        response.error = err?.message || 'Not Exists';
      }
      res.json(response);
    });
  });

  site.post({ name: `/api/nphisElig/patient`, public: true }, (req, res) => {
    site.nphisElig(req.data, (nphisCallback) => {
      res.json(nphisCallback);
    });
  });

  site.nphisElig = function (obj, callback) {
    response = {};
    response.elig = true;
    response.done = true;
    callback(response);
    return;
  };

  app.init();
  site.addApp(app);
};
