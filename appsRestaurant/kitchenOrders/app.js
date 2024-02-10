module.exports = function init(site) {
  let app = {
    name: "kitchenOrders",
    allowRoute: true,
    allowRouteGet: true,
  };

  if (app.allowRoute) {
    if (app.allowRouteGet) {
      site.get(
        {
          name: app.name,
        },
        (req, res) => {
          res.render(
            app.name + "/index.html",
            {
              title: app.name,
              appName: "Kitchen Orders",
              setting: site.getCompanySetting(req),
            },
            { parser: "html", compres: true }
          );
        }
      );
    }
  }
};
