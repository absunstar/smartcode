let closeButtons = document.querySelectorAll('.closeAction')
closeButtons.forEach((closeButton) => {
    closeButton.addEventListener('click', () => {
        const popupWindows = document.querySelectorAll('.popupWindow')
        const body = document.querySelector('body')
        body.classList.remove('my-body-noscroll-class')
        popupWindows.forEach((popupWindow) => {
            popupWindow.classList.remove('showElement')
            const popupOverlay = document.querySelector('.popupOverlay')
            popupOverlay.classList.remove('showOverlay')
        });
    });
});