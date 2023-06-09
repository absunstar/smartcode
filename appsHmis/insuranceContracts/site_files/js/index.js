app.controller('insuranceContracts', function ($scope, $http, $timeout) {
  $scope.baseURL = '';
  $scope.appName = 'insuranceContracts';
  $scope.modalID = '#insuranceContractsManageModal';
  $scope.modalSearchID = '#insuranceContractsSearchModal';
  $scope.mode = 'add';
  $scope._search = {};
  $scope.structure = {
    image: { url: '/images/insuranceContracts.png' },
    active: true,
  };
  $scope.item = {};
  $scope.list = [];

  $scope.showAdd = function (_item) {
    $scope.error = '';
    $scope.mode = 'add';
    $scope.item = { ...$scope.structure };
    site.showModal($scope.modalID);
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
          $scope.list.unshift(response.data.doc);
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
          $scope.error = response.data.error;
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

  $scope.getMainInsuranceCompaniesList = function () {
    $scope.busy = true;
    $scope.mainInsuranceCompaniesList = [];
    $http({
      method: 'POST',
      url: '/api/mainInsuranceCompanies/all',
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
          $scope.mainInsuranceCompaniesList = response.data.list;
        }
      },
      function (err) {
        $scope.busy = false;
        $scope.error = err;
      }
    );
  };

  $scope.getInsuranceCompaniesList = function () {
    $scope.busy = true;
    $scope.insuranceCompaniesList = [];
    $http({
      method: 'POST',
      url: '/api/insuranceCompanies/all',
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
          $scope.insuranceCompaniesList = response.data.list;
        }
      },
      function (err) {
        $scope.busy = false;
        $scope.error = err;
      }
    );
  };

  $scope.getInsuranceClassesList = function () {
    $scope.busy = true;
    $scope.insuranceClassesList = [];
    $http({
      method: 'POST',
      url: '/api/insuranceClasses/all',
      data: {
        where: { active: true },
        select: {
          id: 1,
          nameEn: 1,
          nameAr: 1,
          code: 1,
        },
      },
    }).then(
      function (response) {
        $scope.busy = false;
        if (response.data.done && response.data.list.length > 0) {
          $scope.insuranceClassesList = response.data.list;
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

  $scope.getServicesCategoriesList = function ($search) {
    if ($search && $search.length < 1) {
      return;
    }
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
        search: $search,
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
          serviceSpecialty :1,
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
    _item.servicesGroupsList = _item.servicesGroupsList || [];
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
          needApproval: false,
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
    _item.servicesCategoriesList = _item.servicesCategoriesList || [];
    if (_item.$serviceCategory && _item.$serviceCategory.id) {
      if (!_item.servicesCategoriesList.some((s) => s.id === _item.$serviceCategory.id)) {
        _item.servicesCategoriesList.unshift({
          ..._item.$serviceCategory,
          cashOut: 0,
          creditOut: 0,
          cashIn: 0,
          creditIn: 0,
          coverage: true,
          needApproval: false,
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
    _item.servicesList = _item.servicesList || [];

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
          needApproval: false,
        });
      }
      _item.$service = {};
    } else {
      $scope.error = 'Must Select Service';
      return;
    }
  };

  $scope.addInsuranceClass = function () {
    $scope.error = '';
    $scope.item.insuranceClassesList = $scope.item.insuranceClassesList || [];
    if ($scope.item.$insuranceClass && $scope.item.$insuranceClass.id) {
      if (!$scope.item.insuranceClassesList.some((s) => s.id === $scope.item.$insuranceClass.id && code == s.code)) {
        $scope.item.insuranceClassesList.push({
          id: $scope.item.$insuranceClass.id,
          nameAr: $scope.item.$insuranceClass.nameAr,
          nameEn: $scope.item.$insuranceClass.nameEn,
          code: $scope.item.$insuranceClass.code,
          maxServiceAmount: 0,
          maxConsAmount: 0,
          freeRevisitAmount: 0,
          maxDeductAmount: 0,
          serviceDeduct: 0,
          serviceType: 'percent',
          consultationDeduct: 0,
          consultationType: 'percent',
          servicesCategoriesList: [],
          servicesGroupsList: [],
          servicesList: [],
        });
      }
      delete $scope.item.$insuranceClass;
    } else {
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
  $scope.getMainInsuranceCompaniesList();
  $scope.getInsuranceCompaniesList();
  $scope.getNumberingAuto();
  $scope.getInsuranceClassesList();
  $scope.getServicesGroupsList();
  $scope.getServicesCategoriesList();
  $scope.getServicesList();
});
