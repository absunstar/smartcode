module.exports = function init(site) {
  let app = {
    name: 'ordersScreen',
    allowRoute: true,
    allowRouteGet: true,
  };
  site.ordersScreenList = site.ordersScreenList || [];

  // site.post({ name: `/api/${app.name}/openOrders`, require: { permissions: ['login'] } }, (req, res) => {
  //   let response = {
  //     done: false,
  //   };

  //   let _data = req.data;
  //   _data.editUserInfo = req.getUserFinger();
  //   if (_data.type == 'save') {
  //     if (!_data.item.id) {
  //       _data.item.id = (site.ordersScreenList[0].id || 0) + 1;
  //       site.ordersScreenList.unshift(_data.item);
  //     } else {
  //       let index = site.ordersScreenList.findIndex((a) => a.id === _data.id);
  //       if (index !== -1) {
  //         site.ordersScreenList[index] = _data.item;
  //       }
  //     }
  //   } else if (_data.type == 'delete') {
  //     let index = site.ordersScreenList.findIndex((a) => a.id === _data.id);
  //     if (index !== -1) {
  //       site.ordersScreenList.splice(index, 1);
  //       response.done = true;
  //     } else {
  //       response.error = 'Order Not Found';
  //     }
  //   }
  //   res.json(response);
  // });

  if (app.allowRoute) {
    if (app.allowRouteGet) {
      site.get(
        {
          name: app.name,
        },
        (req, res) => {
          res.render(app.name + '/index.html', { title: app.name, appName: req.word("Orders Screen"), setting: site.getCompanySetting(req) }, { parser: 'html', compres: true });
        }
      );
    }
  }

  site.addApp(app);
};
