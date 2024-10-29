
# Resource Auto-Refresh Script for FiveM

**Tired of having to manually refresh and restart your resources every time you make a change?** This script automates the process by watching for file changes in your resource folders and automatically restarting the affected resources whenever it detects updates.

## Features

- Monitors specified resources for changes in files.
- Automatically refreshes and restarts the resource whenever a modification is detected.
- Easy setup with customizable resource paths.

## Installation

1. Clone this repository or download the script file.
2. Config the script
3. Start the script in server.cfg

## Configuration

To set up the script for a specific resource, define the resource name and path in the script:

```javascript
const resourceName = 'MCore';
const resourcePath = `./resources/${resourceName}`;
```

Alternatively, you can configure the script to watch all resources by setting the `resourcePath` to the main resources folder.

## Adding Permissions in `server.cfg`

To grant the necessary permissions, add the following lines to your `server.cfg` file:

```plaintext
add_ace resource.MRefresh command.stop allow
add_ace resource.MRefresh command.start allow
add_ace resource.MRefresh command.refresh allow
add_ace resource.MRefresh command.restart allow
```

## Usage

1. Ensure your FiveM server is running.
2. Run the script in server.cfg

## Notes

- The script will detect any change in the specified resource directory.
- Each time a change is detected, it will automatically refresh and restart the resource using the following commands:
    ```javascript
    ExecuteCommand("refresh");
    ExecuteCommand("restart " + resourceName);
    ```
- This script was designed to run continuously, so keep it running as long as you need automatic restarts.

## Dependencies

- [chokidar](https://www.npmjs.com/package/chokidar): Used to watch for file changes.
