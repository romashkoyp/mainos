# Location Tracker

A map-based tool to track visited locations and campaign-specific locations in Jyväskylä.

## Features

- **Base Locations**: All available locations are shown as **grey markers**.
- **Campaigns**: Load one or more campaigns by ID. Each campaign gets a unique color for its markers.
- **Visited Tracking**: Mark any campaign location as "Visited" (turns green). Progress is saved automatically.
- **City Filter**: Filter markers by city using the dropdown.
- **Clustering**: Toggle clustering of markers on/off for easier viewing.
- **Legend**: View a legend explaining marker types and colors.
- **Import/Export**: Export your progress to a file or import it later to restore.
- **Campaign Management**: Show/hide individual campaigns, clear a specific campaign, or clear all campaigns.
- **Find My Location**: Center the map on your current location.
- **Persistent State**: Map view, filters, and campaign visibility are saved in your browser.

## How to Use

1. **View Locations**  
   The map displays all base locations as grey markers.

2. **Load Campaign Data**  
   - Enter a Campaign ID (e.g., `af79ad25-1bc0-4451-a8bc-600d12b36a68`) and click **Load**.
   - Campaign locations appear in a unique color (default: red if only one campaign).
   - You can load multiple campaigns; each will have its own color and toggle.

3. **Track Your Progress**  
   - Click a marker to open its popup.
   - Check the "Visited" box. The marker turns green, and statistics update.
   - Progress is saved automatically.

4. **Filter Markers**  
   - Use the **"Base markers"** toggle to show/hide grey base locations.
   - Use the campaign toggles to show/hide specific campaigns.
   - Use the **city filter dropdown** to show only markers from a specific city.

5. **Marker Legend**  
   - Click the **Legend** button to view marker types and color meanings.

6. **Clustering**  
   - Use the **Clustering markers** toggle to enable/disable marker clustering.

7. **Campaign Management**  
   - Use the **Clear** button next to a campaign to remove it.
   - Use the **Reset** button to refresh base marker data from the server.

8. **Save & Restore Progress**  
   - Click **Export** to save your progress to a file.
   - Click **Import** to load a previously saved file.

9. **Find My Location**  
   - Click **Find Me** to center the map on your current location.

## Marker Colors

- **Grey**: Base location (not visited, not part of any campaign).
- **[Campaign Color]**: Campaign-specific location (not visited).
- **Green**: Any location marked as "Visited" (across all campaigns).

## Notes

- All data is stored in your browser (IndexedDB and localStorage).
- You can load multiple campaigns at once and control their visibility.
- Clearing or importing data will remove all progress and