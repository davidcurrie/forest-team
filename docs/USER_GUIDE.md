# Forest Team User Guide

Complete guide for orienteering event officials using Forest Team.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Installing the App](#installing-the-app)
3. [Uploading Events](#uploading-events)
4. [Viewing Maps](#viewing-maps)
5. [Using GPS](#using-gps)
6. [Managing Events](#managing-events)
7. [Troubleshooting](#troubleshooting)
8. [Tips & Best Practices](#tips--best-practices)

## Getting Started

### What is Forest Team?

Forest Team is a mobile-friendly web app designed for orienteering event officials who need to:
- View georeferenced maps in the forest
- See course layouts with accurate control positions
- Track their GPS location to verify control placement
- Work completely offline without network coverage

### What You Need

**Device Requirements:**
- iPhone with iOS 13+ (Safari browser)
- Android phone with Chrome 80+
- Or desktop browser for preparation

**Files Required:**
- Georeferenced map (JPEG + .jgw world file, or KMZ)
- Course data (IOF XML v3 format from Condes or Purple Pen)

## Installing the App

### On iPhone (iOS)

1. Open Safari and visit the Forest Team URL
2. Tap the **Share** button (square with arrow)
3. Scroll down and tap **Add to Home Screen**
4. Tap **Add** in the top-right corner
5. The app icon appears on your home screen

### On Android

1. Open Chrome and visit the Forest Team URL
2. Tap the **three-dot menu** in the top-right
3. Tap **Add to Home screen** or **Install app**
4. Tap **Add** or **Install**
5. The app icon appears in your app drawer

### First Launch

1. Grant location permissions when prompted (for GPS tracking)
2. You'll see the home screen with two options:
   - **Upload New Event** - Add your first event
   - **View Events** - See stored events

## Uploading Events

### Step 1: Prepare Your Files

**Map Files - Option A: JPEG + World File**
- `.jpg` - Your orienteering map image
- `.jgw` - World file with georeferencing data (6 lines of numbers)

Both files must have the same name (e.g., `my-map.jpg` and `my-map.jgw`).

**Map Files - Option B: KMZ**
- `.kmz` - Zipped file containing KML and map image
- Export from mapping software or create manually

**Course File:**
- `.xml` - IOF XML v3 format
- Export from Condes: File > Export > IOF XML 3.0
- Export from Purple Pen: File > Export > IOF XML

### Step 2: Upload Process

1. From the home screen, tap **Upload New Event**

2. Enter event details:
   - **Event Name**: e.g., "Spring Classic 2024"
   - **Event Date**: Select the date

3. Upload map:
   - Tap **Choose Map Files**
   - Select your JPEG image first
   - Then select the matching .jgw file
   - OR select a .kmz file

4. Upload course:
   - Tap **Choose Course File**
   - Select your IOF XML file

5. Tap **Create Event**

The app will:
- Validate your files
- Process georeferencing
- Parse course data
- Store everything locally on your device
- Automatically navigate to the map view

**Processing Time:** Usually 2-5 seconds, can be up to 30 seconds for large maps.

### Common Upload Errors

**"Invalid world file format"**
- World file must have exactly 6 lines
- Each line must be a number
- Check for extra spaces or blank lines

**"Map image too large"**
- Maximum file size: 20MB
- Compress your JPEG to reduce size
- Recommended: 3000x3000 pixels max

**"Invalid IOF XML"**
- Ensure XML is version 3.0
- Check that courses have control coordinates
- Verify file isn't corrupted

## Viewing Maps

### Navigation

**Zoom:**
- Pinch to zoom in/out
- Or use the **+/−** buttons (top-right)

**Pan:**
- Drag with one finger to move around
- Works smoothly even with gloves

**Controls:**
- **Course Selector** (top-left): Toggle courses on/off
- **GPS Toggle** (top-right): Enable location tracking
- **Zoom Controls** (below GPS): Zoom in/out buttons

### Course Selector

Located in the top-left corner:

1. **Expand/Collapse** - Click the arrow icon
2. **Show All** - Make all courses visible
3. **Hide All** - Hide all courses
4. **Individual Courses** - Check/uncheck each course

**Color Coding:**
- Each course has a unique color
- Control circles are purple
- Course lines match the course color
- Start triangles and finish circles are purple

### Control Information

**View Control Details:**
1. Tap any control circle on the map
2. A popup shows:
   - Control code (e.g., "101")
   - All courses using this control
   - Control number on each course

**Close Popup:**
- Tap anywhere outside the popup
- Or tap another control

### Map Symbols

| Symbol | Meaning |
|--------|---------|
| Purple Circle | Control (5m diameter) |
| Purple Triangle | Start (points toward first control) |
| Purple Double Circle | Finish |
| Colored Lines | Course routes (connecting controls) |
| Blue Circle | Your GPS position |

## Using GPS

### Enabling GPS

1. Tap the **GPS button** (top-right)
2. Grant location permission if prompted
3. Wait for GPS fix (5-30 seconds)
4. Your position appears as a blue circle

### GPS Indicators

**Button States:**
- Gray - GPS disabled
- Blue border - GPS active, good accuracy
- Yellow border - GPS active, low accuracy (>50m)
- Red border - GPS error

**Accuracy Display:**
- Small text below GPS button shows accuracy (e.g., "±8m")
- Larger circle around your position shows accuracy range

### Accuracy Warnings

**Yellow Warning (>50m accuracy):**
- "Low Accuracy - GPS accuracy: ±75m"
- Common causes: Dense forest canopy, nearby buildings
- Wait for better accuracy or move to clear area

**Red Warning (>100m accuracy):**
- "Very Low Accuracy - GPS accuracy: ±150m"
- GPS not reliable for control verification
- Move to area with better sky view

### GPS Best Practices

**For Best Accuracy:**
- Wait 1-2 minutes after enabling GPS for initial fix
- Stay in one place while GPS stabilizes
- Avoid dense tree cover if possible
- Clear sky view improves accuracy

**Battery Conservation:**
- Turn off GPS when not needed
- GPS uses significant battery power
- Bring external battery pack for full-day events

**Offline GPS:**
- GPS works completely offline
- Uses device GPS chip, not network location
- No internet connection required

## Managing Events

### Viewing All Events

1. From home screen, tap **View Events**
2. See all stored events sorted by date
3. Each event shows:
   - Event name
   - Date
   - Number of courses
   - "Demo" badge (if applicable)

### Switching Events

Simply tap **View Map** on any event to open it.

### Sharing Events

**⚠️ Important Limitation:** The Share feature only copies a URL to your event - it does NOT transfer event data to other users. Recipients will need to upload the same map and course files to their own device before the URL will work.

**How Sharing Works:**

1. Go to **View Events**
2. Find the event you want to share
3. Tap **Share** to copy the event URL to clipboard
4. Send the URL to others via text, email, etc.
5. Recipients must:
   - Upload the **same map files** (JPEG + JGW or KMZ)
   - Upload the **same course file** (IOF XML)
   - Give it the **same event name** (optional but recommended)
   - Then the shared URL will open their locally-stored copy

**Why This Limitation?**
All event data is stored locally in your browser for privacy and offline functionality. There's no server to sync data between users. This architecture ensures the app works completely offline but means each user needs their own copy of the files.

### Deleting Events

1. Go to **View Events**
2. Find the event to delete
3. Tap **Delete**
4. Confirm deletion

**Warning:** This cannot be undone. Demo events cannot be deleted.

### Storage Management

**Check Storage:**
- View Events page shows storage usage at top
- Bar shows used/available space
- Color indicates status:
  - Green: <60% used
  - Yellow: 60-80% used
  - Red: >80% used

**Free Up Space:**
- Delete old events you no longer need
- Each event uses 2-15MB depending on map size

## Troubleshooting

### GPS Issues

**Problem: "Location permission denied"**
- Solution: Enable location in browser settings
- iOS: Settings > Safari > Location > While Using
- Android: Settings > Apps > Chrome > Permissions > Location

**Problem: GPS not acquiring fix**
- Check: Are you indoors? GPS needs sky view
- Try: Move to window or outside
- Wait: Initial fix can take 1-2 minutes

**Problem: GPS jumps around**
- Common in dense forest with poor sky view
- Watch accuracy indicator - only trust <20m
- Wait for accuracy to stabilize

### Map Display Issues

**Problem: Map not showing**
- Check: Did upload complete successfully?
- Verify: World file coordinates are correct
- Try: Delete and re-upload event

**Problem: Controls in wrong position**
- Cause: Incorrect georeferencing in world file
- Solution: Verify world file values with mapping software

**Problem: Map loads slowly**
- Normal for large maps (>10MB)
- Wait 5-10 seconds for initial load
- Consider reducing map file size

### Upload Problems

**Problem: "Event name is required"**
- Enter a name before uploading

**Problem: "Invalid world file"**
- Check .jgw file format (6 lines, numbers only)
- Ensure .jpg and .jgw have matching filenames

**Problem: Upload freezes**
- Large files take longer (up to 30 seconds)
- Don't close browser during upload
- Check browser console for errors

### App Installation

**Problem: Can't find "Add to Home Screen"**
- iOS: Use Safari browser (not Chrome)
- Android: Use Chrome browser
- Desktop: Not available (use browser)

**Problem: App icon disappeared**
- Reinstall from browser
- Data is still saved locally

## Tips & Best Practices

### Before the Event

1. **Upload and test** files at home with good internet
2. **Verify control positions** with GPS in known locations
3. **Charge your device** fully
4. **Bring power bank** for all-day use
5. **Download offline** - ensure app works in airplane mode

### During the Event

1. **Enable GPS early** - give it time to get accurate fix
2. **Check accuracy** before verifying control positions
3. **Turn off GPS** when not actively using it (saves battery)
4. **Use airplane mode** to save battery (GPS still works)
5. **Keep screen brightness** at minimum readable level

### File Preparation

**Maps:**
- Use 1:15,000 scale for best results
- Keep file size under 10MB for fast loading
- Test georeferencing before event day
- JPEG quality 80-90% is sufficient

**Courses:**
- Export from latest version of Condes/Purple Pen
- Verify all controls have coordinates
- Include all courses in single XML file
- Test file opens in course software

### Battery Life

**To Maximize Battery:**
- Close other apps
- Reduce screen brightness
- Enable airplane mode (GPS still works)
- Turn off GPS when not needed
- Bring 10,000+ mAh power bank

**Expected Usage:**
- Map viewing only: 6-8 hours
- GPS tracking: 3-4 hours continuous
- Mixed usage: 4-6 hours

### Data Management

**Storage Planning:**
- Average event: 3-5MB
- Large event: 10-15MB
- Device capacity: Usually 100MB+ available
- Plan for 10-20 events on device

**Backup:**
- Keep original map and course files
- Events stored only on your device
- No cloud backup
- Reinstalling app loses all data

## Advanced Features

### Working with Projected Coordinates

**Current Limitation:**
- World files with projected coordinates (UTM, etc.) require .prj file
- Without .prj file, course rendering is disabled
- KMZ files always work (use geographic coordinates)

**Workaround:**
- Convert map to KMZ format with geographic coordinates
- Or use world file with lat/lng values

### Multi-Course Comparison

1. Enable multiple courses in course selector
2. Each course shows in different color
3. Shared controls show all visiting courses in popup
4. Zoom out to see all courses at once

### Offline Operation

**What Works Offline:**
- Viewing all stored events
- Map display with full functionality
- GPS tracking (uses device GPS chip)
- Course visualization
- All navigation and controls

**What Doesn't Work Offline:**
- Uploading new events (file processing requires initial online load)
- Installing app updates (service worker updates require connection)

**Note on Sharing:**
- URL copy works offline
- However, sharing is limited - recipients must upload the same files separately (see Sharing Events section)

## Keyboard Shortcuts

When using on desktop:

- `+` / `=` - Zoom in
- `-` - Zoom out
- Arrow keys - Pan map
- `G` - Toggle GPS
- `Esc` - Close popups

## Accessibility

Forest Team is designed for outdoor use:

- **Large touch targets** (44x44 points) - works with gloves
- **High contrast colors** - readable in bright sunlight
- **Screen reader support** - for visually impaired officials
- **Keyboard navigation** - all features accessible without mouse
- **Zoom up to 400%** - for better visibility

## Getting Help

**Documentation:**
- README.md - Overview and quick start
- TESTING.md - Technical testing details
- This guide - Complete user instructions

**Common Questions:**
1. Q: Does GPS work offline?
   A: Yes! GPS uses your device's GPS chip, not network location.

2. Q: How accurate is GPS?
   A: Typically 5-10m in open areas, can be >50m in dense forest.

3. Q: Can I share events with my team?
   A: You can share the event URL, but it does NOT transfer data. Each team member must upload the same map and course files to their own device. The URL only works as a bookmark to their local copy. This limitation exists because all data is stored locally in your browser for offline functionality.

4. Q: What if I lose my phone?
   A: All data is lost. Keep original files as backup.

5. Q: Can I export data?
   A: Not currently. Feature planned for future release.

**Support:**
- Email: support@forestteam.app
- Issues: GitHub Issues
- Community: Orienteering forums

---

**Happy course setting!** 🧭🌲
