const navButtons = document.querySelectorAll('.navlink');
const submenuLists = document.querySelectorAll('.navlink .submenu');

function showAndHide(param) {
  document.querySelectorAll('.submenu').forEach((submenu) => {
    submenu.classList.remove('showSection');
    submenu.classList.add('hideSection');
  });

  if ((id = document.querySelector('#' + param))) {
    const submenuList = id.querySelector('.submenu');
    if (submenuList.classList.contains('hideSection')) {
      submenuList.classList.remove('hideSection');
      submenuList.classList.add('showSection');
    } else {
      submenuList.classList.remove('showSection');
    }
  }
}

document.addEventListener('click', () => {
  showAndHide();
});

const header = document.querySelector('header');
const menutoggle = document.querySelector('.menutoggle');

menutoggle.addEventListener('click', () => {
  if (header.classList.contains('showheader')) {
    header.classList.remove('showheader');
    header.classList.add('hideheader');
  } else {
    header.classList.add('showheader');
    header.classList.remove('hideheader');
  }
});

var urlPage = window.location.pathname;
var pageName = urlPage.split('/').pop();
var categoryName = urlPage.split('/')[2];
var PureName = pageName.split('.html')[0];
var pageSpaceName = PureName.replace(/([a-z])([A-Z])/g, '$1 $2');

console.log(urlPage);
console.log(pageName);
console.log(PureName);
console.log(categoryName);
if (urlPage === '/') {
  var categoryPage = (document.querySelector('.branchLink #currantCatogry').innerText = '/');
  var currantPage = (document.querySelector('.branchLink #currantPage').innerText = 'Main Dashboard');
} else {
  var categoryPage = (document.querySelector('.branchLink #currantCatogry').innerText = categoryName);
  var currantPage = (document.querySelector('.branchLink #currantPage').innerText = pageSpaceName);
}
