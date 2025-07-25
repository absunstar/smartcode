module.exports = function init(site) {
  let app = {
    name: "salesInvoices",
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

      app.$collection.find({ id: _item.id || _item.invoiceId }, (err, doc) => {
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
          res.render(
            app.name + "/index.html",
            {
              title: app.name,
              appName: req.word("Sales Invoices"),
              setting: site.getCompanySetting(req),
            },
            { parser: "html", compres: true }
          );
        }
      );
    }

    if (app.allowRouteAdd) {
      site.post({ name: `/api/${app.name}/add`, require: { permissions: ["login"] } }, (req, res) => {
        let response = {
          done: false,
        };

        let _data = req.data;
        if ((!_data.itemsList || !_data.itemsList.length) && !_data.openingBalance) {
          response.error = `The items list is empty`;
          res.json(response);
          return;
        }
        if (_data.fromOfferPrice) {
          if (!_data.offerPrice || !_data.offerPrice.id) {
            response.error = `Must Select Offer Price`;
            res.json(response);
            return;
          } else {
            _data.offerPrice = {
              id: _data.offerPrice.id,
              code: _data.offerPrice.code,
              date: _data.offerPrice.date,
              title: _data.offerPrice.title,
            };
          }
        }
        const storesSetting = site.getCompanySetting(req).storesSetting;

        if (_data.salesCategory && _data.salesCategory.id == 2) {
          _data.deliveryStatus = {
            ...site.deliveryStatus[0],
            date: new Date(),
          };
          _data.deliveryStatusList = [_data.deliveryStatus];
          _data["approved"] = _data["approved"] || false;
        } else if (_data.orderScreen) {
          _data["approved"] = _data["approved"] || false;
        } else if (storesSetting.autoApproveSales) {
          _data["approved"] = true;
        } else {
          _data["approved"] = true;
        }

        _data.company = site.getCompany(req);

        let errBatchList = [];
        let medicationDosesList = [];
        const accountsSetting = site.getCompanySetting(req).accountsSetting;
        site.getBatchesToSalesAuto({ store: _data.store, items: _data.itemsList }, (callbackItems) => {
          _data?.itemsList?.forEach((_item) => {
            if (_item.hasMedicalData && _data.salesType.code != "company") {
              if (!_item.medicineDuration || !_item.medicineFrequency || !_item.medicineRoute) {
                let itemName = req.session.lang == "Ar" ? _item.nameAr : _item.nameEn;
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
                  let itemName = req.session.lang == "Ar" ? _item.nameAr : _item.nameEn;
                  errBatchList.push(itemName);
                }
              } else {
                let itemName = req.session.lang == "Ar" ? _item.nameAr : _item.nameEn;
                errBatchList.push(itemName);
              }
            }
          });

          if (errBatchList.length > 0) {
            let error = errBatchList.map((m) => m).join("-");
            response.error = `The Batches Count is not correct in ( ${error} )`;
            res.json(response);
            return;
          }

          if (medicationDosesList.length > 0) {
            let error = medicationDosesList.map((m) => m).join("-");
            response.error = `The Medication doses is not correct in ( ${error} )`;
            res.json(response);
            return;
          }

          // if (_data.salesType.code == 'company') {
          //   appName = 'salesCompaniesInvoices';
          // } else if (_data.salesType.code == 'patient') {
          //   appName = 'salesPatientsInvoices';
          // } else if (_data.salesType.code == 'er') {
          //   appName = 'salesErInvoices';
          // }

          let overDraftObj = {
            store: _data.store,
            items: _data.itemsList,
          };

          site.checkOverDraft(req, overDraftObj, (overDraftCb) => {
            if (!overDraftCb.done) {
              let error = "";
              error = overDraftCb.refuseList.map((m) => (req.session.lang == "Ar" ? m.nameAr : m.nameEn)).join("-");
              response.error = `Item Balance Insufficient ( ${error} )`;
              res.json(response);
              return;
            }
            _data.addUserInfo = req.getUserFinger();

            if (_data.invoiceType.id == 1 && accountsSetting.linkAccountsToStores) {
              if (site.toNumber(_data.paymentList[0].paidByCustomer) < site.toNumber(_data.totalNet) && _data.paymentList.length == 1) {
                response.error = "Must Paid By Customer greater than or equal to total Net";
                res.json(response);
                return;
              }
              // if (!_data.paymentType || !_data.paymentType.id) {
              //   response.error = 'Must Select Payment Type';
              //   res.json(response);
              //   return;
              // } else if (!_data.safe || !_data.safe.id) {
              //   response.error = 'Must Select Safe';
              //   res.json(response);
              //   return;
              // }
              if (_data.paymentList && _data.paymentList.length > 0) {
                _data.amountPaid = 0;
                _data.paymentList.forEach((element) => {
                  _data.amountPaid += element.amountPaid;
                });
                if (_data.amountPaid != _data.totalNet) {
                  response.error = "Must total amount Paid equal total Net";
                  res.json(response);
                  return;
                }
              } else {
                response.error = "Must Add Payment List";
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

            let numObj = {
              company: site.getCompany(req),
              screen: "salesInvoices",
              date: new Date(),
            };

            let cb = site.getNumbering(numObj);
            if (!_data.code && !cb.auto) {
              response.error = "Must Enter Code";
              res.json(response);
              return;
            } else if (cb.auto) {
              _data.code = cb.code;
            }

            app.add(_data, (err, doc) => {
              if (!err) {
                response.done = true;
                if (_data["approved"]) {
                  if (doc.invoiceType.id == 1 && accountsSetting.linkAccountsToStores) {
                    doc.paymentList.forEach((_p, i) => {
                      setTimeout(() => {
                        site.addReceiptVouchers({
                          session: req.session,
                          itemsList: doc.itemsList,
                          date: new Date(),
                          delivery: doc.delivery,
                          customer: doc.customer,
                          patient: doc.patient,
                          company: doc.company,
                          doctorDeskTop: doc.doctorDeskTop,
                          voucherType: site.vouchersTypes[2],
                          invoiceId: doc.id,
                          invoiceCode: doc.code,
                          total: _p.amountPaid,
                          safe: _p.safe,
                          paymentType: _p.paymentType,
                          addUserInfo: doc.addUserInfo,
                          branch: doc.branch,
                        });
                      }, 1000 * i);
                    });
                  }
                  let obj = {
                    code: doc.code,
                    image: doc.image,
                    appName: app.name,
                    store: doc.store,
                    delivery: doc.delivery,
                    customer: doc.customer,
                    company: doc.company,
                    user: doc.customer,
                    patient: doc.patient,
                    totalNet: doc.totalNet,
                    totalBeforeVat: doc.totalBeforeVat,
                    totalDiscounts: doc.totalDiscounts,
                    totalVat: doc.totalVat,
                    totalAverageCost: 0,
                    userInfo: doc.addUserInfo,
                  };

                  doc?.itemsList?.forEach((_item) => {
                    obj.totalAverageCost += _item.averageCost || 0;
                    let item = { ..._item };
                    item.store = { ...doc.store };
                    site.editItemsBalance(item, app.name);
                    item.invoiceId = doc.id;
                    item.company = doc.company;
                    item.date = doc.date;
                    item.delivery = doc.delivery;
                    item.customer = doc.customer;
                    item.patient = doc.patient;
                    item.countType = "out";
                    item.orderCode = doc.code;
                    site.setItemCard(item, app.name);
                  });

                  if (doc.store.linkWithRasd && doc.store.rasdUser && doc.store.rasdPass && doc.itemsList) {
                    site.sendRasdData({
                      rasdUser: doc.store.rasdUser,
                      rasdPass: doc.store.rasdPass,
                      appName: app.name,
                      items: doc.itemsList,
                    });
                  }

                  if (doc.salesType.code == "patient") {
                    obj.user = doc.patient;
                    site.hasSalesDoctorDeskTop({
                      id: doc.doctorDeskTop.id,
                      items: doc.itemsList,
                    });
                  } else if (doc.salesType.code == "er") {
                    obj.user = doc.patient;
                    site.hasErDoctorDeskTop({
                      id: doc.doctorDeskTop.id,
                      items: doc.itemsList,
                    });
                  }
                  obj.nameAr = "فاتورة مبيعات" + " (" + doc.code + " )";
                  obj.nameEn = "Sales Invoice" + " (" + doc.code + " )";
                  obj.session = req.session;
                  site.autoJournalEntry(obj);
                }
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
      site.post(
        {
          name: `/api/${app.name}/update`,
          require: { permissions: ["login"] },
        },
        (req, res) => {
          let response = {
            done: false,
          };

          let _data = req.data;
          if (!_data.itemsList || !_data.itemsList.length) {
            response.error = `The items list is empty`;
            res.json(response);
            return;
          }
          _data.editUserInfo = req.getUserFinger();
          if (_data.fromOfferPrice) {
            if (!_data.offerPrice || !_data.offerPrice.id) {
              response.error = `Must Select Offer Price`;
              res.json(response);
              return;
            }
          } else if (_data.offerPrice) {
            _data.offerPrice = {
              id: _data.offerPrice.id,
              code: _data.offerPrice.code,
              date: _data.offerPrice.date,
              title: _data.offerPrice.title,
            };
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
        }
      );
    }

    if (app.allowRouteDelete) {
      site.post(
        {
          name: `/api/${app.name}/delete`,
          require: { permissions: ["login"] },
        },
        (req, res) => {
          let response = {
            done: false,
          };
          let _data = req.data;

          app.delete(_data, (err, result) => {
            if (!err && result.count === 1) {
              response.done = true;
              response.result = result;
            } else {
              response.error = err?.message || "Deleted Not Exists";
            }
            res.json(response);
          });
        }
      );
    }

    if (app.allowRouteView) {
      site.post({ name: `/api/${app.name}/view`, public: true }, (req, res) => {
        let response = {
          done: false,
        };

        let _data = req.data;

        app.view({ id: _data.id }, (err, doc) => {
          if (!err && doc) {
            response.done = true;
            response.doc = doc;
          } else {
            response.error = err?.message || "Not Exists";
          }
          res.json(response);
        });
      });
    }

    if (app.allowRouteAll) {
      site.post({ name: `/api/${app.name}/all`, public: true }, (req, res) => {
        let where = req.body.where || {};
        let select = req.body.select || {};
        let search = req.body.search || "";
        let limit = req.body.limit || 500;
        if (select == "all") {
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
            (g) => g.company && g.company.id == site.getCompany(req).id && (typeof where.active != "boolean" || g.active === where.active) && JSON.stringify(g).contains(where.search)
          );

          res.json({
            done: true,
            list: list.slice(-limit),
          });
        } else {
          where["company.id"] = site.getCompany(req).id;
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
                      PREAUTH: "",
                      ICD10_Code1: "",
                      Claim_Type: _doc.doctorDeskTop.type == "out" ? "O" : "I",
                      Service_Code: _s.code,
                      Service_Description: _s.nameEn,
                      Tooth_No: "",
                      Service_date: _doc.date,
                      QTY: 1,
                      Gross_Amount: _s.price,
                      Discount: _s.totalDiscounts,
                      Net_After_Discount: _s.totalAfterDiscounts,
                      Deductible: _s.deduct,
                      Net_Payable_Amount: _s.companyCash,
                      VatPercentage: _s.comVat,
                      PatientVatAmount: _s.totalPVat,
                      NetVatAmount: _s.totalComVat,
                      Temperature: _doc.doctorDeskTop.temperature,
                      Respiratory_rate: _doc.doctorDeskTop.respiratoryRate,
                      Blood_pressure: _doc.doctorDeskTop.bloodPressureHigh + "/" + _doc.doctorDeskTop.bloodPressureLow,
                      Height: _doc.doctorDeskTop.height,
                      Weight: _doc.doctorDeskTop.weight,
                      Pulse: _doc.doctorDeskTop.pulse,
                      Policy_Name: _doc.doctorDeskTop.patient.insuranceCompany && _doc.doctorDeskTop.patient.insuranceCompany.id ? _doc.doctorDeskTop.patient.insuranceCompany.nameEn : "",
                      MediCode: "",
                      Notes: _s.notesAfter,
                      Policy: _doc.doctorDeskTop.patient.policyNumber,
                      Refer_Ind: _doc.doctorDeskTop.referNum,
                      Emr_Ind: "",
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

    site.post({ name: `/api/${app.name}/kitchenItems`, public: true }, (req, res) => {
      let where = req.body.where || {};
      let select = req.body.select || {};
      let search = req.body.search || "";
      let limit = req.body.limit || 50;

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

      where["company.id"] = site.getCompany(req).id;
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
      app.all({ where: where, limit, select, sort: { id: -1 } }, (err, docs) => {
        if (docs) {
          let list = [];
          docs.forEach((_doc) => {
            if (_doc.itemsList && _doc.itemsList.length > 0) {
              _doc.itemsList.forEach((_s) => {
                if (_s.itemGroup && _s.itemGroup.kitchen && _s.itemGroup.kitchen.id == req.body.kitchenId && !_s.doneKitchen) {
                  _s.invoiceId = _doc.id;
                  _s.invoiceCode = _doc.code;
                  list.push({ ..._s });
                }
              });
            }
          });
          res.json({
            done: true,
            list: list,
          });
        } else {
          res.json({ done: true, list: [] });
        }
      });
    });

    site.post({ name: `/api/${app.name}/kitchenInProgress`, public: true }, (req, res) => {
      let where = req.body.where || {};
      let select = req.body.select || {};
      let search = req.body.search || "";
      let limit = req.body.limit || 50;

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

      where["company.id"] = site.getCompany(req).id;
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
      app.all({ where: where, limit, select, sort: { id: -1 } }, (err, docs) => {
        if (docs) {
          let list = [];
          docs.forEach((_doc) => {
            list.push(_doc.code);
          });
          res.json({
            done: true,
            list: list,
          });
        } else {
          res.json({ done: true, list: [] });
        }
      });
    });

    site.post({ name: `/api/${app.name}/kitchenServing`, public: true }, (req, res) => {
      let where = req.body.where || {};
      let select = req.body.select || {};
      let search = req.body.search || "";
      let limit = req.body.limit || 50;

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

      where["company.id"] = site.getCompany(req).id;
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
      app.all({ where: where, limit, select, sort: { id: -1 } }, (err, docs) => {
        if (docs) {
          let list = [];
          docs.forEach((_doc) => {
            list.push(_doc.code);
          });
          res.json({
            done: true,
            list: list,
          });
        } else {
          res.json({ done: true, list: [] });
        }
      });
    });

    site.post({ name: `/api/${app.name}/kitchenComplitedItem`, public: true }, (req, res) => {
      let response = {
        done: false,
      };

      let _data = req.data;
      app.view({ invoiceId: _data.invoiceId }, (err, doc) => {
        if (!err && doc) {
          let _doc = { ...doc };
          let itemIndex = _doc.itemsList.findIndex((itm) => itm.id === _data.id && _data.randomCode == itm.randomCode);
          if (itemIndex !== -1) {
            _doc.itemsList[itemIndex].doneKitchen = true;
          }

          app.update(_doc, (err, result) => {
            if (!err) {
              response.done = true;
            } else {
              response.error = err.message;
            }
            res.json(response);
          });
        } else {
          response.error = err?.message || "Not Exists";
          res.json(response);
        }
      });
    });

    if (app.allowRouteReport) {
      site.post({ name: `/api/${app.name}/report`, public: true }, (req, res) => {
        let where = req.body.where || {};
        let select = req.body.select || {};
        let search = req.body.search || "";
        let limit = req.body.limit || 5000;
        if (select == "all") {
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

        where["company.id"] = site.getCompany(req).id;

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
                    PREAUTH: "",
                    ICD10_Code1: "",
                    Claim_Type: _doc.doctorDeskTop.type == "out" ? "O" : "I",
                    Service_Code: _s.code,
                    Service_Description: _s.nameEn,
                    Tooth_No: "",
                    Service_date: _doc.date,
                    QTY: 1,
                    Gross_Amount: _s.price,
                    Discount: _s.totalDisc,
                    Net_After_Discount: _s.totalAfterDisc,
                    Deductible: _s.deduct,
                    Net_Payable_Amount: _s.companyCash,
                    VatPercentage: _s.comVat,
                    PatientVatAmount: _s.totalPVat,
                    NetVatAmount: _s.totalComVat,
                    Temperature: _doc.doctorDeskTop.temperature,
                    Respiratory_rate: _doc.doctorDeskTop.respiratoryRate,
                    Blood_pressure: _doc.doctorDeskTop.bloodPressureHigh + "/" + _doc.doctorDeskTop.bloodPressureLow,
                    Height: _doc.doctorDeskTop.height,
                    Weight: _doc.doctorDeskTop.weight,
                    Pulse: _doc.doctorDeskTop.pulse,
                    Policy_Name: _doc.doctorDeskTop.patient.insuranceCompany && _doc.doctorDeskTop.patient.insuranceCompany.id ? _doc.doctorDeskTop.patient.insuranceCompany.nameEn : "",
                    MediCode: "",
                    Notes: _s.notesAfter,
                    Policy: _doc.doctorDeskTop.patient.policyNumber,
                    Refer_Ind: _doc.doctorDeskTop.referNum,
                    Emr_Ind: "",
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
            let totalNet = 0;
            let totalPaid = 0;
            let totalRemain = 0;
            for (let i = 0; i < docs.length; i++) {
              totalNet += Number(docs[i].totalNet);
              docs[i].totalPaid = Number(docs[i].totalNet) - Number(docs[i].remainPaid);
              totalPaid += docs[i].totalPaid;
              totalRemain += Number(docs[i].remainPaid);
            }
            res.json({ done: true, totalNet, totalPaid, totalRemain, list: docs });
          }
        });
      });
    }
  }

  site.post({ name: `/api/${app.name}/approve`, require: { permissions: ["login"] } }, (req, res) => {
    let response = {
      done: false,
    };

    let _data = req.data;

    if (!_data.id) {
      response.error = "No Id";
      res.json(response);
      return;
    }

    if (_data.fromOfferPrice) {
      if (!_data.offerPrice || !_data.offerPrice.id) {
        response.error = `Must Select Offer Price`;
        res.json(response);
        return;
      }
    } else {
      _data.offerPrice = {
        id: _data?.offerPrice?.id,
        code: _data?.offerPrice?.code,
        date: _data?.offerPrice?.date,
        title: _data?.offerPrice?.title,
      };
    }

    if (_data.salesCategory && _data.salesCategory.id == 2) {
      _data.deliveryStatus = { ...site.deliveryStatus[1], date: new Date() };
      _data.deliveryStatusList.push(_data.deliveryStatus);
    }

    _data["approved"] = true;
    const storesSetting = site.getCompanySetting(req).storesSetting;
    let errBatchList = [];
    let medicationDosesList = [];
    const accountsSetting = site.getCompanySetting(req).accountsSetting;
    site.getBatchesToSalesAuto({ store: _data.store, items: _data.itemsList }, (callbackItems) => {
      _data.itemsList.forEach((_item) => {
        if (_item.hasMedicalData && _data.salesType.code != "company") {
          if (!_item.medicineDuration || !_item.medicineFrequency || !_item.medicineRoute) {
            let itemName = req.session.lang == "Ar" ? _item.nameAr : _item.nameEn;
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
              let itemName = req.session.lang == "Ar" ? _item.nameAr : _item.nameEn;
              errBatchList.push(itemName);
            }
          } else {
            let itemName = req.session.lang == "Ar" ? _item.nameAr : _item.nameEn;
            errBatchList.push(itemName);
          }
        }
      });

      if (errBatchList.length > 0) {
        let error = errBatchList.map((m) => m).join("-");
        response.error = `The Batches Count is not correct in ( ${error} )`;
        res.json(response);
        return;
      }

      if (medicationDosesList.length > 0) {
        let error = medicationDosesList.map((m) => m).join("-");
        response.error = `The Medication doses is not correct in ( ${error} )`;
        res.json(response);
        return;
      }

      let appName = "salesInvoices";

      // if (_data.salesType.code == 'company') {
      //   appName = 'salesCompaniesInvoices';
      // } else if (_data.salesType.code == 'patient') {
      //   appName = 'salesPatientsInvoices';
      // } else if (_data.salesType.code == 'er') {
      //   appName = 'salesErInvoices';
      // }

      let numObj = {
        company: site.getCompany(req),
        screen: appName,
        date: new Date(),
      };

      let cb = site.getNumbering(numObj);
      if (!_data.code && !cb.auto) {
        response.error = "Must Enter Code";
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
          let error = "";
          error = overDraftCb.refuseList.map((m) => (req.session.lang == "Ar" ? m.nameAr : m.nameEn)).join("-");
          response.error = `Item Balance Insufficient ( ${error} )`;
          res.json(response);
          return;
        }
        _data.editUserInfo = req.getUserFinger();

        if (_data.invoiceType.id == 1 && accountsSetting.linkAccountsToStores) {
          // if (site.toNumber(_data.paidByCustomer) < site.toNumber(_data.totalNet)) {
          //   response.error = 'Must Paid By Customer greater than or equal to ';
          //   res.json(response);
          //   return;
          // }
          // if (!_data.paymentType || !_data.paymentType.id) {
          //   response.error = 'Must Select Payment Type';
          //   res.json(response);
          //   return;
          // } else if (!_data.safe || !_data.safe.id) {
          //   response.error = 'Must Select Safe';
          //   res.json(response);
          //   return;
          // }
          if (site.toNumber(_data.paymentList[0].paidByCustomer) < site.toNumber(_data.totalNet) && _data.paymentList.length == 1) {
            response.error = "Must Paid By Customer greater than or equal to total Net";
            res.json(response);
            return;
          }
          if (_data.paymentList && _data.paymentList.length > 0) {
            _data.amountPaid = 0;
            _data.paymentList.forEach((element) => {
              _data.amountPaid += element.amountPaid;
            });
            if (_data.amountPaid != _data.totalNet) {
              response.error = "Must total amount Paid equal total Net";
              res.json(response);
              return;
            }
          } else {
            response.error = "Must Add Payment List";
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

        app.update(_data, (err, result) => {
          if (!err) {
            response.done = true;
            if (result.doc) {
              if (result.doc.invoiceType.id == 1 && accountsSetting.linkAccountsToStores) {
                result.doc.paymentList.forEach((_p, i) => {
                  setTimeout(() => {
                    site.addReceiptVouchers({
                      session: req.session,
                      date: new Date(),
                      itemsList: result.doc.itemsList,
                      delivery: result.doc.delivery,
                      customer: result.doc.customer,
                      patient: result.doc.patient,
                      doctorDeskTop: result.doc.doctorDeskTop,
                      voucherType: site.vouchersTypes[2],
                      invoiceId: result.doc.id,
                      invoiceCode: result.doc.code,
                      total: _p.amountPaid,
                      safe: _p.safe,
                      paymentType: _p.paymentType,
                      addUserInfo: result.doc.addUserInfo,
                      company: result.doc.company,
                      branch: result.doc.branch,
                    });
                  }, 1000 * i);
                });
              }
              let obj = {
                code: result.doc.code,
                image: result.doc.image,
                appName: app.name,
                store: result.doc.store,
                delivery: result.doc.delivery,
                customer: result.doc.customer,
                company: result.doc.company,
                user: result.doc.customer,
                patient: result.doc.patient,
                totalNet: result.doc.totalNet,
                totalBeforeVat: result.doc.totalBeforeVat,
                totalDiscounts: result.doc.totalDiscounts,
                totalVat: result.doc.totalVat,
                totalAverageCost: 0,
                userInfo: result.doc.addUserInfo,
              };

              result.doc.itemsList.forEach((_item) => {
                obj.totalAverageCost += _item.averageCost || 0;
                let item = { ..._item };
                item.store = { ...result.doc.store };
                site.editItemsBalance(item, app.name);
                item.invoiceId = result.doc.id;
                item.company = result.doc.company;
                item.date = result.doc.date;
                item.delivery = result.doc.delivery;
                item.customer = result.doc.customer;
                item.patient = result.doc.patient;
                item.countType = "out";
                item.orderCode = result.doc.code;
                site.setItemCard(item, app.name);
              });

              if (result.doc.store.linkWithRasd && result.doc.store.rasdUser && result.doc.store.rasdPass) {
                site.sendRasdData({
                  rasdUser: result.doc.store.rasdUser,
                  rasdPass: result.doc.store.rasdPass,
                  appName: app.name,
                  items: result.doc.itemsList,
                });
              }

              if (result.doc.salesType.code == "patient") {
                obj.user = result.doc.patient;
                site.hasSalesDoctorDeskTop({
                  id: result.doc.doctorDeskTop.id,
                  items: result.doc.itemsList,
                });
              } else if (result.doc.salesType.code == "er") {
                obj.user = result.doc.patient;
                site.hasErDoctorDeskTop({
                  id: result.doc.doctorDeskTop.id,
                  items: result.doc.itemsList,
                });
              }
              obj.nameAr = "فاتورة مبيعات" + " (" + result.doc.code + " )";
              obj.nameEn = "Sales Invoice" + " (" + result.doc.code + " )";
              obj.session = req.session;
              site.autoJournalEntry(obj);
              response.doc = result.doc;
            }
          } else {
            response.error = err.message;
          }

          res.json(response);
        });
      });
    });
  });

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
    where["approved"] = true;
    where["company.id"] = site.getCompany(req).id;
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

  site.post(
    {
      name: `/api/${app.name}/resetForCompany`,
      require: { permissions: ["login"] },
    },
    (req, res) => {
      let response = {
        done: false,
      };

      app.$collection.removeMany(
        {
          where: {
            "company.id": req.data.id,
          },
        },
        (err, result) => {
          response.err = err;
          response.done = true;
          res.json(response);
        }
      );
    }
  );

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

  site.getSalesInvoice = function (where, callback) {
    let select = {
      id: 1,
      itemsList: 1,
    };

    app.all({ where, select, sort: { id: -1 } }, (err, docs) => {
      if (!err && docs) {
        let totalBrand = 0;
        let totalGeneric = 0;
        let totalMedicalDevice = 0;
        docs.forEach((_doc) => {
          for (let i = 0; i < _doc.itemsList.length; i++) {
            if (_doc.itemsList[i].itemsMedicalTypes) {
              if (_doc.itemsList[i].itemsMedicalTypes.id == 1) {
                totalBrand += _doc.itemsList[i].total;
              } else if (_doc.itemsList[i].itemsMedicalTypes.id == 2) {
                totalGeneric += _doc.itemsList[i].total;
              } else if (_doc.itemsList[i].itemsMedicalTypes.id == 3) {
                totalMedicalDevice += _doc.itemsList[i].total;
              }
            }
          }
        });
        callback({ docs, totalBrand, totalGeneric, totalMedicalDevice });
      } else {
        callback(null);
      }
    });
  };

  site.getSalesInvoicesFilter = function (where, callback) {
    
    app.all({ where, sort: { id: -1 } }, (err, docs) => {
      
      if (!err && docs) {
        callback(docs);
      } else {
        callback(null);
      }
    });
  };

  app.init();
  site.addApp(app);
};
