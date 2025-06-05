module.exports = function init(site) {
  let app = {
    name: "reportCustomerStatement",
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
          res.render(app.name + "/index.html", { title: app.name, appName: req.word("Report Customer Statement"), setting: site.getCompanySetting(req) }, { parser: "html", compres: true });
        }
      );
    }
  }

  site.post({ name: `/api/${app.name}/all`, require: { permissions: ["login"] } }, (req, res) => {
    let where = req.body.where || {};
    let search = req.body.search || "";
    let limit = req.body.limit || site.options.mongodb.limit;
    let select = req.body.select || { id: 1, code: 1, nameEn: 1, nameAr: 1, image: 1 };
    if (where && where.fromDate && where.toDate) {
      let d1 = site.toDate(where.fromDate);
      let d2 = site.toDate(where.toDate);
      d2.setDate(d2.getDate() + 1);
      where.date = {
        $gte: d1,
        $lte: d2,
      };
      delete where.fromDate;
      delete where.toDate;
    }

    where["company.id"] = site.getCompany(req).id;
    where["approved"] = true;
    if (where.customer && where.customer.id) {
      where["customer.id"] = where.customer.id;
      delete where.customer;
    }
    if (where.fromDate && where.toDate) {
      let d1 = site.toDate(where.fromDate);
      let d2 = site.toDate(where.toDate);
      d2.setDate(d2.getDate() + 1);
      where.date = {
        $gte: d1,
        $lte: d2,
      };
      delete where.fromDate;
      delete where.toDate;
    }

    site.getSalesInvoicesFilter({ ...where, hasReturnTransaction: { $ne: true } }, (salesInvoicesCb) => {
      site.getSalesInvoicesReturnPartsFilter({ ...where, hasReturnTransaction: { $ne: true } }, (salesInvoicesReturnPartsCb) => {
        let obj = {
          totalNet: 0,
          remainPaid: 0,
          amountPaid: 0,
          totalNetReturn: 0,
          remainPaidReturn: 0,
          amountPaidReturn: 0,
          totalNetInvoice: 0,
          remainPaidInvoice: 0,
          amountPaidInvoice: 0,
        };
        let list = [];

        for (let i = 0; i < salesInvoicesCb.length; i++) {
          let item = {
            type: {
              nameEn: "Invoice",
              nameAr: "فاتورة",
            },
            id: salesInvoicesCb[i].id,
            code: salesInvoicesCb[i].code,
            itemsList: salesInvoicesCb[i].itemsList,
            date: salesInvoicesCb[i].date,
            customer: salesInvoicesCb[i].customer,
            totalNet: salesInvoicesCb[i].totalNet || 0,
            remainPaid: salesInvoicesCb[i].remainPaid || 0,
            amountPaid: site.toNumber(salesInvoicesCb[i].totalNet || 0) - site.toNumber(salesInvoicesCb[i].remainPaid || 0),
          };
          obj.totalNet += site.toNumber(item.totalNet || 0);
          obj.remainPaid += site.toNumber(item.remainPaid || 0);
          obj.amountPaid += site.toNumber(item.amountPaid || 0);

          obj.totalNetInvoice += site.toNumber(item.totalNet || 0);
          obj.remainPaidInvoice += site.toNumber(item.remainPaid || 0);
          obj.amountPaidInvoice += site.toNumber(item.amountPaid || 0);

          list.unshift(item);
        }

        for (let i = 0; i < salesInvoicesReturnPartsCb.length; i++) {
          let item = {
            type: {
              nameEn: "Return Part",
              nameAr: "مرتجع جزئي",
            },
            id: salesInvoicesReturnPartsCb[i].id,
            code: salesInvoicesReturnPartsCb[i].code,
            itemsList: salesInvoicesReturnPartsCb[i].itemsList,
            date: salesInvoicesReturnPartsCb[i].date,
            customer: salesInvoicesReturnPartsCb[i].customer,
            totalNet: salesInvoicesReturnPartsCb[i].totalNet || 0,
            remainPaid: salesInvoicesReturnPartsCb[i].remainPaid || 0,
            amountPaid: site.toNumber(salesInvoicesReturnPartsCb[i].totalNet || 0) - site.toNumber(salesInvoicesReturnPartsCb[i].remainPaid || 0),
          };
          obj.totalNet -= site.toNumber(item.totalNet || 0);
          obj.remainPaid -= site.toNumber(item.remainPaid || 0);
          obj.amountPaid -= site.toNumber(item.amountPaid || 0);
          obj.totalNetReturn += site.toNumber(item.totalNet || 0);
          obj.remainPaidReturn += site.toNumber(item.remainPaid || 0);
          obj.amountPaidReturn += site.toNumber(item.amountPaid || 0);

          list.push(item);
        }

        res.json({ done: true, list: list, ...obj });
      });
    });
  });
};
