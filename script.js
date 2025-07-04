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

// Function to fetch data from the API
const fetchData = async () => {
  return fetch(url).then(response => response.json());
};

// Function to display data
async function renderData() {
  // Await the promise to get the actual data
  const data = await fetchData();
  allData.push(...data.results);
  if (data.next) {
    page++;
    const newUrl = address + id + format + page;
    const newCorsUrl = corsProxyUrl + encodeURIComponent(newUrl);
    url = newCorsUrl;
    renderData();
  } else {
    filterItems();
  }
}

// Function to filter items
function filterItems() {
  // Clear the array
  filteredData.length = 0;
  
  // Filter data to include only items with name containing 'Jyväskylä'
  filteredData.push(...allData.filter(item => item.name.includes('Jyväskylä')));
  
  // Store filtered data in localStorage
  localStorage.setItem(dataManager.originalKey, JSON.stringify(filteredData));

  // Initialize the map with filtered data after filtering is complete
  initializeMapWithFilteredData();
}

// Function to fetch company data
const fetchCompanyData = async () => {
  return fetch(urlCompany).then(response => response.json());
};

// Function to display company data
async function renderCompanyData() {
  // Check if we have allCompanyData in localStorage
  if (localStorage.getItem(dataManager.companyOriginalKey)) {
    combineData();
    return;
  }

  const data = await fetchCompanyData();
  allCompanyData.push(data);
  
  // Store allCompanyData in localStorage
  localStorage.setItem(dataManager.companyOriginalKey, JSON.stringify(allCompanyData));
  combineData();
}

// Function which combines the filteredData and allCompanyData
function combineData() {
  filteredCompanyData.length = 0; // Clear the array
  const allCompanyData = JSON.parse(localStorage.getItem(dataManager.companyOriginalKey) || '[]');
  const filteredData = JSON.parse(localStorage.getItem(dataManager.originalKey) || '[]');

  if (allCompanyData.length > 0 && allCompanyData[0].reserved_resources) {
    allCompanyData[0].reserved_resources.forEach(resource => {
      if (resource.inventory_resource && resource.inventory_resource.map_point_markers) {
        resource.inventory_resource.map_point_markers.forEach(marker => {
          // Find matching item in filteredData
          const matchingItem = filteredData.find(item => item.id === marker.id);
          if (matchingItem) {
            // Add the parent resource to filteredCompanyData
            filteredCompanyData.push({
              id: marker.id,
              name: matchingItem.name,
              lat: matchingItem.lat,
              lng: matchingItem.lng,
              startDate: resource.start_date,
              endDate: resource.end_date,
              companyName: allCompanyData[0].name,
              companyDescription: allCompanyData[0].description
            });
          }
        });
      }
    });

    // Store combined data in localStorage
    localStorage.setItem(dataManager.companyModifiedKey, JSON.stringify(filteredCompanyData));
    
    // After combining data, render company markers
    if (filteredCompanyData.length > 0) {
      // Display company name info and update tracker title
      displayCompanyInfo(allCompanyData[0].name);
      renderCompanyMarkers();
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
  
  // Update the global companyId and URL
  companyId = inputCompanyId;
  companyUrl = 'https://atlasmedia.mediani.fi/api/v1/reservation-resources-map/' + companyId + '/?format=json';
  urlCompany = corsProxyUrl + encodeURIComponent(companyUrl);
  
  // Clear previous company data
  allCompanyData.length = 0;
  filteredCompanyData.length = 0;
  
  // Clear the input field
  inputElement.value = '';
  
  // Fetch and render company data
  renderCompanyData();
}

// Initialize the map
var map = L.map('map').setView([62.160871, 25.6416672], 8);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

// Data Manager with localStorage for filtered API data
class DataManager {
  constructor() {
    this.originalKey = 'originalFilteredData';
    this.modifiedKey = 'modifiedFilteredData';
    this.statusKey = 'locationStatus';
    this.companyOriginalKey = 'originalCompanyData';
    this.companyModifiedKey = 'modifiedCompanyData';
  }

  // Initialize data with status field
  initializeData(apiData) {
    let originalData = localStorage.getItem(this.originalKey);

    if (!originalData || JSON.parse(originalData).length !== apiData.length) {
      // Add status: false to each item from API data
      const dataWithStatus = apiData.map(place => ({
        id: place.id,
        lat: parseFloat(place.lat),
        lng: parseFloat(place.lng),
        name: place.name,
        status: false
      }));

      localStorage.setItem(this.originalKey, JSON.stringify(dataWithStatus));
      localStorage.setItem(this.modifiedKey, JSON.stringify(dataWithStatus));
      return dataWithStatus;
    } else {
      // Return modified data if exists, otherwise original
      const modified = localStorage.getItem(this.modifiedKey);
      return JSON.parse(modified || originalData);
    }
  }

  // Initialize company data with status field
  initializeCompanyData(companyData) {
    // For company data, always start fresh with status: false
    const dataWithStatus = companyData.map(place => ({
      id: place.id,
      lat: parseFloat(place.lat),
      lng: parseFloat(place.lng),
      name: place.name,
      status: false,
      isCompanyLocation: true,
      startDate: place.startDate,
      endDate: place.endDate,
      companyName: place.companyName,
      companyDescription: place.companyDescription
    }));

    localStorage.setItem(this.companyOriginalKey, JSON.stringify(dataWithStatus));
    localStorage.setItem(this.companyModifiedKey, JSON.stringify(dataWithStatus));
    return dataWithStatus;
  }

  // Update status of a location
  updateStatus(locationId, status) {
    // Check if it's a company location first
    const companyData = localStorage.getItem(this.companyModifiedKey);
    if (companyData) {
      const currentCompanyData = JSON.parse(companyData);
      const companyLocationIndex = currentCompanyData.findIndex(place => place.id === locationId);
      
      if (companyLocationIndex !== -1) {
        currentCompanyData[companyLocationIndex].status = status;
        localStorage.setItem(this.companyModifiedKey, JSON.stringify(currentCompanyData));
        
        // Store individual status for quick lookup
        const statusData = JSON.parse(localStorage.getItem(this.statusKey) || '{}');
        statusData[locationId] = status;
        localStorage.setItem(this.statusKey, JSON.stringify(statusData));
        
        return currentCompanyData;
      }
    }

    // If not found in company data, check regular data
    const currentData = JSON.parse(localStorage.getItem(this.modifiedKey) || '[]');
    const locationIndex = currentData.findIndex(place => place.id === locationId);

    if (locationIndex !== -1) {
      currentData[locationIndex].status = status;
      localStorage.setItem(this.modifiedKey, JSON.stringify(currentData));

      // Also store individual status for quick lookup
      const statusData = JSON.parse(localStorage.getItem(this.statusKey) || '{}');
      statusData[locationId] = status;
      localStorage.setItem(this.statusKey, JSON.stringify(statusData));
    }

    return currentData;
  }

  // Get current data (prioritize company data if available)
  getCurrentData() {
    const companyData = localStorage.getItem(this.companyModifiedKey);
    if (companyData && JSON.parse(companyData).length > 0) {
      return JSON.parse(companyData);
    }
    
    const modified = localStorage.getItem(this.modifiedKey);
    const original = localStorage.getItem(this.originalKey);
    return JSON.parse(modified || original || '[]');
  }

  // Get status of a specific location
  getStatus(locationId) {
    const statusData = JSON.parse(localStorage.getItem(this.statusKey) || '{}');
    return statusData[locationId] || false;
  }
}

// Initialize data manager
const dataManager = new DataManager();
// Function to clear all data except original filtered data
function clearCompanyData() {
  if (!confirm('Are you sure you want to clear all company data?')) return;
  localStorage.removeItem(dataManager.companyOriginalKey);
  localStorage.removeItem(dataManager.companyModifiedKey);
  localStorage.removeItem(dataManager.modifiedKey);
  localStorage.removeItem(dataManager.statusKey);
  allCompanyData.length = 0;
  filteredCompanyData.length = 0;
  initializeMapWithFilteredData();
  const companyInfoElement = document.getElementById('company-info');
  if (companyInfoElement) {
    companyInfoElement.style.display = 'none';
  }
}

// Function to initialize map with filtered data from local storage
function initializeMapWithFilteredData() {
  // Get filtered data from local storage
  const filteredData = JSON.parse(localStorage.getItem(dataManager.originalKey) || '[]');
  
  if (filteredData.length > 0) {
    // Hide company info when loading regular data
    const companyInfoElement = document.getElementById('company-info');
    if (companyInfoElement) {
      companyInfoElement.style.display = 'none';
    }
    
    const placesData = dataManager.initializeData(filteredData);
    renderPlaces(placesData);
  }
}

// Handle checkbox change
function handleStatusChange(locationId, checkbox) {
  const newStatus = checkbox.checked;
  dataManager.updateStatus(locationId, newStatus);
  console.log(`Location ${locationId} status changed to: ${newStatus}`);

  // Update the label text and color
  const label = checkbox.parentElement;
  const span = label.querySelector('span');
  span.textContent = newStatus ? 'Visited' : 'Not Visited';
  span.className = newStatus ? 'status-text-visited' : 'status-text-not-visited';

  // Update marker color by finding the marker and changing its icon
  if (markersLayer) {
    markersLayer.eachLayer(function(marker) {
      if (marker.locationId === locationId) {
        // Check if it's a company location by checking if we have company data
        const companyData = localStorage.getItem(dataManager.companyModifiedKey);
        const isCompanyLocation = companyData && JSON.parse(companyData).some(place => place.id === locationId);
        
        // Choose appropriate icon: green for visited, red for unvisited company locations, grey for unvisited regular locations
        let newIcon;
        if (newStatus) {
          newIcon = greenIcon;
          marker.setOpacity(1); // Make sure visited markers are always visible
        } else {
          newIcon = isCompanyLocation ? redIcon : greyIcon;
          // For grey markers, check the toggle state
          if (!isCompanyLocation) {
            const greyToggle = document.getElementById('grey-markers-toggle');
            marker.setOpacity(greyToggle && greyToggle.checked ? 1 : 0);
          } else {
            marker.setOpacity(1); // Company markers are always visible
          }
        }
        
        marker.setIcon(newIcon);
      }
    });
  }

  // Update statistics
  updateStatistics();
}

// Update statistics in the control panel
function updateStatistics() {
  const data = dataManager.getCurrentData();
  const total = data.length;
  const visited = data.filter(place => place.status).length;
  const notVisited = total - visited;
  const progress = total > 0 ? Math.round((visited / total) * 100) : 0;

  document.getElementById('total-count').textContent = total;
  document.getElementById('visited-count').textContent = visited;
  document.getElementById('not-visited-count').textContent = notVisited;
  document.getElementById('progress-percent').textContent = `${progress}%`;
  document.getElementById('progress-bar').style.width = `${progress}%`;
}

// Export data as JSON
function exportData() {
  const data = dataManager.getCurrentData();
  const exportData = {
    exportDate: new Date().toISOString(),
    totalLocations: data.length,
    visitedLocations: data.filter(place => place.status).length,
    isCompanyData: data.length > 0 && data[0].isCompanyLocation,
    companyName: data.length > 0 && data[0].companyName ? data[0].companyName : null,
    data: data
  };

  const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  const filename = exportData.isCompanyData 
    ? `company-locations-${new Date().toISOString().split('T')[0]}.json`
    : `locations-${new Date().toISOString().split('T')[0]}.json`;
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Import data from JSON file
function importData(input) {
  const file = input.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const importedData = JSON.parse(e.target.result);

      // Validate the imported data
      if (importedData.data && Array.isArray(importedData.data)) {
        // Check if it's company data
        const isCompanyData = importedData.isCompanyData || 
          (importedData.data.length > 0 && importedData.data[0].isCompanyLocation);

        if (isCompanyData) {
          // Import as company data
          localStorage.setItem(dataManager.companyModifiedKey, JSON.stringify(importedData.data));
        } else {
          // Import as regular data
          localStorage.setItem(dataManager.modifiedKey, JSON.stringify(importedData.data));
        }

        // Update status lookup
        const statusData = {};
        importedData.data.forEach(place => {
          if (place.id && typeof place.status === 'boolean') {
            statusData[place.id] = place.status;
          }
        });
        localStorage.setItem(dataManager.statusKey, JSON.stringify(statusData));

        alert('Data imported successfully!');
        location.reload();
      } else {
        alert('Invalid file format. Please select a valid locations JSON file.');
      }
    } catch (error) {
      alert('Error reading file. Please make sure it\'s a valid JSON file.');
    }
  };
  reader.readAsText(file);

  // Clear the input
  input.value = '';
}

// Create custom marker icons
const greyIcon = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-grey.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const greenIcon = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const redIcon = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Store markers globally for updates
let markersLayer;

// Store all markers separately for filtering
let allMarkers = [];

// Global variable to store the cluster radius
let clusterRadius = 70;

// Define a function to update the cluster radius
function updateClusterRadius(value) {
  // Update the displayed value
  document.getElementById('cluster-radius-value').textContent = value;
  
  // Update the global variable
  clusterRadius = parseInt(value);
  
  // Re-render markers with new cluster radius
  if (markersLayer) {
    map.removeLayer(markersLayer);
    
    // Create a new marker cluster group with updated radius
    markersLayer = L.markerClusterGroup({
      maxClusterRadius: clusterRadius
    });
    
    // Re-add all markers to the new cluster
    filterAndAddMarkers();
    
    // Add the cluster group back to the map
    map.addLayer(markersLayer);
  }
}

// Render data to the map
function renderPlaces(placesData) {
  if (placesData.length === 0) {
    return;
  }

  // Remove existing markers if they exist
  if (markersLayer) {
    map.removeLayer(markersLayer);
  }

  // Clear all markers array
  allMarkers = [];

  // Create a marker cluster group
  markersLayer = L.markerClusterGroup({
    maxClusterRadius: 50
  });

  // Loop through the data and create markers
  placesData.forEach(place => {
    const checkboxId = `status-${place.id}`;
    const markerIcon = place.status ? greenIcon : greyIcon;
    const marker = L.marker([place.lat, place.lng], { icon: markerIcon });

    // Create popup content dynamically
    marker.bindPopup(() => {
      const currentStatus = dataManager.getStatus(place.id);
      const isChecked = currentStatus ? 'checked' : '';

      return `
        <div class="popup-content">
          <h3>${place.name}</h3>
          <div class="checkbox-container">
            <label class="checkbox-label">
              <input
                type="checkbox"
                id="${checkboxId}"
                ${isChecked}
                onchange="handleStatusChange(${place.id}, this)"
                class="checkbox-input"
              />
              <span class="${currentStatus ? 'status-text-visited' : 'status-text-not-visited'}">
                ${currentStatus ? 'Visited' : 'Not Visited'}
              </span>
            </label>
          </div>
        </div>
      `;
    });

    // Store location ID and additional info in marker
    marker.locationId = place.id;
    marker.isCompanyLocation = place.isCompanyLocation || false;
    marker.isVisited = place.status;

    // Add to all markers array
    allMarkers.push(marker);
  });

  // Filter and add markers to cluster based on current toggle state
  filterAndAddMarkers();

  // Add the cluster group to the map
  map.addLayer(markersLayer);

  // Update statistics after rendering
  updateStatistics();
}

// Function to filter and add appropriate markers to cluster
function filterAndAddMarkers() {
  // Clear the cluster group
  markersLayer.clearLayers();
  
  const greyToggle = document.getElementById('grey-markers-toggle');
  const showGreyMarkers = greyToggle ? greyToggle.checked : true;

  allMarkers.forEach(marker => {
    const isVisited = dataManager.getStatus(marker.locationId);
    const isCompanyLocation = marker.isCompanyLocation;
    
    // Always show visited markers and company markers
    if (isVisited || isCompanyLocation) {
      markersLayer.addLayer(marker);
    } else if (showGreyMarkers) {
      // Only add grey markers if toggle is enabled
      markersLayer.addLayer(marker);
    }
  });
}

// Render company data markers with red icons
function renderCompanyMarkers() {
  // Get company data from local storage
  const companyData = JSON.parse(localStorage.getItem(dataManager.companyModifiedKey) || '[]');

  // Convert company data to the format expected by DataManager
  const companyDataForManager = companyData.map(place => ({
    id: place.id,
    lat: parseFloat(place.lat),
    lng: parseFloat(place.lng),
    name: place.name,
    status: false, // Company locations start as unvisited
    isCompanyLocation: true,
    startDate: place.startDate,
    endDate: place.endDate,
    companyName: place.companyName,
    companyDescription: place.companyDescription
  }));

  // Initialize company data in data manager
  const companyPlacesData = dataManager.initializeCompanyData(companyDataForManager);
  
  // Remove existing markers if they exist
  if (markersLayer) {
    map.removeLayer(markersLayer);
  }

  // Create a marker cluster group
  markersLayer = L.markerClusterGroup({
    // Adjust the maxClusterRadius to control the size of clusters in px
    maxClusterRadius: 50
  });

  // Add company markers with red icons
  companyPlacesData.forEach(place => {
    const checkboxId = `status-${place.id}`;

    // Company locations use red icon when not visited, green when visited
    const markerIcon = place.status ? greenIcon : redIcon;

    const marker = L.marker([place.lat, place.lng], { icon: markerIcon });

    // Create popup content with company information
    marker.bindPopup(() => {
      const currentStatus = dataManager.getStatus(place.id);
      const isChecked = currentStatus ? 'checked' : '';

      return `
        <div class="popup-content">
          <h3>${place.name}</h3>
          <div class="popup-info">
            <i class="fas fa-building"></i>Company: ${place.companyName}
          </div>
          <div class="popup-info">
            <i class="fas fa-info-circle"></i>Description: ${place.companyDescription || 'N/A'}
          </div>
          <div class="popup-info">
            <i class="fas fa-calendar-alt"></i>Start Date: ${formatDate(place.startDate)}
          </div>
          <div class="popup-info">
            <i class="fas fa-calendar-alt"></i>End Date: ${formatDate(place.endDate)}
          </div>
          <div class="checkbox-container">
            <label class="checkbox-label">
              <input
                type="checkbox"
                id="${checkboxId}"
                ${isChecked}
                onchange="handleStatusChange(${place.id}, this)"
                class="checkbox-input"
              />
              <span class="${currentStatus ? 'status-text-visited' : 'status-text-not-visited'}">
                ${currentStatus ? 'Visited' : 'Not Visited'}
              </span>
            </label>
          </div>
        </div>
      `;
    });

    // Store location ID in marker for later reference
    marker.locationId = place.id;

    // Add marker to cluster group
    markersLayer.addLayer(marker);
  });

  // Add the cluster group to the map
  map.addLayer(markersLayer);

  // Update statistics after rendering
  updateStatistics();
}

// Function to display company information with a clear button
function displayCompanyInfo(companyName) {
  const companyInfoElement = document.getElementById('company-info');
  if (companyInfoElement) {
    companyInfoElement.innerHTML = `
      <div class="company-info-content">
        <input
          type="checkbox"
          id="company-markers-toggle"
          checked
          class="checkbox-input-company"
        />
        <div class="company-name">
          <span>${companyName.split('.')[0]}</span>
          <span>${companyName.split(',')[1]}</span>
        </div>
        <button id="clear-company-data" class="red-marker-indicator">Clear</button>
      </div>
    `;
    companyInfoElement.style.display = 'initial';
    
    const clearButton = document.getElementById('clear-company-data');
    if (clearButton) {
      clearButton.addEventListener('click', clearCompanyData);
    }
  }
}

// Function to format date as DD-MM-YYYY
function formatDate(dateString) {
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
}

// Function to toggle grey markers visibility
function toggleGreyMarkers(checkbox) {
  // Simply rebuild the cluster with current filter settings
  filterAndAddMarkers();
}

// Initialize the application
function initializeApp() {
  // Check if we have original filtered data in localStorage
  if (localStorage.getItem(dataManager.originalKey)) {
    initializeMapWithFilteredData();
  } else {
    renderData();
  }

  // Initialize company data if available
  if (localStorage.getItem(dataManager.companyOriginalKey)) {
    renderCompanyMarkers();
  }

  // Add this to display company info on reload
  const companyData = JSON.parse(localStorage.getItem(dataManager.companyOriginalKey) || '[]');
  if (companyData.length > 0 && companyData[0].companyName) {
    displayCompanyInfo(companyData[0].companyName);
  }
}

// Function to toggle container minimize
function toggleMinimize() {
  const container = document.getElementById('container');
  const content = document.getElementById('tracker-content');
  const minimizeBtn = document.getElementById('minimize-btn');
  
  if (container.classList.contains('container-minimized')) {
    // Expand
    container.classList.remove('container-minimized');
    content.style.display = 'block';
    minimizeBtn.innerHTML = '<i class="fas fa-minus"></i>';
  } else {
    // Minimize
    container.classList.add('container-minimized');
    content.style.display = 'none';
    minimizeBtn.innerHTML = '<i class="fas fa-plus"></i>';
  }
}


