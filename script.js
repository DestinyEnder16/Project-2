// ======
const form = document.querySelector('.input-form');
const submitForm = document.querySelector('.form__btn');
const exercise = document.querySelector('#activity');
const duration = document.getElementById('time');
const label = document.querySelector('.label');
const inputType = document.getElementById('activity');
const sidebar = document.querySelector('.sidebar');
const trash = document.querySelectorAll('.trash');

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

const greenIcon = new L.Icon({
  iconUrl:
    'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const redIcon = new L.Icon({
  iconUrl:
    'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

let mapImage;
let coords;
let _polyline;

let weight;

const request = prompt(
  `Would you like to use an existing "weight" data (Yes or No)?`
);

if (request == 'NO' || request == 'no' || request == 'No') {
  for (let i = 0; i <= 5; i++) {
    weight = prompt('Please enter your weight.');
    if (+weight >= 25) {
      // Initializing the application
      alert('Weight has been saved into the database.');
      break;
    } else if (+weight < 25) {
      alert('Weight must be at least 25(kg).');
    } else {
      alert('Weight should be inputed as a number.');
    }

    if (i === 5) {
      alert('You have been temporarily suspended. Kindly reload the page.');
    }
  }

  (() => {
    // Put data into the local storage
    localStorage.setItem('weight', JSON.stringify(weight));
  })();
} else {
  weight = JSON.parse(localStorage.getItem('weight'));
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
  #mapZoom = 17;

  constructor() {
    this._loadMap();
    this.#deleteWorkout();
    this._submitForm();
    sidebar.addEventListener('click', this._moveToPopup.bind(this));

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

          L.tileLayer(
            'https://{s}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png',
            {
              maxZoom: 20,
              attribution:
                '&copy; OpenStreetMap France | &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            }
          ).addTo(mapImage);

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
        },
        error => {
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
      if (exercise.value == '') {
        alert('Activity not yet chosen.');
      } else {
        this._displayMarker();
        form.classList.add('hidden');
        exercise.disabled = true;
        this._formConfig();
      }

      // validating the form input.
      if (this.#secondCoords) {
        // if (!this._validateDuration(+duration.value)) {
        //   alert('Duration of exercise must be more than 1 minute.');
        // }
        if (exercise.value == '') {
          alert('Activity not yet chosen.');
        } else {
          this._displayMarker();
          this._drawPolyline();
          this._newWorkout();
          this._formConfig();
          // this._formConfig();

          const activty = exercise.value;

          // Resetting input fields
          exercise.value = duration.value = '';
          exercise.disabled = false;

          form.style.display = 'none';
          form.classList.add('hidden');

          this.#firstCoords = null;
          this.#secondCoords = null;
        }
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
      L.marker(workout.coords, { icon: redIcon })
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
    // drawing a polyline bbetween the two points
    _polyline = L.polyline([this.#firstCoords, this.#secondCoords], {
      color: 'orange',
    }).addTo(mapImage);

    // Also return the length between the two distances
    this.#length = mapImage.distance(this.#firstCoords, this.#secondCoords);
    console.log(this.#length);
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
                <span class="workout__value">${workout.speed.toFixed(2)}</span>
                <span class="workout__unit">km/h</span>
              </div>
              <div class="workout__details">
                <span class="workout__icon">🔥</span>
                <span class="workout__value">${(
                  (workout.met * 3.5 * weight) /
                  200
                ).toFixed(1)}</span>
                <span class="workout__unit">kcal/min</span>
              </div>

             
          </li>`;

    form.insertAdjacentHTML('afterend', html);
  }

  _moveToPopup(e) {
    const workoutEl = e.target.closest('.workout');
    // console.log(workoutEl.dataset.id);

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
        console.log(match);
        this.#workouts.splice(match, 1);

        // workoutTab.style.opacity = '0';
        // workoutTab.style.pointerEvents = 'none';
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
    console.log(this.#workouts);

    this.#workouts.forEach(work => {
      this._renderWorkout(work);
      this._displayMarker(work);
    });
  }

  // For resetting the local storage
  reset() {
    localStorage.removeItem('workout');
    location.reload();
  }
}

const app = new App();

// Implementing the workout object

// const cycle = new Cycling(
//   [
//     [6.34, 3.5],
//     [6.5, 3.2],
//   ],
//   1500,
//   10
// );
