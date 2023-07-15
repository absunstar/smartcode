module.exports = function init(site) {
  let app = {
    name: 'salesInvoices',
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
    allowRouteReport: true,
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
          res.render(app.name + '/index.html', { title: app.name, appName: 'Sales Invoices For Customers', setting: site.getSystemSetting(req) }, { parser: 'html', compres: true });
        }
      );
    }

    if (app.allowRouteAdd) {
      site.post({ name: `/api/${app.name}/add`, require: { permissions: ['login'] } }, (req, res) => {
        let response = {
          done: false,
        };

        let _data = req.data;

        _data['approved'] = true;
        _data.company = site.getCompany(req);
        const storesSetting = site.getSystemSetting(req).storesSetting;
        let errBatchList = [];
        let medicationDosesList = [];
        const accountsSetting = site.getSystemSetting(req).accountsSetting;
        site.getBatchesToSalesAuto({ store: _data.store, items: _data.itemsList }, (callbackItems) => {
          _data.itemsList.forEach((_item) => {
            if (_item.hasMedicalData && _data.salesType.code != 'company') {
              if (!_item.medicineDuration || !_item.medicineFrequency || !_item.medicineRoute) {
                let itemName = req.session.lang == 'Ar' ? _item.nameAr : _item.nameEn;
                medicationDosesList.push(itemName);
              }
            }
            if (_item.workByBatch || _item.workBySerial || _item.workByQrCode) {
              if (_item.batchesList) {
                if (storesSetting.workFifo) {
                  _item.$batchCount = _item.batchesList.reduce((a, b) => a + b.count, 0);

                  if (_item.$batchCount != _item.count) {
                    let itemIndex = callbackItems.findIndex((itm) => itm.id === _item.id);
                    if (itemIndex !== -1) {
                      _item.batchesList = callbackItems[itemIndex].batchesList;
                    }
                  }
                  _item.$batchCount = _item.batchesList.reduce((a, b) => a + b.count, 0);
                }
                let batchCountErr = _item.batchesList.find((b) => {
                  return b.count > b.currentCount;
                });
                if (_item.$batchCount != _item.count || batchCountErr) {
                  let itemName = req.session.lang == 'Ar' ? _item.nameAr : _item.nameEn;
                  errBatchList.push(itemName);
                }
              } else {
                let itemName = req.session.lang == 'Ar' ? _item.nameAr : _item.nameEn;
                errBatchList.push(itemName);
              }
            }
          });

          if (errBatchList.length > 0) {
            let error = errBatchList.map((m) => m).join('-');
            response.error = `The Batches Count is not correct in ( ${error} )`;
            res.json(response);
            return;
          }

          if (medicationDosesList.length > 0) {
            let error = medicationDosesList.map((m) => m).join('-');
            response.error = `The Medication doses is not correct in ( ${error} )`;
            res.json(response);
            return;
          }

          let appName = 'salesInvoices';

          if (_data.salesType.code == 'company') {
            appName = 'salesCompaniesInvoices';
          } else if (_data.salesType.code == 'patient') {
            appName = 'salesPatientsInvoices';
          } else if (_data.salesType.code == 'er') {
            appName = 'salesErInvoices';
          }

          let numObj = {
            company: site.getCompany(req),
            screen: appName,
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

          let overDraftObj = {
            store: _data.store,
            items: _data.itemsList,
          };

          site.checkOverDraft(req, overDraftObj, (overDraftCb) => {
            if (!overDraftCb.done) {
              let error = '';
              error = overDraftCb.refuseList.map((m) => (req.session.lang == 'Ar' ? m.nameAr : m.nameEn)).join('-');
              response.error = `Item Balance Insufficient ( ${error} )`;
              res.json(response);
              return;
            }
            _data.addUserInfo = req.getUserFinger();

            if (_data.invoiceType.id == 1 && accountsSetting.linkAccountsToStores) {
              if (site.toNumber(_data.$paidByCustomer) < site.toNumber(_data.totalNet)) {
                response.error = 'Must Paid By Customer greater than or equal to ';
                res.json(response);
                return;
              }
              if (!_data.paymentType || !_data.paymentType.id) {
                response.error = 'Must Select Payment Type';
                res.json(response);
                return;
              } else if (!_data.safe || !_data.safe.id) {
                response.error = 'Must Select Safe';
                res.json(response);
                return;
              }
              _data.remainPaid = _data.totalNet - _data.amountPaid;
            } else {
              _data.remainPaid = _data.totalNet;
              if (_data.invoiceType.id == 2) {
                if (_data.installmentsList && _data.installmentsList.length > 0) {
                  let totalInstallment = _data.installmentsList.reduce((a, b) => a + b.amount, 0);
                  totalInstallment = site.toNumber(totalInstallment);
                  if (totalInstallment != _data.totalNet) {
                    response.error = `The installments amount is not equal invoice total net`;
                    res.json(response);
                    return;
                  }
                }
              }
            }

            app.add(_data, (err, doc) => {
              if (!err) {
                response.done = true;
                if (doc.invoiceType.id == 1 && accountsSetting.linkAccountsToStores) {
                  site.addReceiptVouchers({
                    session: req.session,
                    date: new Date(),
                    customer: doc.customer,
                    patient: doc.patient,
                    voucherType: site.vouchersTypes[0],
                    invoiceId: doc.id,
                    invoiceCode: doc.code,
                    total: doc.amountPaid,
                    safe: doc.safe,
                    paymentType: doc.paymentType,
                    addUserInfo: doc.addUserInfo,
                    company: doc.company,
                    branch: doc.branch,
                  });
                }
                let obj = {
                  code: doc.code,
                  image: doc.image,
                  appName: app.name,
                  store: doc.store,
                  customer: doc.customer,
                  user: doc.customer,
                  patient: doc.patient,
                  totalNet: doc.totalNet,
                  totalBeforeVat: doc.totalBeforeVat,
                  totalDiscounts: doc.totalDiscounts,
                  totalVat: doc.totalVat,
                  totalAverageCost: 0,
                  userInfo: doc.addUserInfo,
                };

                doc.itemsList.forEach((_item) => {
                  obj.totalAverageCost += _item.averageCost || 0;
                  let item = { ..._item };
                  item.store = { ...doc.store };
                  site.editItemsBalance(item, app.name);
                  item.invoiceId = doc.id;
                  item.company = doc.company;
                  item.date = doc.date;
                  item.customer = doc.customer;
                  item.countType = 'out';
                  item.orderCode = doc.code;
                  site.setItemCard(item, app.name);
                });

                if (doc.store.linkWithRasd && doc.store.rasdUser && doc.store.rasdPass) {
                  site.sendRasdData({
                    rasdUser: doc.store.rasdUser,
                    rasdPass: doc.store.rasdPass,
                    appName: app.name,
                    items: doc.itemsList,
                  });
                }

                if (doc.salesType.code == 'patient') {
                  obj.user = result.doc.patient;
                  site.hasSalesDoctorDeskTop({ id: doc.doctorDeskTop.id, items: doc.itemsList });
                }
                if (doc.salesType.code == 'er') {
                  obj.user = result.doc.patient;
                  site.hasErDoctorDeskTop({ id: doc.doctorDeskTop.id, items: doc.itemsList });
                }
                obj.nameAr = 'فاتورة مبيعات' + ' (' + doc.code + ' )';
                obj.nameEn = 'Sales Invoice' + ' (' + doc.code + ' )';
                obj.session = req.session;
                site.autoJournalEntry(obj);
                response.doc = doc;
              } else {
                response.error = err.message;
              }

              res.json(response);
            });
          });
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
        let select = req.body.select || {};
        let search = req.body.search || '';
        let limit = req.body.limit || 50;
        if (select == 'all') {
          select = {};
        }
        if (where && where.fromDate && where.toDate) {
          let d1 = site.toDate(where.fromDate);
          let d2 = site.toDate(where.toDate);
          d2.setDate(d2.getDate() + 1);
          where.date = {
            $gte: d1,
            $lte: d2,
          };
          delete where.fromDate;
          delete where.toDate;
        }
        if (app.allowMemory) {
          let list = app.memoryList.filter(
            (g) => g.company && g.company.id == site.getCompany(req).id && (typeof where.active != 'boolean' || g.active === where.active) && JSON.stringify(g).contains(where.search)
          );

          res.json({
            done: true,
            list: list.slice(-limit),
          });
        } else {
          where['company.id'] = site.getCompany(req).id;

          app.all({ where: where, limit, select, sort: { id: -1 } }, (err, docs) => {
            if (req.body.claims && docs) {
              let list = [];
              docs.forEach((_doc) => {
                if (_doc.itemsList && _doc.itemsList.length > 0 && _doc.doctorDeskTop && _doc.doctorDeskTop.id) {
                  _doc.itemsList.forEach((_s) => {
                    let obj = {
                      Membership_No: _doc.doctorDeskTop.patient.member,
                      Patient_File_No: _doc.doctorDeskTop.patient.code,
                      Patient_Name: _doc.doctorDeskTop.patient.fullNameEn,
                      Patient_ID: _doc.doctorDeskTop.patient.havisaNum,
                      Nationality: _doc.doctorDeskTop.patient.nationality.nameEn,
                      Invoice_No: _doc.doctorDeskTop.code,
                      Invoice_Date: _doc.date,
                      DOCTOR_NAME: _doc.doctorDeskTop.doctor.nameEn,
                      SPECIALTY: _doc.doctorDeskTop.doctor.specialty.nameEn,
                      PREAUTH: '',
                      ICD10_Code1: '',
                      Claim_Type: _doc.doctorDeskTop.type == 'out' ? 'O' : 'I',
                      Service_Code: _s.code,
                      Service_Description: _s.nameEn,
                      Tooth_No: '',
                      Service_date: _doc.date,
                      QTY: 1,
                      Gross_Amount: _s.price,
                      Discount: _s.totalDisc,
                      Net_After_Discount: _s.totalAfterDisc,
                      Deductible: _s.deduct,
                      Net_Payable_Amount: _s.comCash,
                      VatPercentage: _s.comVat,
                      PatientVatAmount: _s.totalPVat,
                      NetVatAmount: _s.totalComVat,
                      Temperature: _doc.doctorDeskTop.temperature,
                      Respiratory_rate: _doc.doctorDeskTop.respiratoryRate,
                      Blood_pressure: _doc.doctorDeskTop.bloodPressureHigh + '/' + _doc.doctorDeskTop.bloodPressureLow,
                      Height: _doc.doctorDeskTop.height,
                      Weight: _doc.doctorDeskTop.weight,
                      Pulse: _doc.doctorDeskTop.pulse,
                      Policy_Name: _doc.doctorDeskTop.patient.insuranceCompany && _doc.doctorDeskTop.patient.insuranceCompany.id ? _doc.doctorDeskTop.patient.insuranceCompany.nameEn : '',
                      MediCode: '',
                      Notes: _s.notesAfter,
                      Policy: _doc.doctorDeskTop.patient.policyNumber,
                      Refer_Ind: _doc.doctorDeskTop.referNum,
                      Emr_Ind: '',
                      VIndicator: _s.comVat ? 1 : 0,
                    };

                    list.push(obj);
                  });
                }
              });
              res.json({
                done: true,
                list: list,
              });
            } else {
              res.json({ done: true, list: docs });
            }
          });
        }
      });
    }

    if (app.allowRouteReport) {
      site.post({ name: `/api/${app.name}/report`, public: true }, (req, res) => {
        let where = req.body.where || {};
        let select = req.body.select || {};
        let search = req.body.search || '';
        let limit = req.body.limit || 50;
        if (select == 'all') {
          select = {};
        }
        if (where && where.fromDate && where.toDate) {
          let d1 = site.toDate(where.fromDate);
          let d2 = site.toDate(where.toDate);
          d2.setDate(d2.getDate() + 1);
          where.date = {
            $gte: d1,
            $lte: d2,
          };
          delete where.fromDate;
          delete where.toDate;
        }
        // console.log('salesInvoices',where);

        where['company.id'] = site.getCompany(req).id;

        app.all({ where: where, limit, select, sort: { id: -1 } }, (err, docs) => {
          if (req.body.claims && docs) {
            let list = [];
            docs.forEach((_doc) => {
              if (_doc.itemsList && _doc.itemsList.length && _doc.doctorDeskTop && _doc.doctorDeskTop.id) {
                _doc.itemsList.forEach((_s) => {
                  let obj = {
                    Membership_No: _doc.doctorDeskTop.patient.member,
                    Patient_File_No: _doc.doctorDeskTop.patient.code,
                    Patient_Name: _doc.doctorDeskTop.patient.fullNameEn,
                    Patient_ID: _doc.doctorDeskTop.patient.havisaNum,
                    Nationality: _doc.doctorDeskTop.patient.nationality.nameEn,
                    Invoice_No: _doc.doctorDeskTop.code,
                    Invoice_Date: _doc.date,
                    DOCTOR_NAME: _doc.doctorDeskTop.doctor.nameEn,
                    SPECIALTY: _doc.doctorDeskTop.doctor.specialty.nameEn,
                    PREAUTH: '',
                    ICD10_Code1: '',
                    Claim_Type: _doc.doctorDeskTop.type == 'out' ? 'O' : 'I',
                    Service_Code: _s.code,
                    Service_Description: _s.nameEn,
                    Tooth_No: '',
                    Service_date: _doc.date,
                    QTY: 1,
                    Gross_Amount: _s.price,
                    Discount: _s.totalDisc,
                    Net_After_Discount: _s.totalAfterDisc,
                    Deductible: _s.deduct,
                    Net_Payable_Amount: _s.comCash,
                    VatPercentage: _s.comVat,
                    PatientVatAmount: _s.totalPVat,
                    NetVatAmount: _s.totalComVat,
                    Temperature: _doc.doctorDeskTop.temperature,
                    Respiratory_rate: _doc.doctorDeskTop.respiratoryRate,
                    Blood_pressure: _doc.doctorDeskTop.bloodPressureHigh + '/' + _doc.doctorDeskTop.bloodPressureLow,
                    Height: _doc.doctorDeskTop.height,
                    Weight: _doc.doctorDeskTop.weight,
                    Pulse: _doc.doctorDeskTop.pulse,
                    Policy_Name: _doc.doctorDeskTop.patient.insuranceCompany && _doc.doctorDeskTop.patient.insuranceCompany.id ? _doc.doctorDeskTop.patient.insuranceCompany.nameEn : '',
                    MediCode: '',
                    Notes: _s.notesAfter,
                    Policy: _doc.doctorDeskTop.patient.policyNumber,
                    Refer_Ind: _doc.doctorDeskTop.referNum,
                    Emr_Ind: '',
                    VIndicator: _s.comVat ? 1 : 0,
                  };

                  list.push(obj);
                });
              }
            });
            res.json({
              done: true,
              list: list,
            });
          } else {
            res.json({ done: true, list: docs });
          }
        });
      });
    }
  }

  site.changeRemainPaidSalesInvoices = function (obj) {
    app.view({ id: obj.id }, (err, doc) => {
      if (!err && doc) {
        if (doc.invoiceType.id == 2 && doc.installmentsList && doc.installmentsList.length > 0) {
          let index = doc.installmentsList.findIndex((itm) => itm.date.toString() === obj.installment.date.toString());
          if (index !== -1) {
            doc.installmentsList[index].paid = true;
          }
        }

        doc.remainPaid -= obj.total;
        app.update(doc, (err, result) => {});
      }
    });
  };

  app.init();
  site.addApp(app);
};
