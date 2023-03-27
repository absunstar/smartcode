module.exports = function init(site) {
    let app = {
        name: 'salesCompaniesInvoices',
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
                    res.render(app.name + '/index.html', { title: app.name, appName: 'Sales Invoices For Companies', setting: site.getSystemSetting(req) }, { parser: 'html', compres: true });
                }
            );
        }
    }

    site.addApp(app);
};
