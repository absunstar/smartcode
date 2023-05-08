module.exports = function init(site) {
  let app = {
    name: 'systemSetting',
    allowMemory: true,
    memoryList: [],
    allowCache: false,
    cacheList: [],
    allowRoute: true,
    allowRouteGet: true,
    allowRouteDelete: true,
    allowRouteSave: true,
    allowRouteGetSetting: true,
  };

  site.setting = {
    printerProgram: { invoiceHeader: [], invoiceHeader2: [], invoiceFooter: [], thermalHeader: [], thermalFooter: [] },
    storesSetting: {
      hasDefaultVendor: false,
      cannotExceedMaximumDiscount: false,
      allowOverdraft: false,
      defaultStore: {},
      idefaultItemType: {},
      idefaultItemGroup: {},
      defaultItemUnit: {},
      defaultVendor: {},
    },
    accountsSetting: { paymentType: {}, currencySymbol: 'SR' },
    generalSystemSetting: {},
    workflowAssignmentSettings: site.workflowScreensList,
    hrSettings: {
      absenceDays: 1,
      forgetFingerprint: 0.5,
      nathionalitiesVacationsList: [],
      publicVacations: { annualVacation: 0, casualVacation: 0, regularVacation: 0 },
      nathionalitiesInsuranceList: [],
      publicInsurance: { totalSubscriptions: 21.5, employeePercentage: 9.75, companyPercentage: 11.75 },
    },
    establishingParchaseAccountsList: [
      { id: 1, nameAr: 'الموردين', nameEn: 'Vendors' },
      { id: 2, nameAr: 'المشتريات', nameEn: 'Purchases' },
      { id: 3, nameAr: 'المخازن', nameEn: 'Stores' },
      { id: 4, nameAr: 'مردودات مشتريات', nameEn: 'Purchases returns' },
      { id: 5, nameAr: 'مردودات سنوات سابقة', nameEn: 'Returns from previous years' },
      { id: 6, nameAr: 'خصم مكتسب', nameEn: 'Earned discount' },
      { id: 7, nameAr: 'ضريبة المشتريات', nameEn: 'Purchase tax' },
      { id: 8, nameAr: 'البنك', nameEn: 'Bank' },
      { id: 9, nameAr: 'الصندوق', nameEn: 'Box' },
    ],
    establishingSalesAccountsList: [
      { id: 1, nameAr: 'العملاء', nameEn: 'Customers' },
      { id: 2, nameAr: 'المبيعات', nameEn: 'Sales' },
      { id: 3, nameAr: 'مردودات مبيعات', nameEn: 'Sales returns' },
      { id: 4, nameAr: 'مردودات سنوات سابقة', nameEn: 'Returns from previous years' },
      { id: 5, nameAr: 'خصم مسموح به', nameEn: 'Discount permitted' },
      { id: 6, nameAr: 'ضريبة المبيعات', nameEn: 'Sales tax' },
      { id: 7, nameAr: 'تكلفة مبيعات المخزون', nameEn: 'Inventory sales cost' },
      { id: 8, nameAr: 'المخازن', nameEn: 'Stores' },
      { id: 9, nameAr: 'البنك', nameEn: 'Bank' },
      { id: 10, nameAr: 'الصندوق', nameEn: 'Box' },
    ],
    // establishingAccountsList: [
    //     { id: 1, nameAr: 'تكلفة المبيعات ( مواد + أجور + مصروفات صناعية )', nameEn: 'Cost of sales (materials + wages + industrial expenses)' },
    //     { id: 2, nameAr: 'إيرادات المبيعات', nameEn: 'Sales revenue' },

    //     { id: 7, nameAr: 'خصم مكتسب', nameEn: 'Earned discount' },
    //     { id: 9, nameAr: 'البنك', nameEn: 'The bank' },
    //     { id: 10, nameAr: 'الصندوق', nameEn: 'Box' },
    //     { id: 13, nameAr: 'فروق العملة وسعر الصرف', nameEn: 'Currency differences and exchange rate' },
    //     { id: 14, nameAr: 'حساب عجز المخازن', nameEn: 'Store deficit account' },
    //     { id: 15, nameAr: 'حساب زيادة المخازن', nameEn: 'Incremental inventory account' },
    // ],
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
    site.word({ name: '$', Ar: site.setting.accountsSetting.currencySymbol, En: site.setting.accountsSetting.currencySymbol });
  };

  site.getSystemSetting = function (req) {
    let company = site.getCompany(req);
    let branch = site.getBranch(req);

    site.setting = app.memoryList.find((s) => s.company.id == company.id) || site.setting;

    return site.setting;
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

  app.save = function (_item, callback) {
    app.$collection.find({ where: { 'company.id': _item.company.id } }, (err, doc) => {
      if (!doc) {
        app.$collection.add(_item, (err, doc) => {
          if (callback) {
            callback(err, doc);
          }
          if (app.allowMemory && !err && doc) {
            app.memoryList.push(doc);
          }
          site.word({ name: '$', Ar: doc.accountsSetting.currencySymbol, En: doc.accountsSetting.currencySymbol });
        });
      } else {
        doc = { ...doc, ..._item };
        app.$collection.edit(doc, (err, result) => {
          if (callback) {
            callback(err, result);
          }
          if (result && result.doc) {
            site.word({ name: '$', Ar: result.doc.accountsSetting.currencySymbol, En: result.doc.accountsSetting.currencySymbol });
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
        });
      }
    });
  };

  if (app.allowRoute) {
    if (app.allowRouteGet) {
      site.get(
        {
          name: app.name,
        },
        (req, res) => {
          res.render(app.name + '/index.html', { title: app.name, appName: 'System Settings' }, { parser: 'html', compres: true });
        }
      );
    }

    if (app.allowRouteSave) {
      site.post({ name: `/api/${app.name}/save`, require: { permissions: ['login'] } }, (req, res) => {
        let response = {
          done: false,
        };

        let _data = req.data;
        _data.company = site.getCompany(req);
        _data.editUserInfo = req.getUserFinger();
        app.save(_data, (err, result) => {
          if (!err && result && result.doc) {
            response.done = true;
            response.result = result;
            site.word({ name: '$', Ar: result.doc.accountsSetting.currencySymbol, En: result.doc.accountsSetting.currencySymbol });
          } else if (err) {
            response.error = err?.message || 'Error In System Setting';
          } else {
            app.$collection.add(_data, (err, doc) => {
              if (app.allowMemory && !err && doc) {
                app.memoryList.push(doc);
              }
              site.word({ name: '$', Ar: doc.accountsSetting.currencySymbol, En: doc.accountsSetting.currencySymbol });
            });
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
        let company = site.getCompany(req);

        app.delete(_data, (err, result) => {
          if (!err && result.count === 1) {
            response.done = true;
            app.memoryList = app.memoryList.filter((n) => n.company.id != company.id);
            response.doc = site.setting;
          } else {
            response.error = err?.message || 'Deleted Not Exists';
          }
          res.json(response);
        });
      });
    }

    if (app.allowRouteGetSetting) {
      site.post({ name: `/api/${app.name}/get`, public: true }, (req, res) => {
        site.setting = site.getSystemSetting(req);
        res.json({
          done: true,
          doc: site.setting,
        });
      });
    }
  }

  site.addZero = function (code, number) {
    let c = number - code.toString().length;
    for (let i = 0; i < c; i++) {
      code = '0' + code.toString();
    }
    return code;
  };

  app.init();

  site.addApp(app);
};
