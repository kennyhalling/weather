//Declare variables
const currentWeather = document.querySelector('#current-weather');
const iconBox = document.querySelector('#icon-box');
const currentTemp = document.querySelector('#current-temp');
const weatherIcon = document.querySelector('#weather-icon');
const captionDesc = document.querySelector('figcaption');
const locationName = document.querySelector('#location');
const form = document.querySelector('#location-form');
const cityInput = document.querySelector('#city');
const suggestionsList = document.querySelector('#suggestions');
const forecastSection = document.querySelector('#forecast-section');
const toggleBtn = document.querySelector('#toggle-forecast');
const apiKey = '19bb8e801e1d5dcf4e4da47697f3cdc4';

let forecastVisible = false;

//Default to showing the user the weather for their current location
window.addEventListener('load', () => {
    //Check if user has geolocation to fetch default weather data
    if ('geolocation' in navigator) {
        //Get user location
        navigator.geolocation.getCurrentPosition(
            position => {
                const { latitude, longitude } = position.coords;
                console.log(`User location: ${latitude}, ${longitude}`);
                //Get weather data based on user's city
                getCityName(latitude, longitude).then(cityLabel => {
                    apiFetch(latitude, longitude, cityLabel);
                    fetchForecast(latitude, longitude);
                });
            },
            error => {
                console.warn('Geolocation permission denied or failed', error);
            }
        );
    }
    else {
        console.warn('Geolocation is not supported by this browser.');
    }
})

//Take the user's input in the city input box and show them a list of cities that match what they type. Allow them to click on the city in the list
//  that they are trying to get weather info for. Then change the display to show weather/forecasts based on the city the user chose.
cityInput.addEventListener('input', async () => {
    //Store what the user typed into the query bar
    const query = cityInput.value.trim();
    suggestionsList.innerHTML = '';

    if (query.length < 3) return;

    //Use API to get list of cities with available weather data
    const geoURL = `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(query)}&limit=5&appid=${apiKey}`;

    //If the fetch fails, handle the exception by throwing and error to the website console
    try {
        const response = await fetch(geoURL);
        const cities = await response.json();

        suggestionsList.innerHTML = '';
        
        const seen = new Set();
        //Generate suggestions list of cities the user can choose from, ensuring they get the weather data they are looking for
        cities.forEach(city => {
            const identifier = `${city.name}, ${city.state}, ${city.country}`;
            if (!seen.has(identifier)) {
                seen.add(identifier)
                const label = `${city.name}, ${city.state}, ${city.country}`;
                const item = document.createElement('li');
                item.textContent = label;
                item.style.cursor = 'pointer';
                item.style.padding = '4px';

                //Fetch the weather data for the city the user clicks on in the suggestion list
                item.addEventListener('click', () => {
                    apiFetch(city.lat, city.lon, label);
                    fetchForecast(city.lat, city.lon);
                    suggestionsList.innerHTML = '';
                    cityInput.value = '';
                });
    
                suggestionsList.appendChild(item);
            }
        })
    }
    catch (error) {
        console.error('Geocoding error:', error);
    }
});

form.addEventListener('submit', event => {
    event.preventDefault();
    suggestionsList.innerHTML = '';
});

//All functions that fetch data from APIs have the ability to handle exceptions by virtue of the "try/catch" setup. If an API fetch fails, an error is
// to the website's console.

//API call to get basic weather data for a city that the user enters
async function apiFetch(lat, lon, locationLabel){
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=imperial&appid=${apiKey}`;

    try{
        const response = await fetch(url);
        if (response.ok){
            const data = await response.json();
            console.log(data);
            displayResults(data, locationLabel);
        }
        else{
            throw new Error('Weather data not available');
        }
    }
    catch (error){
        console.error('Weather fetch error:', error);
    }
}

//API call to get the name of the city the user is currently in
async function getCityName(lat, lon) {
    const geoReverseUrl = `https://api.openweathermap.org/geo/1.0/reverse?lat=${lat}&lon=${lon}&limit=1&appid=${apiKey}`;
    try {
        const response = await fetch(geoReverseUrl);
        if (response.ok) {
            const [data] = await response.json();
            if (data) {
                return `${data.name}, ${data.state || ''}, ${data.country}`.replace(/,\s+,/, ',');
            }
        }
        return 'Your Location';
    }
    catch (error) {
        console.error('Reverse geocoding error:', error);
        return 'Your Location';
    }
}

//API call to get 7-day forecast data
async function fetchForecast(lat, lon) {
    const forecastUrl = `https://api.openweathermap.org/data/3.0/onecall?lat=${lat}&lon=${lon}&exclude=minutely,hourly,alerts&units=imperial&appid=${apiKey}`;

    try {
        const response = await fetch(forecastUrl);
        if (response.ok){
            const data = await response.json();
            console.log(data);
            forecastSection.innerHTML = '';
            forecastVisible = false;
            toggleBtn.textContent = '7-Day Forecast';
            console.log('Forecast button should be visible');
            toggleBtn.style.display = 'inline-block';

            toggleBtn.onclick = () => toggleForecast(data.daily.slice(0, 7));
        }
        else{
            throw new Error('Forecast fetch failed');
        }
    }
    catch (error){
        console.error('Forecast fetch error:', error.message || error);
    }
}

//Function to allow user to toggle between current weather data and a 7-Day forecast
function toggleForecast(forecastData) {
    forecastSection.innerHTML = '';
    forecastVisible = !forecastVisible;
    toggleBtn.textContent = forecastVisible ? 'Current Weather' : '7-Day Forecast';

    if (forecastVisible) {
        const container = document.createElement('div');
        container.style.display = 'grid';
        container.style.gridTemplateColumns = 'repeat(auto-fit, minmax(120px, 1fr))';
        container.style.gap = '10px';

        renderForecast(forecastData, 0, container);
        forecastSection.appendChild(container);

        document.querySelector('#current-weather').style.display = 'none';

    }
    else{
        document.querySelector('#current-weather').style.display = '';
    }
}

//Function to recursively render a 7-Day weather forecast
function renderForecast(days, index, container) {
    if (index >= days.length) return;

    //Dynamically create a DOM element ('div' as stored in the card variable) to store the forecast for a single day. Apply CSS styling to make it look
    // nicer.
    const day = days[index];
    const card = document.createElement('div');
    card.style.border = '1px solid #ccc';
    card.style.borderRadius = '10px';
    card.style.padding = '10px';
    card.style.textAlign = 'center';
    card.style.backgroundColor = '#f9f9f9';

    const date = new Date(day.dt * 1000);
    const dayName = date.toLocaleDateString('en-US', { weekday: 'short'});

    const icon = document.createElement('img');
    icon.src = `https://openweathermap.org/img/wn/${day.weather[0].icon}@2x.png`;
    icon.alt = day.weather[0].description;

    const temp = document.createElement('p');
    temp.textContent = `Temp: ${Math.round(day.temp.day)} °F`;

    const title = document.createElement('h4');
    title.textContent = dayName;

    card.appendChild(title);
    card.appendChild(icon);
    card.appendChild(temp);

    container.appendChild(card);

    //Recursive call
    renderForecast(days, index +1, container)
}

//Display the current weather data
function displayResults(data, labelOverride = null){
    currentTemp.innerHTML = `${Math.round(data.main.temp)}&deg;F`;
    const iconsrc = `https://openweathermap.org/img/w/${data.weather[0].icon}.png`;
    const desc = data.weather[0].description;

    weatherIcon.setAttribute('src', iconsrc);
    weatherIcon.setAttribute('alt', desc);
    captionDesc.textContent = desc;
    locationName.textContent = `${labelOverride}` || `${data.name}, ${data.sys.country}`;

    document.querySelector('#current-wind').textContent = `Wind Speed: ${data.wind.speed} mph`;
    document.querySelector('#current-humidity').textContent = `Humidity: ${data.main.humidity}%`;
}