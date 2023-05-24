app.controller('patientHistory', function ($scope, $http, $timeout) {
  $scope.baseURL = '';
  $scope.appName = 'patientHistory';
  $scope.modalID = '#patientHistoryManageModal';
  $scope.modalSearchID = '#patientHistorySearchModal';
  $scope.patientId = site.toNumber('##params.id##');
  $scope.patient = {};

  $scope.setting = site.showObject(`##data.#setting##`);
  $('#ordersDetails').addClass('hidden');
  $('#attendanceNoticDetails').addClass('hidden');
  $('#sickLeaveDetails').addClass('hidden');
  $('#medicalReportDetails').addClass('hidden');
  $('#radiologyDetails').addClass('hidden');
  $('#laboratoryLabels').addClass('hidden');
  $('#laboratoryDetails').addClass('hidden');
  
  if ($scope.patientId > 0) {
    $scope.getPatient = function (id) {
      $scope.busy = true;
      $http({
        method: 'POST',
        url: '/api/patients/view',
        data: {
          id: site.toNumber(id),
        },
      }).then(
        function (response) {
          $scope.busy = false;
          if (response.data.done && response.data.doc) {
            $scope.patient = response.data.doc;
            document.querySelector(`#patientHistory .tab-link`).click();
            $scope.getDoctorDeskTopList($scope.patient.id);
            $scope.getLaboratoryDeskTopList($scope.patient.id);
            $scope.getRadiologyDeskTopList($scope.patient.id);
            $scope.getOffersOrdersList($scope.patient.id);
          }
        },
        function (err) {
          $scope.busy = false;
          $scope.error = err;
        }
      );
    };
    $scope.getPatient($scope.patientId);
  }

  $scope.getPatientsList = function ($search) {
    $scope.busy = true;
    if ($search && $search.length < 1) {
      return;
    }
    $scope.patientsList = [];
    $http({
      method: 'POST',
      url: '/api/patients/all',
      data: {
        where: { active: true, 'type.id': 5 },
        select: {
          id: 1,
          code: 1,
          image: 1,
          fullNameEn: 1,
          fullNameAr: 1,
          patientType: 1,
          maritalStatus: 1,
          dateOfBirth: 1,
          gender: 1,
          age: 1,
          motherNameEn: 1,
          motherNameAr: 1,
          newBorn: 1,
          nationality: 1,
          mobile: 1,
          patientType: 1,
          insuranceCompany: 1,
          insuranceClass: 1,
          expiryDate: 1,
          havisaNum: 1,
          member:1,
        },
        search: $search,
      },
    }).then(
      function (response) {
        $scope.busy = false;
        if (response.data.done && response.data.list.length > 0) {
          $scope.patientsList = response.data.list;
        }
      },
      function (err) {
        $scope.busy = false;
        $scope.error = err;
      }
    );
  };

  $scope.getDoctorDeskTopList = function (id) {
    $scope.doctorDeskTopList = [];
    $scope.medicineOrdersList = [];
    $http({
      method: 'POST',
      url: '/api/doctorDeskTop/all',
      data: {
        where: { 'patient.id': id },
        select: {
          id: 1,
          code: 1,
          doctor: 1,
          service: 1,
          status: 1,
          ordersList: 1,
          date: 1,
        },
      },
    }).then(
      function (response) {
        if (response.data.done && response.data.list.length > 0) {
          $scope.doctorDeskTopList = response.data.list;
          $scope.doctorDeskTopList.forEach((_d) => {
            _d.ordersList = _d.ordersList || [];
            _d.ordersList.forEach((_o) => {
              if (_o.type == 'MD') {
                $scope.medicineOrdersList.push(_o);
              }
            });
          });
        }
      },
      function (err) {
        $scope.error = err;
      }
    );
  };

  $scope.getLaboratoryDeskTopList = function (id) {
    $scope.laboratoryDeskTopList = [];
    $http({
      method: 'POST',
      url: '/api/laboratoryDeskTop/all',
      data: {
        where: { 'patient.id': id },
        select: {
          id: 1,
          code: 1,
          doctor: 1,
          service: 1,
          status: 1,
          date: 1,
        },
      },
    }).then(
      function (response) {
        if (response.data.done && response.data.list.length > 0) {
          $scope.laboratoryDeskTopList = response.data.list;
        }
      },
      function (err) {
        $scope.error = err;
      }
    );
  };

  $scope.getOffersOrdersList = function (id) {
    $scope.offersOrdersList = [];
    $http({
      method: 'POST',
      url: '/api/offersOrders/all',
      data: {
        where: { 'patient.id': id },
        select: {
          id: 1,
          code: 1,
          medicalOffer: 1,
          totalNet: 1,
          remainPaid: 1,
          date: 1,
        },
      },
    }).then(
      function (response) {
        if (response.data.done && response.data.list.length > 0) {
          $scope.offersOrdersList = response.data.list;
        }
      },
      function (err) {
        $scope.error = err;
      }
    );
  };

  $scope.getRadiologyDeskTopList = function (id) {
    $scope.radiologyDeskTopList = [];
    $http({
      method: 'POST',
      url: '/api/radiologyDeskTop/all',
      data: {
        where: { 'patient.id': id },
        select: {
          id: 1,
          code: 1,
          doctor: 1,
          service: 1,
          status: 1,
          date: 1,
        },
      },
    }).then(
      function (response) {
        if (response.data.done && response.data.list.length > 0) {
          $scope.radiologyDeskTopList = response.data.list;
        }
      },
      function (err) {
        $scope.error = err;
      }
    );
  };

  $scope.showOffersOrders = function (_item) {
    $scope.error = '';
    $http({
      method: 'POST',
      url: `/api/offersOrders/view`,
      data: {
        id: _item.id,
      },
    }).then(
      function (response) {
        $scope.busy = false;
        if (response.data.done) {
          $scope.item = response.data.doc;
          $scope.item.$view = true;
          $scope.mode = 'view';
          site.showModal('#offersOrdersManageModal');
        } else {
          $scope.error = response.data.error;
        }
      },
      function (err) {
        console.log(err);
      }
    );
  };

  $scope.showDoctorRecommendations = function (_item) {
    $scope.error = '';
    $http({
      method: 'POST',
      url: `/api/doctorDeskTop/view`,
      data: {
        id: _item.id,
      },
    }).then(
      function (response) {
        $scope.busy = false;
        if (response.data.done) {
          $scope.item = response.data.doc;
          $scope.item.$view = true;
          site.showModal('#doctorRecommendationsModal');
          document.querySelector(`#doctorRecommendationsModal .tab-link`).click();
        } else {
          $scope.error = response.data.error;
        }
      },
      function (err) {
        console.log(err);
      }
    );
  };

  $scope.showLaboratoryRecommendations = function (_item) {
    $scope.error = '';
    $http({
      method: 'POST',
      url: `/api/laboratoryDeskTop/view`,
      data: {
        id: _item.id,
      },
    }).then(
      function (response) {
        $scope.busy = false;
        if (response.data.done) {
          $scope.item = response.data.doc;
          $scope.item.$view = true;
          site.showModal('#recommendationsModal');
        } else {
          $scope.error = response.data.error;
        }
      },
      function (err) {
        console.log(err);
      }
    );
  };

  $scope.showRadiologyRecommendations = function (_item) {
    $scope.error = '';
    $http({
      method: 'POST',
      url: `/api/radiologyDeskTop/view`,
      data: {
        id: _item.id,
      },
    }).then(
      function (response) {
        $scope.busy = false;
        if (response.data.done) {
          $scope.item = response.data.doc;
          $scope.item.$view = true;
          site.showModal('#recommendationsRadiologyModal');
        } else {
          $scope.error = response.data.error;
        }
      },
      function (err) {
        console.log(err);
      }
    );
  };

  $scope.ordersPrint = function (item) {
    $scope.error = '';
    if ($scope.busy) return;
    $scope.busy = true;
    $('#ordersDetails').removeClass('hidden');
    $scope.order = item;
    document.getElementById('treatment').innerHTML = $scope.order.treatment;

    $scope.localPrint = function () {
      let printer = {};
      if ($scope.setting.printerProgram.a4Printer) {
        printer = $scope.setting.printerProgram.a4Printer;
      } else {
        $scope.error = '##word.A4 printer must select##';
        return;
      }
      if ('##user.a4Printer##' && '##user.a4Printer.id##' > 0) {
        printer = JSON.parse('##user.a4Printer##');
      }
      $timeout(() => {
        site.print({
          selector: '#ordersDetails',
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
      $('#ordersDetails').addClass('hidden');
    }, 8000);
  };

  $scope.attendanceNoticPrint = function (item) {
    $scope.error = '';
    if ($scope.busy) return;
    $scope.busy = true;
    $('#attendanceNoticDetails').removeClass('hidden');
    $scope.order = item;

    $scope.localPrint = function () {
      let printer = {};
      if ($scope.setting.printerProgram.a4Printer) {
        printer = $scope.setting.printerProgram.a4Printer;
      } else {
        $scope.error = '##word.A4 printer must select##';
        return;
      }
      if ('##user.a4Printer##' && '##user.a4Printer.id##' > 0) {
        printer = JSON.parse('##user.a4Printer##');
      }
      $timeout(() => {
        site.print({
          selector: '#attendanceNoticDetails',
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
      $('#attendanceNoticDetails').addClass('hidden');
    }, 8000);
  };

  $scope.sickLeavePrint = function (item) {
    $scope.error = '';
    if ($scope.busy) return;
    $scope.busy = true;
    $('#sickLeaveDetails').removeClass('hidden');
    $scope.order = item;

    $scope.localPrint = function () {
      let printer = {};
      if ($scope.setting.printerProgram.a4Printer) {
        printer = $scope.setting.printerProgram.a4Printer;
      } else {
        $scope.error = '##word.A4 printer must select##';
        return;
      }
      if ('##user.a4Printer##' && '##user.a4Printer.id##' > 0) {
        printer = JSON.parse('##user.a4Printer##');
      }
      $timeout(() => {
        site.print({
          selector: '#sickLeaveDetails',
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
      $('#sickLeaveDetails').addClass('hidden');
    }, 8000);
  };

  $scope.medicalReportPrint = function (item) {
    $scope.error = '';
    if ($scope.busy) return;
    $scope.busy = true;
    $('#medicalReportDetails').removeClass('hidden');
    $scope.order = item;
    document.getElementById('treatment').innerHTML = $scope.order.treatment;

    $scope.localPrint = function () {
      let printer = {};
      if ($scope.setting.printerProgram.a4Printer) {
        printer = $scope.setting.printerProgram.a4Printer;
      } else {
        $scope.error = '##word.A4 printer must select##';
        return;
      }
      if ('##user.a4Printer##' && '##user.a4Printer.id##' > 0) {
        printer = JSON.parse('##user.a4Printer##');
      }
      $timeout(() => {
        site.print({
          selector: '#medicalReportDetails',
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
      $('#medicalReportDetails').addClass('hidden');
    }, 8000);
  };

  $scope.labelLaboratoryPrint = function (item) {
    $scope.error = '';
    if ($scope.busy) return;
    $scope.busy = true;
    $scope.item = item;
    $('#laboratoryLabels').removeClass('hidden');
    JsBarcode('.barcode', $scope.item.code);
    $scope.localLabelPrint = function () {
      let printer = {};
      if ($scope.setting.printerProgram.labelPrinter) {
        printer = $scope.setting.printerProgram.labelPrinter;
      } else {
        $scope.error = '##word.Label printer must select##';
        return;
      }
      if ('##user.labelPrinter##' && '##user.labelPrinter.id##' > 0) {
        printer = JSON.parse('##user.labelPrinter##');
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

    $scope.localLabelPrint();

    $scope.busy = false;
    $timeout(() => {
      $('#laboratoryLabels').addClass('hidden');
    }, 8000);
  };

  $scope.laboratoryPrint = function (item) {
    $scope.error = '';
    if ($scope.busy) return;
    $scope.busy = true;
    $('#laboratoryDetails').removeClass('hidden');
    $scope.order = item;
    $scope.localPrint = function () {
      let printer = {};
      if ($scope.setting.printerProgram.a4Printer) {
        printer = $scope.setting.printerProgram.a4Printer;
      } else {
        $scope.error = '##word.A4 printer must select##';
        return;
      }
      if ('##user.a4Printer##' && '##user.a4Printer.id##' > 0) {
        printer = JSON.parse('##user.a4Printer##');
      }
      $timeout(() => {
        site.print({
          selector: '#laboratoryDetails',
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
      $('#laboratoryDetails').addClass('hidden');
    }, 8000);
  };

  $scope.radiologyPrint = function (item) {
    $scope.error = '';
    if ($scope.busy) return;
    $scope.busy = true;
    $('#radiologyDetails').removeClass('hidden');
    $scope.order = item;
    document.getElementById('treatment').innerHTML = $scope.order.treatment;
    $scope.localPrint = function () {
      let printer = {};
      if ($scope.setting.printerProgram.a4Printer) {
        printer = $scope.setting.printerProgram.a4Printer;
      } else {
        $scope.error = '##word.A4 printer must select##';
        return;
      }
      if ('##user.a4Printer##' && '##user.a4Printer.id##' > 0) {
        printer = JSON.parse('##user.a4Printer##');
      }
      $timeout(() => {
        site.print({
          selector: '#radiologyDetails',
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
      $('#radiologyDetails').addClass('hidden');
    }, 8000);
  };


  if ($scope.setting && $scope.setting.printerProgram.invoiceLogo) {
    $scope.invoiceLogo = document.location.origin + $scope.setting.printerProgram.invoiceLogo.url;
  }
});
