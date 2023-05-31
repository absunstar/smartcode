module.exports = function init(site) {
  let app = {
    name: 'attendance',
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
  site.getAttendance = function (paySlip, callback) {
    const d1 = site.toDate(paySlip.fromDate);
    const d2 = site.toDate(paySlip.toDate);
    app.$collection.findMany({ where: { 'employee.id': paySlip.employeeId, date: { $gte: d1, $lte: d2 } } }, (err, docs) => {
      paySlip.realWorkTimesList.forEach((workDay) => {
        let shiftEnd;
        const shiftStart = new Date(
          new Date(workDay.date).getFullYear(),
          new Date(workDay.date).getMonth(),
          new Date(workDay.date).getDate(),
          new Date(workDay.shiftData.start).getHours(),
          new Date(workDay.shiftData.start).getMinutes()
        );

        if (workDay.shiftData.nightTime) {
          shiftEnd = new Date(
            new Date(workDay.date).getFullYear(),
            new Date(workDay.date).getMonth(),
            new Date(new Date(workDay.date).getDate() + 1),
            new Date(workDay.shiftData.end).getHours(),
            new Date(workDay.shiftData.end).getMinutes()
          );
        } else {
          shiftEnd = new Date(
            new Date(workDay.date).getFullYear(),
            new Date(workDay.date).getMonth(),
            new Date(workDay.date).getDate(),
            new Date(workDay.shiftData.end).getHours(),
            new Date(workDay.shiftData.end).getMinutes()
          );
        }

        let attencance = {
          appName: '',
          date: '',
          absent: false,
          shiftStart: '',
          shiftEnd: '',
          fingetPrintMissing: false,
        };

        let docIndex = docs.findIndex((_doc) => {
          const getDayIndex = new Date(_doc.date).getDay();
          const docDay = new Date(_doc.date).getDate();
          if (workDay && workDay.shiftData.active && docDay === workDay.day && workDay.dayIndex == getDayIndex) {
            return _doc;
          }
        });

        attencance = { ...attencance };
        if (docIndex == -1) {
          attencance = {
            appName: app.name,
            date: workDay.date,
            absent: true,
            shiftStart,
            shiftEnd,
            // attendanceDifference: -1,
            // attendPeriod: -1,
            // leaveDifference: -1,
            // shiftTime: -1,
            // absentPeriod: -1,
            attendanceDifference: 'none',
            attendPeriod: 'none',
            leaveDifference: 'none',
            shiftTime: 'none',
            absentPeriod: 'none',
            attendExisit: false,
            fingetPrintMissing: false,
          };
          paySlip.attendanceDataList.push(attencance);
          0;
        } else {
          attencance = { ...attencance };
          // const attendTime = new Date(docs[docIndex].attendTime);
          // const leaveTime = new Date(docs[docIndex].leaveTime);
          // const attendDiff = ((shiftStart.getTime() - attendTime.getTime()) / 1000 / 60).toFixed();
          // const attendanceDifference = Number(attendDiff);
          // const leaveDiff = ((shiftEnd.getTime() - leaveTime.getTime()) / 1000 / 60).toFixed();
          // const leaveDifference = Number(leaveDiff);
          // const shiftPeriod = ((shiftEnd.getTime() - shiftStart.getTime()) / 1000 / 60).toFixed();
          // const shiftTime = Number(shiftPeriod);
          // const attendValue = ((leaveTime.getTime() - attendTime.getTime()) / 1000 / 60).toFixed();
          // const attendPeriod = Number(attendValue);
          // const absentPeriod = Number(shiftTime - attendPeriod);
          let attendTime;
          let leaveTime;
          let attendDiff;
          let attendanceDifference;
          let leaveDiff;
          let leaveDifference;
          let shiftPeriod;
          let shiftTime;
          let attendValue;
          let attendPeriod;
          let absentPeriod;

          // console.log('shiftEnd', docIndex, workDay.shiftData.dayIndex, workDay.shiftData.active, new Date(docs[docIndex].date).getDate(), shiftEnd);
          if (workDay.shiftData.fingerprintMethod == 'fixed' && docIndex != -1 && !docs[docIndex].absent) {
            const attendanceListLength = docs[docIndex]?.attendanceList.length;
            attendTime = new Date(docs[docIndex]?.attendanceList[0].fingerprintTime);
            leaveTime = new Date(docs[docIndex]?.attendanceList[attendanceListLength - 1].fingerprintTime);
            attendDiff = ((shiftStart.getTime() - attendTime.getTime()) / 1000 / 60).toFixed();
            attendanceDifference = Number(attendDiff);
            leaveDiff = ((shiftEnd?.getTime() - leaveTime.getTime()) / 1000 / 60).toFixed();
            leaveDifference = Number(leaveDiff);
            shiftPeriod = ((shiftEnd?.getTime() - shiftStart.getTime()) / 1000 / 60).toFixed();
            shiftTime = Number(shiftPeriod);
            attendValue = ((leaveTime.getTime() - attendTime.getTime()) / 1000 / 60).toFixed();
            attendPeriod = Number(attendValue);
            absentPeriod = Number(shiftTime - attendPeriod);

            if (attendanceListLength == 1) {
              attencance.fingetPrintMissing = true;
              attendTime = shiftStart;
              leaveTime = shiftEnd;
            }
          }

          //  else if (workDay.shiftData.fingerprintMethod == 'variable') {

          // }
          // console.log('attencance.fingetPrintMissing', attencance.fingetPrintMissing);

          if (!docs[docIndex].absent) {
            attencance = {
              date: docs[docIndex].date,
              absent: false,
              shiftStart,
              shiftEnd,
              attendTime,
              leaveTime,
              attendanceDifference,
              attendPeriod,
              leaveDifference,
              shiftTime,
              absentPeriod,
              attendExisit: true,
              fingetPrintMissing: attencance.fingetPrintMissing,
            };
          } else {
            attencance = {
              date: docs[docIndex].date,
              absent: true,
              shiftStart,
              shiftEnd,
              attendanceDifference: 'none',
              attendPeriod: 'none',
              leaveDifference: 'none',
              shiftTime: 'none',
              absentPeriod: 'none',
              attendExisit: true,
              fingetPrintMissing: false,
            };
          }

          paySlip.attendanceDataList.push(attencance);
        }
      });

      callback(paySlip);
    });
  };
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
          res.render(app.name + '/index.html', { title: app.name, appName: 'Attendance', setting: site.getSystemSetting(req) }, { parser: 'html', compres: true });
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

        _data.date = site.toDate(_data.date);
        app.$collection.find({ where: { 'employee.id': _data.employee.id, date: { $eq: _data.date } } }, (err, doc) => {
          if (doc) {
            res.done = false;
            response.error = 'Attendance Exisit For Employee In Same Date';
            res.json(response);
          } else {
            const checkShiftData = { date: _data.date, id: _data.shift.id };
            site.checkShiftWorkDays(checkShiftData, (result) => {
              if (result.done) {
                app.add(_data, (err, doc) => {
                  if (!err && doc) {
                    response.done = true;
                    response.doc = doc;
                  } else {
                    response.error = err.mesage;
                  }
                  res.json(response);
                });
              } else {
                response.done = result.done;
                response.error = result.error;
                res.json(response);
                return;
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

        let _data = req.data;
        _data.editUserInfo = req.getUserFinger();

        _data.date = site.toDate(_data.date);
        app.$collection.find({ where: { 'employee.id': _data.employee.id, date: { $eq: _data.date } } }, (err, doc) => {
          if (doc && doc.id != _data.id) {
            res.done = false;
            response.error = 'Attendance Exisit For Employee In Same Date';
            res.json(response);
          } else {
            const checkShiftData = { date: _data.date, id: _data.shift.id };
            site.checkShiftWorkDays(checkShiftData, (result) => {
              if (result.done && doc.id == _data.id) {
                app.update(_data, (err, result) => {
                  if (!err) {
                    response.done = true;
                    response.result = result;
                  } else {
                    response.error = err.message;
                  }
                  res.json(response);
                });
              } else {
                response.done = result.done;
                response.error = result.error;
                res.json(response);
                return;
              }
            });
          }
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
        let select = req.body.select || {};
        let search = req.body.search || {};
        let limit = req.body.limit || 50;

        if (search && search.employee) {
          where.$or = [];

          where.$or.push({
            'employee.id': site.get_RegExp(search, 'i'),
          });

          where.$or.push({
            'employee.code': site.get_RegExp(search, 'i'),
          });

          where.$or.push({
            'employee.nameAr': site.get_RegExp(search, 'i'),
          });

          where.$or.push({
            'employee.nameEn': site.get_RegExp(search, 'i'),
          });
        } else {
          search = search;
        }

        if (where && where.date) {
          const d1 = site.toDate(where.date);
          where.date = { $eq: d1 };
        }

        if (where && where.fromDate && where.toDate) {
          let d1 = site.toDate(where.fromDate);
          let d2 = site.toDate(where.toDate);
          d2.setDate(d2.getDate() + 1);
          where.date = {
            $gte: d1,
            $lt: d2,
          };
          delete where.fromDate;
          delete where.toDate;
        }

        if (app.allowMemory) {
          if (!search) {
            search = 'id';
          }
          let list = app.memoryList
            .filter((g) => g.company && g.company.id == site.getCompany(req).id && (typeof where.active != 'boolean' || g.active === where.active) && JSON.stringify(g).contains(search))
            .slice(0, limit);

          res.json({
            done: true,
            list: list,
          });
        } else {
          where['company.id'] = site.getCompany(req).id;

          app.all({ where, select, limit }, (err, docs) => {
            res.json({
              done: true,
              list: docs,
            });
          });
        }
      });
    }
  }

  app.init();
  site.addApp(app);
};
