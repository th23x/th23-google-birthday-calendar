/*
* Birthday Calendar for Google Contacts and Calendar using Apps Script
*
* created 2025 by th23 (Thorsten Hartmann)
*
* This script is open source and shared for free usage by everybody on their own responsibility.
* You are free to use this code in your script and projects as you like.
* There is absolutely no guaranty, no warranty, no liabilities and no support!
*
* Comments, feedback and contributions are welcome via https://github.com/th23x/th23-google-birthday-calendar
*/


// === SETUP (detailed step-by-step) ===

/* 
*  A) Code and Resources
*    1) Open https://script.google.com in your browser
*    2) Create "New project" and change its title to "Birthday Calendar"
*    3) Open the "code.gs" file from Github repository, mark everything and copy to clipboard
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
*/


// === CONFIGURATION ===

// calendar id for Google calendar to hold birthdays of your contacts
// note: either create a new calendar only for your birthdays (recommended) or use an existing one (skipping step 2 below)
//   1) in Google Calendar / navigate to "Settings"
//   2) select "Add calendar" / "Create new calendar" / add "Name" eg "My Birthdays" / click "Create calendar"
//   3) select "Settings for my calendars" / select newly created calendar eg "My Birthdays" / scroll down to "Integrate calendar"
//   4) copy "Calendar ID" as "cal_id" below, eg something like "...@group.calendar.google.com"
const cal_id = "...@group.calendar.google.com";

// title for birthday series
// note: has to contain "%s" which is replaced by contacts (display) name
// note: if contact birthday has year of birth specified, next occurance will have contacts age attached to event title eg "Mr X's birthday 🎁 (19)"
const birthday_title = "%s's birthday 🎁";

// description for birthday series - to view in each event the date of birth ie to know how old somebody just got
// note: expected to be simple and only contain a valid date format, eg "* dd MMM yyyy" resulting in "* 20 Apr 1973"
// important: description is only added, if year of birthday is specified for contact
const birthday_description_format = "* dd MMM yyyy";

// option to ignore years for description for birthday series, as some apps do not allow adding dates of birth without a valid year
// note: set to integer "0" to always add date of birth into event description if year is given ie not empty
const birthday_description_ignore_before = 1901;

// option to show birthdays as "busy" or "available" in the calendar
// note: default for all-day events is "busy", set to "available" to show as free
// note: if birthdays are stored in separate calendar (recommended) this will NOT affect availability visible by others (which is based on main calendar)
// important: changes only apply to future added or changed birthday series, to apply changes to already existing birthday series in calendar, execute delete_birthdays() function and let the script re-add all birthday series with the next run
const birthday_show_as = "busy";

// reminder for birthdays series - triggering notifications
// note: expects integer defining minutes before midnight - or set to boolean "false" for no reminders
// note: must be set to a value in the range from min 5 minutes to max 40320 minutes (= 4 weeks) as limits set by Google - see https://developers.google.com/apps-script/reference/calendar/calendar-event#addPopupReminder(Integer)
// important: changes only apply to future added or changed birthday series, to apply changes to already existing birthday series in calendar, execute delete_birthdays() function and let the script re-add all birthday series with the next run
const birthday_reminder_minutes = 15;

// option to set specific start time for birthdays - allows to trigger notifications also some time mid-day, see note about Google limitation above
// note: default is "false" which will create all-day events starting at midnight
// note: must be set to a value in the range from min 0 to max 23 hours, the duration of the event will be 1 hour
// important: changes only apply to future added or changed birthday series, to apply changes to already existing birthday series in calendar, execute delete_birthdays() function and let the script re-add all birthday series with the next run
const birthday_start_time = false;

// debug mode will log details upon execution into console
// note: if disabled ie set to boolean "false" eg for unattended regular runs, script will send an email for errors occuring
const debug = false;


// === STOP: Do NOT edit anything below this line! ===

// get Google services
const people_service = People.People;
const cal_service = CalendarApp;
const yearly = cal_service.newRecurrence().addYearlyRule();

// get birthday calendar and implicitly check ownership
const cal_birthday = cal_service.getOwnedCalendarById(cal_id);

// set birthday status as busy (opaque) / free (transparent) by getting respective code from CalendarApp
const birthday_status = ("available" == birthday_show_as) ? cal_service.EventTransparency.TRANSPARENT : cal_service.EventTransparency.OPAQUE;

// ensure birthday start hour is a valid value or false as fallback for full-day
const birthday_start_hour = (0 <= birthday_start_time && birthday_start_time <= 23) ? birthday_start_time : false;

// own execution time limit in milliseconds - 330000ms = 1000ms * 60sec * 5.5min (vs hard Google limit after 6min)
const exec_limit = 330000;

// simple short form for months - only used for log/debug
const month_short = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

// main script for regular execution to sync birthdays
function update_birthdays() {

  try {

    if(!cal_birthday) {
      throw new Error("No owned calendar accessible");
    }

    // start own timer (milliseconds)
    const start = new Date().getTime();

    if(debug) { console.time("Total execution"); }

    // determine birthday calendar timezone
    const timezone = cal_birthday.getTimeZone();

    // get all contacts with (current) birthday
    // { "[people/]xxx": { name: xxx, birthday: { [year: xxx,] month: xxx, day: xxx } } }
    let contacts_birthdays = {};
    
    if(debug) { console.time("Getting contacts"); }

    // by default People api returns results in pages
    let page_token = null;
    do {

      // get names and birthdays of all contacts
      const contacts = people_service.Connections.list("people/me", { personFields: 'names,birthdays', pageToken: page_token });
      const connections = contacts.connections || [];

      // simplify data by collecting only resourceName, display name, birthday date object of contacts with a birthday saved
      connections.forEach(connection => {
        const names = connection.names || [];
        const birthdays = connection.birthdays || [];
        if(names.length > 0 && birthdays.length > 0 && birthdays[0].date !== undefined) {
          contacts_birthdays[connection.resourceName] = { name: names[0].displayName, birthday: birthdays[0].date };
        }
      });

      page_token = contacts.nextPageToken;
    } while (page_token);

    if(debug) { console.log(Object.keys(contacts_birthdays).length + " contacts with birthdays found"); console.timeEnd("Getting contacts"); }

    // get all events from birthday calendar within last one year with th23_birthday tag (= associated people_id)
    // { "[people/]xxx": { id: xxx, title: xxx, date: { year: xxx, month: xxx, day: xxx }, description: xxx } }
    let birthday_events = {};

    if(debug) { console.time("Getting birthdays"); }

    // beginning of tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0);

    // end of day in one year from now
    const nextYear = new Date();
    nextYear.setFullYear(nextYear.getFullYear() + 1);
    nextYear.setHours(23, 59, 59);

    // get all individual events from tomorrow until one year ahead tagged "th23_birthday" ie added by this script
    const events = cal_birthday.getEvents(tomorrow, nextYear).filter(e => e.getTag("th23_birthday") !== undefined);

    // collect duplicates ie multiple birthday events per person within one year
    // note: this should not happen, but calendar technically allows multiple recurrences and upon error these can happen and would go "unnoticed" by script
    // { "event_id": "[people/]xxx" }
    let duplicates = {};

    // simplify: collect only resourceName (tag), event id, title, date (in same structure as birthday date above), description, transparency and feb29
    events.forEach(event => {

      const people_id = event.getTag("th23_birthday");
      const event_id = event.getId();
      const event_title = event.getTitle();
      const event_date = event.getStartTime();
      
      // identify duplicates and add both occurences to duplicates - note: one occurence remains in birthday_events until removed later
      if(undefined !== birthday_events[people_id]) {
        duplicates[birthday_events[people_id]["id"]] = { people_id: people_id, event_title: birthday_events[people_id]["title"] };
        duplicates[event_id] = { people_id: people_id, event_title: event_title };
      }
      
      birthday_events[people_id] = { id: event_id, title: event_title, date: { day: event_date.getDate(), month: event_date.getMonth() + 1, year: event_date.getFullYear() }, description: event.getDescription(), status: event.getTransparency(), feb29: event.getTag("th23_birthday_feb29") };

    });

    // remove duplicates (ensure non of the series remains, as there is no way to determine the correct one - missing correct one will be re-added later)
    Object.keys(duplicates).forEach(function(event_id) {

      const duplicate = duplicates[event_id];    

      if(debug) { console.time("Removing duplicate"); }
      cal_birthday.getEventSeriesById(event_id).deleteEventSeries();
      // remove remaining occurence from birthday_events
      delete birthday_events[duplicate["people_id"]];
      if(debug) { console.log("Removed duplicate '" + duplicate["event_title"] + "' from calendar"); console.timeEnd("Removing duplicate"); }

    });

    if(debug) { console.log(Object.keys(birthday_events).length + " birthday series found in calendar"); console.timeEnd("Getting birthdays"); }

    // loop through all birthday events - remove or update series on calendar, if
    //    a) contact does not exist or not have a birthday specified anymore
    //    b) date (year, month or day) of birthday or contact (display) name (and thus event title) changed
    // note: requires approx 1 second per birthday series to remove or .5 seconds to update - if terminated will resume job upon next launch
    Object.keys(birthday_events).forEach(function(people_id) {

      const birthday = birthday_events[people_id];

      // contact does not exist or not have a birthday specified anymore -> delete series from calendar
      if(undefined === contacts_birthdays[people_id]) {
        if(debug) { console.time("Removing birthday series"); }
        cal_birthday.getEventSeriesById(birthday.id).deleteEventSeries();
        delete birthday_events[people_id];
        if(debug) { console.log("Removed '" + birthday.title + "' from calendar"); console.timeEnd("Removing birthday series"); }
        return;
      }

      const contact = contacts_birthdays[people_id];
      let birthday_series = undefined;

      // simplify month-day comparisson
      const contact_birthday = contact.birthday["month"] + "-" + contact.birthday["day"];
      const birthday_date = birthday.date["month"] + "-" + birthday.date["day"];

      // (moved to Feb 29 or never set correct rrule ie missing tag) or (moved from Feb 29, identified via tag or event date)
      // note: requires deleting series from calendar and from existing birthdays_events array, as setRecurrence function does NOT handle Feb 29 rule - see (re-)adding series again further below
      if((("2-29" == contact_birthday || "2-29" == birthday_date) && !birthday.feb29) || ("2-29" != contact_birthday && (birthday.feb29 || "2-29" == birthday_date))) {
        if(debug) { console.time("Deleting birthday series"); }
        if(undefined == birthday_series) {
          birthday_series = cal_birthday.getEventSeriesById(birthday.id);
        }
        birthday_series.deleteEventSeries();
        delete birthday_events[people_id];
        if(debug) { console.log("Deleted birthday series for '" + contact.name + "' as touched 'Feb 29' which requires special handling - it will be re-added later..."); console.timeEnd("Deleting birthday series"); }
        return;
      }
      // other "normal" date changes 
      else if(birthday_date != contact_birthday && !birthday.feb29) {
        if(debug) { console.time("Modifying birthday series"); }
        if(undefined == birthday_series) {
          birthday_series = cal_birthday.getEventSeriesById(birthday.id);
        }
        // all-day event
        if(false === birthday_start_hour) {
          birthday_series.setRecurrence(yearly, get_birthday_date(contact.birthday));
        }
        // one-hour event
        else {
          const birthday_hours = get_birthday_hours(contact.birthday);
          birthday_series.setRecurrence(yearly, birthday_hours.start, birthday_hours.end);
        }
        if(debug) { console.log("Changed date of birthday series for '" + contact.name + "' from '" + month_short[birthday.date["month"] - 1] + " " + birthday.date["day"] + "' to '" + month_short[contact.birthday["month"] - 1] + " " + contact.birthday["day"] + "'"); console.timeEnd("Modifying birthday series"); }
      }

      // contact (display) name (and thus event title) changed -> update series title
      const birthday_title = get_birthday_title(contact.name);
      const birthday_title_age = get_birthday_title_age(birthday_title, birthday.date["year"], contact.birthday["year"]);
      if(birthday.title !== birthday_title && birthday.title !== birthday_title_age) {
        if(debug) { console.time("Modifying birthday series"); }
        if(undefined == birthday_series) {
          birthday_series = cal_birthday.getEventSeriesById(birthday.id);
        }
        birthday_series.setTitle(birthday_title);
        if(debug) { console.log("Changed title from '" + birthday.title + "' to '" + birthday_title + "'"); console.timeEnd("Modifying birthday series"); }
      }

      // event description changed -> update series description
      const birthday_description = get_birthday_description(contact.birthday, timezone);
      if(birthday.description !== birthday_description) {
        if(debug) { console.time("Modifying birthday series"); }
        if(undefined == birthday_series) {
          birthday_series = cal_birthday.getEventSeriesById(birthday.id);
        }
        birthday_series.setDescription(birthday_description);
        if(debug) { console.log("Changed description of '" + birthday_title + "' from '" + birthday.description + "' to '" + birthday_description + "'"); console.timeEnd("Modifying birthday series"); }
      }

      // check own timer against own limit
      if(new Date().getTime() - start > exec_limit) {
        throw new Error("Exceeded maximum execution time - will resume on next run");
      }

    });

    // loop through all contacts with birthdays - add series, if not existing in all birthday events
    // note: requires approx 2 seconds per birthday series to add - if terminated will resume job upon next launch
    Object.keys(contacts_birthdays).forEach(function(people_id) {

      if(debug) { console.time("Adding birthday series"); }

      if(undefined === birthday_events[people_id]) {

        const contact = contacts_birthdays[people_id];

        // create birthday event series, add tag and reminders
        let new_series = undefined;
        // special handling for birthdays on Feb 29 - add recurrence on the last day of Feb each year
        // note: special RRULE can not be generated for usage by createAllDayEventSeries function -> workaround via Calendar API
        if(2 == contact.birthday["month"] && 29 == contact.birthday["day"]) {
          const birthday_start_year = get_birthday_date(contact.birthday).getFullYear();
          // all-day event
          let event_start = { date: birthday_start_year + "-02-29" };
          let event_end = { date: birthday_start_year + "-03-01" };
          // one-hour event
          if(false !== birthday_start_hour) {
            const birthday_hours = get_birthday_hours(contact.birthday);
            event_start = { dateTime: birthday_hours.start.toISOString(), timeZone: 'UTC' };
            event_end = { dateTime: birthday_hours.end.toISOString(), timeZone: 'UTC' };
          }
          const feb29_insert = Calendar.Events.insert({
            start: event_start,
            end: event_end,
            recurrence: ["RRULE:FREQ=YEARLY;INTERVAL=1;BYMONTH=2;BYMONTHDAY=-1"],
            summary: get_birthday_title(contact.name),
            description: get_birthday_description(contact.birthday, timezone),
          }, cal_id);
          new_series = cal_birthday.getEventSeriesById(feb29_insert.iCalUID);
          new_series.setTag("th23_birthday_feb29", "feb29");
        }
        // all other dates follow a simple yearly recurrence
        else {
          // all-day event
          if(false === birthday_start_hour) {
            new_series = cal_birthday.createAllDayEventSeries(get_birthday_title(contact.name), get_birthday_date(contact.birthday), yearly, { description: get_birthday_description(contact.birthday, timezone) });
          }
          // one-hour event
          else {
            const birthday_hours = get_birthday_hours(contact.birthday);
            new_series = cal_birthday.createEventSeries(get_birthday_title(contact.name), birthday_hours.start, birthday_hours.end, yearly, { description: get_birthday_description(contact.birthday, timezone) });
          }
        }
        new_series.setTag("th23_birthday", people_id);
        new_series.setTransparency(birthday_status);
        if(false !== birthday_reminder_minutes) {
          new_series.addPopupReminder(Number(birthday_reminder_minutes));
        }

        if(debug) { console.log("Added birthday series for '" + contact.name + "'"); console.timeEnd("Adding birthday series"); }

      }

      // check own timer against own limit
      if(new Date().getTime() - start > exec_limit) {
        throw new Error("Exceeded maximum execution time - will resume on next run");
      }

    });

    // loop through individual events for one year ahead starting from tomorrow (once more, as now they are all there and up to date)
    // note: separate loop, as getEventById function only returns the series not the individual occurance (other then getEvents with limit to timeframe) 
    const next_birthdays = cal_birthday.getEvents(tomorrow, nextYear).filter(e => e.getTag("th23_birthday") !== undefined);
    next_birthdays.forEach(event => {

      const people_id = event.getTag("th23_birthday");
      const contact = contacts_birthdays[people_id];

      const birthday_title = get_birthday_title(contact.name);
      const birthday_title_age = get_birthday_title_age(birthday_title, event.getStartTime().getFullYear(), contact.birthday["year"]);

      const event_title = event.getTitle();

      if(birthday_title_age !== event_title) {
        if(debug) { console.time("Modifying next birthday event"); }
        event.setTitle(birthday_title_age);
        if(debug) { console.log("Changed title of next birthday event from '" + event_title + "' to '" + birthday_title_age + "'"); console.timeEnd("Modifying next birthday event"); }
      }

      // check own timer against own limit
      if(new Date().getTime() - start > exec_limit) {
        throw new Error("Exceeded maximum execution time - will resume on next run");
      }

    });
  
    if(debug) { console.timeEnd("Total execution"); }

    // send a sign of life once a month via mail - after run on last day of month so users see it on the first morning of each new month
    const now = new Date();
    const last_day = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    if(last_day.getDate() == now.getDate()) {
      GmailApp.sendEmail(
        Session.getActiveUser().getEmail(), 
        "Update: Google Script - Birthday Calendar" , 
        "Hello," + "\n\n" + 
        "If you haven't heard from me since a month all is good and I keep your contacts' birthdays synced with your calendar once a day :-)" + "\n\n" + 
        "You currently have " + Object.keys(contacts_birthdays).length + " contacts with birthdays and " + events.length + " birthday series in your calendar." + "\n\n" +
        "---" + "\n\n" +
        "Please check project page for updates of this script from time to time to ensure you have the latest version" + "\n" +
        "https://github.com/th23x/th23-google-birthday-calendar"
      );
    }

  } catch (error) {
    if(debug) {
      console.error(error.message);
    }
    else {
      // for unattended regular runs send mail upon any errors
      GmailApp.sendEmail(
        Session.getActiveUser().getEmail(), 
        "Error: Google Script - Birthday Calendar" , 
        "Unfortunately, an error happened upon syncing your contacts' birthdays with your calendar:" + "\n\n" + 
        error.message + "\n\n" + 
        (("Exceeded maximum execution time - will resume on next run" === error.message) ? "The script didn't manage to work through all birthdays this time, due to Google's time limit. But no worries, it will continue its job where it was stopped with the next run later today... " : "Please try again - in case the error persists, check project page for updates of this script or opening an issue"  + "\n" + "https://github.com/th23x/th23-google-birthday-calendar")
      );
    }
  }

}

// build birthday event title
function get_birthday_title(contact_name) {
  // must contain "%s" otherwise only shows contact (display) name as title
  return (birthday_title.includes("%s")) ? birthday_title.replace("%s", contact_name) : contact_name;
}

// extend birthday event title with age at event date
function get_birthday_title_age(birthday_title, event_year, birth_year) {
  return (undefined !== birth_year && birth_year > Number(birthday_description_ignore_before)) ? birthday_title + " (" + (event_year - birth_year) + ")" : birthday_title;
}

// build birthday event date
function get_birthday_date(contact_birthday) {
  const today = new Date();
  return new Date((today.getFullYear() - 1), (contact_birthday["month"] - 1), contact_birthday["day"]);
}

// build birthday event start and end dates
function get_birthday_hours(contact_birthday) {
  let birthday_start = get_birthday_date(contact_birthday);
  birthday_start.setHours(birthday_start_hour, 0, 0);
  let birthday_end = get_birthday_date(contact_birthday);
  birthday_end.setHours(birthday_start_hour + 1, 0, 0);
  return { start: birthday_start, end: birthday_end };
}

// build birthday event description
function get_birthday_description(contact_birthday, timezone) {
  return (undefined !== contact_birthday["year"] && contact_birthday["year"] > Number(birthday_description_ignore_before)) ? Utilities.formatDate(new Date(contact_birthday["year"], (contact_birthday["month"] - 1), contact_birthday["day"]), timezone, birthday_description_format) : "";
}

// delete all birthday series added by this script
function delete_birthdays() {

  try {

    if(!cal_birthday) {
      throw new Error("No owned calendar accessible");
    }

    // start own timer (milliseconds)
    const start = new Date().getTime();

    if(debug) { console.time("Deleting birthdays"); }

    // beginning of tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0);

    // end of day in one year from now
    const nextYear = new Date();
    nextYear.setFullYear(nextYear.getFullYear() + 1);
    nextYear.setHours(23, 59, 59);

    // get all individual events from tomorrow until one year ahead tagged "th23_birthday" ie added by this script
    const events = cal_birthday.getEvents(tomorrow, nextYear).filter(e => e.getTag("th23_birthday") !== undefined);

    // loop through events and delete birthday series
    events.forEach(event => {

      const event_id = event.getId();
      const event_title = event.getTitle();

      if(debug) { console.time("Deleting birthday series"); }
      cal_birthday.getEventSeriesById(event_id).deleteEventSeries();
      if(debug) { console.log("Deleted birthday series '" + event_title); console.timeEnd("Deleting birthday series"); }

      // check own timer against own limit
      if(new Date().getTime() - start > exec_limit) {
        throw new Error("Exceeded maximum execution time - please restart 'delete_birthdays' again to complete the job");
      }

    });

  } catch (error) {
    console.error(error.message);
  }

}
