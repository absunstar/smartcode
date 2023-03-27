app.controller('costCenters', function ($scope, $http, $timeout) {
  $scope.baseURL = '';
  $scope.appName = 'costCenters';
  $scope.modalID = '#costCentersManageModal';
  $scope.modalSearchID = '#costCentersSearchModal';
  $scope.mode = 'add';
  $scope._search = {};
  $scope.structure = {
    image: { url: '/images/costCenters.png' },
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
      image: { url: '/images/costCenters.png' },
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
});
