module.exports = function init(site) {
  let app = {
    name: 'reportEmployeesAdvances',
    allowRoute: true,
    allowRouteGet: true,
  };

  app.$collection = site.connectCollection(app.name);

  if (app.allowRoute) {
    if (app.allowRouteGet) {
      site.get(
        {
          name: app.name,
        },
        (req, res) => {
          res.render(app.name + '/index.html', { title: app.name, appName: 'Report Employees Advances' }, { parser: 'html', compres: true });
        }
      );
    }
  }
};
