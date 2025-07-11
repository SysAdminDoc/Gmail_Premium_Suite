# MailPro-Enhancement-Suite
An unofficial enhancement extension for Gmail

## 1. Introduction

### 1.1 Brief overview of the extension and its purpose

This is a userscript that enhances the Gmail web interface. It provides a suite of features designed to declutter the interface, improve productivity, and add visual flair. The script is highly configurable, allowing users to enable or disable features based on their preferences.

---
## 2. Features

### 2.1 For each feature or function

The extension includes a wide variety of features, which can be grouped into the following categories:

#### 2.1.1 UI & Visuals

* **Floating Settings Button**: Adds a floating gear icon to the page, which opens the settings panel for the extension.
* **Glowing Starred Section**: Makes the "Starred" email section in your inbox glow.
* **Squarify UI Elements**: Removes rounded corners from many UI elements for a sharper look.
* **Animated Compose Button**: Animates the "Compose" button with a breathing effect.
* **Animated Star Icons**: Replaces the static star icons with an animated, glowing version.
* **Style Email Date/Time**: Applies custom styling to the date and time of emails.

#### 2.1.2 Themes

* **Default Dark Theme**: Applies a dark theme to the Gmail interface.

#### 2.1.3 Layout

* **Core Layout Fixes**: Applies some CSS tweaks for a cleaner layout.
* **Style Reply Button**: Adds custom styling to the main reply button.
* **Compose Recipient Border**: Adds a border below the To/Cc/Subject fields in the compose window.
* **Collapse Chat Sidebar**: Collapses the chat sidebar to save space.

#### 2.1.4 Productivity

* **Show Raw Emails**: Shows the full email address of the sender instead of just their name.
* **Toggleable Formatting Bar**: Adds a button to toggle the visibility of the formatting bar in the compose window.
* **Disable Compose Hover-Cards**: Disables the hover-cards that appear when you mouse over email addresses in the compose fields.
* **Double-Click to Copy Email**: Allows you to double-click on a contact in the To/Cc/Bcc fields to copy their email address to the clipboard.

#### 2.1.5 Header Elements

* **Hide Google Apps Grid**: Hides the Google Apps grid button in the main header.
* **Hide Account Profile Box**: Hides your Google Account profile picture in the main header.
* **Hide Top Bar Support Icon**: Hides the "Support" icon in the main header.
* **Hide Top Bar Settings Icon**: Hides the main Gmail "Settings" icon in the header.

#### 2.1.6 Hubspot

* **Hubspot Activity Indicator**: Adds a colored bar at the top of the page to indicate the Hubspot status.
* **Hide Hubspot Compose Toolbar**: Hides the Hubspot toolbar in the compose window.
* **Hide Log Tracker Indicator**: Hides the Hubspot log/track status indicator.
* **Hide Sender Profile Button**: Hides the "View [Sender]'s Profile" button in the Hubspot sidebar.
* **Hide Hubspot Icon on Contact Chips**: Hides the Hubspot icon on contact chips.

#### 2.1.7 AI & Tools

* **Hide Gemini "Help me write"**: Hides the "Help me write" button in the compose window.
* **Hide "Ask Gemini" Button**: Hides the "Ask Gemini" button in the main header.
* **Hide "Summarize Email" Button**: Hides the "Summarize this email" button.
* **Hide Loom Button**: Hides the Loom button in the compose window toolbar.

#### 2.1.8 Declutter

* **Hide "Outside Org" Warning**: Hides the warning banner about external recipients.
* **Hide Labels in Emails**: Hides the label tags at the top of an email.
* **Hide Profile Picture in Emails**: Hides the sender's profile picture in the email view.
* **Hide "Everything else" Header**: Hides the header for the "Everything else" email group.
* **Hide "Labels" Section**: Hides the "Labels" section in the left sidebar.
* **Hide "Starred" Section Header**: Hides the header for the "Starred" email group.
* **Hide Empty Subject Toolbar**: Hides the empty space where the Hubspot toolbar was.
* **Hide "Discover More" Button**: Hides the "Discover more" button in the sidebar.
* **Hide Misc. Clutter**: Hides various other UI elements.

#### 2.1.9 Email Thread Declutter

* **Nuke Reply Metadata**: Replaces reply/forward headers with a divider.
* **Hide All Signatures in Reply Chain**: Removes all signatures from the reply chain.

---
## 3. Installation

### 3.1 Prerequisites

You will need a userscript manager extension for your browser. Some popular options are:

* [Tampermonkey](https://www.tampermonkey.net/)
* [Greasemonkey](https://www.greasespot.net/)
* [Violentmonkey](https://violentmonkey.github.io/)

### 3.2 Step by step instructions to install locally

1.  Install a userscript manager from the links above.
2.  Open the `Gmail Premium UI Suite (v5.0 - Dynamic Collapse & Nuclear Headers)-5.0.user.js` file in a text editor.
3.  Copy the entire contents of the file.
4.  Open your userscript manager's dashboard and create a new script.
5.  Paste the copied code into the new script and save it.
6.  The script will now be active on Gmail.

---
## 4. Usage

### 4.1 How to load the extension in developer mode

This is a userscript, not a Chrome extension. You do not need to load it in developer mode. Just follow the installation instructions above.

### 4.2 How to access and use each feature

Once the script is installed, you will see a floating gear icon in the bottom-left corner of the Gmail interface. Click this icon to open the settings panel. From there, you can enable or disable each feature individually.

---
## 5. Architecture overview

### 5.1 High level file and module layout

The entire extension is contained within a single file: `Gmail Premium UI Suite (v5.0 - Dynamic Collapse & Nuclear Headers)-5.0.user.js`.

### 5.2 Key modules and their roles

* **`settingsManager`**: This object is responsible for loading and saving the user's settings.
* **`features`**: This is an array of objects, where each object represents a feature of the extension. Each feature object has properties like `id`, `name`, `description`, `group`, and `init` and `destroy` functions.
* **Dynamic Content Hiding Engine**: This is a MutationObserver-based system that dynamically hides elements on the page based on the active hiding rules.
* **UI & Settings Panel**: This is the code that builds the settings panel, allowing users to configure the extension.
* **Main Bootstrap**: This is the entry point of the script, which loads the settings, injects the styles, builds the panel, and initializes the enabled features.

---
## 6. Detailed function reference

### 6.1 For each exported function or main routine

#### 6.1.1 `settingsManager.load()`
* **Parameters**: None
* **Return value**: A promise that resolves to an object containing the user's saved settings.
* **Purpose**: To load the user's settings from storage.

#### 6.1.2 `settingsManager.save(settings)`
* **Parameters**:
    * `settings` (object): The settings object to save.
* **Return value**: A promise that resolves when the settings have been saved.
* **Purpose**: To save the user's settings to storage.

#### 6.1.3 `addHidingRule(id, ruleFn)`
* **Parameters**:
    * `id` (string): A unique identifier for the hiding rule.
    * `ruleFn` (function): A function that takes a DOM node as an argument and hides it if it matches the rule.
* **Return value**: None
* **Purpose**: To add a new rule to the dynamic content hiding engine.

#### 6.1.4 `removeHidingRule(id)`
* **Parameters**:
    * `id` (string): The identifier of the hiding rule to remove.
* **Return value**: None
* **Purpose**: To remove a rule from the dynamic content hiding engine.

#### 6.1.5 `buildPanel(appState)`
* **Parameters**:
    * `appState` (object): The application state object, which contains the user's settings.
* **Return value**: None
* **Purpose**: To build the settings panel UI.

#### 6.1.6 `feature.init()`
* **Parameters**: None
* **Return value**: None
* **Purpose**: To initialize a feature. This function is called when a feature is enabled.

#### 6.1.7 `feature.destroy()`
* **Parameters**: None
* **Return value**: None
* **Purpose**: To tear down a feature. This function is called when a feature is disabled.

---
## 7. Contributing

### 7.1 How to report issues

If you find a bug or have a feature request, please open an issue on the GitHub repository.

### 7.2 How to submit pull requests

Pull requests are welcome. Please make sure your code is well-formatted and follows the existing coding style.

### 7.3 Coding style guidelines if any

There are no strict coding style guidelines, but please try to match the style of the existing code.

---
## 8. License

### 8.1 MIT

This project is licensed under the MIT License. See the `LICENSE` file for details.
