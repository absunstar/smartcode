module.exports = function init(site) {
    let app = {
        name: 'salesErInvoices',
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
                    res.render(app.name + '/index.html', { title: app.name, appName: req.word("Sales Invoices For ER"), setting: site.getCompanySetting(req) }, { parser: 'html', compres: true });
                }
            );
        }
    }

    site.addApp(app);
};
