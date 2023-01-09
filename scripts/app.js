'use strict';

// ======

// For the App
const nav = document.querySelector('.form-btn');
const menu = document.querySelector('.menu');
const menuLine = document.querySelector('.menu__line');
const form = document.querySelector('.input-form');
const submitForm = document.querySelector('.form__btn');
const exercise = document.querySelector('#activity');
const duration = document.querySelector('#time');
const label = document.querySelector('.label');
const inputType = document.getElementById('activity');
const sidebar = document.querySelector('.sidebar');
const trash = document.querySelectorAll('.trash');

const clearData = document.querySelector('.clear-data');

const notification = document.querySelector('.notification-bar');
const notificationText = document.querySelector('.notification-bar__text');
const formWeight = document.querySelector('#weight');
const notificationBtn = document.querySelector('.notification-button');
const formWeightBtn = document.querySelector('.notification-bar__form__submit');

// IMPORTANT PROBLEM
// Users are mistrustful of or confused by sites that request their location without context.
// Consider tying the request to a user action instead.

menu.addEventListener('click', function () {
  menuLine.classList.toggle('open');

  sidebar.classList.toggle('open');
});

const months = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

let workout;

let greenIcon, redIcon;

let mapImage;
let coords;
let _polyline;

let weight;

// Retrieve the weight from localStorage
if (localStorage.getItem('weight') !== null) {
  weight = JSON.parse(localStorage.getItem('weight'));
  formWeight.value = weight;
  alert('Weight retrieved from database.');
}

// Validate imputed date.
function validWeight(kg) {
  if (kg >= 25 && kg <= 635) {
    if (localStorage.getItem('weight') === null) {
      // If the weight does not exists
      (() => {
        // Put data into the local storage
        weight = kg;
        localStorage.setItem('weight', JSON.stringify(weight));
        alert('Weight saved into database.');
      })();
    }

    formWeight.disabled = true;
    formWeightBtn.disabled = true;
  } else {
    alert('Weight not in correct format.');
    formWeight.value = '';
  }
}

class Workout {
  met;
  date = new Date();
  id = Date.now() + ''.slice(-10);

  weight = weight;

  constructor(coords, distance, duration) {
    this.coords = coords; // [lat, lng]
    this.distance = distance; // in m
    this.duration = duration; // in min
  }
}

class Running extends Workout {
  type = 'running';
  constructor(coords, distance, duration) {
    super(coords, distance, duration);
    this.speed = this.distance / 1000 / (this.duration / 60); // km/h

    if (this.speed >= 9) {
      this.met = 8.8;
    }
    if (this.speed >= 4.8 && this.speed < 9) {
      this.met = 7;
    } else {
      this.met = 5;
    }

    this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${
      months[this.date.getMonth()]
    } ${this.date.getDate()}`;

    // // Calories calculation
    this.calories = 200;
  }
}

class Cycling extends Workout {
  type = 'cycling';

  constructor(coords, distance, duration) {
    super(coords, distance, duration);
    this.speed = this.distance / 1000 / (this.duration / 60); // km/h

    this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${
      months[this.date.getMonth()]
    } ${this.date.getDate()}`;

    if (this.speed >= 15 && this.speed <= 20) {
      this.met = 5.8;
    }
    if (this.speed < 15 && this.speed >= 8) {
      this.met = 4.5;
    }
    if (this.speed > 20) {
      this.met = 12;
    } else {
      this.met = 4;
    }
  }
}

class App {
  mapEvent;
  #firstCoords;
  #secondCoords;
  #length;
  #workouts = [];
  #mapZoom = 15;

  constructor() {
    // Open the notification panel

    notification.classList.add('open');
    this.#deleteWorkout();
    this._submitForm();
    sidebar.addEventListener('click', this._moveToPopup.bind(this));
    notificationBtn.addEventListener('click', e => {
      if (+formWeight.value >= 25 && +formWeight.value <= 635) {
        notificationBtn.classList.add('hidden');
        this._loadMap();
        notificationText.textContent =
          'Click on a point on the map to start tracking your activity.';
      } else {
        formWeight.focus();
        notificationText.textContent =
          'Please enter a valid value for your weight';
      }
    });

    formWeightBtn.addEventListener('click', e => {
      e.preventDefault();
      validWeight(+formWeight.value);
    });
    // this._getLocalStorage();
  }

  _loadMap() {
    //

    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        position => {
          const { latitude, longitude } = position.coords;
          coords = [latitude, longitude];
          mapImage = L.map('map').setView(coords, this.#mapZoom);

          L.tileLayer('https://{s}.tile.openstreetmap.de/{z}/{x}/{y}.png', {
            maxZoom: 18,
            attribution:
              '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          }).addTo(mapImage);

          L.marker(coords)
            .addTo(mapImage)
            .bindPopup(
              L.popup({
                autoClose: true,
                closeOnClick: false,
                maxWidth: 200,
                minWidth: 50,
                className: 'location',
              }).setContent('Current Location.')
            )
            .openPopup();

          // Assign icon colors

          greenIcon = new L.Icon({
            iconUrl:
              'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
            shadowUrl:
              'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowSize: [41, 41],
          });

          redIcon = new L.Icon({
            iconUrl:
              'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
            shadowUrl:
              'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowSize: [41, 41],
          });

          // load the data from the local storage
          this._getLocalStorage();
          this._displayMarker();

          mapImage.on('click', e => {
            this.mapEvent = e;
            form.style.display = 'grid';

            setTimeout(() => {
              form.classList.remove('hidden');
            }, 500);
            exercise.focus();

            if (this.#firstCoords) {
              duration.focus();
            }

            // const coords = [lat,lng]
          });

          mapImage.on('click', function (e) {
            sidebar.classList.add('open');
          });
        },
        error => {
          alert('Please enable your location');
          console.log(`Error ${error.code} -> ${error.message}`);
        }
      );

      duration.style.display = 'none';
      label.style.display = 'none';
      submitForm.style.height = '100%';
      form.style.gridTemplateColumns = '1fr';
    }
  }

  _submitForm() {
    submitForm.addEventListener('click', e => {
      e.preventDefault();
      // this._formConfig();

      if (!this.#secondCoords) {
        if (exercise.value == '') {
          exercise.style.outline = '2px solid #d22';
          exercise.focus();
        } else {
          exercise.style.outline = 'none';

          this._displayMarker();
          form.classList.add('hidden');
          exercise.disabled = true;
          this._formConfig();

          // removing the sidebar
          sidebar.classList.remove('open');
        }
      }

      // validating the form input.
      if (this.#secondCoords) {
        this._displayMarker();
        this._drawPolyline();
        this._newWorkout();
        this._formConfig();

        // removing the sidebar
        sidebar.classList.remove('open');
        // this._formConfig();

        // Resetting input fields
        exercise.value = duration.value = '';
        exercise.disabled = false;

        form.style.display = 'none';
        form.classList.add('hidden');

        this.#firstCoords = null;
        this.#secondCoords = null;
      }
    });
  }

  _validateDuration(dur) {
    if (dur < 1 || dur == '') return false;
    if (dur > 1) return true;
  }

  _displayMarker(workout = null) {
    //

    if (workout != null) {
      L.marker(workout.coords)
        .addTo(mapImage)
        .bindPopup(
          L.popup({
            autoClose: false,
            closeOnClick: false,
            maxWidth: 200,
            minWidth: 50,
            className: `running-popup`,
          }).setContent(
            `${
              workout.type == 'running'
                ? 'Running Exercise'
                : 'Cycling Exercise'
            }`
          )
        );
    } else if (this.mapEvent) {
      const { lat, lng } = this.mapEvent?.latlng;
      if (!this.#firstCoords) {
        this.#firstCoords = [lat, lng];

        // Display marker on first co-ordinate
        L.marker(this.#firstCoords, { icon: greenIcon })
          .addTo(mapImage)
          .bindPopup(
            L.popup({
              autoClose: false,
              closeOnClick: false,
              maxWidth: 200,
              minWidth: 50,
              className: 'running-popup',
            }).setContent(
              `${
                exercise.value == 'running'
                  ? 'Running Exercise'
                  : 'Cycling Exercise'
              }`
            )
          )
          .openPopup();
      } else if (!this.#secondCoords) {
        this.#secondCoords = [lat, lng];
        // Adding marker to the second co-ordinate
        L.marker(this.#secondCoords, { icon: redIcon })
          .addTo(mapImage)
          .bindPopup(
            L.popup({
              autoClose: false,
              closeOnClick: false,
              maxWidth: 200,
              minWidth: 50,
              className: 'cycling-popup',
            }).setContent(
              `${
                exercise.value == 'running'
                  ? 'Running Exercise End'
                  : 'Cycling Exercise End'
              }`
            )
          );
      }
    }
  }

  _drawPolyline() {
    //
    // drawing a polyline between the two points
    _polyline = L.polyline([this.#firstCoords, this.#secondCoords], {
      color: 'orange',
    }).addTo(mapImage);

    // Also return the length between the two distances
    this.#length = mapImage.distance(this.#firstCoords, this.#secondCoords);
  }

  _formConfig() {
    // if the user has clicked twice
    if (this.#secondCoords) {
      duration.style.display = 'none';
      label.style.display = 'none';
      submitForm.style.height = '100%';
      form.style.gridTemplateColumns = '1fr';
    } else {
      duration.style.display = 'block';
      label.style.display = 'block';
      submitForm.style.height = '100%';
      // form.style.gridTemplateColumns = '1fr 1fr';
      exercise.disabled = true;
      submitForm.style.gridColumn = '1 / -1';
    }
  }

  // Create new workout
  _newWorkout() {
    const workoutActivity = exercise.value;
    const workoutTime = +duration.value;

    if (workoutActivity === 'running') {
      workout = new Running(this.#secondCoords, this.#length, workoutTime);
      this.#workouts.push(workout);
      this._renderWorkout(workout);
    }
    if (workoutActivity === 'cycling') {
      workout = new Cycling(this.#secondCoords, this.#length, workoutTime);
      this.#workouts.push(workout);
      this._renderWorkout(workout);
    }
    this._setLocalStorage();
  }

  // Render new workout to list
  _renderWorkout(workout) {
    let html = `<li class="workout workout--${workout.type}" id="a${
      workout.id
    }" data-id="${workout.id}">
            <div class="workout-header">
            <h2 class="workout__title">${workout.description}</h2>
             <div>
                  <span class="trash"><ion-icon name="trash-outline"></ion-icon></span>        
              </div>
            </div>
            <div class="workout-features">
              <div class="workout__details">
                <span class="workout__icon">${
                  workout.type == 'running' ? '🏃‍♂️' : '🚴‍♂️'
                }</span>
                <span class="workout__value">${(
                  workout.distance / 1000
                ).toFixed(1)}</span>
                <span class="workout__unit">km</span>
              </div>
              <div class="workout__details">
                <span class="workout__icon">⏰</span>
                <span class="workout__value">${workout.duration}</span>
                <span class="workout__unit">min</span>
              </div>
              <div class="workout__details">
                <span class="workout__icon">⚡️</span>
                <span class="workout__value">${workout.speed?.toFixed(2)}</span>
                <span class="workout__unit">km/h</span>
              </div>
              <div class="workout__details">
                <span class="workout__icon">🔥</span>
                <span class="workout__value">${
                  // prettier-ignore
                  (workout.duration *((workout.met * 3.5 * weight) /200)).toFixed(1)
                }</span>
                <span class="workout__unit">cal</span>
              </div>

             
          </li>`;

    form.insertAdjacentHTML('afterend', html);
  }

  _moveToPopup(e) {
    const workoutEl = e.target.closest('.workout');

    if (!workoutEl) return;

    const workout = this.#workouts.find(work => {
      return work.id === workoutEl.dataset.id;
    });

    if (workout) {
      mapImage.setView(workout.coords, this.#mapZoom, {
        animate: true,
        pan: {
          duration: 1,
        },
      });

      sidebar.classList.remove('open');
    }
  }

  #deleteWorkout() {
    let iconWork, match, workoutTab;
    sidebar.addEventListener('click', e => {
      iconWork = e.target.closest('.trash')?.closest('.workout');
      if (iconWork) {
        workoutTab = document.querySelector(`#a${iconWork.dataset.id}`);
        match = this.#workouts.findIndex(workout => {
          return workout.id === iconWork.dataset.id;
        });
        this.#workouts.splice(match, 1);

        workoutTab.style.display = 'none';

        this._setLocalStorage();
      }
    });
  }

  #deletePopups() {}

  // Put the data into the local storage
  _setLocalStorage() {
    localStorage.setItem('workout', JSON.stringify(this.#workouts));
  }

  _getLocalStorage() {
    const data = JSON.parse(localStorage.getItem('workout'));

    if (!data) return;

    this.#workouts = data;

    this.#workouts.forEach(work => {
      this._renderWorkout(work);
      this._displayMarker(work);
    });
  }

  // For resetting the local storage
  reset() {
    localStorage.removeItem('workout');
    localStorage.removeItem('weight');
    location.reload();
  }
}

const app = new App();

// Erase data.
clearData.addEventListener('click', e => {
  const reply = confirm(
    'This will delete your weight, workout history and markers.'
  );
  if (reply === true) {
    app.reset();
  }
});

// To confirm the user's exit.
window.addEventListener('beforeunload', event => {
  // do something
  event.preventDefault();
  event.returnValue = '';
});
