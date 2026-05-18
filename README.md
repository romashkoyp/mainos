# Location Tracker

A map-based tool to track visited locations and campaign-specific locations across Finnish cities.

## Features

- **Base Locations**: All available locations are shown as **grey markers**.
- **Campaigns**: Load one or more campaigns by pasting an Odoo URL. Each campaign gets a unique color for its markers.
- **Visited Tracking**: Mark any campaign location as "Visited" (turns green). Progress is saved automatically.
- **City Filter**: Filter markers by city using the dropdown.
- **Legend**: View a legend explaining marker types and colors.
- **Import/Export**: Export your progress to a file or import it later to restore.
- **Campaign Management**: Show/hide individual campaigns, clear a specific campaign, or clear all campaigns.
- **Find My Location**: Center the map on your current location.
- **Work Report**: Generate and download a daily work report as an `.ics` calendar event.
- **Persistent State**: Map view, filters, and campaign visibility are saved in your browser.

## How to Use

1. **View Locations**
   The map displays all base locations as grey markers.

2. **Load Campaign Data**
   - Paste the full Odoo campaign URL (e.g., `https://kengurumedia.odoo.com/...`) and click **Load**.
   - The tool automatically fetches and parses the campaign locations.
   - Campaign locations appear in a unique color.
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

6. **Campaign Management**
   - Use the **Clear** button next to a campaign to remove it.

7. **Save & Restore Progress**
   - Click **Export** to save your progress to a file.
   - Click **Import** to load a previously saved file.

8. **Find My Location**
   - Click **Find Me** to center the map on your current location.

9. **Work Report**
   - Click **Report** to open the work report modal.
   - Fill in starting and ending kilometers, select the campaigns worked on, enter advertisement counts by type, and add any extra work notes.
   - Click **Download Report** to generate and download the report as an `.ics` calendar event.

## Marker Types

| Type | Shape |
|---|---|
| Maxi | Circle inside pin |
| Classic Keski | Tall rectangle inside pin |
| Classic Single | Small circle inside pin |
| Classic Tupla | Twin circles inside pin |

## Marker Colors

- **Grey**: Base location (not part of any campaign).
- **[Campaign Color]**: Campaign-specific location (not yet visited).
- **Green**: Any location marked as "Visited".

## Notes

- All data is stored in your browser (IndexedDB and localStorage).
- You can load multiple campaigns at once and control their visibility independently.
- Clearing or importing data will remove all existing progress.
