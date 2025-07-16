# Location Tracker

A simple map-based tool to track visited locations for specific campaigns.

## How to Use

1.  **View Locations**: The map initially displays all available locations in Jyväskylä as **grey markers**.

2.  **Load Campaign Data**:
    *   An example Campaign ID is `af79ad25-1bc0-4451-a8bc-600d12b36a68`. Click the **Load** button to see locations specific to that campaign.
    *   Campaign-specific locations that you haven't visited will appear as **red markers**.

3.  **Track Your Progress**:
    *   Click any marker on the map to open a popup.
    *   Check the "Visited" box. The marker will turn **green**, and the progress statistics will update.
    *   All progress is saved automatically in your browser.

4.  **Filter Markers**:
    *   Use the **"All markers"** toggle to show or hide the base (grey) locations.
    *   After loading campaign data, a new toggle appears. Use it to show or hide the unvisited campaign (red) locations.
    *   Use the **"Clear"** button to remove the campaign data overlay and return to the base view.

5.  **Adjust Marker Clustering**:
    *   Use the **Cluster Radius** slider at the bottom of the control panel to change how markers are grouped.
    *   A smaller radius will show more individual markers, while a larger radius will group more markers into clusters.

6.  **Save & Restore Progress**:
    *   Click **Export** to save your current progress (visited locations and campaign data) to a file.
    *   Click **Import** to load a previously saved file, restoring your progress.

## Marker Colors

-   **Grey**: A base location, not yet visited.
-   **Red**: A campaign-specific location, not yet visited.
-   **Green**: Any location that has been marked as "Visited".