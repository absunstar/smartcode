app.controller('mainInsuranceCompanies', function ($scope, $http, $timeout) {
  $scope.baseURL = '';
  $scope.appName = 'mainInsuranceCompanies';
  $scope.modalID = '#mainInsuranceCompaniesManageModal';
  $scope.modalSearchID = '#mainInsuranceCompaniesSearchModal';
  $scope.mode = 'add';
  $scope._search = {};
  $scope.structure = {
    image: '/images/mainInsuranceCompanies.png',
    active: true,
  };
  $scope.item = {};
  $scope.list = [];

  $scope.showAdd = function (_item) {
    $scope.error = '';
    $scope.mode = 'add';
    $scope.item = {
      ...$scope.structure,
      servicesCategoriesList: [],
      servicesGroupsList: [],
      servicesList: [],
      packageServicesGroupsList: [],
    };
    site.showModal($scope.modalID);
    document.querySelector(`${$scope.modalID} .tab-link`).click();
  };

  $scope.add = function (_item) {
    $scope.error = '';
    const v = site.validated($scope.modalID);
    if (!v.ok) {
      $scope.error = v.messages[0].ar;
      return;
    }

    $scope.busy = true;
    $http({
      method: 'POST',
      url: `${$scope.baseURL}/api/${$scope.appName}/add`,
      data: $scope.item,
    }).then(
      function (response) {
        $scope.busy = false;
        if (response.data.done) {
          site.hideModal($scope.modalID);
          site.resetValidated($scope.modalID);
          $scope.list.push(response.data.doc);
        } else {
          $scope.error = response.data.error;
          if (response.data.error && response.data.error.like('*Must Enter Code*')) {
            $scope.error = '##word.Must Enter Code##';
          }
        }
      },
      function (err) {
        console.log(err);
      }
    );
  };

  $scope.showUpdate = function (_item) {
    $scope.error = '';
    $scope.mode = 'edit';
    $scope.view(_item);
    $scope.item = {};
    site.showModal($scope.modalID);
    document.querySelector(`${$scope.modalID} .tab-link`).click();
  };

  $scope.update = function (_item) {
    $scope.error = '';
    const v = site.validated($scope.modalID);
    if (!v.ok) {
      $scope.error = v.messages[0].ar;
      return;
    }
    $scope.busy = true;
    $http({
      method: 'POST',
      url: `${$scope.baseURL}/api/${$scope.appName}/update`,
      data: _item,
    }).then(
      function (response) {
        $scope.busy = false;
        if (response.data.done) {
          site.hideModal($scope.modalID);
          site.resetValidated($scope.modalID);
          let index = $scope.list.findIndex((itm) => itm.id == response.data.result.doc.id);
          if (index !== -1) {
            $scope.list[index] = response.data.result.doc;
          }
        } else {
          $scope.error = 'Please Login First';
        }
      },
      function (err) {
        console.log(err);
      }
    );
  };

  $scope.showView = function (_item) {
    $scope.error = '';
    $scope.mode = 'view';
    $scope.item = {};
    $scope.view(_item);
    site.showModal($scope.modalID);
    document.querySelector(`${$scope.modalID} .tab-link`).click();
  };

  $scope.view = function (_item) {
    $scope.busy = true;
    $scope.error = '';
    $http({
      method: 'POST',
      url: `${$scope.baseURL}/api/${$scope.appName}/view`,
      data: {
        id: _item.id,
      },
    }).then(
      function (response) {
        $scope.busy = false;
        if (response.data.done) {
          $scope.item = response.data.doc;
        } else {
          $scope.error = response.data.error;
        }
      },
      function (err) {
        console.log(err);
      }
    );
  };

  $scope.showDelete = function (_item) {
    $scope.error = '';
    $scope.mode = 'delete';
    $scope.item = {};
    $scope.view(_item);
    site.showModal($scope.modalID);
    document.querySelector(`${$scope.modalID} .tab-link`).click();
  };

  $scope.delete = function (_item) {
    $scope.busy = true;
    $scope.error = '';

    $http({
      method: 'POST',
      url: `${$scope.baseURL}/api/${$scope.appName}/delete`,
      data: {
        id: $scope.item.id,
      },
    }).then(
      function (response) {
        $scope.busy = false;
        if (response.data.done) {
          site.hideModal($scope.modalID);
          let index = $scope.list.findIndex((itm) => itm.id == response.data.result.doc.id);
          if (index !== -1) {
            $scope.list.splice(index, 1);
          }
        } else {
          $scope.error = response.data.error;
        }
      },
      function (err) {
        console.log(err);
      }
    );
  };

  $scope.getAll = function (where) {
    $scope.busy = true;
    $scope.list = [];
    $http({
      method: 'POST',
      url: `${$scope.baseURL}/api/${$scope.appName}/all`,
      data: {
        where: where,
      },
    }).then(
      function (response) {
        $scope.busy = false;
        if (response.data.done && response.data.list.length > 0) {
          $scope.list = response.data.list;
          $scope.count = response.data.count;
          site.hideModal($scope.modalSearchID);
          $scope.search = {};
        }
      },
      function (err) {
        $scope.busy = false;
        $scope.error = err;
      }
    );
  };

  $scope.getAccountsGuideList = function () {
    $scope.error = '';
    $scope.accountsGuideList = [];
    $scope.busy = true;
    $http({
      method: 'POST',
      url: '/api/accountsGuide/all',
      data: {
        where: {
          status: 'active',
          type: 'detailed',
        },
        select: {
          id: 1,
          code: 1,
          nameEn: 1,
          nameAr: 1,
        },
      },
    }).then(
      function (response) {
        $scope.busy = false;
        $scope.accountsGuideList = response.data.list;
      },
      function (err) {
        $scope.error = err;
      }
    );
  };

  $scope.getCountriesList = function () {
    $scope.busy = true;
    $http({
      method: 'POST',
      url: '/api/countries/all',
      data: {
        where: {
          active: true,
        },
        select: {
          id: 1,
          nameEn: 1,
          nameAr: 1,
        },
      },
    }).then(
      function (response) {
        $scope.busy = false;
        if (response.data.done && response.data.list.length > 0) {
          $scope.countriesList = response.data.list;
        }
      },
      function (err) {
        $scope.busy = false;
        $scope.error = err;
      }
    );
  };

  $scope.getGovesList = function (country) {
    $scope.busy = true;
    $http({
      method: 'POST',
      url: '/api/goves/all',
      data: {
        where: {
          country: country,
          active: true,
        },
        select: {
          id: 1,
          nameEn: 1,
          nameAr: 1,
        },
      },
    }).then(
      function (response) {
        $scope.busy = false;
        if (response.data.done && response.data.list.length > 0) {
          $scope.govesList = response.data.list;
        }
      },
      function (err) {
        $scope.busy = false;
        $scope.error = err;
      }
    );
  };

  $scope.getCitiesList = function (gov) {
    $scope.busy = true;
    $http({
      method: 'POST',
      url: '/api/cities/all',
      data: {
        where: {
          gov: gov,
          active: true,
        },
        select: {
          id: 1,
          nameEn: 1,
          nameAr: 1,
        },
      },
    }).then(
      function (response) {
        $scope.busy = false;
        if (response.data.done && response.data.list.length > 0) {
          $scope.citiesList = response.data.list;
        }
      },
      function (err) {
        $scope.busy = false;
        $scope.error = err;
      }
    );
  };

  $scope.getAreasList = function (city) {
    $scope.busy = true;
    $http({
      method: 'POST',
      url: '/api/areas/all',
      data: {
        where: {
          city: city,
          active: true,
        },
        select: {
          id: 1,
          nameEn: 1,
          nameAr: 1,
        },
      },
    }).then(
      function (response) {
        $scope.busy = false;
        if (response.data.done && response.data.list.length > 0) {
          $scope.areasList = response.data.list;
        }
      },
      function (err) {
        $scope.busy = false;
        $scope.error = err;
      }
    );
  };

  $scope.getNumberingAuto = function () {
    $scope.error = '';
    $scope.busy = true;
    $http({
      method: 'POST',
      url: '/api/numbering/getAutomatic',
      data: {
        screen: $scope.appName,
      },
    }).then(
      function (response) {
        $scope.busy = false;
        if (response.data.done) {
          $scope.disabledCode = response.data.isAuto;
        }
      },
      function (err) {
        $scope.busy = false;
        $scope.error = err;
      }
    );
  };



  $scope.getServicesGroupsList = function () {
    $scope.busy = true;
    $scope.servicesGroupsList = [];
    $http({
      method: 'POST',
      url: '/api/servicesGroups/all',
      data: {
        where: { active: true },
        select: {
          id: 1,
          code: 1,
          nameEn: 1,
          nameAr: 1,
        },
      },
    }).then(
      function (response) {
        $scope.busy = false;
        if (response.data.done && response.data.list.length > 0) {
          $scope.servicesGroupsList = response.data.list;
        }
      },
      function (err) {
        $scope.busy = false;
        $scope.error = err;
      }
    );
  };

  $scope.getServicesCategoriesList = function () {
    $scope.busy = true;
    $scope.servicesCategoriesList = [];
    $http({
      method: 'POST',
      url: '/api/servicesCategories/all',
      data: {
        where: { active: true },
        select: {
          id: 1,
          code: 1,
          nameEn: 1,
          nameAr: 1,
        },
      },
    }).then(
      function (response) {
        $scope.busy = false;
        if (response.data.done && response.data.list.length > 0) {
          $scope.servicesCategoriesList = response.data.list;
        }
      },
      function (err) {
        $scope.busy = false;
        $scope.error = err;
      }
    );
  };

  $scope.getServicesList = function ($search) {
    $scope.busy = true;
    $scope.servicesList = [];
    $http({
      method: 'POST',
      url: '/api/services/all',
      data: {
        where: { active: true },
        select: {
          id: 1,
          code: 1,
          nameEn: 1,
          nameAr: 1,
          servicesCategoriesList: 1,
          cashPriceOut: 1,
          creditPriceOut: 1,
          cashPriceIn: 1,
          creditPriceIn: 1,
          packagePrice: 1,
          vat: 1,
        },
        search: $search,

      },
    }).then(
      function (response) {
        $scope.busy = false;
        if (response.data.done && response.data.list.length > 0) {
          $scope.servicesList = response.data.list;
        }
      },
      function (err) {
        $scope.busy = false;
        $scope.error = err;
      }
    );
  };



  $scope.addServicesGroups = function (_item) {
    $scope.error = '';
    if (_item.$serviceGroup && _item.$serviceGroup.id) {
      if (!_item.servicesGroupsList.some((s) => s.id === _item.$serviceGroup.id)) {
        _item.servicesGroupsList.unshift({
          ..._item.$serviceGroup,
          cashOut: 0,
          creditOut: 0,
          cashIn: 0,
          creditIn: 0,
          secondAmnt: 0,
          secoundValuePerDay: 0,
          coverage: true,
          applyDiscOut: true,
          applyDiscIn: true,

        });
      }
      _item.$serviceGroup = {};
    } else {
      $scope.error = 'Must Select Service Group';
      return;
    }
  };

  $scope.addServicesCategories = function (_item) {
    $scope.error = '';
    if (_item.$serviceCategory && _item.$serviceCategory.id) {
      if (!_item.servicesCategoriesList.some((s) => s.id === _item.$serviceCategory.id)) {
        _item.servicesCategoriesList.unshift({
          ..._item.$serviceCategory,
          cashOut: 0,
          creditOut: 0,
          cashIn: 0,
          creditIn: 0,
          coverage: true,
          applyDiscOut: true,
          applyDiscIn: true,

        });
      }
      _item.$serviceCategory = {};
    } else {
      $scope.error = 'Must Select Service Category';
      return;
    }
  };

  $scope.addServices = function (_item) {
    $scope.error = '';
    if (_item.$service && _item.$service.id) {
      if (!_item.servicesList.some((s) => s.id === _item.$service.id)) {
        _item.servicesList.unshift({
          ..._item.$service,
          cashIn: 0,
          creditIn: 0,
          cashOut: 0,
          creditOut: 0,
          packagePrice: 0,
          cashInDisc: 0,
          creditInDisc: 0,
          cashOutDisc: 0,
          creditOutDisc: 0,
          coverage: true,

        });
      }
      _item.$service = {};
    } else {
      $scope.error = 'Must Select Service';
      return;
    }
  };

  $scope.addPackageServicesGroups = function (_item) {
    $scope.error = '';
    if (_item.$packageServiceGroup && _item.$packageServiceGroup.id) {
      if (!_item.packageServicesGroupsList.some((s) => s.id === _item.$packageServiceGroup.id)) {
        _item.packageServicesGroupsList.unshift({
          ..._item.$packageServiceGroup,
          discount: 0,
        });
      }
      _item.$packageServiceGroup = {};
    } else {
      $scope.error = 'Must Select Service Group';
      return;
    }
  };

  $scope.showSearch = function () {
    $scope.error = '';
    site.showModal($scope.modalSearchID);
  };

  $scope.searchAll = function () {
    $scope.getAll($scope.search);
    site.hideModal($scope.modalSearchID);
    $scope.search = {};
  };

  $scope.getAll();
  $scope.getNumberingAuto();
  $scope.getCountriesList();
  $scope.getServicesCategoriesList();
  $scope.getServicesGroupsList();
  $scope.getServicesList();
  $scope.getAccountsGuideList();
});
