// --- START OF FILE script.js ---

// API Configuration
const address = 'https://atlasmedia.mediani.fi/api/v1/public-map-point-markers/';
const format = '/?format=json&page=';
const id = '100';
let page = 1;
const originalUrl = address + id + format + page;
const corsProxyUrl = 'https://corsproxy.io/?';
let url = corsProxyUrl + encodeURIComponent(originalUrl);

// let companyId = 'af79ad25-1bc0-4451-a8bc-600d12b36a68';
let companyId = null;
let companyUrl = 'https://atlasmedia.mediani.fi/api/v1/reservation-resources-map/' + companyId + '/?format=json'
let urlCompany = corsProxyUrl + encodeURIComponent(companyUrl);

// Data storage arrays
const allData = []; // Stores all raw data fetched from the base API
const filteredData = []; // Stores data filtered for a specific city (e.g., 'Jyväskylä')
const allCompanyData = []; // Stores raw data fetched from the company-specific API
const filteredCompanyData = []; // Stores company locations that match the base locations

/**
 * Manages saving and loading user preferences (map view and filters) to/from localStorage.
 */
class UserPreferencesManager {
    /**
     * Initializes the keys used for storing data in localStorage.
     */
    constructor() {
        this.mapViewKey = 'mapViewState';
        this.filtersKey = 'filterToggleState';
    }

    /**
     * Saves the current map center and zoom level to localStorage.
     * @param {L.Map} map The Leaflet map instance.
     */
    saveMapState(map) {
        const mapState = {
            zoom: map.getZoom(),
            center: map.getCenter()
        };
        localStorage.setItem(this.mapViewKey, JSON.stringify(mapState));
    }

    /**
     * Loads the saved map state from localStorage.
     * @returns {Object|null} The saved map state {zoom, center} or null if not found.
     */
    loadMapState() {
        const savedState = localStorage.getItem(this.mapViewKey);
        return savedState ? JSON.parse(savedState) : null;
    }

    /**
     * Saves the current state of UI filters (toggles, sliders) to localStorage.
     */
    saveFilterState() {
        const greyToggle = document.getElementById('grey-markers-toggle');
        const companyToggle = document.getElementById('company-markers-toggle');
        const clusterSlider = document.getElementById('cluster-radius-slider');
        const filterState = {
            showAll: greyToggle ? greyToggle.checked : true,
            showCompany: companyToggle ? companyToggle.checked : true,
            clusterRadius: clusterSlider ? clusterSlider.value : 70,
        };
        localStorage.setItem(this.filtersKey, JSON.stringify(filterState));
    }

    /**
     * Loads the saved filter state from localStorage.
     * @returns {Object} The saved filter state or a default state.
     */
    loadFilterState() {
        const savedState = localStorage.getItem(this.filtersKey);
        return savedState ? JSON.parse(savedState) : { showAll: true, showCompany: true, clusterRadius: 70 };
    }
}
const prefsManager = new UserPreferencesManager();


/**
 * Fetches a single page of location data from the base API.
 * @returns {Promise<Object>} A promise that resolves to the JSON data from the API.
 */
const fetchData = async () => {
  return fetch(url).then(response => response.json());
};

/**
 * Fetches and processes all pages of data from the base API recursively.
 * Once all data is fetched, it triggers the filtering process.
 */
async function renderData() {
  const data = await fetchData();
  allData.push(...data.results);
  if (data.next) {
    page++;
    const newUrl = address + id + format + page;
    url = corsProxyUrl + encodeURIComponent(newUrl);
    renderData();
  } else {
    localStorage.setItem('originalAllData', JSON.stringify(allData));
    localStorage.setItem(dataManager.originalKey, JSON.stringify(allData));
    filterItems();
  }
}

// Function to test some queries from allData
function testQueries() {
  // Test 1: Find special type of advertisement
  const placesByTypeOfAdvertisement = [];
  const allData = JSON.parse(localStorage.getItem('originalAllData') || '[]');
  allData.forEach(item => {
    if (typeof item.name === 'string' && item.name.toLowerCase().includes(' maxi')) {
      placesByTypeOfAdvertisement.push(item.name);
    }
  });
  console.log('Places: ', placesByTypeOfAdvertisement);

  // Test 2: Find all possible locations from the name field
  if (allData.length === 0) return;

  const uniqueLocations = new Set();
  allData.forEach(item => {
    if (typeof item.name === 'string') {
      uniqueLocations.add(item.name.split(' ')[1].toLowerCase());
    }
  });

  const locations = Array.from(uniqueLocations)
    .filter(Boolean)
    .map(str => str.charAt(0).toUpperCase() + str.slice(1));
  console.log('Locations:', locations);
}
/**
 * Filters the fetched raw data to include only items from 'Jyväskylä'.
 * It then formats and stores this data in localStorage as the base layer.
 */
function filterItems() {
  filteredData.length = 0;
  filteredData.push(...allData.filter(item => item.name.includes('Jyväskylä')));

  const dataWithStatus = filteredData.map(place => ({
    id: place.id,
    lat: parseFloat(place.lat),
    lng: parseFloat(place.lng),
    name: place.name,
    status: false
  }));

  localStorage.setItem(dataManager.originalKey, JSON.stringify(dataWithStatus));
  localStorage.setItem(dataManager.modifiedKey, JSON.stringify(dataWithStatus));

  renderMapMarkers();
}

/**
 * Fetches location data for a specific company from the API.
 * @returns {Promise<Object>} A promise that resolves to the JSON data from the API.
 */
const fetchCompanyData = async () => {
  const response = await fetch(urlCompany);
  console.log(response);
  if (!response.ok) {
    alert(`Failed to get data. Status: ${response.status}`);
    return;
  }
  return response.json();
};

/**
 * Initiates the fetching and processing of company-specific data.
 */
async function processCompanyData() {
  const data = await fetchCompanyData();
  if (!data) return;
  allCompanyData.length = 0;
  filteredCompanyData.length = 0;
  localStorage.removeItem(dataManager.companyModifiedKey);
  allCompanyData.push(data);
  combineData();
}

/**
 * Combines the base location data with the fetched company data.
 * It finds matching locations and creates a new dataset with enriched company information.
 */
function combineData() {
  filteredCompanyData.length = 0;
  const companyApiData = allCompanyData[0];
  const allBaseLocations = JSON.parse(localStorage.getItem(dataManager.originalKey) || '[]');

  if (companyApiData && companyApiData.reserved_resources) {
    companyApiData.reserved_resources.forEach(resource => {
      if (resource.inventory_resource && resource.inventory_resource.map_point_markers) {
        resource.inventory_resource.map_point_markers.forEach(marker => {
          const matchingItem = allBaseLocations.find(item => item.id === marker.id);
          if (matchingItem) {
            filteredCompanyData.push({
              id: marker.id,
              name: matchingItem.name,
              lat: matchingItem.lat,
              lng: matchingItem.lng,
              startDate: resource.start_date,
              endDate: resource.end_date,
              companyName: companyApiData.name,
              companyDescription: companyApiData.description,
              isCompanyLocation: true,
              status: dataManager.getStatus(marker.id)
            });
          }
        });
      }
    });

    localStorage.setItem(dataManager.companyModifiedKey, JSON.stringify(filteredCompanyData));
    
    if (filteredCompanyData.length > 0) {
      displayCompanyInfo(companyApiData.name);
      renderMapMarkers();
    } else {
      alert('No matching locations found for this company');
    }
  }
}

/**
 * Handles the "Load" button click. It reads the company ID from the input,
 * clears previous company data, and initiates the fetch process.
 */
function loadCompanyData() {
  const inputElement = document.getElementById('company-id-input');
  const inputCompanyId = inputElement.value.trim();
  
  if (!inputCompanyId) {
    alert('Please enter a Company ID');
    return;
  }
  
  companyId = inputCompanyId;
  companyUrl = 'https://atlasmedia.mediani.fi/api/v1/reservation-resources-map/' + companyId + '/?format=json';
  urlCompany = corsProxyUrl + encodeURIComponent(companyUrl);
  
  inputElement.value = '';
  processCompanyData();
}

// Map Initialization
const savedMapState = prefsManager.loadMapState();
var map = L.map('map').setView(
    savedMapState ? savedMapState.center : [62.160871, 25.6416672],
    savedMapState ? savedMapState.zoom : 8
);

// Saves map state whenever the user stops moving or zooming the map.
map.on('moveend zoomend', () => {
    prefsManager.saveMapState(map);
});

// Adds the OpenStreetMap tile layer to the map.
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

/**
 * Manages all data interactions with localStorage, such as updating location statuses.
 */
class DataManager {
  /**
   * Initializes the keys used for storing location data in localStorage.
   */
  constructor() {
    this.originalKey = 'originalFilteredData'; // Base Jyväskylä locations
    this.modifiedKey = 'modifiedFilteredData'; // Base locations with status updates
    this.statusKey = 'locationStatus'; // A separate object just for statuses {id: {status, timestamp}}
    this.companyModifiedKey = 'modifiedCompanyData'; // Company locations with status updates
  }

  /**
   * Updates the visited status and timestamp for a specific location.
   * This change is persisted in localStorage.
   * @param {number} locationId - The ID of the location to update.
   * @param {boolean} status - The new status (true for visited, false for not visited).
   */
  updateStatus(locationId, status) {
    const statusData = JSON.parse(localStorage.getItem(this.statusKey) || '{}');
    if (status) {
        statusData[locationId] = { status: true, timestamp: new Date().toISOString() };
    } else {
        statusData[locationId] = { status: false, timestamp: null };
    }
    localStorage.setItem(this.statusKey, JSON.stringify(statusData));

    // Update the status in the company data if it exists there
    const companyData = JSON.parse(localStorage.getItem(this.companyModifiedKey) || '[]');
    const companyIdx = companyData.findIndex(p => p.id === locationId);
    if (companyIdx !== -1) {
      companyData[companyIdx].status = status;
      localStorage.setItem(this.companyModifiedKey, JSON.stringify(companyData));
    }

    // Update the status in the base modified data
    const modifiedData = JSON.parse(localStorage.getItem(this.modifiedKey) || '[]');
    const modifiedIdx = modifiedData.findIndex(p => p.id === locationId);
    if (modifiedIdx !== -1) {
      modifiedData[modifiedIdx].status = status;
      localStorage.setItem(this.modifiedKey, JSON.stringify(modifiedData));
    }
  }

  /**
   * Retrieves the visited status for a specific location.
   * @param {number} locationId - The ID of the location.
   * @returns {boolean} The visited status (true/false).
   */
  getStatus(locationId) {
    const statusData = JSON.parse(localStorage.getItem(this.statusKey) || '{}');
    const entry = statusData[locationId];
    if (typeof entry === 'object' && entry !== null) {
        return entry.status || false;
    }
    return !!entry; // Legacy support for old boolean-only format
  }

  /**
   * Retrieves the timestamp of when a location was marked as visited.
   * @param {number} locationId - The ID of the location.
   * @returns {string|null} The visit timestamp in ISO format, or null if not visited.
   */
  getTimestamp(locationId) {
    const statusData = JSON.parse(localStorage.getItem(this.statusKey) || '{}');
    const entry = statusData[locationId];
    if (typeof entry === 'object' && entry !== null) {
        return entry.timestamp || null;
    }
    return null;
  }

  /**
   * Gets the currently active dataset for display (company data if loaded, otherwise base data).
   * @returns {Array} An array of location objects to be displayed.
   */
  getCurrentData() {
    const companyData = JSON.parse(localStorage.getItem(this.companyModifiedKey) || '[]');
    if (companyData.length > 0) {
      return companyData;
    }
    return JSON.parse(localStorage.getItem(this.modifiedKey) || '[]');
  }
}

const dataManager = new DataManager();

/**
 * Clears all company-specific data from the application and localStorage.
 * Re-renders the map to show only the base layer.
 */
function clearCompanyData() {
  if (!confirm('Are you sure you want to clear all company data?')) return;
  localStorage.removeItem(dataManager.companyModifiedKey);
  localStorage.removeItem(dataManager.statusKey);
  allCompanyData.length = 0;
  filteredCompanyData.length = 0;
  
  const companyInfoElement = document.getElementById('company-info');
  if (companyInfoElement) {
    companyInfoElement.style.display = 'none';
  }
  
  renderMapMarkers();
}

/**
 * Initializes the map view with data already present in localStorage.
 */
function initializeMapWithFilteredData() {
  renderMapMarkers();
}

/**
 * Finds a marker by its ID and opens its popup, zooming to it if necessary.
 * This is useful for re-opening a popup after re-rendering the map.
 * @param {number} locationId - The ID of the location whose popup should be opened.
 */
function reopenPopup(locationId) {
    if (!markersLayer) return;

    // Use getLayers() to access all markers, even those inside clusters
    const allMarkers = markersLayer.getLayers();
    const targetMarker = allMarkers.find(m => m.locationId === locationId);

    if (targetMarker) {
        // This function will zoom to the cluster and execute the callback
        markersLayer.zoomToShowLayer(targetMarker, function() {
            targetMarker.openPopup();
        });
    }
}

/**
 * Handles the change event of the "Visited" checkbox in a marker's popup.
 * It updates the location's status and re-renders the map.
 * @param {number} locationId - The ID of the location that was changed.
 * @param {HTMLInputElement} checkbox - The checkbox element that was clicked.
 */
function handleStatusChange(locationId, checkbox) {
  const newStatus = checkbox.checked;
  dataManager.updateStatus(locationId, newStatus);
  
  // Re-render all markers to apply new rules
  renderMapMarkers();
  
  // Re-open the popup of the marker that was just changed
  reopenPopup(locationId);
}

/**
 * Updates the statistics panel (total, visited, not visited, progress bar)
 * based on the currently displayed data.
 */
function updateStatistics() {
  const currentDisplayData = dataManager.getCurrentData();
  const total = currentDisplayData.length;
  const visited = currentDisplayData.filter(place => dataManager.getStatus(place.id)).length;
  const notVisited = total - visited;
  const progress = total > 0 ? Math.round((visited / total) * 100) : 0;

  document.getElementById('total-count').textContent = total;
  document.getElementById('visited-count').textContent = visited;
  document.getElementById('not-visited-count').textContent = notVisited;
  document.getElementById('progress-percent').textContent = `${progress}%`;
  document.getElementById('progress-bar').style.width = `${progress}%`;
}

// Create custom marker icons for different states
// https://github.com/pointhi/leaflet-color-markers

const greyIcon = L.divIcon({
  className: 'my-div-icon',
  html: '<div>\
          <svg width="25" height="41" viewBox="0 0 40 65" xmlns="http://www.w3.org/2000/svg">\
            <path d="M20 2 C30 2 38 10 38 20 C38 30 20 65 20 65 C20 65 2 30 2 20 C2 10 10 2 20 2 Z"\
              fill="#7B7B7B"\
              stroke="#6B6B6B"\
              stroke-width="2"/>\
            <circle cx="20" cy="20" r="14"\
              fill="#FFFFFF"\
              stroke="#6B6B6B"\
              stroke-width="2"/>\
          </svg>\
        </div>',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34]
});

const greenIcon = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
});

const redIcon = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
});

// Global variables for map layer and settings
let markersLayer; // Holds the marker cluster layer
let clusterRadius = 70; // Default clustering radius
let userLocationMarker = null; // To hold the marker for the user's position

/**
 * Updates the cluster radius based on the slider input and re-renders the map.
 * @param {string} value - The new radius value from the slider.
 */
function updateClusterRadius(value) {
  document.getElementById('cluster-radius-value').textContent = value;
  clusterRadius = parseInt(value);
  prefsManager.saveFilterState();
  renderMapMarkers();
}

/**
 * Formats an ISO timestamp string into a readable format (DD-MM-YYYY HH:MM).
 * @param {string} isoString - The ISO date string to format.
 * @returns {string} The formatted date string, or an empty string if input is invalid.
 */
function formatTimestamp(isoString) {
    if (!isoString) return '';
    const date = new Date(isoString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${day}-${month}-${year} ${hours}:${minutes}`;
}

/**
 * Creates the HTML content for a marker's popup.
 * @param {Object} placeData - The data object for the location.
 * @param {boolean} isCompany - Whether this is a company-specific location.
 * @returns {string} The HTML string for the popup.
 */
function createPopupContent(placeData, isCompany) {
    const currentStatus = dataManager.getStatus(placeData.id);
    const isChecked = currentStatus ? 'checked' : '';
    const checkboxId = `status-${placeData.id}`;

    let companyInfoHtml = '';
    if (isCompany) {
        const timestamp = dataManager.getTimestamp(placeData.id);
        let visitedHtml = '';
        if (timestamp) {
            visitedHtml = `<div class="popup-info"><i class="fas fa-check-circle"></i>Visited on: ${formatTimestamp(timestamp)}</div>`;
        }
        companyInfoHtml = `
            ${visitedHtml}
            <div class="popup-info"><i class="fas fa-building"></i>Company: ${placeData.companyName}</div>
            <div class="popup-info"><i class="fas fa-info-circle"></i>Description: ${placeData.companyDescription || 'N/A'}</div>
            <div class="popup-info"><i class="fas fa-calendar-alt"></i>Start Date: ${formatDate(placeData.startDate)}</div>
            <div class="popup-info"><i class="fas fa-calendar-alt"></i>End Date: ${formatDate(placeData.endDate)}</div>
        `;
    }

    return `
        <div class="popup-content">
            <h3>${placeData.name}</h3>
            ${companyInfoHtml}
            <div class="checkbox-container">
                <label class="checkbox-label">
                    <input type="checkbox" id="${checkboxId}" ${isChecked} onchange="handleStatusChange(${placeData.id}, this)" class="checkbox-input"/>
                    <span class="${currentStatus ? 'status-text-visited' : 'status-text-not-visited'}">${currentStatus ? 'Visited' : 'Not Visited'}</span>
                </label>
            </div>
        </div>
    `;
}

/**
 * The main rendering function. It clears existing markers from the map and adds new ones
 * based on the current data and filter settings.
 */
function renderMapMarkers() {
    const allBaseLocations = JSON.parse(localStorage.getItem(dataManager.originalKey) || '[]');
    const companyLocations = JSON.parse(localStorage.getItem(dataManager.companyModifiedKey) || '[]');
    const showAllToggle = document.getElementById('grey-markers-toggle').checked;
    
    const companyToggle = document.getElementById('company-markers-toggle');
    const showCompanyMarkers = companyToggle ? companyToggle.checked : false;

    if (allBaseLocations.length === 0) {
        alert('No data available. Please reload the page.');
        return;
      }

    // Create a Map for quick lookup of company locations by ID
    const companyDataMap = new Map(companyLocations.map(item => [item.id, item]));

    // Remove old layer and create a new one with the current cluster radius
    if (markersLayer) map.removeLayer(markersLayer);
    markersLayer = L.markerClusterGroup({
        maxClusterRadius: clusterRadius,
        spiderfyOnMaxZoom: true,
        showCoverageOnHover: false,
        zoomToBoundsOnClick: true
    });

    // Iterate through all base locations to decide how to render each one
    allBaseLocations.forEach(place => {
        const status = dataManager.getStatus(place.id);
        const isCompanyLocation = companyDataMap.has(place.id);
        const placeData = isCompanyLocation ? companyDataMap.get(place.id) : place;

        let icon = null;
        let popupContent = null;
        let isVisible = false;

        if (status) { // If visited, always show as green
            icon = greenIcon;
            isVisible = true;
            popupContent = createPopupContent(placeData, isCompanyLocation);
        } else { // If not visited
            if (isCompanyLocation && showCompanyMarkers) { // Show as red if it's a company location and the filter is on
                icon = redIcon;
                isVisible = true;
                popupContent = createPopupContent(placeData, true);
            } else if (showAllToggle) { // Show as grey if it's a base location and the filter is on
                icon = greyIcon;
                isVisible = true;
                popupContent = createPopupContent(placeData, false);
            }
        }

        if (isVisible) {
            let marker = L.marker([place.lat, place.lng], { icon: icon });
            marker.locationId = place.id; // Store ID on marker for easy access
            marker.placeData = placeData; // Store the full data object for easy access later
            marker.bindPopup(() => popupContent); // Use a function to generate popup content on-demand
            markersLayer.addLayer(marker);
        }
    });

    map.addLayer(markersLayer);
    updateStatistics();
}

/**
 * A helper function to save the current filter state and then re-render the map.
 * Used as an onchange handler for filter toggles.
 */
function saveStateAndRender() {
    prefsManager.saveFilterState();
    renderMapMarkers();
}

/**
 * Displays the company information panel in the UI.
 * @param {string} companyName - The name of the company to display.
 */
function displayCompanyInfo(companyName) {
  const companyInfoElement = document.getElementById('company-info');
  if (companyInfoElement) {
    const savedFilters = prefsManager.loadFilterState();
    companyInfoElement.innerHTML = `
      <div class="company-info-content">
        <input type="checkbox" id="company-markers-toggle" ${savedFilters.showCompany ? 'checked' : ''} class="checkbox-input-company" />
        <div class="company-name">
          <span>${companyName}</span>
        </div>
        <button id="clear-company-data" class="red-marker-indicator">Clear</button>
      </div>
    `;
    companyInfoElement.style.display = 'initial';
    
    // Add event listeners to the newly created elements
    document.getElementById('company-markers-toggle').addEventListener('change', saveStateAndRender);
    document.getElementById('clear-company-data').addEventListener('click', clearCompanyData);
  }
}

/**
 * Formats a date string into DD-MM-YYYY format.
 * @param {string} dateString - The date string to format.
 * @returns {string} The formatted date.
 */
function formatDate(dateString) {
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
}

/**
 * Toggles the minimized/maximized state of the control panel.
 */
function toggleMinimize() {
  const container = document.getElementById('container');
  const content = document.getElementById('tracker-content');
  const minimizeBtn = document.getElementById('minimize-btn');
  
  // The class 'container-minimized' is now used by CSS to control layout
  if (container.classList.contains('container-minimized')) {
    container.classList.remove('container-minimized');
    content.style.display = 'block';
    minimizeBtn.innerHTML = '<i class="fas fa-minus"></i>';
  } else {
    container.classList.add('container-minimized');
    content.style.display = 'none';
    minimizeBtn.innerHTML = '<i class="fas fa-plus"></i>';
  }
}

/**
 * Exports the user's progress (statuses and company data) to a JSON file.
 */
function exportData() {
    const dataToExport = {
        locationStatus: localStorage.getItem(dataManager.statusKey) || '{}',
        modifiedCompanyData: localStorage.getItem(dataManager.companyModifiedKey) || '[]',
    };

    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const dateString = `${year}-${month}-${day}`;

    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `location-tracker-data_${dateString}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    alert('Data exported successfully!');
}

/**
 * Imports user progress from a JSON file.
 * @param {Event} event - The file input change event.
 */
function importData(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const importedData = JSON.parse(e.target.result);
            if (importedData.locationStatus && importedData.modifiedCompanyData) {
                localStorage.setItem(dataManager.statusKey, importedData.locationStatus);
                localStorage.setItem(dataManager.companyModifiedKey, importedData.modifiedCompanyData);
                if (confirm('Data imported successfully! Reload the page to apply changes?')) {
                    location.reload();
                }
            } else {
                alert('Import failed: The file is not in the correct format.');
            }
        } catch (error) {
            alert('Import failed: Could not parse the file. ' + error.message);
        } finally {
            // Reset the file input to allow importing the same file again
            event.target.value = '';
        }
    };
    reader.readAsText(file);
}

/**
 * Attempts to get the user's current physical location using the browser's Geolocation API.
 */
function locateUser() {
    if (!navigator.geolocation) {
        alert("Geolocation is not supported by your browser.");
        return;
    }

    // Success callback function
    function success(position) {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const userLatLng = L.latLng(lat, lng);

        // Add or update the user's location marker on the map
        if (userLocationMarker) {
            userLocationMarker.setLatLng(userLatLng);
        } else {
            // Create a unique marker for the user's location (e.g., a blue circle)
            userLocationMarker = L.circleMarker(userLatLng, {
                radius: 8,
                color: '#1d6ef7',
                fillColor: '#1d6ef7',
                fillOpacity: 0.5
            }).addTo(map);
        }
        
        userLocationMarker.bindPopup("<b>You are here</b>").openPopup();

        // Center the map on the user's location with a suitable zoom level
        map.setView(userLatLng, 20);
    }

    // Error callback function
    function error(err) {
        let message = "Could not get your location. ";
        switch (err.code) {
            case err.PERMISSION_DENIED:
                message += "You denied the request for Geolocation.";
                break;
            case err.POSITION_UNAVAILABLE:
                message += "Location information is unavailable.";
                break;
            case err.TIMEOUT:
                message += "The request to get user location timed out.";
                break;
            default:
                message += "An unknown error occurred.";
                break;
        }
        alert(message);
    }

    // Request the user's location
    navigator.geolocation.getCurrentPosition(success, error);
}

/**
 * Initializes the application on page load. It restores filter states and
 * either fetches initial data or renders the map using data from localStorage.
 */
function initializeApp() {
  const savedFilters = prefsManager.loadFilterState();
  document.getElementById('grey-markers-toggle').checked = savedFilters.showAll;
  
  // Restore cluster slider state
  const clusterSlider = document.getElementById('cluster-radius-slider');
  const clusterValueSpan = document.getElementById('cluster-radius-value');
  clusterRadius = parseInt(savedFilters.clusterRadius);
  clusterSlider.value = clusterRadius;
  clusterValueSpan.textContent = clusterRadius;

  // Check if base data already exists
  if (localStorage.getItem(dataManager.originalKey)) {
    // If so, check for company data and display info if present
    const companyData = JSON.parse(localStorage.getItem(dataManager.companyModifiedKey) || '[]');
    if (companyData.length > 0 && companyData[0].companyName) {
      displayCompanyInfo(companyData[0].companyName);
    } else {
       const companyInfoElement = document.getElementById('company-info');
       if (companyInfoElement) companyInfoElement.style.display = 'none';
    }
    
    // Render the map with existing data
    initializeMapWithFilteredData();
    // testQueries();
  } else {
    // If no data exists, fetch it from the API
    renderData();
  }
}