module.exports = function init(site) {
  let app = {
    name: 'doctorDeskTop',
    allowMemory: false,
    memoryList: [],
    allowCache: true,
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
      // site.get({ name: '/css', path: __dirname + '/site_files/css' });

      site.get(
        {
          name: app.name,
        },
        (req, res) => {
          res.render(app.name + '/index.html', { title: app.name, appName: req.word("Doctor DeskTop"), setting: site.getCompanySetting(req) }, { parser: 'html', compres: true });
        }
      );
    }

    if (app.allowRouteAdd) {
      site.post({ name: `/api/${app.name}/add`, require: { permissions: ['login'] } }, (req, res) => {
        let response = {
          done: false,
        };

        let _data = req.data;

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
            if(result.doc.status.id == 3) {
              let obj = {
                orderId : result.doc.orderId,
                serviceId : result.doc.service.id,
                height : result.doc.height,
                weight : result.doc.weight,
                temperature : result.doc.temperature,
                pulse : result.doc.pulse,
                bloodPressureHigh : result.doc.bloodPressureHigh,
                bloodPressureLow : result.doc.bloodPressureLow,
                respiratoryRate : result.doc.respiratoryRate,
                notesAfter : result.doc.notesAfter,
                doctorReccomendList :  result.doc.doctorReccomendList,
                patientReccomendList :  result.doc.patientReccomendList,
              }
              site.changeServiceOrderByOrders(obj);

            }
            let newDate = new Date();
            result.doc.$hours = parseInt((Math.abs(new Date(result.doc.date) - newDate) / (1000 * 60 * 60)) % 24);
            result.doc.$minutes = parseInt((Math.abs(new Date(result.doc.date).getTime() - newDate.getTime()) / (1000 * 60)) % 60);
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
            let newDate = new Date();
            let diffMs = newDate - new Date(doc.date);
            doc.$days = Math.floor(diffMs / 86400000);
            doc.$hours = Math.floor((diffMs % 86400000) / 3600000);
            doc.$minutes = Math.round(((diffMs % 86400000) % 3600000) / 60000);
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
        let select = req.body.select || { id: 1, patient: 1, doctor: 1, code: 1, detectionNum: 1, service: 1, ordersList: 1, mainInsuranceCompany: 1, date: 1, status: 1 };
        let list = [];
        if (app.allowMemory) {
          app.memoryList
            .filter((g) => !where['doctor.id'] || g.doctor.id == where['doctor.id'])
            .forEach((doc) => {
              let obj = { ...doc };
              for (const p in obj) {
                if (!Object.hasOwnProperty.call(select, p)) {
                  delete obj[p];
                }
              }
              list.push(obj);
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
          if (where.toOrder) {
            const hmisSetting = site.getCompanySetting(req).hmisSetting;

            let newDate = new Date();
            let d1 = site.toDate(newDate);
            let d2 = site.toDate(newDate);
            d2.setDate(d2.getDate() - hmisSetting.medicalDirector || 3);
            d1.setDate(d1.getDate() + 1);
            where.date = {
              $gte: d2,
              $lt: d1,
            };
            delete where.toOrder;
          }

          if (where['doctor']) {
            where['doctor.id'] = where['doctor'].id;
            delete where['doctor'];
          }
          app.all({ where, select, sort: { id: -1 }, limit: req.body.limit }, (err, docs) => {
            let newDate = new Date();
            docs.forEach((_d) => {
              // _d.$hours = parseInt((Math.abs(new Date(_d.date) - newDate) / (1000 * 60 * 60)) % 24);
              // _d.$minutes = parseInt((Math.abs(new Date(_d.date).getTime() - newDate.getTime()) / (1000 * 60)) % 60);
              let diffMs = newDate - new Date(_d.date);
              _d.$days = Math.floor(diffMs / 86400000);
              _d.$hours = Math.floor((diffMs % 86400000) / 3600000);
              _d.$minutes = Math.round(((diffMs % 86400000) % 3600000) / 60000);
            });
            res.json({
              done: true,
              list: docs,
            });
          });
        }
      });
    }
  }

  site.post({ name: `/api/${app.name}/ordersReference`, public: true }, (req, res) => {
    let where = req.body.where || {};
    let select = req.body.select || { id: 1, date: 1, doctor: 1, patient: 1, service: 1, ordersList: 1 };

    where['company.id'] = site.getCompany(req).id;

    // if (where['doctorId']) {
    //   where['doctor.id'] = where['doctorId'];
    //   delete where['doctorId'];
    // }
    // if (where['patientId']) {
    //   where['patient.id'] = where['patientId'];
    //   delete where['patientId'];
    // }

    app.all({ where, select, sort: { id: -1 }, limit: req.body.limit }, (err, docs) => {
      let result = {
        consultationList: [],
        laboratoryList: [],
        radiologyList: [],
        medicineList: [],
      };
      if (!err && docs) {
        docs.forEach((doc) => {
          doc.ordersList.forEach((_order) => {
            if (_order.type == 'CO' && !result.consultationList.some((s) => s.id == _order.id)) {
              result.consultationList.push({ ..._order, date: doc.date });
            } else if (_order.type == 'LA' && !result.laboratoryList.some((s) => s.id == _order.id)) {
              result.laboratoryList.push({ ..._order, date: doc.date });
            } else if (_order.type == 'X-R' && !result.radiologyList.some((s) => s.id == _order.id)) {
              result.radiologyList.push({ ..._order, date: doc.date });
            } else if (_order.type == 'MD' && !result.medicineList.some((s) => s.id == _order.id)) {
              result.medicineList.push({ ..._order, date: doc.date });
            }
          });
        });
      }
      res.json({
        done: true,
        doc: result,
      });
    });
  });

  site.post({ name: `/api/selectDoctorDeskTop/serviceOrder`, require: { permissions: ['login'] } }, (req, res) => {
    let response = { done: false };
    let _data = req.body;
    let servicesList = [];

    _data.ordersList.forEach((_s) => {
      if (_s.type == 'LA' || _s.type == 'X-R' || _s.type == 'CO' || _s.type == 'TE') {
        servicesList.push(_s);
      }
    });
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

    site.mainInsurancesFromSub(where, (callback) => {
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
            mainInsuranceCompany: callback.mainInsuranceCompany,
            insuranceContract: callback.insuranceContract,
            patientClass: _data.patient.insuranceClass,
            patient: _data.patient,
            doctor: _data.doctor,
            servicesList: servicesList,
            payment: payment,
            hospitalResponsibility: _data.doctor.hospitalResponsibility,
            type: _data.type,
            session: req.session,
          },
          (serviceCallback) => {
            callback.elig = nphisCallback.elig;
            callback.servicesList = serviceCallback.servicesList;
            res.json(callback);
          }
        );
      });
    });
  });

  site.addDoctorDeskTop = function (obj) {
    let date = new Date();
    let d1 = site.toDate(date);
    let d2 = site.toDate(date);
    d2.setDate(d2.getDate() + 1);
    let where = {};
    where.date = {
      $gte: d1,
      $lt: d2,
    };
    obj.hasOrder = false;
    obj.hasSales = false;
    obj.hasEr = false;
    if (obj.doctor && obj.doctor.id) {
      where['doctor.id'] = obj.doctor.id;
    }

    let numObj = {
      company: obj.company,
      screen: app.name,
      date: new Date(),
    };

    let cb = site.getNumbering(numObj);
    obj.code = cb.code;
    if (obj.code) {
      app.all(
        {
          where,
          limit: 1,
          sort: {
            id: -1,
          },
        },
        (err, docs) => {
          if (!err) {
            obj.detectionNum = docs && docs.length > 0 ? docs[0].detectionNum + 1 : 1;
            obj.ordersList = [];
            obj.date = new Date();
            app.add(obj, (err, doc1) => {});
          }
        }
      );
    }
  };

  site.post({ name: `/api/${app.name}/details`, public: true }, (req, res) => {
    let where = {};
    let date = new Date();
    let d1 = site.toDate(date);
    let d2 = site.toDate(date);
    d2.setMonth(d2.getMonth() + 1);
    d2.setDate(1);
    d1.setDate(1);
    where.date = {
      $gte: d1,
      $lt: d2,
    };
    let select = { id: 1, code: 1, date: 1 };

    app.all({ where, select }, (err, docs) => {
      let obj = {
        today: 0,
        yesterday: 0,
        week: 0,
        month: 0,
      };
      if (!err && docs) {
        let weekDate = site.weekDate();
        obj.month = docs.length;
        for (let i = 0; i < docs.length; i++) {
          docs[i].date = new Date(docs[i].date);

          if (docs[i].date.getDate() == new Date().getDate()) {
            obj.today += 1;
          }
          if (docs[i].date.getDate() == new Date().getDate() - 1) {
            obj.yesterday += 1;
          }
          if (weekDate.firstday.getDate() <= docs[i].date.getDate() && weekDate.lastday.getDate() >= docs[i].date.getDate()) {
            obj.week += 1;
          }
        }
      }
      res.json({
        done: true,
        doc: obj,
      });
    });
  });

  site.getDoctorDeskTopToPeriod = function (obj, callBack) {
    let select = {
      id: 1,
      code: 1,
      date: 1,
      service: 1,
      patient: 1,
      doctor: 1,
    };
    // { 'service.id': { $in: obj.servicesIds }, select }
    let cb = { doctorDescTop: {}, freeRevistCount: 0, freeRevistPeriod: 0 };

    if (obj.doctor.freeRevistCount) {
      cb.freeRevistCount = obj.doctor.freeRevistCount;
    } else if (obj.mainInsurance) {
      cb.freeRevistCount = obj.mainInsurance.freeRevistCount;
    }

    if (obj.doctor.freeRevistPeriod) {
      cb.freeRevistPeriod = obj.doctor.freeRevistPeriod;
    } else if (obj.mainInsurance) {
      cb.freeRevistPeriod = obj.mainInsurance.freeRevistPeriod;
    }

    let newDate = new Date();
    let fromDate = new Date();
    fromDate.setTime(fromDate.getTime() - cb.freeRevistPeriod * 24 * 60 * 60 * 1000);
    fromDate.setHours(0, 0, 0, 0);
    newDate.setHours(0, 0, 0, 0);
    let where = {};
    // where['service.id'] = { $in: obj.servicesIds };
    where['doctor.specialty.id'] = obj.doctor.specialty.id;
    where['patient.id'] = obj.patient.id;
    app.all({ where, select }, (err, docs) => {
      if (!err) {
        if (docs && docs.length > 0) {
          docs.forEach((_doc) => {
            _doc.date = new Date(_doc.date);
            _doc.date.setHours(0, 0, 0, 0);
            if (new Date(_doc.date) >= new Date(fromDate) && new Date(_doc.date) <= new Date(newDate)) {
              if (cb.doctorDescTop.id) {
                if (cb.doctorDescTop.doctor.scientificRank.id > _doc.doctor.scientificRank.id) {
                  cb.doctorDescTop = { id: _doc.id, count: 1, doctor: _doc.doctor, date: new Date(_doc.date) };
                } else {
                  cb.doctorDescTop = { id: _doc.id, count: cb.doctorDescTop.count + 1, doctor: _doc.doctor, date: new Date(_doc.date) };
                }
              } else {
                cb.doctorDescTop = { id: _doc.id, count: 1, doctor: _doc.doctor, date: new Date(_doc.date) };
              }
            }
          });
          if (cb.doctorDescTop.id) {
            callBack(cb);
          } else {
            callBack(false);
          }
        } else {
          callBack(false);
        }
      } else {
        callBack(false);
      }
    });
  };

  site.hasOrderDoctorDeskTop = function (where) {
    app.$collection.update({ where, set: { hasOrder: true } });
  };

  site.hasSalesDoctorDeskTop = function (obj) {
    app.view({ id: obj.id }, (err, doc) => {
      if (!err && doc) {
        obj.items.forEach((_item) => {
          doc.ordersList.forEach((_o) => {
            if (_o.type == 'MD' && _item.id == _o.id) {
              _o.hasOrder = true;
            }
          });
        });
        app.update(doc, (err, result) => {});
      }
    });
  };

  site.hasErDoctorDeskTop = function (obj) {
    app.view({ id: obj.id }, (err, doc) => {
      if (!err && doc) {
        obj.items.forEach((_item) => {
          doc.ordersList.forEach((_o) => {
            if (_o.type == 'ER' && _item.id == _o.id) {
              _o.hasOrder = true;
            }
          });
        });
        app.update(doc, (err, result) => {});
      }
    });
  };

  app.init();
  site.addApp(app);
};
