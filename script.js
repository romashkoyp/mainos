// API Configuration
const address = 'https://atlasmedia.mediani.fi/api/v1/public-map-point-markers/';
const format = '/?format=json&page=';
const id = '100';
let page = 1;
const originalUrl = address + id + format + page;
const corsProxyUrl = 'https://corsproxy.io/?';
let url = corsProxyUrl + encodeURIComponent(originalUrl);

let companyId = 'af79ad25-1bc0-4451-a8bc-600d12b36a68';
let companyUrl = 'https://atlasmedia.mediani.fi/api/v1/reservation-resources-map/' + companyId + '/?format=json'
let urlCompany = corsProxyUrl + encodeURIComponent(companyUrl);

const allData = [];
const filteredData = [];
const allCompanyData = [];
const filteredCompanyData = [];

// --- User Preferences Manager ---
class UserPreferencesManager {
    constructor() {
        this.mapViewKey = 'mapViewState';
        this.filtersKey = 'filterToggleState';
    }

    saveMapState(map) {
        const mapState = {
            zoom: map.getZoom(),
            center: map.getCenter()
        };
        localStorage.setItem(this.mapViewKey, JSON.stringify(mapState));
    }

    loadMapState() {
        const savedState = localStorage.getItem(this.mapViewKey);
        return savedState ? JSON.parse(savedState) : null;
    }

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

    loadFilterState() {
        const savedState = localStorage.getItem(this.filtersKey);
        return savedState ? JSON.parse(savedState) : { showAll: true, showCompany: true, clusterRadius: 70 };
    }
}
const prefsManager = new UserPreferencesManager();


// Function to fetch data from the API
const fetchData = async () => {
  return fetch(url).then(response => response.json());
};

// Function to process fetched data
async function renderData() {
  const data = await fetchData();
  allData.push(...data.results);
  if (data.next) {
    page++;
    const newUrl = address + id + format + page;
    url = corsProxyUrl + encodeURIComponent(newUrl);
    renderData();
  } else {
    filterItems();
  }
}

// Function to filter items for 'Jyväskylä' and store them as the base layer
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

// Function to fetch company data
const fetchCompanyData = async () => {
  return fetch(urlCompany).then(response => response.json());
};

// Function to initiate company data processing
async function processCompanyData() {
  const data = await fetchCompanyData();
  allCompanyData.push(data);
  combineData();
}

// Function which combines the base data and company data
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

// Function to load company data based on user input
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
  
  allCompanyData.length = 0;
  filteredCompanyData.length = 0;
  localStorage.removeItem(dataManager.companyModifiedKey);
  
  inputElement.value = '';
  processCompanyData();
}

// Map Initialization
const savedMapState = prefsManager.loadMapState();
var map = L.map('map').setView(
    savedMapState ? savedMapState.center : [62.160871, 25.6416672],
    savedMapState ? savedMapState.zoom : 8
);

map.on('moveend zoomend', () => {
    prefsManager.saveMapState(map);
});

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

// Data Manager with localStorage
class DataManager {
  constructor() {
    this.originalKey = 'originalFilteredData';
    this.modifiedKey = 'modifiedFilteredData';
    this.statusKey = 'locationStatus';
    this.companyModifiedKey = 'modifiedCompanyData';
  }

  updateStatus(locationId, status) {
    const statusData = JSON.parse(localStorage.getItem(this.statusKey) || '{}');
    if (status) {
        statusData[locationId] = { status: true, timestamp: new Date().toISOString() };
    } else {
        statusData[locationId] = { status: false, timestamp: null };
    }
    localStorage.setItem(this.statusKey, JSON.stringify(statusData));

    const companyData = JSON.parse(localStorage.getItem(this.companyModifiedKey) || '[]');
    const companyIdx = companyData.findIndex(p => p.id === locationId);
    if (companyIdx !== -1) {
      companyData[companyIdx].status = status;
      localStorage.setItem(this.companyModifiedKey, JSON.stringify(companyData));
    }

    const modifiedData = JSON.parse(localStorage.getItem(this.modifiedKey) || '[]');
    const modifiedIdx = modifiedData.findIndex(p => p.id === locationId);
    if (modifiedIdx !== -1) {
      modifiedData[modifiedIdx].status = status;
      localStorage.setItem(this.modifiedKey, JSON.stringify(modifiedData));
    }
  }

  getStatus(locationId) {
    const statusData = JSON.parse(localStorage.getItem(this.statusKey) || '{}');
    const entry = statusData[locationId];
    if (typeof entry === 'object' && entry !== null) {
        return entry.status || false;
    }
    return !!entry;
  }

  getTimestamp(locationId) {
    const statusData = JSON.parse(localStorage.getItem(this.statusKey) || '{}');
    const entry = statusData[locationId];
    if (typeof entry === 'object' && entry !== null) {
        return entry.timestamp || null;
    }
    return null;
  }

  getCurrentData() {
    const companyData = JSON.parse(localStorage.getItem(this.companyModifiedKey) || '[]');
    if (companyData.length > 0) {
      return companyData;
    }
    return JSON.parse(localStorage.getItem(this.modifiedKey) || '[]');
  }
}

const dataManager = new DataManager();

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

function initializeMapWithFilteredData() {
  renderMapMarkers();
}

// --- NEW: Function to re-open a popup after re-rendering ---
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

// --- UPDATED: handleStatusChange now re-opens the popup ---
function handleStatusChange(locationId, checkbox) {
  const newStatus = checkbox.checked;
  dataManager.updateStatus(locationId, newStatus);
  
  // Re-render all markers to apply new rules
  renderMapMarkers();
  
  // Re-open the popup of the marker that was just changed
  reopenPopup(locationId);
}

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

// Create custom marker icons
const greyIcon = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-grey.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
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
let markersLayer;
let clusterRadius = 70;

function updateClusterRadius(value) {
  document.getElementById('cluster-radius-value').textContent = value;
  clusterRadius = parseInt(value);
  prefsManager.saveFilterState();
  renderMapMarkers();
}

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

function renderMapMarkers() {
    const allBaseLocations = JSON.parse(localStorage.getItem(dataManager.originalKey) || '[]');
    const companyLocations = JSON.parse(localStorage.getItem(dataManager.companyModifiedKey) || '[]');
    const showAllToggle = document.getElementById('grey-markers-toggle').checked;
    
    const companyToggle = document.getElementById('company-markers-toggle');
    const showCompanyMarkers = companyToggle ? companyToggle.checked : false;

    if (allBaseLocations.length === 0) return;

    const companyDataMap = new Map(companyLocations.map(item => [item.id, item]));

    if (markersLayer) map.removeLayer(markersLayer);
    markersLayer = L.markerClusterGroup({ maxClusterRadius: clusterRadius });

    allBaseLocations.forEach(place => {
        const status = dataManager.getStatus(place.id);
        const isCompanyLocation = companyDataMap.has(place.id);

        let icon = null;
        let popupContent = null;
        let isVisible = false;

        if (status) {
            icon = greenIcon;
            isVisible = true;
            popupContent = isCompanyLocation ? createPopupContent(companyDataMap.get(place.id), true) : createPopupContent(place, false);
        } else {
            if (isCompanyLocation && showCompanyMarkers) {
                icon = redIcon;
                isVisible = true;
                popupContent = createPopupContent(companyDataMap.get(place.id), true);
            } else if (showAllToggle) {
                icon = greyIcon;
                isVisible = true;
                popupContent = createPopupContent(place, false);
            }
        }

        if (isVisible) {
            let marker = L.marker([place.lat, place.lng], { icon: icon });
            marker.locationId = place.id;
            marker.isCompanyLocation = isCompanyLocation;
            marker.bindPopup(() => popupContent);
            markersLayer.addLayer(marker);
        }
    });

    map.addLayer(markersLayer);
    updateStatistics();
}

function saveStateAndRender() {
    prefsManager.saveFilterState();
    renderMapMarkers();
}

function displayCompanyInfo(companyName) {
  const companyInfoElement = document.getElementById('company-info');
  if (companyInfoElement) {
    const savedFilters = prefsManager.loadFilterState();
    companyInfoElement.innerHTML = `
      <div class="company-info-content">
        <input type="checkbox" id="company-markers-toggle" ${savedFilters.showCompany ? 'checked' : ''} class="checkbox-input-company" />
        <div class="company-name">
          <span>${companyName.split('.')[0]}</span>
          <span>${companyName.split(',')[1]}</span>
        </div>
        <button id="clear-company-data" class="red-marker-indicator">Clear</button>
      </div>
    `;
    companyInfoElement.style.display = 'initial';
    
    document.getElementById('company-markers-toggle').addEventListener('change', saveStateAndRender);
    document.getElementById('clear-company-data').addEventListener('click', clearCompanyData);
  }
}

function formatDate(dateString) {
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
}

function toggleMinimize() {
  const container = document.getElementById('container');
  const content = document.getElementById('tracker-content');
  const minimizeBtn = document.getElementById('minimize-btn');
  
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
            event.target.value = '';
        }
    };
    reader.readAsText(file);
}

function initializeApp() {
  const savedFilters = prefsManager.loadFilterState();
  document.getElementById('grey-markers-toggle').checked = savedFilters.showAll;
  
  const clusterSlider = document.getElementById('cluster-radius-slider');
  const clusterValueSpan = document.getElementById('cluster-radius-value');
  clusterRadius = parseInt(savedFilters.clusterRadius);
  clusterSlider.value = clusterRadius;
  clusterValueSpan.textContent = clusterRadius;

  if (localStorage.getItem(dataManager.originalKey)) {
    const companyData = JSON.parse(localStorage.getItem(dataManager.companyModifiedKey) || '[]');
    if (companyData.length > 0 && companyData[0].companyName) {
      displayCompanyInfo(companyData[0].companyName);
    } else {
       const companyInfoElement = document.getElementById('company-info');
       if (companyInfoElement) companyInfoElement.style.display = 'none';
    }
    
    initializeMapWithFilteredData();

  } else {
    renderData();
  }
}