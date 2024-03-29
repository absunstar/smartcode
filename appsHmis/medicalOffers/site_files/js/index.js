app.controller('medicalOffers', function ($scope, $http, $timeout) {
  $scope.baseURL = '';
  $scope.appName = 'medicalOffers';
  $scope.modalID = '#medicalOffersManageModal';
  $scope.modalSearchID = '#medicalOffersSearchModal';
  $scope.mode = 'add';
  $scope._search = {};
  $scope.structure = {
    image: { url: '/images/medicalOffers.png' },
    active: true,
    discount: 0,
    totalCount: 0,
    totalVat: 0,
    totalPrice: 0,
    totalAfterVat: 0,
    discountType: 'percent',
  };
  $scope.item = {};
  $scope.list = [];

  $scope.showAdd = function (_item) {
    $scope.error = '';
    $scope.mode = 'add';
    $scope.item = { ...$scope.structure, servicesList: [], startDate: new Date() };
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

  $scope.getServicesList = function ($search) {
    $scope.busy = true;
    $http({
      method: 'POST',
      url: '/api/services/all',
      data: {
        where: {
          active: true,
        },
        select: {
          id: 1,
          nameEn: 1,
          nameAr: 1,
          code: 1,
          cashPriceOut: 1,
          vat: 1,
          serviceSpecialty: 1,
          cost: 1,
          sfdaCodeList: 1,
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

  $scope.addServices = function (_item) {
    $scope.error = '';
    if (_item.$service && _item.$service.id) {
      let found = false;
      _item.servicesList.forEach((s) => {
        if (s.id === _item.$service.id) {
          s.qty += 1;
          found = true;
        }
      });

      if (!found) {
        if (_item.$service.sfdaCodeList && _item.$service.sfdaCodeList.length > 0) {
          _item.$service.sfdaCode = _item.$service.sfdaCodeList[0].sfdaCode;
          delete _item.$service.sfdaCodeList;
        }
        _item.servicesList.push({ ..._item.$service, qty: 1 });
      }
      $scope.calc(_item);
      _item.$service = {};
    } else {
      $scope.error = 'Must Select Service';
      return;
    }
  };

  $scope.calc = function (_item) {
    $scope.error = '';
    $timeout(() => {
      _item.totalCount = 0;
      _item.totalVat = 0;
      _item.totalPrice = 0;
      _item.totalAfterVat = 0;
      _item.totalNet = 0;
      _item.totalDiscounts = 0;

      _item.servicesList.forEach((_service) => {
        _service.totalAfterVat = 0;
        _service.totalVat = _service.qty * ((_service.vat * _service.cashPriceOut) / 100);
        _service.total = _service.qty * _service.cashPriceOut;
        _service.totalVat = site.toNumber(_service.totalVat);
        _service.total = site.toNumber(_service.total);
        _service.totalAfterVat = _service.total + _service.totalVat;
        _service.totalAfterVat = site.toNumber(_service.totalAfterVat);

        _item.totalCount += _service.qty;
        _item.totalVat += _service.totalVat;
        _item.totalPrice += _service.total;
        _item.totalAfterVat += _service.totalAfterVat;
      });

      if (_item.discountType == 'percent') {
        _item.totalDiscounts = (_item.discount * _item.totalAfterVat) / 100;
      } else {
        _item.totalDiscounts = _item.discount;
      }

      _item.totalNet = _item.totalAfterVat - _item.totalDiscounts;
      _item.totalAfterVat = site.toNumber(_item.totalAfterVat);
      _item.totalNet = site.toNumber(_item.totalNet);
    }, 300);
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
  $scope.getServicesList();
  $scope.getNumberingAuto();
});
