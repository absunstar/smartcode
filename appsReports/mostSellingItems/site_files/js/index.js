app.controller('mostSellingItems', function ($scope, $http, $timeout) {
    $scope.baseURL = '';
    $scope.appName = 'mostSellingItems';
    $scope.list = [];
    $scope.item = {};
    $scope._search = { fromDate: new Date(), toDate: new Date() };

    $scope.getCurrentMonthDate = function () {
        const date = new Date();
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        $scope._search.fromDate = new Date(firstDay);
        $scope._search.toDate = new Date(lastDay);
        return { firstDay, lastDay };
    };

    $scope.showView = function (_item) {
        $scope.error = '';
        $scope.mode = 'view';
        $scope.item = {};
        $scope.view(_item);
        site.showModal('#storesItemsManageModal');
        document.querySelector(`${'#storesItemsManageModal'} .tab-link`).click();
    };

    $scope.view = function (_item) {
        $scope.busy = true;
        $scope.error = '';
        $http({
            method: 'POST',
            url: `/api/storesItems/view`,
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
    // $scope.getStoresItems = function () {
    //     $scope.error = '';

    //     $scope.busy = true;
    //     $scope.list = [];
    //     $http({
    //         method: 'POST',
    //         url: '/api/storesItems/all',
    //         data: {
    //             where: {
    //                 active: true,
    //                 reportReorderLimits: true,
    //             },
    //             select: {
    //                 id: 1,
    //                 code: 1,
    //                 nameEn: 1,
    //                 nameAr: 1,
    //                 image: 1,
    //                 active: 1,
    //                 unitsList: 1,
    //                 workByBatch: 1,
    //                 workBySerial: 1,
    //                 workByQrCode: 1,
    //                 hasMedicalData: 1,
    //                 reorderLimit: 1,
    //             },
    //         },
    //     }).then(
    //         function (response) {
    //             $scope.busy = false;
    //             if (response.data.done && response.data.list.length > 0) {
    //                 $scope.list = response.data.list;
    //             }
    //         },
    //         function (err) {
    //             $scope.busy = false;
    //             $scope.error = err;
    //         }
    //     );
    // };

    $scope.getStores = function () {
        $scope.busy = true;
        $scope.storesList = [];
        $http({
            method: 'POST',
            url: '/api/stores/all',
            data: {
                where: {
                    active: true,
                },
                select: {
                    id: 1,
                    code: 1,
                    nameEn: 1,
                    nameAr: 1,
                    rasdUser: 1,
                    rasdPass: 1,
                    linkWithRasd: 1,
                },
            },
        }).then(
            function (response) {
                $scope.busy = false;
                if (response.data.done && response.data.list.length > 0) {
                    $scope.storesList = response.data.list;
                }
            },
            function (err) {
                $scope.busy = false;
                $scope.error = err;
            }
        );
    };

    $scope.searchAll = function () {
        $scope.search = { ...$scope._search };
        $scope.getAll($scope.search);
        $scope.search = {};
    };
    $scope.getAll = function (where) {
        $scope.busy = true;
        $scope.list = [];
        $http({
            method: 'POST',
            url: `/api/storesItemsCard/all`,
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

    $scope.getCurrentMonthDate();
    // $scope.getStoresItems();
    $scope.getStores();
});
