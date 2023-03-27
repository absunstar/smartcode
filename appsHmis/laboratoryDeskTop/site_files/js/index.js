app.controller('laboratoryDeskTop', function ($scope, $http, $timeout) {
  $scope.baseURL = '';
  $scope.appName = 'laboratoryDeskTop';
  $scope.modalID = '#laboratoryDeskTopManageModal';
  $scope.modalSearchID = '#laboratoryDeskTopSearchModal';
  $('#laboratoryLabels').addClass('hidden');

  $scope.mode = 'add';
  $scope.search = {};
  $scope.today = true;
  $scope.structure = {
    image: { url: '/images/laboratoryDeskTop.png' },
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

  $scope.update = function (_item, modalID, id) {
    $scope.error = '';
    const v = site.validated(modalID);
    if (!v.ok) {
      $scope.error = v.messages[0].ar;
      return;
    }

    if (id > 0) {
      _item.status = $scope.laboratoryDeskTopTypesList.find((l) => {
        return l.id === id;
      });
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
          site.hideModal(modalID);
          site.resetValidated(modalID);
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

  $scope.updateStatus = function (_item, id) {
    $scope.error = '';

    _item.status = $scope.laboratoryDeskTopTypesList.find((l) => {
      return l.id === id;
    });

    $scope.busy = true;
    $http({
      method: 'POST',
      url: `${$scope.baseURL}/api/${$scope.appName}/update`,
      data: _item,
    }).then(
      function (response) {
        $scope.busy = false;
        if (response.data.done) {
          let index = $scope.list.findIndex((itm) => itm.id == response.data.result.doc.id);
          if (index !== -1) {
            $scope.list[index] = response.data.result.doc;
            site.showModal('#alert');
            $timeout(() => {
              site.hideModal('#alert');
            }, 1500);
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

  $scope.showRecommendations = function (_item) {
    $scope.error = '';
    $scope.item = {};
    $scope.view(_item);
    site.showModal('#recommendationsModal');
  };

  $scope.showVitalsNotes = function (_item) {
    $scope.error = '';
    $scope.item = {};
    $scope.view(_item);
    site.showModal('#vitalsNotesModal');
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

  $scope.getAll = function (where, type) {
    $scope.busy = true;
    $scope.list = [];
    where = where || {};
    if ('##user.type.id##' == 2) {
      where['doctor.id'] == site.toNumber('##user.id##');
    }

    if ($scope.today) {
      where['date'] = new Date();
    }

    if (type == 'all') {
      delete where['status.id'];
    }

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
        }
      },
      function (err) {
        $scope.busy = false;
        $scope.error = err;
      }
    );
  };

  $scope.getDoctorsList = function () {
    $scope.busy = true;
    $scope.doctorsList = [];
    $http({
      method: 'POST',
      url: '/api/doctors/all',
      data: {
        where: { active: true, 'type.id': 8 },
        select: {
          id: 1,
          code: 1,
          image: 1,
          nameEn: 1,
          nameAr: 1,
          consItem: 1,
          specialty: 1,
          hospitalResponsibility: 1,
          doctorType: 1,
          nationality: 1,
          clinicExt: 1,
          mobile: 1,
          homeTel: 1,
        },
      },
    }).then(
      function (response) {
        $scope.busy = false;
        if (response.data.done && response.data.list.length > 0) {
          $scope.doctorsList = response.data.list;
        }
      },
      function (err) {
        $scope.busy = false;
        $scope.error = err;
      }
    );
  };

  $scope.getDiagnosesList = function () {
    $scope.busy = true;
    $scope.diagnosesList = [];
    $http({
      method: 'POST',
      url: '/api/diagnoses/all',
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
          $scope.diagnosesList = response.data.list;
        }
      },
      function (err) {
        $scope.busy = false;
        $scope.error = err;
      }
    );
  };

  $scope.getRecipientPersonList = function () {
    $scope.busy = true;
    $scope.recipientPersonList = [];
    $http({
      method: 'POST',
      url: '/api/recipientPerson',
      data: {},
    }).then(
      function (response) {
        $scope.busy = false;
        if (response.data.done && response.data.list.length > 0) {
          $scope.recipientPersonList = response.data.list;
        }
      },
      function (err) {
        $scope.busy = false;
        $scope.error = err;
      }
    );
  };

  $scope.getLaboratoryDeskTopTypesList = function () {
    $scope.busy = true;
    $scope.laboratoryDeskTopTypesList = [];
    $http({
      method: 'POST',
      url: '/api/laboratoryDeskTopTypes',
      data: {},
    }).then(
      function (response) {
        $scope.busy = false;
        if (response.data.done && response.data.list.length > 0) {
          $scope.laboratoryDeskTopTypesList = response.data.list;
        }
      },
      function (err) {
        $scope.busy = false;
        $scope.error = err;
      }
    );
  };

  $scope.addDiagnoses = function () {
    $scope.error = '';
    $scope.item.diagnosesList = $scope.item.diagnosesList || [];
    if ($scope.item.$diagnoses && $scope.item.$diagnoses.id) {
      if (!$scope.item.diagnosesList.some((s) => s.id === $scope.item.$diagnoses.id && code == s.code)) {
        $scope.item.diagnosesList.push({
          id: $scope.item.$diagnoses.id,
          nameAr: $scope.item.$diagnoses.nameAr,
          nameEn: $scope.item.$diagnoses.nameEn,
          code: $scope.item.$diagnoses.code,
        });
      }
      delete $scope.item.$diagnoses;
    } else {
      return;
    }
  };

  $scope.showDelivered = function (item) {
    $scope.item = item;
    site.showModal('#modalDeliveredModal');
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

  $scope.labelPrint = function (item) {
    $scope.error = '';
    if ($scope.busy) return;
    $scope.busy = true;
    $scope.item = item;
    $('#laboratoryLabels').removeClass('hidden');
    JsBarcode('.barcode', $scope.item.code);
    $scope.localPrint = function () {
      let printer = {};
      if ($scope.settings.printerProgram.labelPrinter) {
        printer = $scope.settings.printerProgram.labelPrinter;
      } else {
        $scope.error = '##word.Label printer must select##';
        return;
      }
      if ('##user.printerPath##' && '##user.printerPath.id##' > 0) {
        printer = JSON.parse('##user.printerPath##');
      }
      $timeout(() => {
        site.print({
          selector: '#laboratoryLabels',
          ip: printer.ipDevice,
          port: printer.portDevice,
          pageSize: 'A4',
          printer: printer.ip.name.trim(),
        });
      }, 500);
    };

    $scope.localPrint();

    $scope.busy = false;
    $timeout(() => {
       $('#laboratoryLabels').addClass('hidden');
    }, 8000);
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
      
        }
      },
      function (err) {
        $scope.busy = false;
        $scope.error = err;
      }
    );
  };

  $scope.getAll({ date: new Date() });
  $scope.getDoctorsList();
  $scope.getDiagnosesList();
  $scope.getRecipientPersonList();
  $scope.getLaboratoryDeskTopTypesList();
  $scope.getSetting();
});
