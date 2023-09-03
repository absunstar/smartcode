const daysTag = document.querySelector('.days'),
  currentDate = document.querySelector('.current-date'),
  prevNextIcon = document.querySelectorAll('.icons span');

let date = new Date(),
  currYear = date.getFullYear(),
  currMonth = date.getMonth();

const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const renderCalendar = () => {
  let firstDayofMonth = new Date(currYear, currMonth, 1).getDay(),
    lastDateofMonth = new Date(currYear, currMonth + 1, 0).getDate(),
    lastDayofMonth = new Date(currYear, currMonth, lastDateofMonth).getDay(),
    lastDateofLastMonth = new Date(currYear, currMonth, 0).getDate();
  let liTag = '';

  for (let i = firstDayofMonth; i > 0; i--) {
    liTag += `<li class="day inactive">${lastDateofLastMonth - i + 1}</li>`;
  }

  for (let i = 1; i <= lastDateofMonth; i++) {
    let isToday = i === date.getDate() && currMonth === new Date().getMonth() && currYear === new Date().getFullYear() ? ' active' : '';
    liTag += `<li class="day${isToday}"  month="${currMonth}" year="${currYear}" day="${i}">${i}</li>`;
  }

  for (let i = lastDayofMonth; i < 6; i++) {
    liTag += `<li class="day inactive">${i - lastDayofMonth + 1}</li>`;
  }
  currentDate.innerText = `${months[currMonth]} ${currYear}`;
  daysTag.innerHTML = liTag;

  const daysButtons = document.querySelectorAll('.day');

  daysButtons.forEach((daysButton) => {
    daysButton.addEventListener('click', (e) => {
      let $scope = angular.element(document.querySelector('#main-layout')).scope();
      let day = e.target.getAttribute('day');
      let month = e.target.getAttribute('month');
      let year = e.target.getAttribute('year');

      $scope.getDoctorAppointmentsViewList({ day: day, month: month, year: year });
      const AppointmentCalenderPopup = document.querySelector('.AppointmentCalenderPopup');
      AppointmentCalenderPopup.classList.add('showElement');
      const body = document.querySelector('body');
      body.classList.add('my-body-noscroll-class');
      const popupOverlay = document.querySelector('.popupOverlay');
      popupOverlay.classList.add('showOverlay');
    });
  });

  let calenderDays = document.querySelectorAll('li.day');
  calenderDays.forEach((calenderDay) => {
    let calenderDayNumber = calenderDay.innerText;
    calenderDay.addEventListener('click', () => {
      selectedDate = `${calenderDayNumber}-${months[currMonth]}-${currYear}`;
    });
  });
};

if (currentDate) {
  renderCalendar();
}

if (prevNextIcon) {
  prevNextIcon.forEach((icon) => {
    icon.addEventListener('click', () => {
      currMonth = icon.id === 'prev' ? currMonth - 1 : currMonth + 1;

      if (currMonth < 0 || currMonth > 11) {
        date = new Date(currYear, currMonth, new Date().getDate());
        currYear = date.getFullYear();
        currMonth = date.getMonth();
      } else {
        date = new Date();
      }
      renderCalendar();
    });
  });
}
