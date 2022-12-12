// ======
const form = document.querySelector('.input-form');
const submitForm = document.querySelector('.form__btn');
const exercise = document.querySelector('#activity');
const duration = document.getElementById('time');
const label = document.querySelector('.label');
const inputType = document.getElementById('activity');

// let weight = prompt('Please enter your weight.');

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
// let mapEvent;
let coords;
let _polyline;

class App {
  mapEvent;
  #firstCoords;
  #secondCoords;
  #length;
  #workouts = [];

  constructor() {
    this.loadMap();
    this.displayForm();
  }

  loadMap() {
    //

    if ('geolocation' in navigator) {
      console.log('Geolocation present!');
      navigator.geolocation.getCurrentPosition(
        position => {
          console.log(position);
          const { latitude, longitude } = position.coords;
          coords = [latitude, longitude];
          console.log(latitude, longitude);
          mapImage = L.map('map').setView(coords, 17);

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
                autoClose: false,
                closeOnClick: false,
                maxWidth: 200,
                minWidth: 50,
                className: 'location',
              }).setContent('Current Location.')
            )
            .openPopup();

          mapImage.on('click', e => {
            this.mapEvent = e;
            form.classList.remove('hidden');
            exercise.focus();

            if (this.#firstCoords && this.#secondCoords) {
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

  displayForm() {
    submitForm.addEventListener('click', e => {
      e.preventDefault();
      this.formConfig();

      // validating the form input.
      if (this.#firstCoords) {
        this.displayMarker();
      } else if (this.#secondCoords) {
        if (!this._validateDuration(+duration.value)) {
          alert('Duration of exercise must be more than 1 minute.');
        } else if (exercise.value == '') {
          alert('Activity not yet chosen.');
        } else {
          form.classList.add('hidden');
          this.displayMarker();
          this.drawPolyline();
          this.formConfig();

          const activty = exercise.value;
          console.log(activty);

          // Resetting input fields
          exercise.value = duration.value = '';
        }
      }
    });
  }

  _validateDuration(dur) {
    if (dur < 1 || dur == '') return false;
    if (dur > 1) return true;
  }

  formConfig() {
    // if the user has clicked once
    const { lat, lng } = this.mapEvent.latlng;

    // if the user has clicked once, but not twice
    if (this.#firstCoords && !this.#secondCoords) {
      duration.style.display = 'block';
      exercise.disabled = false;
      label.style.display = 'block';

      form.style.gridTemplateColumns = '1fr 1fr';
      submitForm.style.height = '100%';
      submitForm.style.gridColumn = '1 / -1';
    }
    // When the user has already clicked twice - specifying a workout already.
    else {
      // Re-assigning the first co-ordinate
      this.#firstCoords = [lat, lng];

      duration.style.display = 'block';
      label.style.display = 'block';
      submitForm.style.height = '100%';
      form.style.gridTemplateColumns = '1fr 1fr';
      exercise.disabled = true;

      // Removing the second co-ordinate
      this.#secondCoords = null;
    }
  }

  displayMarker() {
    //
    const { lat, lng } = this.mapEvent.latlng;
    if (!this.#firstCoords) {
      this.#firstCoords = [lat, lng];

      // Display marker on first co-ordinate
      L.marker(this.#firstCoords, { icon: redIcon })
        .addTo(mapImage)
        .bindPopup(
          L.popup({
            autoClose: false,
            closeOnClick: false,
            maxWidth: 200,
            minWidth: 50,
            className: 'running-popup',
          }).setContent('Hello there!')
        )
        .openPopup();
    } else if (!this.#secondCoords) {
      this.#secondCoords = [lat, lng];
      // Adding marker to the second co-ordinate
      L.marker(this.#secondCoords, { icon: greenIcon })
        .addTo(mapImage)
        .bindPopup(
          L.popup({
            autoClose: false,
            closeOnClick: false,
            maxWidth: 200,
            minWidth: 50,
            className: 'cycling-popup',
          }).setContent('Hey there!')
        );
    } else {
      // Display marker on first co-ordinate
      L.marker(this.#firstCoords, { icon: redIcon })
        .addTo(mapImage)
        .bindPopup(
          L.popup({
            autoClose: false,
            closeOnClick: false,
            maxWidth: 200,
            minWidth: 50,
            className: 'running-popup',
          }).setContent('Hello there!')
        )
        .openPopup();
      // this.#secondCoords = null;
    }
  }

  drawPolyline() {
    //
    // drawing a polyline bbetween the two points
    _polyline = L.polyline([this.#firstCoords, this.#secondCoords], {
      color: 'rgb(200,150,20)',
    }).addTo(mapImage);

    // Also return the length between the two distances
    this.#length = mapImage.distance(this.#firstCoords, this.#secondCoords);
    console.log(this.#length);
  }

  _newWorkOut(e) {
    // Get data from the form
    const type = inputType.value;
    let workout;

    // If workout = 'running', then create a 'Running' object.
    if (type == 'running') {
      if (this._validateDuration) {
        workout = new Running(
          [this.#firstCoords, this.#secondCoords],
          +this.#length,
          +duration.value
        );
        this.#workouts.push(workout);
        console.log(this.#workouts);
      }
    }

    // If workout = 'cycling', then create a 'Cycling' object
    if (type == 'cycling') {
      if (this._validateDuration) {
        workout = new Cycling(
          [this.#firstCoords, this.#secondCoords],
          +this.#length,
          +duration.value
        );
        this.#workouts.push(workout);
        console.log(this.#workouts);
      }
    }
  }
}

let app = new App();

// Prompt for user's age
// for (let i = 1; i <= 10; i++) {
//   console.log('Hello');
//   if (+weight >= 25) {
//     // Initializing the class if weight meets the requirements
//     app = new App();
//     break;
//   } else if (i === 5) {
//     // Suspend the user after 5 attempts
//     alert('You have been suspended. Refresh page.');
//     break;
//   } else {
//     // Request weight if initail value is wrong
//     alert('Users must at least have a weight above 25kg');
//     weight = prompt('Please enter your weight.');
//   }
// }

class Workout {
  _MET;
  date = new Date();
  id = Date.now() + ''.slice(-10);

  constructor(coords, distance, duration) {
    this.coords = coords; // [lat, lng]
    this.distance = distance; // in m
    this.duration = duration; // in min
    this.speed = this.distance / 1000 / (this.duration / 60);
  }
}

class Running extends Workout {
  type = 'running';
  constructor(coords, distance, duration) {
    super(coords, distance, duration);
    this._MET = 4;
  }
}

class Cycling extends Workout {
  type = 'cycling';
  constructor(coords, distance, duration) {
    super(coords, distance, duration);
    this._MET = 6.0;
  }
}

const cycle = new Cycling(150, 20);
