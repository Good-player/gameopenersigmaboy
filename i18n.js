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
      
      // FAQ
      faq_title: "FAQ",
      faq_subtitle: "Frequently Asked Questions",
      faq_q_what_is: "What is CASES?",
      faq_a_what_is: "CASES is a CS:GO-style case opening game with multiplayer features including Blackjack, Plinko, Roulette, Bitcoin trading, horse racing, and a chat/DM system. Plus a real Sollentuna weather tab.",
      faq_q_login: "Do I need to log in?",
      faq_a_login: "Local play works without login. To use chat, DMs, leaderboard, friends, or sync your progress across devices, create an account from the Login button.",
      faq_q_save: "How are my saves stored?",
      faq_a_save: "Locally in your browser (localStorage) per slot. If logged in, you can also Save/Load to the cloud. Three slots are available per browser.",
      faq_q_slots: "What are slots?",
      faq_a_slots: "Three independent save slots in your browser. Tap 'Slot X' in the header to switch.",
      faq_q_rent: "What is rent?",
      faq_a_rent: "Every several opens you owe rent based on your balance: under $1M = $200 flat, $1M-$1B = 1%, over $1B = 2%.",
      faq_q_loan: "How do loans work?",
      faq_a_loan: "Take loans from the Loan tab. Higher credit score = bigger limits. If your credit drops below 10, your account resets.",
      faq_q_bj: "Why do I need a Blackjack card?",
      faq_a_bj: "It's a one-time $50,000 purchase that lets you join the multiplayer Blackjack table. You can still spectate without one.",
      faq_q_btc: "Is the Bitcoin price real?",
      faq_a_btc: "Yes. Live price from Coinbase, CoinGecko, or FreeCryptoAPI (with fallback chain). The chart uses real OHLC data from Alpha Vantage. Cached in D1 to avoid rate limits.",
      faq_q_weather: "Where does weather data come from?",
      faq_a_weather: "Weather: api.met.no (Norwegian Meteorological Institute). Warnings: SMHI (Swedish Meteorological Institute). Pollen: pollenrapporten.se. Air quality: Open-Meteo. Location is hardcoded to Sollentuna.",
      faq_q_chat: "Why are some chats moderated?",
      faq_a_chat: "Automated systems flag suspicious patterns (spam, frequent gifts, multi-IP login) for review. Reports are reviewed manually.",
      faq_q_legal: "Is this real gambling?",
      faq_a_legal: "No. There is no real money involved. All currency is in-game and has no cash value.",
      faq_q_data: "What data do you store?",
      faq_a_data: "Username, hashed password, IP/country for security, game progress, messages you send, fingerprint for alt detection. No real names, emails, or payment info.",
      faq_q_delete: "Can I delete my account?",
      faq_a_delete: "Contact the owner via DM. Manual deletion required.",
      faq_q_contact: "Bug reports / contact?",
      faq_a_contact: "Use the in-game Report button on any message, or DM the owner directly.",

      // Daily bonus
      daily_title: "Daily Bonus!",
      daily_subtitle: "Come back every day to climb the streak",
      daily_claim: "Claim",
      daily_later: "Later",
      daily_claimed: "Claimed ${amount}!",
      daily_streak: "Day {day} streak",
      // Wheel of fortune
      tab_wheel: "Wheel",
      wheel_title: "Wheel of Fortune",
      wheel_subtitle: "One free spin every 24 hours",
      wheel_spin: "SPIN",
      wheel_spinning: "Spinning...",
      wheel_next_spin: "Next spin in",
      wheel_won: "You won ${amount}!",
      wheel_rules: "Prizes: $1K to $2M. Higher prizes are rarer.",
      wheel_login_required: "Log in to spin the wheel",
      
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
      
      // FAQ
      faq_title: "FAQ",
      faq_subtitle: "Vanliga frågor",
      faq_q_what_is: "Vad är CASES?",
      faq_a_what_is: "CASES är ett CS:GO-inspirerat case-öppningsspel med multiplayer-funktioner som Blackjack, Plinko, Roulett, Bitcoin-handel, hästkapplöpning och chatt/DM. Plus en riktig väderflik för Sollentuna.",
      faq_q_login: "Måste jag logga in?",
      faq_a_login: "Lokalt spel fungerar utan inloggning. För att använda chatt, DM, topplista, vänner eller synka framsteg mellan enheter, skapa ett konto via Logga in.",
      faq_q_save: "Hur sparas mitt spel?",
      faq_a_save: "Lokalt i din webbläsare (localStorage) per plats. Inloggad kan du också spara/ladda till molnet. Tre platser per webbläsare.",
      faq_q_slots: "Vad är platser?",
      faq_a_slots: "Tre oberoende sparplatser i din webbläsare. Tryck på 'Plats X' i toppen för att byta.",
      faq_q_rent: "Vad är hyra?",
      faq_a_rent: "Var några öppningar tas en hyra baserat på saldo: under $1M = $200 fast, $1M-$1B = 1%, över $1B = 2%.",
      faq_q_loan: "Hur fungerar lån?",
      faq_a_loan: "Ta lån från Lån-fliken. Högre kreditpoäng = större gränser. Om din kredit faller under 10 återställs ditt konto.",
      faq_q_bj: "Varför behöver jag ett Blackjack-kort?",
      faq_a_bj: "Engångsköp för $50 000 för att gå med vid multiplayer-bordet. Du kan ändå titta på utan ett.",
      faq_q_btc: "Är Bitcoin-priset riktigt?",
      faq_a_btc: "Ja. Direkt från Coinbase, CoinGecko eller FreeCryptoAPI (med reservkedja). Diagrammet använder riktiga OHLC-data från Alpha Vantage. Cachelagrat i D1.",
      faq_q_weather: "Var kommer väderdatan ifrån?",
      faq_a_weather: "Väder: api.met.no (Meteorologisk institutt). Varningar: SMHI. Pollen: pollenrapporten.se. Luftkvalitet: Open-Meteo. Plats är inställd på Sollentuna.",
      faq_q_chat: "Varför modereras vissa chattar?",
      faq_a_chat: "Automatiska system flaggar misstänkta mönster (spam, frekventa gåvor, multi-IP-inloggning) för granskning. Rapporter granskas manuellt.",
      faq_q_legal: "Är detta riktig spelverksamhet?",
      faq_a_legal: "Nej. Inga riktiga pengar är inblandade. All valuta är i spelet och har inget kontantvärde.",
      faq_q_data: "Vilken data lagras?",
      faq_a_data: "Användarnamn, hashat lösenord, IP/land för säkerhet, spelframsteg, meddelanden du skickar, fingerprint för dubbelkontoskydd. Inga riktiga namn, e-post eller betalningsuppgifter.",
      faq_q_delete: "Kan jag radera mitt konto?",
      faq_a_delete: "Kontakta ägaren via DM. Manuell radering krävs.",
      faq_q_contact: "Buggrapporter / kontakt?",
      faq_a_contact: "Använd Rapportera-knappen på meddelanden, eller DM:a ägaren direkt.",

      // Daily bonus
      daily_title: "Daglig bonus!",
      daily_subtitle: "Kom tillbaka varje dag för att öka raden",
      daily_claim: "Hämta",
      daily_later: "Senare",
      daily_claimed: "Hämtade ${amount}!",
      daily_streak: "Dag {day} i rad",
      // Wheel of fortune
      tab_wheel: "Hjul",
      wheel_title: "Lyckohjulet",
      wheel_subtitle: "Ett gratis snurr var 24:e timme",
      wheel_spin: "SNURRA",
      wheel_spinning: "Snurrar...",
      wheel_next_spin: "Nästa snurr om",
      wheel_won: "Du vann ${amount}!",
      wheel_rules: "Priser: $1K till $2M. Större priser är sällsyntare.",
      wheel_login_required: "Logga in för att snurra hjulet",
      
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
