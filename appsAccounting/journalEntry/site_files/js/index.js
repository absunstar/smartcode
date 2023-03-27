app.controller('journalEntry', function ($scope, $http, $timeout) {
  $scope.baseURL = '';
  $scope.appName = 'journalEntry';
  $scope.modalID = '#journalEntryManageModal';
  $scope.modalSearchID = '#journalEntrySearchModal';
  $scope.mode = 'add';
  $scope._search = {};
  $scope.structure = {
    image: { url: '/images/journalEntry.png' },
    active: true,
    totalDebtor: 0,
    totalCreditor: 0,
  };
  $scope.item = {};
  $scope.list = [];

  $scope.showAdd = function (_item) {
    $scope.error = '';
    $scope.mode = 'add';
    $scope.item = { ...$scope.structure, accountsList: [], date: new Date(), $accountGuide: { debtor: 0, creditor: 0 } };
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
          side: 1,
          generalLedgerList: 1,
          costCentersList: 1,
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

  $scope.getAssistantGeneralLedgerList = function (id, callback) {
    $scope.error = '';
    $scope.busy = true;
    $http({
      method: 'POST',
      url: '/api/assistantGeneralLedger/all',
      data: {
        where: {
          active: true,
          'generalLedger.id': id,
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
        if (response.data.done && response.data.list.length > 0) {
          callback(response.data.list);
        } else {
          callback(null);
        }
      },
      function (err) {
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

  $scope.showCostCenters = function (account) {
    $scope.account = account;
    site.showModal('#costCentersModal');
  };

  $scope.showGeneralLedgers = function (account) {
    $scope.account = account;
    site.showModal('#generalLedgerModal');
  };

  $scope.addAccountGuide = function () {
    $scope.item = $scope.item || [];
    $scope.item.accountsList = $scope.item.accountsList || [];
    if ($scope.item.$accountGuide.debtor && $scope.item.$accountGuide.creditor) {
      $scope.error = 'Debit and credit values cannot be entered';
      return;
    }
    if ($scope.item.$accountGuide.id && !$scope.item.accountsList.some((c) => c.id === $scope.item.$accountGuide.id)) {
      $scope.item.accountsList.unshift({ ...$scope.item.$accountGuide });
      if ($scope.item.accountsList[0].generalLedgerList && $scope.item.accountsList[0].generalLedgerList.length > 0) {
        $scope.item.accountsList[0].generalLedgerList.forEach((_g) => {
          $scope.getAssistantGeneralLedgerList(_g.id, (assistantGeneralLedgerList) => {
            if (assistantGeneralLedgerList) {
              _g.$assistantGeneralLedgerList = assistantGeneralLedgerList;
              $scope.$applyAsync();
            }
          });
        });
      }
      $scope.item.$accountGuide = {};
    }
  };

  $scope.calc = function (_item) {
    $scope.error = '';
    $timeout(() => {
      _item.totalDebtor = 0;
      _item.totalCreditor = 0;
      _item.accountsList.forEach((a) => {
        _item.totalDebtor += a.debtor;
        _item.totalCreditor += a.creditor;
      });
    }, 300);
  };

  $scope.getAll();
  $scope.getNumberingAuto();
  $scope.getAccountsGuideList();
});
