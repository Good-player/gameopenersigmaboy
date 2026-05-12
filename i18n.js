// i18n.js - Localization strings for CASES
// Loaded as a plain script (window.I18N) before app.js
(function(){
  const STRINGS = {
    en: {
      // Common
      cancel: "Cancel",
      save: "Save",
      load: "Load",
      reset: "Reset",
      refresh: "Refresh",
      loading: "Loading...",
      retry: "Retry",
      close: "Close",
      send: "Send",
      delete: "Delete",
      confirm: "Confirm",
      yes: "Yes",
      no: "No",
      ok: "OK",
      error: "Error",
      success: "Success",
      failed: "Failed",
      back: "Back",
      
      // Header / chips
      balance: "BAL",
      debt: "DEBT",
      slot: "Slot",
      login: "Login",
      logout: "Logout",
      messages: "Messages",
      online: "online",
      
      // Tabs
      tab_shop: "Shop",
      tab_inv: "Inv",
      tab_stats: "Stats",
      tab_loan: "Loan",
      tab_flip: "Flip",
      tab_pvp: "PvP",
      tab_live: "Live",
      tab_lb: "Top",
      tab_chat: "Chat",
      tab_dm: "DM",
      tab_me: "Me",
      tab_map: "Map",
      tab_horse: "Horses",
      tab_bj: "BJ",
      tab_btc: "BTC",
      tab_plinko: "Plinko",
      tab_roulette: "Roulette",
      tab_weather: "Weather",
      
      // Weather
      weather_title: "Weather",
      weather_location: "Sollentuna",
      weather_current: "Current",
      weather_feels_like: "Feels like",
      weather_wind: "Wind",
      weather_humidity: "Humidity",
      weather_pressure: "Pressure",
      weather_uv: "UV Index",
      weather_dew_point: "Dew Point",
      weather_cloud_cover: "Cloud Cover",
      weather_visibility: "Visibility",
      weather_precip: "Precipitation",
      weather_precip_now: "Precip Now",
      weather_rain_chance: "Rain Chance",
      weather_wind_gust: "Wind Gust",
      weather_wind_from: "Wind From",
      weather_sunrise: "Sunrise",
      weather_sunset: "Sunset",
      weather_solar_noon: "Solar Noon",
      weather_daylight: "Daylight",
      weather_rain_stops: "Rain stops at",
      weather_rain_starts: "Rain starts at",
      weather_no_rain: "No rain forecast next 24h",
      weather_hourly: "Hourly Forecast",
      weather_next_hours: "Next {n} Hours",
      weather_forecast_7day: "7-Day Forecast",
      weather_today: "Today",
      weather_tomorrow: "Tomorrow",
      weather_more_details: "Tap for more details",
      weather_warnings_title: "Weather Warnings",
      weather_pollen_title: "Pollen",
      weather_air_quality: "Air Quality",
      weather_cloud_low: "Low Clouds",
      weather_cloud_mid: "Mid Clouds",
      weather_cloud_high: "High Clouds",
      weather_high: "High",
      weather_low: "Low",
      
      // UV labels
      uv_low: "Low",
      uv_moderate: "Moderate",
      uv_high: "High",
      uv_very_high: "Very High",
      uv_extreme: "Extreme",
      
      // Pollen labels
      pollen_none: "None",
      pollen_trace: "Trace",
      pollen_low: "Low",
      pollen_moderate: "Moderate",
      pollen_high: "High",
      pollen_very_high: "Very High",
      pollen_extreme: "Extreme",
      
      // Wind directions
      wind_n: "N", wind_nne: "NNE", wind_ne: "NE", wind_ene: "ENE",
      wind_e: "E", wind_ese: "ESE", wind_se: "SE", wind_sse: "SSE",
      wind_s: "S", wind_ssw: "SSW", wind_sw: "SW", wind_wsw: "WSW",
      wind_w: "W", wind_wnw: "WNW", wind_nw: "NW", wind_nnw: "NNW",
      
      // Days
      day_mon: "Mon", day_tue: "Tue", day_wed: "Wed", day_thu: "Thu",
      day_fri: "Fri", day_sat: "Sat", day_sun: "Sun",
      
      // Language toggle
      lang_label: "Language",
      lang_english: "English",
      lang_swedish: "Svenska",
    },
    
    sv: {
      // Common
      cancel: "Avbryt",
      save: "Spara",
      load: "Ladda",
      reset: "Återställ",
      refresh: "Uppdatera",
      loading: "Laddar...",
      retry: "Försök igen",
      close: "Stäng",
      send: "Skicka",
      delete: "Ta bort",
      confirm: "Bekräfta",
      yes: "Ja",
      no: "Nej",
      ok: "OK",
      error: "Fel",
      success: "Klart",
      failed: "Misslyckades",
      back: "Tillbaka",
      
      // Header / chips
      balance: "SALDO",
      debt: "SKULD",
      slot: "Plats",
      login: "Logga in",
      logout: "Logga ut",
      messages: "Meddelanden",
      online: "online",
      
      // Tabs
      tab_shop: "Butik",
      tab_inv: "Inv",
      tab_stats: "Statistik",
      tab_loan: "Lån",
      tab_flip: "Flip",
      tab_pvp: "PvP",
      tab_live: "Live",
      tab_lb: "Topp",
      tab_chat: "Chatt",
      tab_dm: "DM",
      tab_me: "Jag",
      tab_map: "Karta",
      tab_horse: "Hästar",
      tab_bj: "BJ",
      tab_btc: "BTC",
      tab_plinko: "Plinko",
      tab_roulette: "Roulett",
      tab_weather: "Väder",
      
      // Weather
      weather_title: "Väder",
      weather_location: "Sollentuna",
      weather_current: "Just nu",
      weather_feels_like: "Känns som",
      weather_wind: "Vind",
      weather_humidity: "Luftfuktighet",
      weather_pressure: "Lufttryck",
      weather_uv: "UV-index",
      weather_dew_point: "Daggpunkt",
      weather_cloud_cover: "Molntäcke",
      weather_visibility: "Sikt",
      weather_precip: "Nederbörd",
      weather_precip_now: "Nederbörd nu",
      weather_rain_chance: "Regnrisk",
      weather_wind_gust: "Vindby",
      weather_wind_from: "Vind från",
      weather_sunrise: "Soluppgång",
      weather_sunset: "Solnedgång",
      weather_solar_noon: "Middagshöjd",
      weather_daylight: "Dagsljus",
      weather_rain_stops: "Regn slutar kl.",
      weather_rain_starts: "Regn börjar kl.",
      weather_no_rain: "Inget regn närmaste 24h",
      weather_hourly: "Timprognos",
      weather_next_hours: "Nästa {n} timmar",
      weather_forecast_7day: "7-dygnsprognos",
      weather_today: "Idag",
      weather_tomorrow: "Imorgon",
      weather_more_details: "Tryck för fler detaljer",
      weather_warnings_title: "Vädervarningar",
      weather_pollen_title: "Pollen",
      weather_air_quality: "Luftkvalitet",
      weather_cloud_low: "Låga moln",
      weather_cloud_mid: "Medelhöga moln",
      weather_cloud_high: "Höga moln",
      weather_high: "Hög",
      weather_low: "Låg",
      
      // UV labels
      uv_low: "Låg",
      uv_moderate: "Måttlig",
      uv_high: "Hög",
      uv_very_high: "Mycket hög",
      uv_extreme: "Extrem",
      
      // Pollen labels
      pollen_none: "Ingen",
      pollen_trace: "Spår",
      pollen_low: "Låg",
      pollen_moderate: "Måttlig",
      pollen_high: "Hög",
      pollen_very_high: "Mycket hög",
      pollen_extreme: "Extrem",
      
      // Wind directions
      wind_n: "N", wind_nne: "NNO", wind_ne: "NO", wind_ene: "ONO",
      wind_e: "O", wind_ese: "OSO", wind_se: "SO", wind_sse: "SSO",
      wind_s: "S", wind_ssw: "SSV", wind_sw: "SV", wind_wsw: "VSV",
      wind_w: "V", wind_wnw: "VNV", wind_nw: "NV", wind_nnw: "NNV",
      
      // Days
      day_mon: "Mån", day_tue: "Tis", day_wed: "Ons", day_thu: "Tor",
      day_fri: "Fre", day_sat: "Lör", day_sun: "Sön",
      
      // Language toggle
      lang_label: "Språk",
      lang_english: "English",
      lang_swedish: "Svenska",
    }
  };

  // Detect default language: saved preference, then browser, default English
  function getDefaultLang(){
    try{const saved=localStorage.getItem("co-lang");if(saved&&STRINGS[saved])return saved}catch(e){}
    const browser=(navigator.language||"en").toLowerCase();
    if(browser.startsWith("sv"))return"sv";
    return"en";
  }

  const state = { lang: getDefaultLang() };

  // Translate function with optional {var} substitution
  function t(key, vars){
    const dict = STRINGS[state.lang] || STRINGS.en;
    let s = dict[key] || STRINGS.en[key] || key;
    if(vars){
      for(const k in vars){
        s = s.replace(new RegExp("\\{"+k+"\\}", "g"), vars[k]);
      }
    }
    return s;
  }

  function setLang(lang){
    if(!STRINGS[lang])return;
    state.lang = lang;
    try{localStorage.setItem("co-lang", lang)}catch(e){}
    // Trigger a re-render by dispatching a custom event
    window.dispatchEvent(new CustomEvent("langchange",{detail:{lang}}));
  }

  function getLang(){return state.lang}
  function getAvailableLangs(){return Object.keys(STRINGS)}

  // Expose globally
  window.I18N = { t, setLang, getLang, getAvailableLangs, STRINGS };
})();
