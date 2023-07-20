if ((createButton = document.querySelector('.create a p'))) {
  createButton.addEventListener('click', () => {
    const popupOverlay = document.querySelector('.popupOverlay');
    popupOverlay.classList.add('showOverlay');
    const addNewPopupWindow = document.querySelector('#addNew');
    addNewPopupWindow.classList.add('showElement');
    const body = document.querySelector('body');
    body.classList.add('my-body-noscroll-class');
  });
}
