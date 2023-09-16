module.exports = function init(site) {

  let collection_name = 'companies'

  let source = {
    En: 'company System',
    Ar: ' نظام الشركات'
  }

  let image_url = '/images/company.png'
  let add_message = {
    En: 'New company Added',
    Ar: 'تم إضافة شركة جديدة'
  }
  let update_message = {
    En: ' company Updated',
    Ar: 'تم تعديل شركة'
  }
  let delete_message = {
    En: ' company Deleted',
    Ar: 'تم حذف شركة '
  }


  site.on('mongodb after insert', function (result) {
    if (result.collection === collection_name) {
      site.call('please monitor action', {
        obj: {
          icon: image_url,
          source: source,
          message: add_message,
          value: {
            name: result.doc.nameAr,
            code: result.doc.code,
            En: result.doc.nameEn,
            Ar: result.doc.nameAr
          },
          add: result.doc,
          action: 'add'
        },
        result: result
      })
    }
  })

  site.on('mongodb after update', function (result) {
    if (result.collection === collection_name) {
      site.call('please monitor action', {
        obj: {
          icon: image_url,
          source: source,
          message: update_message,
          value: {
            name: result.old_doc.name,
            code: result.old_doc.code,
            En: result.old_doc.nameEn,
            Ar: result.old_doc.nameAr
          },
          update: site.objectDiff(result.update.$set, result.old_doc),
          action: 'update'
        },
        result: result
      })
    }
  })


  site.on('mongodb after delete', function (result) {
    if (result.collection === collection_name) {
      site.call('please monitor action', {
        obj: {
          icon: image_url,
          source: source,
          message: delete_message,
          value: {
            name: result.doc.nameAr,
            code: result.doc.code,
            En: result.doc.nameEn,
            Ar: result.doc.nameAr
          },
          delete: result.doc,
          action: 'delete'
        },
        result: result
      })
    }
  })

}