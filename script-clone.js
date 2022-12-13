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
    this.submitForm();
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

  submitForm() {
    submitForm.addEventListener('click', e => {
      e.preventDefault();
      // this.formConfig();
      if (exercise.value == '') {
        alert('Activity not yet chosen.');
      } else {
        this.displayMarker();
        form.classList.add('hidden');
        exercise.disabled = true;
        this.formConfig();
      }

      // validating the form input.
      if (this.#secondCoords) {
        // if (!this._validateDuration(+duration.value)) {
        //   alert('Duration of exercise must be more than 1 minute.');
        // }
        if (exercise.value == '') {
          alert('Activity not yet chosen.');
        } else {
          form.classList.add('hidden');
          this.displayMarker();
          this.formConfig();

          this.drawPolyline();
          // this.formConfig();

          const activty = exercise.value;
          console.log(activty);

          // Resetting input fields
          exercise.value = duration.value = '';
          exercise.disabled = false;

          this.#firstCoords = null;
        }
      }
    });
  }

  _validateDuration(dur) {
    if (dur < 1 || dur == '') return false;
    if (dur > 1) return true;
  }

  displayMarker(coords) {
    //
    const { lat, lng } = this.mapEvent.latlng;
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
          }).setContent('Hello there!')
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
          }).setContent('Hey there!')
        );
    }
  }

  drawPolyline() {
    //
    const { lat, lng } = this.mapEvent.latlng;
    // drawing a polyline bbetween the two points
    _polyline = L.polyline([this.#firstCoords, this.#secondCoords], {
      color: 'rgb(230,190,0)',
    }).addTo(mapImage);

    // Also return the length between the two distances
    this.#length = mapImage.distance(this.#firstCoords, this.#secondCoords);
    console.log(this.#length);

    // resetting the second co-ordinate & assigning new coords for the first coord
    this.#secondCoords = null;
  }

  formConfig() {
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
      form.style.gridTemplateColumns = '1fr 1fr';
      exercise.disabled = true;
      submitForm.style.gridColumn = '1 / -1';
    }
  }
}

// const app = new App();

// Implementing the workout object

class Workout {
  _MET;
  date = new Date();
  id = Date.now() + ''.slice(-10);

  constructor(coords, distance, duration) {
    this.coords = coords; // [lat, lng]
    this.distance = distance; // in m
    this.duration = duration; // in min
    this.speed = this.distance / 1000 / (this.duration / 60); // km/h
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
    if (this.speed >= 5 && this.speed < 9) {
      this._MET = 6.0;
    } else if (this.speed >= 9) {
      this._MET = 8.0;
    } else {
      this._MET = 4.0;
    }
  }
}

const cycle = new Cycling(
  [
    [6.34, 3.5],
    [6.5, 3.2],
  ],
  1500,
  10
);
console.log(cycle);
