/**
 * Map bookmaker `key` → logo URL
 * (Use remote CDN links or place PNGs in /public)
 */
const logos = {
  // Major Operators
  betmgm:         "/logos/betmgm.png",
  fanduel:        "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 60'%3E%3Ctext x='10' y='35' font-family='Arial' font-size='24' font-weight='bold' fill='%234285f4'%3EFanDuel%3C/text%3E%3C/svg%3E",
  draftkings:     "https://upload.wikimedia.org/wikipedia/commons/thumb/0/05/DraftKings_logo.svg/120px-DraftKings_logo.svg.png",
  caesars:        "https://seeklogo.com/images/C/caesars-sportsbook-logo-5B472151D8-seeklogo.com.png",
  williamhill_us: "https://seeklogo.com/images/W/william-hill-logo-8B2B2B2B2B-seeklogo.com.png",
  
  // New Major Operators
  espnbet:        "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 60'%3E%3Ctext x='10' y='35' font-family='Arial' font-size='20' font-weight='bold' fill='%23ff0000'%3EESPN BET%3C/text%3E%3C/svg%3E",
  pointsbetau:    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 60'%3E%3Ctext x='10' y='35' font-family='Arial' font-size='18' font-weight='bold' fill='%23ffd700'%3EPointsBet%3C/text%3E%3C/svg%3E",
  unibet_us:      "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 60'%3E%3Ctext x='10' y='35' font-family='Arial' font-size='20' font-weight='bold' fill='%2300ff00'%3EUnibet%3C/text%3E%3C/svg%3E",
  betfred_us:     "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 60'%3E%3Ctext x='10' y='35' font-family='Arial' font-size='19' font-weight='bold' fill='%23ff1493'%3EBetfred%3C/text%3E%3C/svg%3E",
  hardrockbet:    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 60'%3E%3Ctext x='10' y='35' font-family='Arial' font-size='16' font-weight='bold' fill='%23000000'%3EHard Rock%3C/text%3E%3C/svg%3E",
  fanatics_us:    "https://seeklogo.com/images/F/fanatics-logo-4B4B4B4B4B-seeklogo.com.png",
  
  // Regional/Offshore
  betrivers:      "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 60'%3E%3Ctext x='10' y='35' font-family='Arial' font-size='20' font-weight='bold' fill='%23ff6b35'%3EBetRivers%3C/text%3E%3C/svg%3E",
  betonlineag:    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 60'%3E%3Ctext x='10' y='35' font-family='Arial' font-size='18' font-weight='bold' fill='%23ff0000'%3EBetOnline%3C/text%3E%3C/svg%3E",
  betus:          "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 60'%3E%3Ctext x='10' y='35' font-family='Arial' font-size='24' font-weight='bold' fill='%23ff4500'%3EBetUS%3C/text%3E%3C/svg%3E",
  bovada:         "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 60'%3E%3Ctext x='10' y='35' font-family='Arial' font-size='22' font-weight='bold' fill='%23d4af37'%3EBovada%3C/text%3E%3C/svg%3E",
  mybookieag:     "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 60'%3E%3Ctext x='10' y='35' font-family='Arial' font-size='18' font-weight='bold' fill='%23008000'%3EMyBookie%3C/text%3E%3C/svg%3E",
  lowvig:         "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 60'%3E%3Ctext x='10' y='35' font-family='Arial' font-size='22' font-weight='bold' fill='%236a5acd'%3ELowVig%3C/text%3E%3C/svg%3E",
  
  // DFS Platforms
  prizepicks:     "https://seeklogo.com/images/P/prizepicks-logo-4B4B4B4B4B-seeklogo.com.png",
  underdog:       "https://seeklogo.com/images/U/underdog-fantasy-logo-4B4B4B4B4B-seeklogo.com.png",
  superdraft:     "https://seeklogo.com/images/S/superdraft-logo-4B4B4B4B4B-seeklogo.com.png",
  fliff:          "https://seeklogo.com/images/F/fliff-logo-4B4B4B4B4B-seeklogo.com.png",
  draftkings_pick6: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/05/DraftKings_logo.svg/120px-DraftKings_logo.svg.png",
  
  // Legacy/Other
  bet365:         "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6b/Bet365_logo.svg/120px-Bet365_logo.svg.png"
};

export default logos;
