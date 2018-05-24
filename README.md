## Your First App

Congratulations on creating your first app! Feel free to replace this text with your app's actual description.

### Folder structure explained

    .
    ├── .gitignore                 Lets you exempt temporary files and folders from being added to version control
    ├── README.md                  This file
    ├── app                        Contains the files that are required for the front end component of the app
    │   ├── app.js                 JS to render the dynamic portions of the app
    │   ├── logo.svg               Sidebar icon SVG file. Should have a resolution of 64x64px.
    │   ├── freshdesk_logo.png     The Freshdesk logo that is displayed in the app
    │   ├── style.css              Style sheet for the app
    │   ├── template.html          Contains the HTML required for the app’s UI
    ├── config                     Contains the installation parameters and OAuth configuration
    │   ├── iparam_en.json         Contains the parameters that will be collected during installation
    │   └── iparam_test_data.json  Contains sample Iparam values that will used during testing
    └── manifest.json              Contains app meta data and configuration information

Additional details:
1. The `_en` in the `iparam_en.json` file stands for the English language. If you need to support another language, say Italian, you need to have a `iparam_it.json` file in addition to the English one."
