'use strict';

const moreInfo = document.querySelector('.request__info');
const info = document.querySelector('.info');

moreInfo.addEventListener('click', e => {
  e.preventDefault();
  info.classList.toggle('open');
});
