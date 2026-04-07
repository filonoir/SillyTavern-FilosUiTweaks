# Filos UI Tweaks

A small, opinionated SillyTavern extension that adjusts how the UI behaves on desktop and mobile-sized screens.

It also fixes some quirks on iOS devices, especially on large iPads such as the iPad Pro.

It has been tested only with the default SillyTavern UI.

## Requirements

- SillyTavern `1.15.0` or newer

## Where to find the settings

Open SillyTavern, then go to the extensions settings area.  
This extension adds a drawer named **Filos UI Tweaks**.

If you set a slider control to its minimum value, that setting is treated as disabled.
The UI will dim the user input and show `off` instead of `px`.

## Screen size logic

The extension uses the same hard breakpoint as the default SillyTavern UI:

- `> 1000px` = desktop behavior
- `<= 1000px` = mobile behavior

Desktop-only settings do nothing on smaller screens.  
The mobile adjustment setting only works on screens at or below `1000px`.

## Settings

### Minimum desktop chat size 

This sets a minimum width for the main chat area on desktop and other large screens.

Use it if you want:

- a wider chat column on desktop
- less cramped message layout
- more consistent large-screen spacing

### Minimum desktop sidebar size

This sets a minimum width for the left and right side panels, that is the the response configuration and character cards columns.
If the main chat area is too large, these panels can become too narrow to use comfortably.

This setting enforces a minimum size.
If there is enough space to the left and right of the main chat area, the side panels are displayed as usual.
If there is not enough space, the side panels expand to the configured width and overlap the main chat area.

Note: this setting interacts with the desktop chat width. A larger desktop chat minimum leaves less space for side panels, so the fixed sidebar width behavior will kick in earlier.

### Mobile adjustment maximum screen size

This enables a mobile-specific UI adjustment for screens up to the selected width.

When active, the extension:

- decreases top bar icon size
- decreases bottom form icon size
- hides message avatars
- restructures the character name row stacking

Use it if you want the interface to stay denser on phones or other small screens.

### Replace mobile CSS

This replaces the default mobile CSS with an opinionated version that contains some tweaks, especially for large iPad screens.

**Why this needed:** The default mobile styles appear broken on large iPad screens, such as an iPad Pro, making the chat almost unusable.
This is mainly because a set of styles was added to the end of the default mobile-styles CSS file labeled "iOS specific."
The problem is that these iOS-specific styles seem to depend on the other mobile styles, which are only enabled with a max-width of 1000px. 
However, the iOS-specific styles are always enabled for iOS.
If the screen is larger than 1000px, the iOS-specific styles are applied, but the other styles are missing.
This results in broken behavior for most dialogs.
