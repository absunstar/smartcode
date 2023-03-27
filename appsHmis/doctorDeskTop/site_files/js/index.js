app.controller('doctorDeskTop', function ($scope, $http, $timeout) {
  $scope.baseURL = '';
  $scope.appName = 'doctorDeskTop';
  $scope.modalID = '#doctorDeskTopManageModal';
  $scope.modalSearchID = '#doctorDeskTopSearchModal';
  $scope.mode = 'add';
  $scope.search = {};
  $scope.today = true;
  $scope.structure = {
    image: { url: '/images/doctorDeskTop.png' },
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
      _item.status = $scope.doctorDeskTopTypesList.find((l) => {
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
    _item.status = $scope.doctorDeskTopTypesList.find((l) => {
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

  $scope.showDoctorRecommendations = function (_item) {
    $scope.error = '';
    $scope.item = {};
    $scope.view(_item);
    site.showModal('#doctorRecommendationsModal');
    document.querySelector(`#doctorRecommendationsModal .tab-link`).click();
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

  $scope.getSignificantSignsList = function () {
    $scope.busy = true;
    $scope.significantSignsList = [];
    $http({
      method: 'POST',
      url: '/api/significantSigns/all',
      data: {
        where: { active: true },
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
          $scope.significantSignsList = response.data.list;
        }
      },
      function (err) {
        $scope.busy = false;
        $scope.error = err;
      }
    );
  };

  $scope.getOtherConditionsList = function () {
    $scope.busy = true;
    $scope.otherConditionsList = [];
    $http({
      method: 'POST',
      url: '/api/otherConditions/all',
      data: {
        where: { active: true },
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
          $scope.otherConditionsList = response.data.list;
        }
      },
      function (err) {
        $scope.busy = false;
        $scope.error = err;
      }
    );
  };

  $scope.getChiefComplaintsList = function () {
    $scope.busy = true;
    $scope.chiefComplaintsList = [];
    $http({
      method: 'POST',
      url: '/api/chiefComplaints/all',
      data: {
        where: { active: true },
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
          $scope.chiefComplaintsList = response.data.list;
        }
      },
      function (err) {
        $scope.busy = false;
        $scope.error = err;
      }
    );
  };

  $scope.getDoctorDeskTopTypesList = function () {
    $scope.busy = true;
    $scope.doctorDeskTopTypesList = [];
    $http({
      method: 'POST',
      url: '/api/doctorDeskTopTypes',
      data: {},
    }).then(
      function (response) {
        $scope.busy = false;
        if (response.data.done && response.data.list.length > 0) {
          $scope.doctorDeskTopTypesList = response.data.list;
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

  $scope.getPatientRecommendationsList = function () {
    $scope.busy = true;
    $scope.patientRecommendationsList = [];
    $http({
      method: 'POST',
      url: '/api/patientRecommendations/all',
      data: {
        where: { active: true },
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
          $scope.patientRecommendationsList = response.data.list;
        }
      },
      function (err) {
        $scope.busy = false;
        $scope.error = err;
      }
    );
  };

  $scope.getPatientEducationsList = function () {
    $scope.busy = true;
    $scope.patientEducationsList = [];
    $http({
      method: 'POST',
      url: '/api/patientEducations/all',
      data: {
        where: { active: true },
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
          $scope.patientEducationsList = response.data.list;
        }
      },
      function (err) {
        $scope.busy = false;
        $scope.error = err;
      }
    );
  };

  $scope.getFoodsList = function () {
    $scope.busy = true;
    $scope.foodsList = [];
    $http({
      method: 'POST',
      url: '/api/foods/all',
      data: {
        where: { active: true },
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
          $scope.foodsList = response.data.list;
        }
      },
      function (err) {
        $scope.busy = false;
        $scope.error = err;
      }
    );
  };

  $scope.getOrdersList = function ($search) {
    $scope.busy = true;
    if (!$scope.item.$orderType) {
      return;
    }
    document.getElementById('CO').classList.remove('icon-select');
    document.getElementById('LA').classList.remove('icon-select');
    document.getElementById('X-R').classList.remove('icon-select');
    document.getElementById('MD').classList.remove('icon-select');
    document.getElementById($scope.item.$orderType).classList.add('icon-select');

    $scope.ordersList = [];

    let where = {
      active: true,
    };
    let select = { id: 1, nameEn: 1, nameAr: 1, code: 1 };

    let url = '/api/services/all';
    if ($scope.item.$groupTypeId && $scope.item.$orderType != 'MD') {
      where['serviceGroup.type.id'] = $scope.item.$groupTypeId;
    } else {
      url = '/api/storesItems/all';
      where = {
        ...where,
        active: true,
        allowBuy: true,
        collectionItem: false,
      };
      select = { ...select, unitsList: 1 };
    }
    $http({
      method: 'POST',
      url: url,
      data: {
        where: where,
        select: select,
        search: $search,
      },
    }).then(
      function (response) {
        $scope.busy = false;
        if (response.data.done && response.data.list.length > 0) {
          $scope.ordersList = response.data.list;
        }
      },
      function (err) {
        $scope.busy = false;
        $scope.error = err;
      }
    );
  };

  $scope.getDrinksList = function () {
    $scope.busy = true;
    $scope.drinksList = [];
    $http({
      method: 'POST',
      url: '/api/drinks/all',
      data: {
        where: { active: true },
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
          $scope.drinksList = response.data.list;
        }
      },
      function (err) {
        $scope.busy = false;
        $scope.error = err;
      }
    );
  };

  $scope.getMedicineDurationsList = function () {
    $scope.busy = true;
    $scope.medicineDurationsList = [];
    $http({
      method: 'POST',
      url: '/api/medicineDurations/all',
      data: {
        where: { active: true },
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
          $scope.medicineDurationsList = response.data.list;
        }
      },
      function (err) {
        $scope.busy = false;
        $scope.error = err;
      }
    );
  };
  $scope.getMedicineFrequenciesList = function () {
    $scope.busy = true;
    $scope.medicineFrequenciesList = [];
    $http({
      method: 'POST',
      url: '/api/medicineFrequencies/all',
      data: {
        where: { active: true },
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
          $scope.medicineFrequenciesList = response.data.list;
        }
      },
      function (err) {
        $scope.busy = false;
        $scope.error = err;
      }
    );
  };
  $scope.getMedicineRoutesList = function () {
    $scope.busy = true;
    $scope.medicineRoutesList = [];
    $http({
      method: 'POST',
      url: '/api/medicineRoutes/all',
      data: {
        where: { active: true },
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
          $scope.medicineRoutesList = response.data.list;
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

  $scope.addDoctorReccomend = function (name, code) {
    $scope.error = '';
    $scope.item.doctorReccomendList = $scope.item.doctorReccomendList || [];
    if ($scope.item[name] && $scope.item[name].id) {
      if (!$scope.item.doctorReccomendList.some((s) => s.id === $scope.item[name].id && code == s.code)) {
        $scope.item.doctorReccomendList.push({
          id: $scope.item[name].id,
          nameAr: $scope.item[name].nameAr,
          nameEn: $scope.item[name].nameEn,
          code: code,
        });
      }
      delete $scope.item[name];
    } else {
      return;
    }
  };

  $scope.addPatientReccomend = function (name, code) {
    $scope.error = '';
    $scope.item.patientReccomendList = $scope.item.patientReccomendList || [];
    if ($scope.item[name] && $scope.item[name].id) {
      if (!$scope.item.patientReccomendList.some((s) => s.id === $scope.item[name].id && code == s.code)) {
        $scope.item.patientReccomendList.push({
          id: $scope.item[name].id,
          nameEn: $scope.item[name].nameEn,
          nameAr: $scope.item[name].nameAr,
          code: code,
        });
      }
      delete $scope.item[name];
    } else {
      return;
    }
  };

  $scope.addOrders = function (_item) {
    $scope.error = '';

    if (_item.$order && _item.$order.id) {
      _item.ordersList = _item.ordersList || [];
      if (!_item.ordersList.some((s) => s.id === _item.$order.id && s.type === _item.$orderType)) {
        let order = { ..._item.$order, type: _item.$orderType, count: 1 };
        if (order.type == 'MD') {
          order.unit = _item.$order.unitsList[0].unit;
          order.barcode = _item.$order.unitsList[0].barcode;
          order.price = _item.$order.unitsList[0].salesPrice;
          order.discount = _item.$order.unitsList[0].discount;
          order.discountType = _item.$order.unitsList[0].discountType;
          _item.ordersList.unshift(order);
          $scope.calc(_item.ordersList[0]);
        } else {
          let obj = {
            mainInsuranceCompany: _item.mainInsuranceCompany,
            patientClass: _item.patient.insuranceClass,
            insuranceContract: _item.insuranceContract,
            servicesList: [_item.$order],
            payment: _item.payment,
            type: _item.type,
          };

          if (_item.doctor && _item.doctor.hospitalResponsibility) {
            obj.hospitalResponsibility = { ..._item.doctor.hospitalResponsibility };
          }
          if (_item.patient.nationality && _item.patient.nationality.id) {
            obj.nationalityId = _item.patient.nationality.id;
          } else {
            obj.nationalityId = 0;
          }

          $http({
            method: 'POST',
            url: '/api/serviceMainInsurance',
            data: obj,
          }).then(
            function (response) {
              $scope.busy = false;
              if (response.data.done && response.data.servicesList && response.data.servicesList.length > 0) {
                _item.ordersList.unshift({
                  id: order.id,
                  code: order.code,
                  nameAr: order.nameAr,
                  nameEn: order.nameEn,
                  type: order.type,
                  price: response.data.servicesList[0].price,
                  discount: response.data.servicesList[0].discount,
                  total: response.data.servicesList[0].total,
                });
              }
            },
            function (err) {
              $scope.busy = false;
              $scope.error = err;
            }
          );
        }
      }
      _item.$order = {};
    } else {
      $scope.error = 'Must Select Service';
      return;
    }
  };

  $scope.calc = function (_item) {
    $scope.error = '';
    $timeout(() => {
      let afterPrice = 0;
      if (_item.discountType == 'value') {
        afterPrice = _item.price - _item.discount;
      } else {
        let discount = (_item.price * _item.discount) / 100;
        afterPrice = _item.price - discount;
      }

      _item.total = afterPrice * _item.count;
      _item.total = site.toNumber(_item.total);
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
  $scope.getDoctorsList();
  $scope.getChiefComplaintsList();
  $scope.getSignificantSignsList();
  $scope.getOtherConditionsList();
  $scope.getDiagnosesList();
  $scope.getPatientRecommendationsList();
  $scope.getPatientEducationsList();
  $scope.getDrinksList();
  $scope.getFoodsList();
  $scope.getDoctorDeskTopTypesList();
  $scope.getMedicineDurationsList();
  $scope.getMedicineFrequenciesList();
  $scope.getMedicineRoutesList();
});
