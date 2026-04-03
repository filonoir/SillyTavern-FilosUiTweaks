# Filo Theme Settings

A small SillyTavern extension that adjusts how the UI behaves on desktop and mobile-sized screens.

It adds a settings drawer to the SillyTavern extensions settings panel and applies its changes immediately when the app loads or when the window is resized.

It also fixes some quirks on iOS devices, especially on large iPads such as the iPad Pro.

It has been tested only with the default SillyTavern UI.

## Requirements

- SillyTavern `1.17.0` or newer

## Where to find the settings

Open SillyTavern, then go to the extensions settings area.  
This extension adds a drawer named **Filo Theme Settings**.

Each setting has:

- a slider
- a numeric input
- live preview / immediate application

If you set a control to its minimum value, that setting is treated as disabled. The UI will dim the row, hide the number input, and show `off` instead of `px`.

## Screen size logic

The extension uses the same hard breakpoint as the default SillyTavern UI:

- `> 1000px` = desktop behavior
- `<= 1000px` = mobile behavior

Desktop-only settings do nothing on smaller screens.  
The mobile adjustment setting only works on screens at or below `1000px`.

## Settings

### Minimum desktop chat size

Default: `950px`  
Range: `600px` to `1000px`  

This sets a minimum width for the main chat area on desktop and other large screens.

Use it if you want:

- a wider chat column on desktop
- less cramped message layout
- more consistent large-screen spacing

### Minimum desktop sidebar size

Default: `300px`  
Range: `300px` to `500px`  

This sets a minimum width for the left and right side panels, that is the the response configuration and character cards columns.
If the main chat area is too large, these panels can become too narrow to use comfortably.

This setting enforces a minimum size.
If there is enough space to the left and right of the main chat area, the side panels are displayed as usual.
If there is not enough space, the side panels expand to the configured width and overlap the main chat area.

Note: this setting interacts with the desktop chat width. A larger desktop chat minimum leaves less space for side panels, so the fixed sidebar width behavior will kick in earlier.

### Mobile adjustment maximum screen size

Default: `700px`  
Range: `300px` to `1000px`  

This enables a mobile-specific UI adjustment for screens up to the selected width.

When active, the extension currently:

- decreases top bar icon size
- decreases bottom form icon size
- hides message avatars
- restructures the character name row to stack more cleanly on narrow screens

Use it if you want the interface to stay denser and cleaner on phones or narrow tablet widths.
