# Forest Team Requirements

## 1. Overview

### 1.1 Purpose
The Forest Team application is designed to be used by officials volunteering in the forest at an orienteering event.
At a high level, it displays a copy of the event map and the courses that have been planned on a mobile device.
It also uses GPS to display the device's current location on the map.

### 1.2 Target Users
- Course planners
- Course controllers
- Control hangers
- Event organizers

### 1.3 Primary Use Case
Officials can use the application to verify that controls are placed in the correct locations according to the course plan, even in areas without mobile network coverage.

## 2. Functional Requirements

### 2.1 Map Display (Must-Have)

**FR1:** The application shall display a georeferenced orienteering map
- The map shall support pinch-to-zoom gestures
- The map shall support pan/drag gestures
- The map shall maintain aspect ratio during zoom operations

**FR2:** The application shall support both portrait and landscape device orientations

**FR3:** The map view shall display an appropriate initial zoom level showing all controls for the selected event

### 2.2 Course Data Display (Must-Have)

**FR4:** The application shall display control locations as circles on the map
- Circle size shall be appropriate to map scale (IOF standard diameter)
- Start locations shall be displayed as triangles
- Finish locations shall be displayed as double circles

**FR5:** When a user taps on a control circle, the application shall display:
- List of all courses that include this control
- Control number for each course
- Control code (if available in the course data)

**FR6:** The application shall allow users to select one or more courses to display
- Each course shall be displayed by connecting controls with lines
- Each course shall use a distinct color for its lines
- Users shall be able to toggle course visibility on/off

**FR7:** The application shall display course-specific features:
- Start triangle
- Control circles with appropriate numbering
- Finish double circle
- Lines connecting controls in sequence

### 2.3 GPS Location Tracking (Must-Have)

**FR8:** The application shall provide a toggle to enable/disable GPS location tracking

**FR9:** When GPS is enabled, the application shall:
- Display the user's current location on the map
- Update the location in real-time (target: 1-5 second intervals)
- Display an accuracy circle around the user's location indicating GPS uncertainty
- Auto-center the map on the user's location (with option to disable auto-centering)

**FR10:** The GPS accuracy circle shall:
- Scale appropriately with map zoom level
- Indicate the approximate area where the device might be located based on GPS accuracy

**FR11:** The application shall display a warning when GPS accuracy is very poor (>50m)
- Warning should be prominent but not block usage
- User should be informed that control placement verification may be unreliable

### 2.4 Data Input (Must-Have)

**FR12:** The application shall accept georeferenced map files in one of these formats:
- JPEG + JPEG World File (.jgw), or
- Google KMZ file

**FR13:** The application shall accept course data in IOF XML v3 data standard format
- Specification: [datastandard-v3](https://github.com/international-orienteering-federation/datastandard-v3)
- Example file: [CourseData_Individual_Step2.xml](https://github.com/international-orienteering-federation/datastandard-v3/blob/master/examples/CourseData_Individual_Step2.xml)

**FR14:** The application shall provide a mechanism for users to upload/load event data:
- Initial file upload via browser (map file and course data file)
- Event data sharing via URL to allow other users to access the same event
- One map file per event
- One course data file per event

**FR15:** The application shall validate input files and provide clear error messages for:
- Invalid file formats
- Corrupted files
- Missing georeferencing data
- Invalid IOF XML structure

**FR16:** The application shall include demo/sample data (Must-Have)
- Pre-loaded sample event with map and course data
- Allows users to try the application without needing to upload their own data
- Clearly labeled as demo data

### 2.5 Multi-Event Support (Should-Have)

**FR17:** The application should allow users to store and switch between multiple events

**FR18:** The application should allow users to delete event data to free storage space

## 3. Non-Functional Requirements

### 3.1 Platform Support (Must-Have)

**NFR1:** The application shall be usable on iOS devices (phones and tablets)
- Minimum iOS version: iOS 13+

**NFR2:** The application shall be usable on Android devices (phones and tablets)
- Minimum Android version: Android 8.0+

**NFR3:** The application shall support common screen sizes from 5" phones to 12" tablets

### 3.2 Deployment (Must-Have)

**NFR4:** The application shall be accessible without requiring installation from app stores
- Recommended approach: Progressive Web App (PWA)
- Alternative: Installable web application

**NFR5:** The application shall function completely offline once event data is loaded
- All features must work without network connectivity
- GPS functionality must work offline

### 3.3 Performance (Must-Have)

**NFR6:** Map initial load time shall be under 5 seconds on typical devices

**NFR7:** Zoom and pan operations shall be smooth (target: 30+ fps)

**NFR8:** GPS location updates shall occur at least once every 5 seconds when enabled

**NFR9:** The application shall support map files up to 20MB

**NFR10:** The application shall support course data with up to 50 courses and 500 controls

### 3.4 Storage (Must-Have)

**NFR11:** The application shall use local storage for offline capability
- Maps and course data must persist between sessions
- Storage quota: plan for 100MB minimum per event

### 3.5 Battery Usage (Should-Have)

**NFR12:** The application should minimize battery drain
- GPS updates should use battery-efficient location services
- Screen should stay on while app is in use (configurable)

### 3.6 Usability (Must-Have)

**NFR13:** The user interface shall be usable outdoors in bright sunlight
- High contrast display options
- Readable text sizes

**NFR14:** Controls shall be large enough for use with gloves (minimum 44x44 points)

**NFR15:** The application shall provide visual feedback for all user interactions

### 3.7 Accessibility (Should-Have)

**NFR16:** The application should follow WCAG 2.1 Level AA guidelines where applicable
- Sufficient color contrast
- Support for system font size settings

## 4. Data Requirements

### 4.1 Map Data

- Format: JPEG + .jgw or KMZ
- Maximum file size: 20MB
- Coordinate system: Must include valid georeferencing information
- Resolution: Sufficient for 1:10,000 to 1:15,000 scale orienteering maps

### 4.2 Course Data

- Format: IOF XML v3 data standard
- Must include: control locations (latitude/longitude), course definitions, start/finish positions
- Optional: control descriptions, course names, distances

### 4.3 GPS Data

- Coordinate system: WGS84 (standard GPS)
- Accuracy: Display accuracy estimate provided by device
- Update frequency: 1-5 seconds when tracking is enabled

## 5. User Interface Requirements

### 5.1 Main Map View

- Full-screen map display
- Zoom controls (pinch gesture + optional buttons)
- GPS toggle button (prominent, easily accessible)
- Course selection button/menu
- Settings/menu access

### 5.2 Course Selection Interface

- List of all available courses
- Checkboxes or toggles for multiple selection
- Color indicator for each course
- "Select All" / "Deselect All" options

### 5.3 Control Information Popup

- Display when control is tapped
- Show course names and control numbers
- Easy to dismiss (tap outside or close button)

### 5.4 Event Selection/Management

- List of loaded events
- Load new event option
- Delete event option
- Switch between events

## 6. Technical Constraints

### 6.1 Technology Recommendations

- **Preferred approach:** Progressive Web App (PWA)
  - Enables offline functionality
  - No app store requirements
  - Cross-platform compatibility

- **Map rendering:** HTML5 Canvas or WebGL for performance

- **GPS access:** Geolocation API with high accuracy enabled

- **Storage:** IndexedDB for offline data persistence

### 6.2 Browser Support

If implemented as PWA:
- iOS Safari 13+
- Android Chrome 80+
- Support for service workers and cache API

### 6.3 External Dependencies

- IOF XML parser/library
- Georeferencing calculation library
- Map projection library (for coordinate transformations)

## 7. Assumptions

1. Users will have GPS-enabled devices
2. Users will perform initial setup and load event data while connected to the internet (typically outside the forest)
3. Map files will have accurate georeferencing information
4. Course data will conform to IOF XML v3 standard
5. Users are familiar with basic orienteering terminology and map symbols
6. Device GPS accuracy is typically 5-10 meters in forest conditions
7. Users may have limited technical expertise
8. Event planners will be responsible for uploading initial event data; other officials will access via shared URL

## 8. Constraints

1. Must work offline after initial data load
2. Cannot require app store distribution
3. Must work on both iOS and Android
4. Must use standard, non-proprietary file formats where possible
5. Development should prioritize ease of use over advanced features
6. GPS accuracy is limited by device hardware and environmental conditions

## 9. Success Criteria

The application will be considered successful if:

1. ✓ Officials can load an event's map and courses in under 2 minutes
2. ✓ The application works reliably without network coverage
3. ✓ Users can verify control placement accuracy within GPS limits (5-10m)
4. ✓ The application runs on 90%+ of common iOS and Android devices
5. ✓ Map navigation (zoom, pan) is smooth and intuitive
6. ✓ GPS location tracking is accurate enough for control placement verification
7. ✓ The application is usable by volunteers with minimal training (< 5 minutes)
8. ✓ No crashes or data loss during typical event usage (6-8 hours)

## 10. Out of Scope (Version 1.0)

The following features are explicitly **not** included in the initial version:

- Real-time competitor tracking
- Course editing or modification
- Live results integration
- Course printing functionality
- Vector-based map rendering (raster only)
- Integration with timing systems
- Multi-user collaboration features
- Course planning tools
- Control description creation
- Map creation or editing
- Social features or event sharing
- Analytics or usage statistics
- Error reporting/crash analytics
- User role management or different permission levels
- Course color customization
- Integration with orienteering federation databases
- Support for multiple map files per event

## 11. Future Enhancements (Post-Version 1.0)

Potential features for future versions, in priority order:

### 11.1 High Priority
1. Vector-based map support for improved clarity and smaller file sizes
2. Route recording (track where user has walked)
3. Distance/bearing measurement tools
4. Support for additional map formats (OOM, OCAD exports)
5. Improved course visualization (e.g., line styles, transparency)

### 11.2 Medium Priority
6. Support for multiple map files per event (different scales or areas)
7. Course color customization
8. Export functionality (screenshots, GPS tracks)
9. Notes/annotations on the map
10. Control description display
11. Offline map tile caching for larger areas
12. Compass overlay with device orientation

### 11.3 Low Priority
13. Integration with popular course planning software (direct import)
14. Spectator mode (simplified view for non-officials)
15. Weather overlay information
16. Multi-day event support with event progression tracking

## 12. Glossary

**Control:** A checkpoint on an orienteering course marked by an orange and white flag

**Course:** A planned route through a series of controls that competitors must visit in sequence

**IOF:** International Orienteering Federation - the governing body for the sport

**Georeferenced map:** A map image with coordinate information linking pixel positions to real-world geographic locations

**Control hanger:** Official responsible for placing controls in the forest at their designated locations

**Course planner:** Official who designs the courses for an event

**Course controller:** Official who verifies the course planner's work before an event

**KMZ:** Compressed Keyhole Markup Language file (Google Earth format)

**JPEG World File (.jgw):** A plain text file that provides georeferencing information for a JPEG image

**WGS84:** World Geodetic System 1984 - the coordinate system used by GPS

**PWA:** Progressive Web App - a web application that can work offline and be installed on devices

## 13. Acceptance Criteria

For each major feature, the following must be verified:

### Map Display
- [ ] Map loads and displays correctly on iOS and Android
- [ ] Pinch zoom works smoothly
- [ ] Pan/drag gestures work correctly
- [ ] Map maintains proper georeferencing at all zoom levels

### Course Display
- [ ] All controls display in correct locations
- [ ] Start triangles and finish double circles render correctly
- [ ] Course lines connect controls in proper sequence
- [ ] Multiple courses can be displayed with distinct colors
- [ ] Control information popup shows correct details

### GPS Functionality
- [ ] GPS can be toggled on/off
- [ ] User location displays correctly on map
- [ ] Accuracy circle scales appropriately
- [ ] Location updates in real-time
- [ ] GPS works offline
- [ ] Warning displays when GPS accuracy exceeds 50m

### Offline Capability
- [ ] Application loads without network connection
- [ ] All features work offline
- [ ] Event data persists between sessions
- [ ] No data loss when going offline

### File Import
- [ ] JPEG + .jgw files load correctly
- [ ] KMZ files load correctly
- [ ] IOF XML files parse correctly
- [ ] Invalid files show appropriate error messages
- [ ] Event data can be shared via URL
- [ ] Other users can access shared event data via URL

### Demo Data
- [ ] Demo/sample event data is included
- [ ] Demo data loads and displays correctly
- [ ] Demo data is clearly labeled

## 14. Risk Analysis

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| GPS inaccuracy in dense forest | High | Medium | Display accuracy circle; set user expectations |
| Large map files exceed storage limits | Medium | High | Implement file size limits; compression; warnings |
| IOF XML variations not supported | Medium | Medium | Test with multiple planning software outputs |
| Browser compatibility issues | Medium | High | Thorough cross-platform testing; fallback options |
| Poor performance on older devices | Medium | Medium | Set minimum device requirements; performance testing |
| Georeferencing calculation errors | Low | High | Validate against known coordinates; extensive testing |
| Battery drain from GPS usage | High | Low | Implement efficient GPS polling; user warnings |
