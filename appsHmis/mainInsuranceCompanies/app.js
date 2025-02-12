module.exports = function init(site) {
  let app = {
    name: 'mainInsuranceCompanies',
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
          res.render(app.name + '/index.html', { title: app.name, appName: req.word("Main Insurance Companies"), setting: site.getCompanySetting(req) }, { parser: 'html', compres: true });
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
        let select = req.body.select || { id: 1, code: 1, nameEn: 1, nameAr: 1, image: 1 };
        let list = [];
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
      });
    }
  }

  site.post({ name: `/api/mainInsurances/fromSub`, require: { permissions: ['login'] } }, (req, res) => {
    site.mainInsurancesFromSub(req.data, (callback) => {
      res.json(callback);
    });
  });

  site.mainInsurancesFromSub = function (_data, callback) {
    let response = {
      done: false,
    };
    let appInsuranceContract = site.getApp('insuranceContracts');

    let insuranceContract = appInsuranceContract.memoryList.find((_c) => _c.insuranceCompany.id == _data.insuranceCompanyId);
    if (insuranceContract) {
      if (new Date(insuranceContract.startDate) <= new Date() && new Date(insuranceContract.endDate) >= new Date()) {
        app.view({ id: insuranceContract.mainInsuranceCompany.id }, (err, doc) => {
          if (!err && doc) {
            response.done = true;
            response.insuranceContract = {
              id: insuranceContract.id,
              code: insuranceContract.code,
              nameAr: insuranceContract.nameAr,
              nameEn: insuranceContract.nameEn,
              startDate: insuranceContract.startDate,
              endDate: insuranceContract.endDate,
              insuranceClass: insuranceContract.insuranceClassesList.find((_c) => _c.id == _data.insuranceClassId),
            };

            response.mainInsuranceCompany = {
              id: doc.id,
              code: doc.code,
              nameAr: doc.nameAr,
              nameEn: doc.nameEn,
            };
          } else {
            response.error = err?.message || 'Not Exists';
          }
          callback(response);
          return;
        });
      } else {
        response.error = "The insurance company's contract date is invalid";
        callback(response);
        return;
      }
    } else {
      response.error = 'There is no insurance company for the patient';
      callback(response);
      return;
    }
  };

  site.post({ name: `/api/serviceMainInsurance`, require: { permissions: ['login'] } }, (req, res) => {
    site.serviceMainInsurance({ ...req.data, session: req.session }, (servicesCallback) => {
      res.json(servicesCallback);
    });
  });

  site.serviceMainInsurance = function (_data, callback) {
    let response = { done: false };
    const hmisSetting = site.getCompanySetting({ session: _data.session }).hmisSetting;
    let appServicesGroup = site.getApp('servicesGroups');
    let mainInsurance = app.memoryList.find((_c) => _data.mainInsuranceCompany && _c.id == _data.mainInsuranceCompany.id);
    response.done = true;
    let servicesList = [];
    let servicesIds = _data.servicesList.map((_s) => _s.id);
    site.getServices({ id: { $in: servicesIds } }, (servicesCb) => {
      site.getInsuranceContract(_data.insuranceContract, (insuranceContractCb) => {
        let whereDoctorDeskTopToPeriod = { servicesIds, doctor: _data.doctor, patient: _data.patient };
        if (mainInsurance) {
          whereDoctorDeskTopToPeriod.mainInsurance = {
            id: mainInsurance.id,
            freeRevistPeriod: mainInsurance.freeRevistPeriod,
            freeRevistCount: mainInsurance.freeRevistCount,
          };
        }
        site.getDoctorDeskTopToPeriod(whereDoctorDeskTopToPeriod, (doctorDeskTopCb) => {
          response.maxDeductAmount = _data.maxDeductAmount || false;
          let total = 0;
          _data.servicesList.forEach((_service) => {
            let foundService = false;
            let foundCoverage = false;
            let serviceMemory = servicesCb.find((_s) => _s.id == _service.id);
            if (serviceMemory && serviceMemory.id) {
              if (mainInsurance) {
                serviceMemory.servicesCategoriesList = serviceMemory.servicesCategoriesList || [];
                if (insuranceContractCb && insuranceContractCb.insuranceClass && _data.patientClass) {
                  if (!foundService && mainInsurance.servicesList && mainInsurance.servicesList.length > 0) {
                    let serviceIndex = mainInsurance.servicesList.findIndex((_cService) => _cService.id === serviceMemory.id);
                    if (serviceIndex != -1) {
                      foundService = true;
                      if (insuranceContractCb && insuranceContractCb.servicesList && insuranceContractCb.servicesList.length > 0) {
                        let serviceInsurance = insuranceContractCb.servicesList.find((itm) => itm.id == serviceMemory.id);
                        if (serviceInsurance && serviceInsurance.id) {
                          mainInsurance.servicesList[serviceIndex].coverage = serviceInsurance.coverage;
                          mainInsurance.servicesList[serviceIndex].needApproval = serviceInsurance.needApproval;
                        }
                      }
                      if (mainInsurance.servicesList[serviceIndex].coverage && insuranceContractCb && insuranceContractCb.insuranceClass.id == _data.patientClass.id) {
                        foundCoverage = true;
                        let service = {
                          id: serviceMemory.id,
                          nameAr: mainInsurance.servicesList[serviceIndex].coName || serviceMemory.nameAr,
                          nameEn: mainInsurance.servicesList[serviceIndex].coName || serviceMemory.nameEn,
                          code: mainInsurance.servicesList[serviceIndex].coCode || serviceMemory.code,
                          needApproval: mainInsurance.servicesList[serviceIndex].needApproval,
                          approved: mainInsurance.servicesList[serviceIndex].needApproval ? false : true,
                          vat: serviceMemory.vat,
                          cost: serviceMemory.cost,
                          serviceSpecialty: serviceMemory.serviceSpecialty,
                          serviceGroup: serviceMemory.serviceGroup,
                          pVat: 0,
                          comVat: 0,
                        };
                        service.count = _service.count || 1;
                        if (_data.type == 'out') {
                          if (_data.payment == 'cash') {
                            service.price = mainInsurance.servicesList[serviceIndex].cashOut;
                            service.discount = mainInsurance.servicesList[serviceIndex].cashOutDisc;
                          } else if (_data.payment == 'credit') {
                            service.price = mainInsurance.servicesList[serviceIndex].creditOut;
                            service.discount = mainInsurance.servicesList[serviceIndex].creditOutDisc;
                          }
                        } else if (_data.type == 'in') {
                          if (_data.payment == 'cash') {
                            service.price = mainInsurance.servicesList[serviceIndex].cashIn;
                            service.discount = mainInsurance.servicesList[serviceIndex].cashInDisc;
                          } else if (_data.payment == 'credit') {
                            service.price = mainInsurance.servicesList[serviceIndex].creditIn;
                            service.discount = mainInsurance.servicesList[serviceIndex].creditInDisc;
                          }
                        }

                        // service.total = service.price - (service.price * service.discount) / 100;

                        servicesList.unshift(service);
                      }
                    }
                  }
                  if (!foundService) {
                    if (
                      serviceMemory &&
                      serviceMemory.servicesCategoriesList &&
                      serviceMemory.servicesCategoriesList.length > 0 &&
                      mainInsurance.servicesCategoriesList &&
                      mainInsurance.servicesCategoriesList.length > 0
                    ) {
                      serviceMemory.servicesCategoriesList.forEach((_sCateGory) => {
                        let categoryInsurance = mainInsurance.servicesCategoriesList.find((_c) => _c.id === _sCateGory.id);

                        if (!foundService && categoryInsurance && categoryInsurance.id) {
                          foundService = true;
                          if (insuranceContractCb && insuranceContractCb.servicesCategoriesList && insuranceContractCb.servicesCategoriesList.length > 0) {
                            let serviceInsurance = insuranceContractCb.servicesCategoriesList.find((itm) => itm.id == categoryInsurance.id);
                            if (serviceInsurance && serviceInsurance.id) {
                              categoryInsurance.coverage = serviceInsurance.coverage;
                              categoryInsurance.needApproval = serviceInsurance.needApproval;
                            }
                          }
                          if (categoryInsurance.coverage && insuranceContractCb && insuranceContractCb.insuranceClass.id == _data.patientClass.id) {
                            foundCoverage = true;
                            let service = {
                              id: serviceMemory.id,
                              nameAr: serviceMemory.nameAr,
                              nameEn: serviceMemory.nameEn,
                              code: serviceMemory.code,
                              serviceSpecialty: serviceMemory.serviceSpecialty,
                              needApproval: categoryInsurance.needApproval,
                              approved: categoryInsurance.needApproval ? false : true,
                              cost: serviceMemory.cost,
                              vat: serviceMemory.vat,
                              serviceGroup: serviceMemory.serviceGroup,
                              pVat: 0,
                              comVat: 0,
                            };

                            service.count = _service.count || 1;
                            if (_data.type == 'out') {
                              if (_data.payment == 'cash') {
                                service.price = serviceMemory.cashPriceOut;
                                service.discount = categoryInsurance.applyDiscOut ? categoryInsurance.cashOut : 0;
                              } else if (_data.payment == 'credit') {
                                service.price = serviceMemory.creditPriceOut;
                                service.discount = categoryInsurance.applyDiscOut ? categoryInsurance.creditOut : 0;
                              }
                            } else if (_data.type == 'in') {
                              if (_data.payment == 'cash') {
                                service.price = categoryInsurance.cashPriceIn;
                                service.discount = categoryInsurance.applyDiscIn ? categoryInsurance.cashIn : 0;
                              } else if (_data.payment == 'credit') {
                                service.price = categoryInsurance.creditPriceIn;
                                service.discount = categoryInsurance.applyDiscIn ? categoryInsurance.creditIn : 0;
                              }
                            }
                            // service.total = service.price - (service.price * service.discount) / 100;
                            servicesList.unshift(service);
                          }
                        }
                      });
                    }
                  }
                  if (!foundService) {
                    if (mainInsurance.servicesGroupsList && mainInsurance.servicesGroupsList.length > 0) {
                      let goupInsurance = mainInsurance.servicesGroupsList.find((_cGroup) => serviceMemory.serviceGroup && _cGroup.id == serviceMemory.serviceGroup.id);
                      if (!foundService && goupInsurance && goupInsurance.id) {
                        foundService = true;
                        if (insuranceContractCb && insuranceContractCb.servicesGroupsList && insuranceContractCb.servicesGroupsList.length > 0) {
                          let serviceInsurance = insuranceContractCb.servicesGroupsList.find((itm) => itm.id == goupInsurance.id);
                          if (serviceInsurance && serviceInsurance.id) {
                            goupInsurance.coverage = serviceInsurance.coverage;
                            goupInsurance.needApproval = serviceInsurance.needApproval;
                          }
                        }
                        if (goupInsurance.coverage && insuranceContractCb && insuranceContractCb.insuranceClass.id == _data.patientClass.id) {
                          foundCoverage = true;
                          let service = {
                            id: serviceMemory.id,
                            nameAr: serviceMemory.nameAr,
                            nameEn: serviceMemory.nameEn,
                            serviceSpecialty: serviceMemory.serviceSpecialty,
                            needApproval: goupInsurance.needApproval,
                            approved: goupInsurance.needApproval ? false : true,
                            code: serviceMemory.code,
                            price: 0,
                            cost: serviceMemory.cost,
                            discount: 0,
                            total: 0,
                            vat: serviceMemory.vat,
                            pVat: 0,
                            serviceGroup: serviceMemory.serviceGroup,
                            comVat: 0,
                          };
                          service.count = _service.count || 1;

                          if (_data.type == 'out') {
                            if (_data.payment == 'cash') {
                              service.price = serviceMemory.cashPriceOut;
                              service.discount = goupInsurance.applyDiscOut ? goupInsurance.cashOut : 0;
                            } else if (_data.payment == 'credit') {
                              service.price = serviceMemory.creditPriceOut;
                              service.discount = goupInsurance.applyDiscOut ? goupInsurance.creditOut : 0;
                            }
                          } else if (_data.type == 'in') {
                            if (_data.payment == 'cash') {
                              service.price = goupInsurance.cashPriceIn;
                              service.discount = goupInsurance.applyDiscIn ? goupInsurance.cashIn : 0;
                            } else if (_data.payment == 'credit') {
                              service.price = goupInsurance.creditPriceIn;
                              service.discount = goupInsurance.applyDiscIn ? goupInsurance.creditIn : 0;
                            }
                          }
                          // service.total = service.price - (service.price * service.discount) / 100;
                          servicesList.unshift(service);
                        }
                      } else if (!foundService && goupInsurance && goupInsurance.id) {
                        let goup = appServicesGroup.memoryList.find((_g) => _g.id === goupInsurance.id);
                        if (goup && goup.servicesCategoriesList && goup.servicesCategoriesList.length > 0) {
                          goup.servicesCategoriesList.forEach((_gCateGory) => {
                            let serviceCategory = serviceMemory.servicesCategoriesList.find((__s) => __s.id === _gCateGory.id);

                            if (serviceCategory && serviceCategory.id == _gCateGory.id) {
                              foundService = true;

                              if (insuranceContractCb && insuranceContractCb.servicesGroupsList && insuranceContractCb.servicesGroupsList.length > 0) {
                                let serviceInsurance = insuranceContractCb.servicesGroupsList.find((itm) => itm.id == goupInsurance.id);
                                if (serviceInsurance && serviceInsurance.id) {
                                  goupInsurance.coverage = serviceInsurance.coverage;
                                  goupInsurance.needApproval = serviceInsurance.needApproval;
                                }
                              }

                              if (goupInsurance.coverage && insuranceContractCb && insuranceContractCb.insuranceClass.id == _data.patientClass.id) {
                                foundCoverage = true;

                                let service = {
                                  id: serviceMemory.id,
                                  nameAr: serviceMemory.nameAr,
                                  nameEn: serviceMemory.nameEn,
                                  code: serviceMemory.code,
                                  serviceSpecialty: serviceMemory.serviceSpecialty,
                                  cost: serviceMemory.cost,
                                  vat: serviceMemory.vat,
                                  pVat: 0,
                                  serviceGroup: serviceMemory.serviceGroup,
                                  comVat: 0,
                                  needApproval: goupInsurance.needApproval,
                                  approved: goupInsurance.needApproval ? false : true,
                                };
                                service.count = _service.count || 1;
                                if (_data.type == 'out') {
                                  if (_data.payment == 'cash') {
                                    service.price = serviceMemory.cashPriceOut;
                                    service.discount = goupInsurance.applyDiscOut ? goupInsurance.cashOut : 0;
                                  } else if (_data.payment == 'credit') {
                                    service.price = serviceMemory.creditPriceOut;
                                    service.discount = goupInsurance.applyDiscOut ? goupInsurance.creditOut : 0;
                                  }
                                } else if (_data.type == 'in') {
                                  if (_data.payment == 'cash') {
                                    service.price = goupInsurance.cashPriceIn;
                                    service.discount = goupInsurance.applyDiscIn ? goupInsurance.cashIn : 0;
                                  } else if (_data.payment == 'credit') {
                                    service.price = goupInsurance.creditPriceIn;
                                    service.discount = goupInsurance.applyDiscIn ? goupInsurance.creditIn : 0;
                                  }
                                }
                                // service.total = service.price - (service.price * service.discount) / 100;
                                servicesList.unshift(service);
                              }
                            }
                          });
                        }
                      }
                    }
                  }
                }
              }
              if (!foundCoverage) {
                let service = {
                  id: serviceMemory.id,
                  code: serviceMemory.code,
                  nameAr: serviceMemory.nameAr,
                  nameEn: serviceMemory.nameEn,
                  cost: serviceMemory.cost,
                  serviceGroup: serviceMemory.serviceGroup,
                  serviceSpecialty: serviceMemory.serviceSpecialty,
                  approved: true,
                  discount: 0,
                  comVat: 0,
                  pVat: 0,
                  vat: serviceMemory.vat,
                };
                service.count = _service.count || 1;
                if (_data.type == 'out') {
                  if (_data.payment == 'cash') {
                    service.price = serviceMemory.creditPriceOut;
                  } else if (_data.payment == 'credit') {
                    service.price = serviceMemory.creditPriceOut;
                  }
                } else if (_data.type == 'in') {
                  if (_data.payment == 'cash') {
                    service.price = serviceMemory.cashPriceIn;
                  } else if (_data.payment == 'credit') {
                    service.price = serviceMemory.creditPriceIn;
                  }
                }
                // service.total = service.price + (service.price * service.vat) / 100;
                // service.total = site.toNumber(service.total);
                // service.patientCash = site.toNumber(service.total);
                servicesList.unshift(service);
              }
              hmisSetting.vatList = hmisSetting.vatList || [];
              let vatIndex = hmisSetting.vatList.findIndex((itm) => itm.id === _data.nationalityId);
              servicesList[0].totalDisc = (servicesList[0].price * servicesList[0].count * servicesList[0].discount) / 100;
              servicesList[0].totalAfterDisc = servicesList[0].price * servicesList[0].count - servicesList[0].totalDisc;

              if (vatIndex !== -1) {
                servicesList[0].pVat = hmisSetting.vatList[vatIndex].pVat || 0;
                servicesList[0].comVat = hmisSetting.vatList[vatIndex].comVat || 0;
              } else {
                servicesList[0].pVat = hmisSetting.pVat || 0;
                servicesList[0].comVat = hmisSetting.comVat || 0;
              }
              servicesList[0].totalVat = (servicesList[0].totalAfterDisc * servicesList[0].vat || 0) / 100;
              servicesList[0].total = servicesList[0].totalAfterDisc + servicesList[0].totalVat;
              servicesList[0].deduct = 0;
              if (
                mainInsurance &&
                mainInsurance.id &&
                insuranceContractCb &&
                new Date(insuranceContractCb.startDate) <= new Date() &&
                new Date(insuranceContractCb.endDate) >= new Date() &&
                foundCoverage
              ) {
                if (serviceMemory.serviceGroup.type && serviceMemory.serviceGroup.type.id == 2) {
                  if (insuranceContractCb && insuranceContractCb.insuranceClass && insuranceContractCb.insuranceClass.serviceType == 'percent') {
                    servicesList[0].deduct = (servicesList[0].total * insuranceContractCb.insuranceClass.serviceDeduct) / 100;
                  } else {
                    if (insuranceContractCb && insuranceContractCb.insuranceClass) {
                      servicesList[0].deduct = insuranceContractCb.insuranceClass.serviceDeduct;
                    }
                  }
                } else {
                  if (insuranceContractCb && insuranceContractCb.insuranceClass.consultationType == 'percent') {
                    servicesList[0].deduct = (servicesList[0].total * insuranceContractCb.insuranceClass.consultationDeduct) / 100;
                  } else {
                    servicesList[0].deduct = insuranceContractCb.insuranceClass.consultationDeduct;
                  }
                }
                servicesList[0].totalPVat = ((servicesList[0].deduct || servicesList[0].total) * (servicesList[0].pVat || 0)) / 100;
                servicesList[0].totalComVat = ((servicesList[0].total - servicesList[0].deduct) * servicesList[0].comVat || 0) / 100;
              
                total += servicesList[0].deduct + servicesList[0].totalPVat;
                if (insuranceContractCb && insuranceContractCb.insuranceClass && insuranceContractCb.insuranceClass.maxDeductAmount) {
                  if (insuranceContractCb.insuranceClass.maxDeductAmount < total) {
                    if (total - (servicesList[0].deduct + servicesList[0].totalPVat) <= insuranceContractCb.insuranceClass.maxDeductAmount || !response.maxDeductAmount) {
                      response.maxDeductAmount = true;
                      let currentTotal = total - (servicesList[0].deduct + servicesList[0].totalPVat);
                      let remain = insuranceContractCb.insuranceClass.maxDeductAmount - currentTotal;
                      let totalCom = currentTotal - remain;
                      servicesList[0].deduct = remain;
                      servicesList[0].totalPVat = (servicesList[0].deduct * (servicesList[0].pVat || 0)) / 100;
                      servicesList[0].patientCash = servicesList[0].deduct + servicesList[0].totalPVat;
                      servicesList[0].totalComVat = ((servicesList[0].total - totalCom) * servicesList[0].comVat || 0) / 100;
                      servicesList[0].comCash = servicesList[0].total - totalCom + servicesList[0].totalComVat;
                    } else {
                      response.maxDeductAmount = true;
                      servicesList[0].totalPVat = 0;
                      servicesList[0].patientCash = 0;
                      servicesList[0].comCash = servicesList[0].total;
                      servicesList[0].totalComVat = (servicesList[0].total * servicesList[0].comVat || 0) / 100;
                    }

                  } else {
                    servicesList[0].patientCash = insuranceContractCb.insuranceClass.maxDeductAmount;
                    servicesList[0].comCash = servicesList[0].total - insuranceContractCb.insuranceClass.maxDeductAmount;
                  }
                } else {
                  servicesList[0].patientCash = servicesList[0].deduct + servicesList[0].totalPVat;
                  servicesList[0].comCash = servicesList[0].total - servicesList[0].deduct + servicesList[0].totalComVat;
                }
              } else {
                servicesList[0].comCash = 0;
                servicesList[0].totalPVat = 0;
                servicesList[0].totalComVat = 0;
                servicesList[0].patientCash = servicesList[0].total + servicesList[0].totalPVat;
              }

              servicesList[0].patientDeduct = servicesList[0].deduct;
              if (_data.hospitalResponsibility && _data.hospitalResponsibility.id) {
                servicesList[0].hospitalResponsibility = _data.hospitalResponsibility;
              }
              if (serviceMemory.normalRangeList && serviceMemory.normalRangeList.length > 0) {
                servicesList[0].normalRangeList = serviceMemory.normalRangeList;
              }

              // let dDeskTop = doctorDeskTopCb.list.find((itm) => itm.serviceId == servicesList[0].id);
              if (servicesList[0].serviceGroup.type.id == 2) {
                if (doctorDeskTopCb && doctorDeskTopCb.doctorDescTop.count < doctorDeskTopCb.freeRevistCount) {
                  if (doctorDeskTopCb.doctorDescTop.doctor.scientificRank.id <= _data.doctor.scientificRank.id) {
                    servicesList[0].patientDeduct = 0;
                    servicesList[0].totalPVat = 0;
                    servicesList[0].totalComVat = 0;
                    servicesList[0].comCash = 0;
                    servicesList[0].patientCash = 0;
                  }
                }
              }
              if (serviceMemory.sfdaCodeList && serviceMemory.sfdaCodeList.length > 0) {
                servicesList[0].sfdaCode = serviceMemory.sfdaCodeList[0].sfdaCode;
              }
            }
          });

          if (servicesList.length > 0) {
            response.done = true;
            response.servicesList = servicesList;
            if (insuranceContractCb.insuranceClass && insuranceContractCb.insuranceClass.id) {
              response.insuranceContract = {
                id: insuranceContractCb.id,
                code: insuranceContractCb.code,
                insuranceClass: {
                  id: insuranceContractCb.insuranceClass.id,
                  nameAr: insuranceContractCb.insuranceClass.nameAr,
                  nameEn: insuranceContractCb.insuranceClass.nameEn,
                  maxDeductAmount: insuranceContractCb.insuranceClass.maxDeductAmount,
                },
              };
            }
            callback(response);
            return;
          } else {
            response.error = 'Not Exists';
            callback(response);
            return;
          }
        });
      });
    });
  };
  app.init();
  site.addApp(app);
};
