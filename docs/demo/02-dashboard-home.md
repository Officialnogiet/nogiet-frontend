# 02 · Dashboard Home

The Dashboard brings together the main signals from NOGIET. Open **Dashboard** from the navigation menu; on a phone, tap **Home** in the bottom bar. The figures depend on the data currently available, so an empty chart or table does not mean that emissions are zero.

## What each section shows

1. **Key figures:** Total Facilities counts registered ground facilities. Satellite-Detected Sources counts detection points returned by the active satellite providers. Total Emission Rate combines satellite observations in your chosen unit. Alerts This Week counts threshold exceedances over the past seven days.
2. **Emission trend (7 days):** Daily satellite observations separated by provider. Hover over a day to see the provider values. The chart explains when there are no recent observations.
3. **Top emitters:** Facilities ranked by the total of their recorded ground measurements. This is a ground-data table, so its numbers need not match the satellite emission card.
4. **Recent alerts:** The five newest threshold alerts, with severity and time. Open **Alerts** for the full list and follow-up tools.
5. **Quick Actions:** Open the Live Map, Alerts, or Manage Data directly.
6. **Data Sources:** Shows which providers are configured in the current summary.

To change the unit used in dashboard figures and charts, open **Settings → Appearance → Emission Unit**. The selection is saved in this browser. For a closer look at a detection, use **Open live map**. For longer time periods, open **Methane Trends**.

## Help while using the app

The **?** button at the bottom right gives tips for the current screen. **Start guided tour** there, or in **Settings → Guided tour**, for an interactive walkthrough. The tour highlights one section at a time, moves between the main screens, and can be skipped, replayed, or navigated with Back and Next. It starts once for each signed-in account on a browser; completing or skipping it stops it from opening automatically again there.

## Where the data comes from

Dashboard summary values come from `GET /api/v1/emissions/dashboard-summary`. The trend chart also uses satellite observations from the shared satellite store, so its daily provider series can differ from ground-measurement rankings. NOGIET updates what it displays as data feeds and facility records become available.
