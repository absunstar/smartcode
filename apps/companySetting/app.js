module.exports = function init(site) {
  let app = {
    name: 'companySetting',
    allowMemory: true,
    memoryList: [],
    allowCache: false,
    cacheList: [],
    allowRoute: true,
    allowRouteGet: true,
    allowRouteView: true,
    allowRouteDelete: true,
    allowRouteSave: true,
    allowRouteGetSetting: true,
  };

  let teethList = [];

  for (let i = 0; i < 32; i++) {
    teethList.push({ name: i + 1, id: i + 1 });
  }

  site.defaultCompanySetting = {
    printerProgram: { itemsCountA4: 4, invoiceHeader: [], invoiceHeader2: [], invoiceFooter: [], thermalHeader: [], thermalFooter: [] },
    storesSetting: {
      showAccountant: true,
      showInventory: true,
      showHr: true,
      showHospital: true,
      showReports: true,
      showSetting: true,
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
    hmisSetting: {
      pVat: 0,
      comVat: 0,
      teethList: teethList,
    },
    hrSettings: {
      absenceDays: 1,
      forgetFingerprint: 0.5,
      nathionalitiesVacationsList: [],
      publicVacations: { annualVacation: 0, casualVacation: 0, regularVacation: 0 },
      nathionalitiesInsuranceList: [],
      publicInsurance: { totalSubscriptions: 21.5, employeePercentage: 9.75, companyPercentage: 11.75 },
    },
    establishingAccountsList: [
      // { id: 2, nameAr: 'المشتريات', nameEn: 'Purchases' },
      //  { id: 8, nameAr: 'مردودات سنوات سابقة', nameEn: 'Returns from previous years' },
      // { id: 7, nameAr: 'مردودات مشتريات', nameEn: 'Purchases returns' },
      { id: 'vendors', nameAr: 'الموردين', nameEn: 'Vendors' },
      { id: 'stores', nameAr: 'المخازن', nameEn: 'Stores' },
      { id: 'customers', nameAr: 'العملاء', nameEn: 'Customers' },
      { id: 'sales', nameAr: 'المبيعات', nameEn: 'Sales' },
      { id: 'reSales', nameAr: 'مردودات مبيعات', nameEn: 'Sales returns' },
      { id: 'salesTax', nameAr: 'ضريبة المبيعات', nameEn: 'Sales tax' },
      { id: 'purchaseTax', nameAr: 'ضريبة المشتريات', nameEn: 'Purchase tax' },
      { id: 'inventorySalesCost', nameAr: 'تكلفة مبيعات المخزون', nameEn: 'Inventory sales cost' },
      { id: 'salesDiscount', nameAr: 'خصم مبيعات', nameEn: 'Sales Discount' },
      { id: 'purshaseDiscount', nameAr: 'خصم مشتريات', nameEn: 'Purshase Discount' },
      { id: 'service', nameAr: 'الخدمة', nameEn: 'Service' },
      { id: 'box', nameAr: 'الصندوق', nameEn: 'Box' },
      { id: 'bank', nameAr: 'البنك', nameEn: 'Bank' },
    ],
  };

  app.$collection = site.connectCollection('companies');
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
    site.word({ name: '$', Ar: site.defaultCompanySetting.accountsSetting.currencySymbol, En: site.defaultCompanySetting.accountsSetting.currencySymbol });
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

  site.getCompanySetting = function (req) {
    let company = site.getCompany(req);
    let branch = site.getBranch(req);

    let companySetting = app.memoryList.find((s) => s.id == company.id) || site.defaultCompanySetting;
    return companySetting;
  };

  if (app.allowRoute) {
    if (app.allowRouteGet) {
      site.get(
        {
          name: app.name,
        },
        (req, res) => {
          res.render(app.name + '/index.html', { title: app.name, appName: 'Company Settings', setting: site.getCompanySetting(req) }, { parser: 'html', compres: true });
        }
      );
    }

    site.post({ name: `/api/${app.name}/reset`, require: { permissions: ['login'] } }, (req, res) => {
      let response = {
        done: false,
      };
      let _data = req.data;
      _data.editUserInfo = req.getUserFinger();
      _data.printerProgram = {};
      _data.hmisSetting = {};
      _data.storesSetting = {};
      _data.accountsSetting = {};
      _data.hrSettings = {};
      _data.administrativeStructure = {};
      _data.workflowAssignmentSettings = {};
      _data.autoJournal = true;
      _data.establishingAccountsList = {};
      app.save(_data, (err, result) => {
        if (!err && result && result.doc) {
          response.done = true;
          response.result = result;
          site.word({ name: '$', Ar: result.doc.accountsSetting.currencySymbol, En: result.doc.accountsSetting.currencySymbol });
        }
        res.json(response);
      });
    });

    if (app.allowRouteGetSetting) {
      site.post({ name: `/api/${app.name}/get`, public: true }, (req, res) => {
        let companySetting = site.getCompanySetting(req) || site.defaultCompanySetting;
        res.json({
          done: true,
          doc: companySetting,
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
