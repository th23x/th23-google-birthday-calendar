# 🎉 th23 Google Birthday Calendar

Birthday Calendar for syncing Google Contacts and Calendar using Apps Script


## 🚀 Introduction

Due to some regulatory requirements (?) birthdays added to your Google Contacts are not shown in the Google Calendar, even if you activate `Sync birthdays`. You are left with the options to **manually** create a birthday series for every contact and keep this updated in case of any changes or you run the **risk to miss birthdays** of your contacts.

`th23 Google Birthday Calendar` uses Google Apps Script to create and sync an event series for every contacts birthday.

* Get a **remider** in the Google Calendar for birthdays of your contacts
* Maintain your contacts birthdays **in one place** together with other key info in Google Contacts
* Automate any updates by the **once a day** sync running in the background - only notifying you about any issues or giving a sign of life once in a while **via mail**


## ⚙️ Setup

*  A) Code and Resources
*    1) Open https://script.google.com in your browser
*    2) Create `New project` and change its title to `Birthday Calendar`
*    3) Open the `code.gs` file from Github repository, mark everything and copy to clipboard
*    4) Back to the Apps Script window in your browser, ensure you are in "code.gs" file, where you might see only an empty "function myFunction()"
*    5) Mark everything and replace it by pasting the copied code from the cllipboard
*    6) On the left pane click the "+" button next to "Services", scroll down and select "Peopleapi", click "Add" at the bottom right
*    7) On the left pane click the "+" button next to "Services", scroll down and select "Google Calendar API", click "Add" at the bottom right
*    8) Click "Save project to Drive" button
*
*  B) Configuration and Permissions
*    1) Adjust configuration via the const... lines in the "=== CONFIGURATION ===" secion (see comments above each setting)
*    2) For a test set "const debug = true" in the configuration to get more information about the progress via updates in the console
*    3) Once done, hit the "Run" button to try it - and grant required permissions
*    4) A popup will indicate "Authorization required: This project requires your permission to access your data."
*    5) Click "Review Permissions" and select your Google account, that contains your contacts and calendar to sync
*    6) You will get the warning, that "Google hasn’t verified this app", but you can review the source code, so you can review
*       to be safe that there are no "funny" things included!
*    7) Click "Advanced" at the bottom left to continue and click "Go to Birthday Calendar (unsafe)"
*    8) Sign in by selecting your Goolge account (again) and clicking "Continue" to allow required permissions:
*       a) Allow access to your mails - used for authentication and infos via mail in case of any errors
*       b) Allow access to your contacts - used to read all contacts and filter the ones with a birthday given
*       c) Allow access to your calendar - used to create / modify birthday events / series
*    9) You will receive an email with recently granted permissions as a "Security alert", follow the included link to indicate "Yes, it was me"
*
*  C) Automation
*    1) If everything worked well, you should revert the debug config to false (see above) add a regular time-based trigger
*    2) Navigate to "Triggers" in the pane on the left. Click "Add Trigger" on the bottom right
*    3) In the following window to add a trigger ensure the following settings:
*       a) Function to run "update_birthdays"
*       b) Deployment to run "Head"
*       c) Event source "Time-driven"
*       d) Time based trigger "Day timer"
*       e) Time of day "10pm to 11pm"
*       f) Failure notification - leave at default
*    4) Scroll down and hit "Save"
*
*  note: Google defines a hard limit of max 6min execution time for a script - dealing with the limit this script stops execution
*        after 5:30min and continues its job on the next run ie on following day where it stopped before - you will get a notification
*        via mail in case this happens
*  note: once a month you get a "sign of life" via mail from this script - just so you know everything is working in the background as planned


The folder / file structure of your PHP project when adding `th23 Easy Translation` should look something like this:
```
inc/
   i18n.php
lang/
   de_DE.php
   ...
tools/
   .htaccess
   i18n-tools.php
config.php
index.php
```

The `/inc` folder contains the core script picking and showing the translations according to the chosen language.

All language files have to be named according to the locale of the language they are replresenting. The language files have to be placed in the `/lang` subfolder of your project.

Additonal language files can be created using the `i18n-tools.php` script in the `/tools` folder.

In the `config.php` file you have to defined a default language.

The `index.php` gives an example of how it all works together and can be included into your PHP project file(s).

> [!TIP]
> Copy all the included files into an empty folder on your server to have a first simple working example to switch languages


## 🖐️ Usage

In the source code of your PHP application you can simply use the following syntax on every string that should be translatable:
`__('English language text')`

To parse in data into language strings use the following syntax, allowing for multiple additional parameters passed to the translation function and replacing placeholder (`%s` for strings, `%i` for integers, `%d` for doubles):
`__('Here you see %s at work...', 'th23 Easy Translation')`

To start translation into a new language or update an existing translation file eg in case new language strings got added to your source code enable access to `/tools/i18n-tools.php` (see `/tools/.htaccess`) and open it in your webbrowser. Save generated / updated language file in the `/lang` subfolder.


## 🤝 Contributors

Feel free to [raise issues](../../issues) or [contribute code](../../pulls) for improvements via GitHub.


## ©️ License

You are free to use this code in your projects as per the `GNU General Public License v3.0`. References to this repository are of course very welcome in return for my work 😉
