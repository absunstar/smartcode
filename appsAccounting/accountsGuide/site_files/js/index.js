app.controller('accountsGuide', function ($scope, $http, $timeout) {
  $scope.baseURL = '';
  $scope.appName = 'accountsGuide';
  $scope.modalID = '#accountsGuideManageModal';
  $scope.modalSearchID = '#accountsGuideSearchModal';
  $scope.mode = 'add';
  $scope._search = {};
  $scope.structure = {
    image: { url: '/images/accountsGuide.png' },
    active: true,
  };

  $scope.item = {};
  $scope.list = [];

  $scope.showAdd = function (_item) {
    $scope.error = '';
    $scope.mode = 'add';
    if (!$scope.settings || !$scope.settings.id) {
      $scope.error = '##word.Please Contact System Administrator to Set System Setting##';
      return;
    }

    if (_item && _item.type == 'detailed') {
      return;
    }

    $scope.item = {
      type: 'detailed',
      status: 'active',
      image: { url: '/images/accountsGuide.png' },
    };

    if (_item) {
      $scope.item.parentId = _item.id;
      $scope.item.topParentId = _item.topParentId || _item.id;
    }

    if ($scope.item.topParentId) {
      $scope.item = {
        code: _item.code,
        type: 'detailed',
        status: _item.status,
        image: _item.image,
      };

      $scope.item.parentId = _item.id;
      $scope.item.topParentId = _item.topParentId || _item.id;
    }

    if ($scope.settings.accountsSetting && $scope.settings.accountsSetting.autoGenerateAccountsGuideAndCostCenterCode) {
      $scope.item.lengthLevel = $scope.settings.accountsSetting.lengthLevel || 0;
    }

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
          $scope.getAll();
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
          $scope.getAll();
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

  $scope.getCostCentersList = function () {
    $scope.error = '';
    $scope.costCentersList = [];
    $scope.busy = true;
    $http({
      method: 'POST',
      url: '/api/costCenters/all',
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
        $scope.costCentersList = response.data.list;
      },
      function (err) {
        $scope.error = err;
      }
    );
  };

  $scope.getGeneralLedgerList = function () {
    $scope.error = '';
    $scope.generalLedgerList = [];
    $scope.busy = true;
    $http({
      method: 'POST',
      url: '/api/generalLedger/all',
      data: {
        where: {
          active: true,
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
        $scope.generalLedgerList = response.data.list;
      },
      function (err) {
        $scope.error = err;
      }
    );
  };

  $scope.getCategoryList = function () {
    $scope.error = '';
    $timeout(() => {
      if ($scope.settings.accountsSetting.linkGlWithIncomeStatementAndBudget) {
        let url = '/api/incomeList/all';
        if ($scope.item.reportType == 'budget') {
          url = '/api/budgetClassifications/all';
        } else if ($scope.item.reportType == 'incomeList') {
          url = '/api/incomeList/all';
        }

        $scope.categoryList = [];
        $scope.busy = true;
        $http({
          method: 'POST',
          url: url,
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
            $scope.categoryList = response.data.list;
          },
          function (err) {
            $scope.error = err;
          }
        );
      }
    }, 250);
  };

  $scope.getSetting = function () {
    $scope.busy = true;
    $scope.settings = {};
    $http({
      method: 'POST',
      url: '/api/systemSetting/get',
      data: {},
    }).then(
      function (response) {
        $scope.busy = false;
        if (response.data.done) {
          $scope.settings = response.data.doc;
          $scope.disabledCode = $scope.settings.accountsSetting.autoGenerateAccountsGuideAndCostCenterCode == true ? true : false;
        }
      },
      function (err) {
        $scope.busy = false;
        $scope.error = err;
      }
    );
  };

  $scope.addCostCenters = function () {
    $scope.item = $scope.item || [];
    $scope.item.costCentersList = $scope.item.costCentersList || [];
    if ($scope.item.$costCenter.id && !$scope.item.costCentersList.some((c) => c.id === $scope.item.$costCenter.id)) {
      $scope.item.costCentersList.unshift($scope.item.$costCenter);
      $scope.item.$costCenter = {};
    }
  };

  $scope.addGeneralLedger = function () {
    $scope.item = $scope.item || [];
    $scope.item.generalLedgerList = $scope.item.generalLedgerList || [];
    if ($scope.item.$generalLedger.id && !$scope.item.generalLedgerList.some((c) => c.id === $scope.item.$generalLedger.id)) {
      $scope.item.generalLedgerList.unshift($scope.item.$generalLedger);
      $scope.item.$generalLedger = {};
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
  $scope.getSetting();
  $scope.getCostCentersList();
  $scope.getGeneralLedgerList();
});
