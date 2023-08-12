const navButtons = document.querySelectorAll('.navlink');
const submenuLists = document.querySelectorAll('.navlink .submenu');

var menuBusy = false;
function showAndHide(param) {
  if (menuBusy) {
    return;
  }
  menuBusy = true;
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
  setTimeout(() => {
    menuBusy = false;
  }, 250);
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
