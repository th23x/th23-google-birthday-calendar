# 🎉 th23 Google Birthday Calendar

Automatic syncing of Google Contacts birthdays as event series with reminders to Google Calendar


## 🚀 Introduction

Due to some regulatory requirements (?) birthdays added to your Google Contacts are not shown in the Google Calendar, even if you activate `Sync birthdays`. You are left with the options to **manually** create a birthday series for every contact and keep this updated in case of any changes or you run the **risk to miss birthdays** of your contacts.

`th23 Google Birthday Calendar` uses Google Apps Script to create and sync an event series for every contacts birthday.

* Get a **remider** in the Google Calendar for birthdays of your contacts
* Maintain your contacts birthdays **in one place** together with other key info in Google Contacts
* Automate any updates by the **once a day** sync running in the background - only notifying you about any issues or giving a sign of life once in a while **via mail**


## ⚙️ Setup

### A) Code and Resources

1. Open https://script.google.com in your browser
2. Create `New project` and change its title to `Birthday Calendar`
3. Open the `code.gs` file from Github repository, mark everything and copy to clipboard
4. Back to the Apps Script window in your browser, ensure you are in `code.gs` file, where you might see only an empty `function myFunction()`
5. Mark everything and replace it by pasting the copied code from the cllipboard
6. On the left pane click the `+` button next to `Services`, scroll down and select `Peopleapi`, click `Add` at the bottom right
7. On the left pane click the `+` button next to `Services`, scroll down and select `Google Calendar API`, click `Add` at the bottom right
8. Click `Save project to Drive` button

###  B) Configuration and Permissions

1. Adjust configuration via the const... lines in the `=== CONFIGURATION ===` secion (see comments above each setting)
2. For a test set `const debug = true` in the configuration to get more information about the progress via updates in the console
3. Once done, hit the `Run` button to try it - and grant required permissions
4. A popup will indicate `Authorization required: This project requires your permission to access your data.`
5. Click `Review Permissions` and select your Google account, that contains your contacts and calendar to sync
6. You will get the warning, that `Google hasn’t verified this app`, but you can either trust me or review the source code, to be safe that there are no "funny" things included!
7. Click `Advanced` at the bottom left to continue and click `Go to Birthday Calendar (unsafe)`
8. Sign in by selecting your Goolge account (again) and clicking `Continue` to allow required permissions:
   * Allow access to your mails - used for authentication and infos via mail in case of any errors
   * Allow access to your contacts - used to read all contacts and filter the ones with a birthday given
   * Allow access to your calendar - used to create / modify birthday events / series
9. You will receive an email with recently granted permissions as a "Security alert", follow the included link to indicate "Yes, it was me"

### C) Automation

1. If everything worked well, you should revert the debug config to false (see above) add a regular time-based trigger
2. Navigate to `Triggers` in the pane on the left. Click `Add Trigger` on the bottom right
3. In the following window to add a trigger ensure the following settings:
   * Function to run `update_birthdays`
   * Deployment to run `Head`
   * Event source `Time-driven`
   * Time based trigger `Day timer`
   * Time of day `10pm to 11pm`
   * Failure notification - leave at default
4. Scroll down and hit `Save`

> [!IMPORTANT]
> Google defines a hard limit of max 6min execution time for a script - dealing with the limit this script stops execution after 5:30min and continues its job on the next run ie on following day where it stopped before
> 
> You will get a notification via mail in case this happens

> [!NOTE]
> Once a month you get a "sign of life" via mail from this script - just so you know everything is working in the background as planned


## 🖐️ Usage

Just **keep using your Google Contacts and Calendar as you did before** - adding your contacts date of birth directly in the contact - and get reminded of all of your contacts birthdays with a calendar notification.


## 🤝 Contributors

Feel free to [raise issues](../../issues) or [contribute code](../../pulls) for improvements via GitHub.


## ©️ License

You are free to use this code in your projects as per the `GNU General Public License v3.0`. References to this repository are of course very welcome in return for my work 😉
