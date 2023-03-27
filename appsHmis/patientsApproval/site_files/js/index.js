app.controller('patientsApproval', function ($scope, $http, $timeout) {
  $scope.baseURL = '';
  $scope.appName = 'patientsApproval';
  $scope.modalID = '#patientsApprovalManageModal';
  $scope.modalSearchID = '#patientsApprovalSearchModal';

  $scope.getServicesOrderNeedApprove = function () {
    $scope.busy = true;
    $scope.list = [];
    $http({
      method: 'POST',
      url: '/api/servicesOrders/needApprove',
      data: {},
    }).then(
      function (response) {
        $scope.busy = false;
        if (response.data.done && response.data.list.length > 0) {
          $scope.list = response.data.list;
        }
      },
      function (err) {
        $scope.busy = false;
        $scope.error = err;
      }
    );
  };

  $scope.approve = function (obj) {
    $http({
      method: 'POST',
      url: '/api/servicesOrders/approveService',
      data: {
       orderId : obj.id,
       serviceId : obj.service.id,
      },
    }).then(
      function (response) {
        if (response.data.done ) {
    $scope.getServicesOrderNeedApprove();
        }
      },
      function (err) {
    $scope.error = err;
      }
    );
  };
  $scope.getServicesOrderNeedApprove();

});
