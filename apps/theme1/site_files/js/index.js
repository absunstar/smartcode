app.controller('mainHmis', function ($scope, $http, $timeout) {
  $scope.mainHm = {ahmed: 5}

  $scope.getDoctorAppointmentsList = function () {
    $scope.busy = true;
    $scope.doctorAppointmentsList = [];

    let where = { bookingDate: new Date(), hasTransaction: false };

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
          patient: 1,
          doctor: 1,
          bookingDate:1,
          bookingNumber:1,
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
$scope.getDoctorAppointmentsList();
});
