document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('city-search');
    const searchDropdown = document.getElementById('search-dropdown');
    const currentDateEl = document.getElementById('current-date');
    
    // Elements to update
    const currentTempEl = document.getElementById('current-temp');
    const currentConditionEl = document.getElementById('current-condition');
    const currentWindEl = document.getElementById('current-wind');
    const currentHumidityEl = document.getElementById('current-humidity');
    const forecastListEl = document.getElementById('forecast-list');
    
    // Default City (Brooklyn, NYC)
    let currentCity = { name: "Brooklyn, New York, USA", lat: 40.6501, lon: -73.9496, timezone: "America/New_York" };

    // WMO Weather interpretation codes
    const wmoMap = {
        0: { text: "Clear Sky", icon: "sunny" },
        1: { text: "Mainly Clear", icon: "sunny" },
        2: { text: "Partly Cloudy", icon: "cloudy" },
        3: { text: "Overcast", icon: "cloudy" },
        45: { text: "Fog", icon: "cloudy" },
        48: { text: "Depositing Rime Fog", icon: "cloudy" },
        51: { text: "Light Drizzle", icon: "rain" },
        53: { text: "Moderate Drizzle", icon: "rain" },
        55: { text: "Dense Drizzle", icon: "rain" },
        56: { text: "Light Freezing Drizzle", icon: "snow" },
        57: { text: "Dense Freezing Drizzle", icon: "snow" },
        61: { text: "Slight Rain", icon: "rain" },
        63: { text: "Moderate Rain", icon: "rain" },
        65: { text: "Heavy Rain", icon: "rain-heavy" },
        66: { text: "Light Freezing Rain", icon: "snow" },
        67: { text: "Heavy Freezing Rain", icon: "snow" },
        71: { text: "Slight Snow Fall", icon: "snow" },
        73: { text: "Moderate Snow Fall", icon: "snow" },
        75: { text: "Heavy Snow Fall", icon: "snow" },
        77: { text: "Snow Grains", icon: "snow" },
        80: { text: "Slight Rain Showers", icon: "rain" },
        81: { text: "Moderate Rain Showers", icon: "rain-heavy" },
        82: { text: "Violent Rain Showers", icon: "rain-heavy" },
        85: { text: "Slight Snow Showers", icon: "snow" },
        86: { text: "Heavy Snow Showers", icon: "snow" },
        95: { text: "Thunderstorm", icon: "thunder" },
        96: { text: "Thunderstorm with Hail", icon: "thunder" },
        99: { text: "Heavy Thunderstorm", icon: "thunder" }
    };

    function getWeatherInfo(code) {
        return wmoMap[code] || { text: "Unknown", icon: "sunny" };
    }

    // Helper: Map icon IDs to SVG string
    function getIconSvg(id) {
        switch(id) {
            case 'sunny': return `<circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>`;
            case 'cloudy': return `<path d="M17.5 19H9a7 7 0 1 1 6.71-9.9A4.6 4.6 0 0 1 17.5 19Z"></path>`;
            case 'rain': return `<path d="M20 16.2A4.5 4.5 0 0 0 17.5 8h-1.8A7 7 0 1 0 4 14.9"></path><path d="M16 14v6"></path><path d="M8 14v6"></path><path d="M12 16v6"></path>`;
            case 'rain-heavy': return `<path d="M20 16.2A4.5 4.5 0 0 0 17.5 8h-1.8A7 7 0 1 0 4 14.9"></path><path d="M16 14v8"></path><path d="M8 14v8"></path><path d="M12 16v8"></path>`;
            case 'thunder': return `<path d="M19 16.9A5 5 0 0 0 18 7h-1.26a8 8 0 1 0-11.62 9"></path><polyline points="13 11 9 17 15 17 11 23"></polyline>`;
            case 'snow': return `<path d="M20 17.58A5 5 0 0 0 18 8h-1.26A8 8 0 1 0 4 16.25"></path><path d="M8 16h6"></path><path d="M8 20h6"></path><path d="M12 18v6"></path>`;
            default: return `<circle cx="12" cy="12" r="4"></circle>`; // fallback
        }
    }

    // Initialize Dashboard
    async function initDashboard() {
        // Formate Date
        const options = { weekday: 'long', month: 'long', day: 'numeric' };
        currentDateEl.textContent = `(${new Date().toLocaleDateString('en-US', options)})`;

        await fetchWeatherData();

        // trigger CSS return animations
        const elements = document.querySelectorAll('.fade-in-up');
        elements.forEach(el => {
            el.style.animation = 'none';
            el.offsetHeight; 
            el.style.animation = null; 
        });
    }

    async function fetchWeatherData() {
        try {
            const url = `https://api.open-meteo.com/v1/forecast?latitude=${currentCity.lat}&longitude=${currentCity.lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&hourly=temperature_2m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto`;
            const res = await fetch(url);
            const data = await res.json();
            
            updateCurrentWeather(data.current);
            updateForecast(data.daily);
            drawHourlyGraph(data.hourly);
            
        } catch(e) {
            console.error('Error fetching weather:', e);
        }
    }

    function updateCurrentWeather(current) {
        currentTempEl.textContent = Math.round(current.temperature_2m);
        currentConditionEl.textContent = getWeatherInfo(current.weather_code).text;
        currentWindEl.textContent = `${current.wind_speed_10m} km/h`;
        currentHumidityEl.textContent = `${current.relative_humidity_2m}%`;
    }

    function updateForecast(daily) {
        forecastListEl.innerHTML = '';
        
        // Skip today (index 0) and show next 6 days
        for(let i = 1; i <= 6; i++) {
            if (!daily.time[i]) break;
            
            const date = new Date(daily.time[i]);
            const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
            const maxTemp = Math.round(daily.temperature_2m_max[i]);
            const codeInfo = getWeatherInfo(daily.weather_code[i]);
            
            const li = document.createElement('li');
            li.className = `forecast-item ${i === 1 ? 'active' : ''}`;
            
            li.innerHTML = `
                <svg class="weather-icon" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                    ${getIconSvg(codeInfo.icon)}
                </svg>
                <div class="forecast-info">
                    <div class="day-name">${dayName}</div>
                    <div class="condition-sm">${codeInfo.text}</div>
                </div>
                <div class="forecast-temp">${maxTemp}°</div>
            `;
            forecastListEl.appendChild(li);
        }
    }

    function drawHourlyGraph(hourly) {
        const svg = document.querySelector('.graph-svg');
        const labelsContainer = document.getElementById('timeline-labels');
        labelsContainer.innerHTML = '';
        svg.innerHTML = '';

        // Get next 8 hours skipping current hour
        const nowIndex = 1; // OpenMeteo gives hours from midnight, we'll just slice the next 8 hours relative to current time
        // Find current hour index based on current time
        const currentHourStr = new Date().toISOString().slice(0, 14) + "00";
        let startIdx = hourly.time.findIndex(t => t.startsWith(currentHourStr.slice(0, 13)));
        if(startIdx === -1) startIdx = 0;

        const hourlyData = [];
        for(let i = startIdx; i < startIdx + 8; i++) {
            if(!hourly.time[i]) break;
            const t = new Date(hourly.time[i]);
            hourlyData.push({
                time: t.getHours().toString().padStart(2, '0') + ':00',
                temp: Math.round(hourly.temperature_2m[i]),
                active: i === startIdx + 1 // Highlight +1 hour
            });
        }

        const width = 1000;
        const height = 150;
        
        const temps = hourlyData.map(d => d.temp);
        const minTemp = Math.min(...temps) - 8;
        const maxTemp = Math.max(...temps) + 8;
        const range = maxTemp - minTemp || 1; // fallback if range is 0

        const points = [];
        const count = hourlyData.length;
        const stepX = width / (count - 1);

        let pathD = "";

        hourlyData.forEach((data, index) => {
            const x = index * stepX;
            const y = height - ((data.temp - minTemp) / range) * (height - 50) - 25;
            points.push({x, y, data});
            
            const xPercent = (index / (count - 1)) * 100;
            const label = document.createElement('div');
            label.className = 'time-label';
            label.style.position = 'absolute';
            label.style.left = `${xPercent}%`;
            label.style.transform = 'translateX(-50%)';
            label.style.top = `${y - 45}px`;
            
            label.innerHTML = `
                <div class="temp-tooltip" style="font-size: 1.1rem; font-weight: 300; margin-bottom: ${height - y + 10}px;">
                    ${data.temp}°
                </div>
                <div class="time-text" style="${data.active ? 'background: rgba(255,255,255,0.15); padding: 4px 10px; border-radius: 12px; color: #fff;' : 'color: rgba(255,255,255,0.6);'}">${data.time}</div>
            `;
            labelsContainer.appendChild(label);
        });

        if(points.length > 0) {
            pathD += `M ${points[0].x} ${points[0].y}`;
            for (let i = 0; i < points.length - 1; i++) {
                const current = points[i];
                const next = points[i + 1];
                const ctrlX = (current.x + next.x) / 2;
                pathD += ` C ${ctrlX} ${current.y}, ${ctrlX} ${next.y}, ${next.x} ${next.y}`;
            }

            const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
            path.setAttribute("d", pathD);
            path.setAttribute("fill", "none");
            path.setAttribute("stroke", "rgba(255,255,255,0.4)");
            path.setAttribute("stroke-width", "1.5");
            path.setAttribute("class", "graph-line");
            svg.appendChild(path);

            points.forEach((pt) => {
                if (pt.data.active) {
                    const dot = document.createElementNS("http://www.w3.org/2000/svg", "circle");
                    dot.setAttribute("cx", pt.x);
                    dot.setAttribute("cy", pt.y);
                    dot.setAttribute("r", "5");
                    dot.setAttribute("fill", "#ffb800");
                    svg.appendChild(dot);
                }
            });
        }
    }

    // Debounce for search
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // City Search Logic
    const handleSearch = debounce(async (e) => {
        const query = e.target.value.trim();
        if(query.length < 2) {
            searchDropdown.classList.remove('active');
            return;
        }

        try {
            const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=5`);
            const data = await res.json();
            
            searchDropdown.innerHTML = '';
            
            if(data.results && data.results.length > 0) {
                data.results.forEach(city => {
                    const div = document.createElement('div');
                    div.className = 'search-item';
                    const locationStr = `${city.name}, ${city.admin1 ? city.admin1 + ', ' : ''}${city.country}`;
                    div.textContent = locationStr;
                    div.onclick = () => {
                        selectCity(city, locationStr);
                    };
                    searchDropdown.appendChild(div);
                });
                searchDropdown.classList.add('active');
            } else {
                searchDropdown.innerHTML = '<div class="search-item">No results found</div>';
                searchDropdown.classList.add('active');
            }
        } catch(err) {
            console.error(err);
        }
    }, 400);

    function selectCity(city, locationStr) {
        searchInput.value = locationStr;
        currentCity = { name: locationStr, lat: city.latitude, lon: city.longitude, timezone: city.timezone };
        searchDropdown.classList.remove('active');
        fetchWeatherData();
    }

    searchInput.addEventListener('input', handleSearch);
    
    // Close dropdown on click outside
    document.addEventListener('click', (e) => {
        if(!document.getElementById('search-container').contains(e.target)) {
            searchDropdown.classList.remove('active');
        }
    });

    initDashboard();

    // Resize tracking to not completely break the SVG points horizontally
    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            // We'd have to refetch or cache 'hourly' to re-draw it purely. 
            // For now, doing fetchWeatherData isn't terrible once resize ends.
            fetchWeatherData();
        }, 250);
    });
});