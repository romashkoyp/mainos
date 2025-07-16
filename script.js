// API Configuration
const address = 'https://atlasmedia.mediani.fi/api/v1/public-map-point-markers/';
const format = '/?format=json&page=';
const id = '100';
let page = 1;
const originalUrl = address + id + format + page;
const corsProxyUrl = 'https://corsproxy.io/?';
let url = corsProxyUrl + encodeURIComponent(originalUrl);

// let campaignId = 'af79ad25-1bc0-4451-a8bc-600d12b36a68';
let campaignId = null;
let campaignUrl = 'https://atlasmedia.mediani.fi/api/v1/reservation-resources-map/' + campaignId + '/?format=json'
let urlCampaign = corsProxyUrl + encodeURIComponent(campaignUrl);

// Data storage arrays
const allData = []; // Stores all raw data fetched from the base API
const filteredData = []; // Stores data filtered for a specific city (e.g., 'Jyväskylä')
const allCampaignData = []; // Stores raw data fetched from the campaign-specific API
const filteredCampaignData = []; // Stores campaign locations that match the base locations

// Initialize IndexedDB database and tables
const db = new Dexie('MainosDB');
db.version(1).stores({
  allMarkers: 'id, name, lat, lng',
  markersCampaigns: '[campaignId+markerId], campaignName, campaignDescription, campaignStartDate, campaignEndDate, markerName, markerLat, markerLng, markerVisited, markerDateVisited'
});

/**
 * Manages marker data operations using IndexedDB for storage.
 * Handles status tracking, timestamps, and campaign-specific data.
 */
class MarkerDataManager {
    constructor() {
        this.db = db;
    }

    /**
     * Gets the visited status for a campaign marker
     * @param {string} campaignId - The campaign ID
     * @param {number} markerId - The marker ID
     * @returns {Promise<boolean>} The visited status
     */
    async getStatus(campaignId, markerId) {
        try {
            const marker = await this.db.markersCampaigns.get([campaignId, markerId]);
            return marker ? marker.markerVisited : false;
        } catch (error) {
            console.error('Error getting marker status:', error);
            return false;
        }
    }

    /**
     * Gets the visited timestamp for a campaign marker
     * @param {string} campaignId - The campaign ID
     * @param {number} markerId - The marker ID
     * @returns {Promise<string|null>} The visited timestamp or null
     */
    async getTimestamp(campaignId, markerId) {
        try {
            const marker = await this.db.markersCampaigns.get([campaignId, markerId]);
            return marker ? marker.markerDateVisited : null;
        } catch (error) {
            console.error('Error getting marker timestamp:', error);
            return null;
        }
    }

    /**
     * Updates the visited status and timestamp for a campaign marker
     * @param {string} campaignId - The campaign ID
     * @param {number} markerId - The marker ID
     * @param {boolean} visited - The new visited status
     * @returns {Promise<void>}
     */
    async updateMarkerStatus(campaignId, markerId, visited) {
        try {
            const updateData = {
                markerVisited: visited,
                markerDateVisited: visited ? new Date().toISOString() : null
            };
            await this.db.markersCampaigns.update([campaignId, markerId], updateData);
        } catch (error) {
            console.error('Error updating marker status:', error);
        }
    }

    /**
     * Gets all campaign markers for a specific campaign
     * @param {string} campaignId - The campaign ID
     * @returns {Promise<Array>} Array of campaign markers
     */
    async getCampaignMarkers(campaignId) {
        try {
            return await this.db.markersCampaigns.where('campaignId').equals(campaignId).toArray();
        } catch (error) {
            console.error('Error getting campaign markers:', error);
            return [];
        }
    }

    /**
     * Gets all unique campaign IDs
     * @returns {Promise<Array>} Array of unique campaign IDs
     */
    async getAllCampaignIds() {
        try {
            const campaigns = await this.db.markersCampaigns.toArray();
            return [...new Set(campaigns.map(c => c.campaignId))];
        } catch (error) {
            console.error('Error getting campaign IDs:', error);
            return [];
        }
    }

    /**
     * Clears all campaign data for a specific campaign
     * @param {string} campaignId - The campaign ID to clear
     * @returns {Promise<void>}
     */
    async clearCampaignData(campaignId) {
        try {
            await this.db.markersCampaigns.where('campaignId').equals(campaignId).delete();
        } catch (error) {
            console.error('Error clearing campaign data:', error);
        }
    }

    /**
     * Clears all campaign data
     * @returns {Promise<void>}
     */
    async clearAllCampaignData() {
        try {
            await this.db.markersCampaigns.clear();
        } catch (error) {
            console.error('Error clearing all campaign data:', error);
        }
    }
}

const dataManager = new MarkerDataManager();

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
        const campaignToggle = document.getElementById('campaign-markers-toggle');
        const clusterSlider = document.getElementById('cluster-radius-slider');
        const filterState = {
            showAll: greyToggle ? greyToggle.checked : true,
            showCampaign: campaignToggle ? campaignToggle.checked : true,
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
        return savedState ? JSON.parse(savedState) : { showAll: true, showCampaign: true, clusterRadius: 70 };
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
    // Store allData in IndexedDB
    db.allMarkers.bulkAdd(allData.map(item => ({
      id: item.id,
      name: item.name,
      lat: item.lat,
      lng: item.lng
    }))).then(() => {
      console.log('All data added to IndexedDB');
    }).catch(e => {
      console.log(`Error: ${e}`);
    });
    renderMapMarkers();
  }
}

// Function to test some queries from IndexedDB data
async function testQueries() {
  try {
    // Test 1: Find special type of advertisement
    const allData = await db.allMarkers.toArray();
    const placesByTypeOfAdvertisement = [];

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
        const parts = item.name.split(' ');
        if (parts.length > 1) {
          uniqueLocations.add(parts[1].toLowerCase());
        }
      }
    });

    const locations = Array.from(uniqueLocations)
      .filter(Boolean)
      .map(str => str.charAt(0).toUpperCase() + str.slice(1));
    console.log('Locations:', locations);
  } catch (error) {
    console.error('Error running test queries:', error);
  }
}

/**
 * Fetches location data for a specific campaign from the API.
 * @returns {Promise<Object>} A promise that resolves to the JSON data from the API.
 */
const fetchCampaignData = async () => {
  const response = await fetch(urlCampaign);
  // console.log(response);
  if (!response.ok) {
    alert(`Failed to get campaign data. Status: ${response.status}`);
    return;
  }
  return response.json();
};

/**
 * Initiates the fetching and processing of campaign-specific data.
 */
async function processCampaignData() {
  const data = await fetchCampaignData();
  if (!data) return;

  allCampaignData.length = 0;
  allCampaignData.push(data);
  const campaignApiData = allCampaignData[0];

  if (campaignApiData && campaignApiData.reserved_resources) {
    try {
      // Clear existing data for this campaign to avoid duplicates
      await dataManager.clearCampaignData(campaignApiData.id);

      // Process and add new campaign data
      const campaignMarkers = [];
      campaignApiData.reserved_resources.forEach(resource => {
        if (resource.inventory_resource && resource.inventory_resource.map_point_markers) {
          resource.inventory_resource.map_point_markers.forEach(marker => {
            campaignMarkers.push({
              campaignId: campaignApiData.id,
              markerId: marker.id,
              markerName: marker.name,
              markerLat: marker.lat,
              markerLng: marker.lng,
              campaignStartDate: resource.start_date,
              campaignEndDate: resource.end_date,
              campaignName: campaignApiData.name,
              campaignDescription: campaignApiData.description,
              markerVisited: false,
              markerDateVisited: null
            });
          });
        }
      });

      // Bulk add all campaign markers
      if (campaignMarkers.length > 0) {
        await db.markersCampaigns.bulkAdd(campaignMarkers);
        console.log(`Campaign data for ${campaignApiData.id} added to IndexedDB (${campaignMarkers.length} markers)`);

        // Display campaign info and re-render markers
        displayCampaignInfo(campaignApiData.name);
        renderMapMarkers();
      }
    } catch (error) {
      console.error('Error processing campaign data:', error);
    }
  }
}

/**
 * Handles the "Load" button click. It reads the campaign ID from the input,
 * updates the API URL, and initiates the fetch process.
 */
function loadCampaignData() {
  const inputElement = document.getElementById('campaign-id-input');
  const inputCampaignId = inputElement.value.trim();
  
  if (!inputCampaignId) {
    alert('Please enter a Campaign ID');
    return;
  }
  
  campaignId = inputCampaignId;
  campaignUrl = 'https://atlasmedia.mediani.fi/api/v1/reservation-resources-map/' + campaignId + '/?format=json';
  urlCampaign = corsProxyUrl + encodeURIComponent(campaignUrl);
  
  inputElement.value = '';
  processCampaignData();
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
 * @param {string} campaignId - The campaign ID of the marker
 * @param {number} locationId - The ID of the location that was changed.
 * @param {HTMLInputElement} checkbox - The checkbox element that was clicked.
 */
async function handleStatusChange(campaignId, locationId, checkbox) {
  const newStatus = checkbox.checked;

  // Update the marker status in IndexedDB
  await dataManager.updateMarkerStatus(campaignId, locationId, newStatus);

  // Re-render all markers to apply new rules
  renderMapMarkers();

  // Re-open the popup of the marker that was just changed
  setTimeout(() => reopenPopup(locationId), 100);
}

/**
 * Determines the advertisement type from the item name
 * @param {string} name - The name of the advertisement location
 * @returns {string} The advertisement type: 'maxi', 'classic_keski', 'classic_single', or 'default'
 */
function getAdvertisementType(name) {
  if (typeof name !== 'string') return 'default';

  const lowerName = name.toLowerCase();
  if (lowerName.includes(' maxi')) {
    return 'maxi';
  } else if (lowerName.includes(' classic keski')) {
    return 'classic_keski';
  } else if (lowerName.includes(' classic single')) {
    return 'classic_single';
  }
  return 'default';
}

// Create custom marker icons for different states
// Unified SVG-based marker template system

/**
 * Creates a dynamic SVG marker icon with customizable color and shape
 * @param {string} color - The fill color for the marker (e.g., '#7B7B7B', '#DC143C', '#228B22')
 * @param {string} shape - The shape type: 'circle', 'rectangle', 'small-circle', or 'default'
 * @returns {L.DivIcon} A Leaflet divIcon with SVG content
 */
function createMarkerIcon(color, shape = 'default') {
  let innerShape = '';

  switch (shape) {
    case 'circle':
    case 'maxi':
      innerShape = '<circle cx="20" cy="20" r="13" fill="#FFFFFF" stroke="#000000" stroke-width="1"/>';
      break;
    case 'rectangle':
    case 'classic_keski':
      innerShape = '<rect width="10" height="32" x="15" y="9" rx="5" ry="5" fill="#FFFFFF" stroke="#000000" stroke-width="1"/>';
      break;
    case 'small-circle':
    case 'classic_single':
      innerShape = '<circle cx="20" cy="20" r="6" fill="#FFFFFF" stroke="#000000" stroke-width="1"/>';
      break;
    case 'default':
    default:
      innerShape = '<circle cx="20" cy="20" r="13" fill="#FFFFFF" stroke="#000000" stroke-width="1"/>';
      break;
  }

  return L.divIcon({
    className: 'my-div-icon',
    html: `<div>
            <svg width="25" height="41" viewBox="0 0 40 65" xmlns="http://www.w3.org/2000/svg">
              <path d="M20 2 C30 2 38 10 38 20 C38 30 20 65 20 65 C20 65 2 30 2 20 C2 10 10 2 20 2 Z"
                fill="${color}",
                stroke="black",
                stroke-width="1"/>
              ${innerShape}
            </svg>
          </div>`,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34]
  });
}

// Define color constants for different campaign IDs
const MARKER_COLORS = {
  BLUE: '#2A81CB',
  GOLD: '#FFD326',
  RED: '#CB2B3E',
  GREEN: '#2AAD27', // only for visited markers
  ORANGE: '#CB8427',
  YELLOW: '#CAC428',
  VIOLET: '#9C2BCB',
  GREY: '#7B7B7B' // default color for base locations
};

/**
 * Gets the appropriate marker icon based on campaign ID and color
 * @param {string} campaignId - Campaign ID
 * @param {string} color - The color for the marker
 * @returns {L.DivIcon} The appropriate marker icon
 */
function getMarkerIcon(campaignId, color = MARKER_COLORS.GREY) {
  switch (campaignId) {
    case 'maxi':
      return createMarkerIcon(color, 'maxi');
    case 'classic_keski':
      return createMarkerIcon(color, 'classic_keski');
    case 'classic_single':
      return createMarkerIcon(color, 'classic_single');
    default:
      return createMarkerIcon(color, 'default');
  }
}

// Legacy function for backward compatibility with grey markers
function getGreyIconByType(campaignId) {
  return getMarkerIcon(campaignId, MARKER_COLORS.GREY);
}

/**
 * Creates a marker icon for campaign layers with custom color
 * This function can be used for different campaign IDs
 * @param {string} campaignId - Campaign ID
 * @param {string} campaignType - The type of campaign ('ID1', 'ID2', etc.)
 * @returns {L.DivIcon} The appropriate campaign marker icon
 */
function getCampaignMarkerIcon(campaignId, campaignType = 'default') {
  const campaignColors = {
    'default': MARKER_COLORS.RED
  };

  const color = campaignColors[campaignType] || MARKER_COLORS.RED;
  return getMarkerIcon(campaignId, color);
}

/**
 * Helper function to determine campaign type based on campaign data
 * This can be extended in the future to support different campaign classifications
 * @param {Object} campaignData - The campaign data object
 * @returns {string} The campaign type
 */
function getCampaignType(campaignData) {
  // Future implementation could check campaign properties like:
  // - campaignData.tier (premium, standard, basic)
  // - campaignData.partnership_level
  // - campaignData.subscription_type
  // For now, return 'default' for all companies

  // Suppress unused parameter warning for future implementation
  void campaignData;
  return 'default';
}

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
 * @param {boolean} isCampaign - Whether this is a campaign-specific location.
 * @returns {string} The HTML string for the popup.
 */
function createPopupContent(placeData, isCampaign) {
    const checkboxId = `status-${placeData.markerId || placeData.id}`;
    const currentStatus = placeData.markerVisited || false;
    const isChecked = currentStatus ? 'checked' : '';

    let campaignInfoHtml = '';
    if (isCampaign) {
        let visitedHtml = '';
        if (placeData.markerDateVisited) {
            visitedHtml = `<div class="popup-info"><i class="fas fa-check-circle"></i>Visited on: ${formatTimestamp(placeData.markerDateVisited)}</div>`;
        }
        campaignInfoHtml = `
            ${visitedHtml}
            <div class="popup-info"><i class="fas fa-building"></i>Campaign: ${placeData.campaignName}</div>
            <div class="popup-info"><i class="fas fa-info-circle"></i>Description: ${placeData.campaignDescription || 'N/A'}</div>
            <div class="popup-info"><i class="fas fa-calendar-alt"></i>Start Date: ${formatDate(placeData.campaignStartDate)}</div>
            <div class="popup-info"><i class="fas fa-calendar-alt"></i>End Date: ${formatDate(placeData.campaignEndDate)}</div>
        `;
    }

    const markerName = placeData.markerName || placeData.name;
    const markerId = placeData.markerId || placeData.id;
    const campaignId = placeData.campaignId || '';

    return `
        <div class="popup-content">
            <h3>${markerName}</h3>
            ${campaignInfoHtml}
            ${isCampaign ? `
            <div class="checkbox-container">
                <label class="checkbox-label">
                    <input type="checkbox" id="${checkboxId}" ${isChecked} onchange="handleStatusChange('${campaignId}', ${markerId}, this)" class="checkbox-input"/>
                    <span class="${currentStatus ? 'status-text-visited' : 'status-text-not-visited'}">${currentStatus ? 'Visited' : 'Not Visited'}</span>
                </label>
            </div>
            ` : ''}
        </div>
    `;
}

/**
 * The main rendering function. It clears existing markers from the map and adds new ones
 * Implements visibility logic:
 * - If only grey markers are active - show them
 * - If grey and campaign markers with the same ID are active, campaign markers are visible, but grey for the same ID marker - not
 * - If for markerID active several campaigns - show all of them
 */
async function renderMapMarkers() {
    // Remove old layer and create a new one with the current cluster radius
    if (markersLayer) map.removeLayer(markersLayer);
    markersLayer = L.markerClusterGroup({
        maxClusterRadius: clusterRadius,
        spiderfyOnMaxZoom: true,
        showCoverageOnHover: false,
        zoomToBoundsOnClick: true
    });

    const showGreyMarkers = document.getElementById('grey-markers-toggle').checked;
    const showCampaignMarkers = document.getElementById('campaign-markers-toggle')?.checked;

    try {
        // Get all data from IndexedDB
        const [allBaseLocations, allCampaignLocations] = await Promise.all([
            db.allMarkers.toArray(),
            db.markersCampaigns.toArray()
        ]);

        // Create a set of marker IDs that have campaign data
        const campaignMarkerIds = new Set();
        if (showCampaignMarkers && allCampaignLocations.length > 0) {
            allCampaignLocations.forEach(campaign => {
                campaignMarkerIds.add(campaign.markerId);
            });
        }

        // Add grey markers (only if they don't have campaign data when campaign markers are shown)
        if (showGreyMarkers && allBaseLocations.length > 0) {
            allBaseLocations.forEach(place => {
                // Skip grey markers if campaign markers are shown and this marker has campaign data
                if (showCampaignMarkers && campaignMarkerIds.has(place.id)) {
                    return;
                }

                const advertisementType = getAdvertisementType(place.name);
                const icon = getMarkerIcon(advertisementType, MARKER_COLORS.GREY);
                const popupContent = createPopupContent(place, false);
                const marker = L.marker([place.lat, place.lng], { icon });
                marker.locationId = place.id;
                marker.bindPopup(popupContent);
                markersLayer.addLayer(marker);
            });
        }

        // Add campaign markers with different colors per campaign
        if (showCampaignMarkers && allCampaignLocations.length > 0) {
            // Group campaigns by ID to assign different colors
            const campaignColors = {};
            const availableColors = [
                MARKER_COLORS.RED,
                MARKER_COLORS.BLUE,
                MARKER_COLORS.ORANGE,
                MARKER_COLORS.YELLOW,
                MARKER_COLORS.VIOLET
            ];

            let colorIndex = 0;
            const uniqueCampaignIds = [...new Set(allCampaignLocations.map(c => c.campaignId))];
            uniqueCampaignIds.forEach(campaignId => {
                campaignColors[campaignId] = availableColors[colorIndex % availableColors.length];
                colorIndex++;
            });

            allCampaignLocations.forEach(place => {
                const advertisementType = getAdvertisementType(place.markerName);
                // Use visited color if marker is visited, otherwise use campaign color
                const campaignColor = campaignColors[place.campaignId];
                const markerColor = place.markerVisited ? MARKER_COLORS.GREEN : campaignColor;
                const icon = getMarkerIcon(advertisementType, markerColor);
                const popupContent = createPopupContent(place, true);
                const marker = L.marker([place.markerLat, place.markerLng], { icon });
                marker.locationId = place.markerId;
                marker.campaignId = place.campaignId;
                marker.bindPopup(popupContent);
                markersLayer.addLayer(marker);
            });
        }

        // Add the layer to the map
        map.addLayer(markersLayer);

    } catch (error) {
        console.error('Error loading markers from IndexedDB:', error);
        // Add empty layer to prevent errors
        map.addLayer(markersLayer);
    }
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
 * Displays the campaign information panel in the UI.
 * @param {string} campaignName - The name of the campaign to display.
 */
function displayCampaignInfo(campaignName) {
  const campaignInfoElement = document.getElementById('campaign-info');
  if (campaignInfoElement) {
    const savedFilters = prefsManager.loadFilterState();
    campaignInfoElement.innerHTML = `
      <div class="campaign-info-content">
        <input type="checkbox" id="campaign-markers-toggle" ${savedFilters.showCampaign ? 'checked' : ''} class="checkbox-input-campaign" />
        <div class="campaign-name">
          <span>${campaignName}</span>
        </div>
        <button id="clear-campaign-data" class="red-marker-indicator">Clear</button>
      </div>
    `;
    campaignInfoElement.style.display = 'initial';
    
    // Add event listeners to the newly created elements
    document.getElementById('campaign-markers-toggle').addEventListener('change', saveStateAndRender);
    document.getElementById('clear-campaign-data').addEventListener('click', clearCampaignData);
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
 * Clears all campaign data and updates the UI
 */
async function clearCampaignData() {
  try {
    await dataManager.clearAllCampaignData();

    // Hide campaign info panel
    const campaignInfoElement = document.getElementById('campaign-info');
    if (campaignInfoElement) {
      campaignInfoElement.style.display = 'none';
    }

    // Re-render the map
    renderMapMarkers();

    console.log('All campaign data cleared');
  } catch (error) {
    console.error('Error clearing campaign data:', error);
    alert('Error clearing campaign data. Please try again.');
  }
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
 * either fetches initial data or renders the map using data from IndexedDB.
 */
async function initializeApp() {
  const savedFilters = prefsManager.loadFilterState();
  document.getElementById('grey-markers-toggle').checked = savedFilters.showAll;

  // Restore cluster slider state
  const clusterSlider = document.getElementById('cluster-radius-slider');
  const clusterValueSpan = document.getElementById('cluster-radius-value');
  clusterRadius = parseInt(savedFilters.clusterRadius);
  clusterSlider.value = clusterRadius;
  clusterValueSpan.textContent = clusterRadius;

  try {
    // Check if base data already exists in IndexedDB
    const markerCount = await db.allMarkers.count();

    if (markerCount > 0) {
      // Check for existing campaign data
      const campaignIds = await dataManager.getAllCampaignIds();
      if (campaignIds.length > 0) {
        // Get the first campaign's data to display info
        const firstCampaignMarkers = await dataManager.getCampaignMarkers(campaignIds[0]);
        if (firstCampaignMarkers.length > 0) {
          displayCampaignInfo(firstCampaignMarkers[0].campaignName);
        }
      } else {
        // Hide campaign info panel if no campaign data
        const campaignInfoElement = document.getElementById('campaign-info');
        if (campaignInfoElement) campaignInfoElement.style.display = 'none';
      }

      // Render the map with existing data
      renderMapMarkers();
    } else {
      // If no data exists, fetch it from the API
      renderData();
    }
  } catch (error) {
    console.error('Error initializing app:', error);
    // Fallback to fetching data
    renderData();
  }
}

/**
 * Exports all marker data to a JSON file
 */
async function exportData() {
  try {
    const [allMarkers, campaignMarkers] = await Promise.all([
      db.allMarkers.toArray(),
      db.markersCampaigns.toArray()
    ]);

    const exportData = {
      allMarkers,
      campaignMarkers,
      exportDate: new Date().toISOString()
    };

    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `mainos-data-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    console.log('Data exported successfully');
  } catch (error) {
    console.error('Error exporting data:', error);
    alert('Error exporting data. Please try again.');
  }
}

/**
 * Imports marker data from a JSON file
 */
async function importData(event) {
  const file = event.target.files[0];
  if (!file) return;

  try {
    const text = await file.text();
    const importData = JSON.parse(text);

    if (importData.allMarkers) {
      await db.allMarkers.clear();
      await db.allMarkers.bulkAdd(importData.allMarkers);
    }

    if (importData.campaignMarkers) {
      await db.markersCampaigns.clear();
      await db.markersCampaigns.bulkAdd(importData.campaignMarkers);
    }

    // Re-render the map with imported data
    renderMapMarkers();

    // Update campaign info if available
    const campaignIds = await dataManager.getAllCampaignIds();
    if (campaignIds.length > 0) {
      const firstCampaignMarkers = await dataManager.getCampaignMarkers(campaignIds[0]);
      if (firstCampaignMarkers.length > 0) {
        displayCampaignInfo(firstCampaignMarkers[0].campaignName);
      }
    }

    console.log('Data imported successfully');
    alert('Data imported successfully!');
  } catch (error) {
    console.error('Error importing data:', error);
    alert('Error importing data. Please check the file format.');
  }

  // Clear the file input
  event.target.value = '';
}

// Initialize the application when the page loads
document.addEventListener('DOMContentLoaded', initializeApp);