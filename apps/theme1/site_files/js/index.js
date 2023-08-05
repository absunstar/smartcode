app.controller('mainHmis', function ($scope, $http, $timeout) {
  $scope.baseURL = '';
  $scope.setting = site.showObject(`##data.#setting##`);
  console.log($scope.setting);
  $scope.getDoctorAppointmentsViewList = function (obj) {
    $scope.busy = true;
    $scope.doctorAppointmentsViewList = [];
    if (obj) {
      obj.day = site.toNumber(obj.day);
      $scope.appointmentDate = { day: obj.day, month: obj.month, year: obj.year };
    }
    let where = { bookingDate: new Date($scope.appointmentDate.year, $scope.appointmentDate.month, $scope.appointmentDate.day + 1, 0, 0, 0, 0) };
    $http({
      method: 'POST',
      url: '/api/doctorAppointments/all',
      data: {
        where: where,
        limit: 20,
        select: {
          id: 1,
          code: 1,
          date: 1,
          active: 1,
          patient: 1,
          doctor: 1,
          bookingDate: 1,
          doctorSchedule: 1,
          bookingNumber: 1,
        },
      },
    }).then(
      function (response) {
        $scope.busy = false;
        if (response.data.done && response.data.list.length > 0) {
          $scope.doctorAppointmentsViewList = response.data.list;
          $scope.$applyAsync();
        }
      },
      function (err) {
        $scope.busy = false;
        $scope.error = err;
      }
    );
  };
  $scope.getDoctorAppointmentsList = function () {
    $scope.busy = true;
    $scope.doctorAppointmentsList = [];

    let where = { bookingDate: new Date(), active: true };

    $http({
      method: 'POST',
      url: '/api/doctorAppointments/all',
      data: {
        where: where,
        limit: 10,
        select: {
          id: 1,
          code: 1,
          date: 1,
          active: 1,
          patient: 1,
          doctor: 1,
          doctorSchedule: 1,
          bookingDate: 1,
          bookingNumber: 1,
        },
      },
    }).then(
      function (response) {
        $scope.busy = false;
        if (response.data.done && response.data.list.length > 0) {
          $scope.doctorAppointmentsList = response.data.list;
        }
      },
      function (err) {
        $scope.busy = false;
        $scope.error = err;
      }
    );
  };

  $scope.getDoctorAppointmentsDetails = function () {
    $scope.busy = true;

    let where = { date: new Date(), active: true };

    $http({
      method: 'POST',
      url: '/api/doctorAppointments/details',
      data: {
        where: where,
        limit: 10,
        select: {
          id: 1,
          date: 1,          
        },
      },
    }).then(
      function (response) {
        $scope.busy = false;
        if (response.data.done && response.data.doc) {
          $scope.doctorAppointmentsDetails = response.data.doc;
        }
      },
      function (err) {
        $scope.busy = false;
        $scope.error = err;
      }
    );
  };

  $scope.getSalesInvoicesDetails = function () {
    $scope.busy = true;

    let where = { date: new Date(), active: true };

    $http({
      method: 'POST',
      url: '/api/salesInvoices/details',
      data: {
        where: where,
        limit: 10,
        select: {
          id: 1,
          date: 1,          
        },
      },
    }).then(
      function (response) {
        $scope.busy = false;
        if (response.data.done && response.data.doc) {
          $scope.salesInvoicesDetails = response.data.doc;
        }
      },
      function (err) {
        $scope.busy = false;
        $scope.error = err;
      }
    );
  };

  $scope.getDoctorDeskTopDetails = function () {
    $scope.busy = true;

    let where = { date: new Date(), active: true };

    $http({
      method: 'POST',
      url: '/api/doctorDeskTop/details',
      data: {
        where: where,
        limit: 10,
        select: {
          id: 1,
          date: 1,          
        },
      },
    }).then(
      function (response) {
        $scope.busy = false;
        if (response.data.done && response.data.doc) {
          $scope.doctorDeskTopDetails = response.data.doc;
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
        where: { active: true, onDuty: true },
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
          gender: 1,
          homeTel: 1,
          freeRevistPeriod: 1,
          freeRevistCount: 1,
          scientificRank: 1,
          onDuty: 1,
          signatureImage: 1,
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

  $scope.showViewAppointment = function (_item) {
    $scope.error = '';
    $scope.mode = 'view';
    $scope.item = {};
    $scope.viewAppointment(_item);
    site.showModal('#doctorAppointmentsManageModal');
  };

  $scope.viewAppointment = function (_item) {
    $scope.busy = true;
    $scope.error = '';
    $http({
      method: 'POST',
      url: `${$scope.baseURL}/api/doctorAppointments/view`,
      data: {
        id: _item.id,
      },
    }).then(
      function (response) {
        $scope.busy = false;
        if (response.data.done) {
          $scope.item = response.data.doc;
          $scope.$applyAsync();
        } else {
          $scope.error = response.data.error;
        }
      },
      function (err) {
        console.log(err);
      }
    );
  };
  $scope.showUpdateAppointment = function (_item) {
    $scope.error = '';
    $scope.mode = 'edit';
    $scope.viewAppointment(_item);
    $scope.item = {};
    site.showModal('#doctorAppointmentsManageModal');
  };

  $scope.updateAppointment = function (_item) {
    $scope.error = '';
    const v = site.validated('#doctorAppointmentsManageModal');
    if (!v.ok) {
      $scope.error = v.messages[0].ar;
      return;
    }
    $scope.busy = true;
    $http({
      method: 'POST',
      url: `${$scope.baseURL}/api/doctorAppointments/update`,
      data: _item,
    }).then(
      function (response) {
        $scope.busy = false;
        if (response.data.done) {
          site.hideModal('#doctorAppointmentsManageModal');
          site.resetValidated('#doctorAppointmentsManageModal');
          $scope.getDoctorAppointmentsViewList();
        } else {
          $scope.error = response.data.error;
        }
      },
      function (err) {
        console.log(err);
      }
    );
  };

  $scope.showDeleteAppointment = function (_item) {
    $scope.error = '';
    $scope.mode = 'delete';
    $scope.item = {};
    $scope.viewAppointment(_item);
    site.showModal('#doctorAppointmentsManageModal');
  };

  $scope.deleteAppointment = function (_item) {
    $scope.busy = true;
    $scope.error = '';

    $http({
      method: 'POST',
      url: `${$scope.baseURL}/api/doctorAppointments/delete`,
      data: {
        id: $scope.item.id,
      },
    }).then(
      function (response) {
        $scope.busy = false;
        if (response.data.done) {
          site.hideModal('#doctorAppointmentsManageModal');
          $scope.getDoctorAppointmentsViewList();
        } else {
          $scope.error = response.data.error;
        }
      },
      function (err) {
        console.log(err);
      }
    );
  };

  $scope.getDoctorAppointmentsList();
  $scope.getDoctorsList();
  $scope.getDoctorAppointmentsDetails();
  $scope.getSalesInvoicesDetails();
  $scope.getDoctorDeskTopDetails();
});
