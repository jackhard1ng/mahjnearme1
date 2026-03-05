export interface MetroRegion {
  metro: string;
  state: string;
  country: string;
  abbreviation: string;
  cities: string[];
}

const METRO_REGIONS: MetroRegion[] = [
  // ALABAMA
  {
    metro: "Birmingham",
    state: "AL",
    country: "US",
    abbreviation: "birmingham-al",
    cities: ["Birmingham", "Hoover", "Vestavia Hills", "Homewood", "Tuscaloosa", "Huntsville", "Montgomery", "Mobile"]
  },
  // ALASKA
  {
    metro: "Anchorage",
    state: "AK",
    country: "US",
    abbreviation: "anchorage-ak",
    cities: ["Anchorage", "Fairbanks", "Juneau"]
  },
  // ARIZONA
  {
    metro: "Phoenix Metro",
    state: "AZ",
    country: "US",
    abbreviation: "phoenix-az",
    cities: ["Phoenix", "Scottsdale", "Tempe", "Mesa", "Chandler", "Gilbert", "Glendale", "Peoria", "Surprise", "Goodyear", "Avondale", "Cave Creek", "Paradise Valley"]
  },
  {
    metro: "Tucson",
    state: "AZ",
    country: "US",
    abbreviation: "tucson-az",
    cities: ["Tucson", "Marana", "Oro Valley", "Sahuarita", "Sierra Vista"]
  },
  // ARKANSAS
  {
    metro: "Northwest Arkansas",
    state: "AR",
    country: "US",
    abbreviation: "nwa-ar",
    cities: ["Fayetteville", "Bentonville", "Rogers", "Springdale", "Siloam Springs", "Bella Vista"]
  },
  {
    metro: "Little Rock",
    state: "AR",
    country: "US",
    abbreviation: "little-rock-ar",
    cities: ["Little Rock", "North Little Rock", "Conway", "Benton", "Bryant", "Sherwood"]
  },
  // CALIFORNIA
  {
    metro: "Los Angeles",
    state: "CA",
    country: "US",
    abbreviation: "los-angeles-ca",
    cities: ["Los Angeles", "Long Beach", "Pasadena", "Burbank", "Santa Monica", "Glendale", "Torrance", "Inglewood", "Culver City", "El Monte", "Alhambra", "San Gabriel", "Arcadia", "Monrovia", "West Hollywood", "Beverly Hills"]
  },
  {
    metro: "San Francisco Bay Area",
    state: "CA",
    country: "US",
    abbreviation: "bay-area-ca",
    cities: ["San Francisco", "Oakland", "San Jose", "Berkeley", "Fremont", "Hayward", "Sunnyvale", "Santa Clara", "Palo Alto", "Mountain View", "Cupertino", "Milpitas", "San Mateo", "Daly City", "Walnut Creek", "Concord", "Richmond", "Alameda"]
  },
  {
    metro: "San Diego",
    state: "CA",
    country: "US",
    abbreviation: "san-diego-ca",
    cities: ["San Diego", "Chula Vista", "Carlsbad", "Oceanside", "Escondido", "El Cajon", "La Mesa", "Santee", "Encinitas", "Vista"]
  },
  {
    metro: "Sacramento",
    state: "CA",
    country: "US",
    abbreviation: "sacramento-ca",
    cities: ["Sacramento", "Roseville", "Elk Grove", "Folsom", "Rancho Cordova", "Davis", "Woodland", "Auburn", "Rocklin"]
  },
  {
    metro: "Orange County",
    state: "CA",
    country: "US",
    abbreviation: "orange-county-ca",
    cities: ["Anaheim", "Irvine", "Santa Ana", "Huntington Beach", "Garden Grove", "Fullerton", "Costa Mesa", "Mission Viejo", "Newport Beach", "Lake Forest"]
  },
  // COLORADO
  {
    metro: "Denver Metro",
    state: "CO",
    country: "US",
    abbreviation: "denver-co",
    cities: ["Denver", "Boulder", "Aurora", "Lakewood", "Arvada", "Westminster", "Thornton", "Englewood", "Littleton", "Centennial", "Fort Collins", "Loveland", "Longmont", "Broomfield", "Castle Rock", "Parker", "Pueblo", "Colorado Springs"]
  },
  // CONNECTICUT
  {
    metro: "Hartford / New Haven",
    state: "CT",
    country: "US",
    abbreviation: "hartford-ct",
    cities: ["Hartford", "New Haven", "Bridgeport", "Stamford", "Waterbury", "Norwalk", "Danbury", "Greenwich", "West Hartford", "Hamden"]
  },
  // DC METRO
  {
    metro: "Washington DC Metro",
    state: "DC",
    country: "US",
    abbreviation: "dc-metro",
    cities: ["Washington DC", "Arlington", "Alexandria", "Bethesda", "Rockville", "Silver Spring", "Tysons", "Reston", "Fairfax", "McLean", "Falls Church", "Gaithersburg", "Germantown", "Chevy Chase", "Potomac"]
  },
  // FLORIDA
  {
    metro: "Miami / South Florida",
    state: "FL",
    country: "US",
    abbreviation: "miami-fl",
    cities: ["Miami", "Fort Lauderdale", "Boca Raton", "West Palm Beach", "Hollywood", "Pembroke Pines", "Miramar", "Coral Springs", "Hialeah", "Doral", "Aventura", "Delray Beach", "Boynton Beach", "Pompano Beach", "Weston"]
  },
  {
    metro: "Orlando",
    state: "FL",
    country: "US",
    abbreviation: "orlando-fl",
    cities: ["Orlando", "Kissimmee", "Sanford", "Lake Mary", "Altamonte Springs", "Winter Park", "Oviedo", "Clermont", "Daytona Beach"]
  },
  {
    metro: "Tampa Bay",
    state: "FL",
    country: "US",
    abbreviation: "tampa-fl",
    cities: ["Tampa", "St. Petersburg", "Clearwater", "Sarasota", "Bradenton", "Brandon", "Lakeland", "Wesley Chapel", "New Port Richey", "Spring Hill"]
  },
  {
    metro: "Jacksonville",
    state: "FL",
    country: "US",
    abbreviation: "jacksonville-fl",
    cities: ["Jacksonville", "St. Augustine", "Orange Park", "Fernandina Beach", "Ponte Vedra", "Gainesville"]
  },
  // GEORGIA
  {
    metro: "Atlanta",
    state: "GA",
    country: "US",
    abbreviation: "atlanta-ga",
    cities: ["Atlanta", "Alpharetta", "Marietta", "Decatur", "Sandy Springs", "Roswell", "Dunwoody", "Smyrna", "Kennesaw", "Lawrenceville", "Duluth", "Johns Creek", "Brookhaven", "Peachtree City", "Savannah"]
  },
  // HAWAII
  {
    metro: "Honolulu",
    state: "HI",
    country: "US",
    abbreviation: "honolulu-hi",
    cities: ["Honolulu", "Pearl City", "Kailua", "Kaneohe", "Hilo", "Kona"]
  },
  // IDAHO
  {
    metro: "Boise",
    state: "ID",
    country: "US",
    abbreviation: "boise-id",
    cities: ["Boise", "Nampa", "Meridian", "Caldwell", "Twin Falls", "Idaho Falls", "Pocatello"]
  },
  // ILLINOIS
  {
    metro: "Chicago Metro",
    state: "IL",
    country: "US",
    abbreviation: "chicago-il",
    cities: ["Chicago", "Evanston", "Naperville", "Oak Park", "Schaumburg", "Skokie", "Aurora", "Joliet", "Elgin", "Waukegan", "Cicero", "Bolingbrook", "Palatine", "Arlington Heights", "Wilmette", "Deerfield", "Highland Park", "Glencoe", "Northbrook", "Glenview"]
  },
  // INDIANA
  {
    metro: "Indianapolis",
    state: "IN",
    country: "US",
    abbreviation: "indianapolis-in",
    cities: ["Indianapolis", "Carmel", "Fishers", "Noblesville", "Greenwood", "Lawrence", "Anderson", "Muncie", "Fort Wayne", "Bloomington", "South Bend"]
  },
  // IOWA
  {
    metro: "Des Moines",
    state: "IA",
    country: "US",
    abbreviation: "des-moines-ia",
    cities: ["Des Moines", "West Des Moines", "Ankeny", "Urbandale", "Ames", "Cedar Rapids", "Iowa City", "Davenport"]
  },
  // KANSAS
  {
    metro: "Wichita",
    state: "KS",
    country: "US",
    abbreviation: "wichita-ks",
    cities: ["Wichita", "Derby", "Andover", "Haysville", "Salina", "Topeka", "Manhattan"]
  },
  // KANSAS CITY
  {
    metro: "Kansas City Metro",
    state: "MO",
    country: "US",
    abbreviation: "kansas-city-metro",
    cities: ["Kansas City MO", "Kansas City KS", "Overland Park", "Olathe", "Lee's Summit", "Independence", "Blue Springs", "Liberty", "Lenexa", "Shawnee", "Prairie Village", "Leawood", "Raytown", "Gladstone"]
  },
  // KENTUCKY
  {
    metro: "Louisville",
    state: "KY",
    country: "US",
    abbreviation: "louisville-ky",
    cities: ["Louisville", "Jeffersonville", "New Albany", "Elizabethtown", "Bowling Green", "Owensboro"]
  },
  {
    metro: "Lexington",
    state: "KY",
    country: "US",
    abbreviation: "lexington-ky",
    cities: ["Lexington", "Richmond", "Georgetown", "Nicholasville", "Frankfort"]
  },
  // LOUISIANA
  {
    metro: "New Orleans",
    state: "LA",
    country: "US",
    abbreviation: "new-orleans-la",
    cities: ["New Orleans", "Metairie", "Kenner", "Slidell", "Covington", "Mandeville", "Gretna"]
  },
  {
    metro: "Baton Rouge",
    state: "LA",
    country: "US",
    abbreviation: "baton-rouge-la",
    cities: ["Baton Rouge", "Gonzales", "Denham Springs", "Zachary", "Lafayette", "Shreveport"]
  },
  // MAINE
  {
    metro: "Portland ME",
    state: "ME",
    country: "US",
    abbreviation: "portland-me",
    cities: ["Portland", "South Portland", "Westbrook", "Biddeford", "Bangor", "Augusta"]
  },
  // MARYLAND
  {
    metro: "Baltimore",
    state: "MD",
    country: "US",
    abbreviation: "baltimore-md",
    cities: ["Baltimore", "Annapolis", "Columbia", "Towson", "Bowie", "Rockville", "Gaithersburg", "Frederick", "Ellicott City", "Catonsville"]
  },
  // MASSACHUSETTS
  {
    metro: "Boston Metro",
    state: "MA",
    country: "US",
    abbreviation: "boston-ma",
    cities: ["Boston", "Cambridge", "Newton", "Brookline", "Somerville", "Quincy", "Medford", "Waltham", "Lexington", "Framingham", "Worcester", "Providence RI", "Manchester NH", "Portsmouth NH", "Burlington VT"]
  },
  // MICHIGAN
  {
    metro: "Detroit Metro",
    state: "MI",
    country: "US",
    abbreviation: "detroit-mi",
    cities: ["Detroit", "Ann Arbor", "Troy", "Royal Oak", "Dearborn", "Livonia", "Warren", "Sterling Heights", "Farmington Hills", "Novi", "Pontiac", "Southfield", "Canton", "Ypsilanti", "Flint"]
  },
  {
    metro: "Grand Rapids",
    state: "MI",
    country: "US",
    abbreviation: "grand-rapids-mi",
    cities: ["Grand Rapids", "Wyoming", "Kentwood", "Walker", "Muskegon", "Holland", "Kalamazoo", "Lansing"]
  },
  // MINNESOTA
  {
    metro: "Minneapolis / St. Paul",
    state: "MN",
    country: "US",
    abbreviation: "minneapolis-mn",
    cities: ["Minneapolis", "St. Paul", "Bloomington", "Plymouth", "Edina", "Eden Prairie", "Minnetonka", "Maple Grove", "Brooklyn Park", "Woodbury", "Eagan", "Burnsville", "Roseville", "St. Cloud", "Duluth"]
  },
  // MISSISSIPPI
  {
    metro: "Jackson MS",
    state: "MS",
    country: "US",
    abbreviation: "jackson-ms",
    cities: ["Jackson", "Ridgeland", "Madison", "Brandon", "Flowood", "Hattiesburg", "Biloxi", "Gulfport"]
  },
  // MISSOURI
  {
    metro: "St. Louis",
    state: "MO",
    country: "US",
    abbreviation: "st-louis-mo",
    cities: ["St. Louis", "Clayton", "Kirkwood", "Webster Groves", "Chesterfield", "Ballwin", "Florissant", "St. Charles", "O'Fallon", "Belleville IL", "Edwardsville IL"]
  },
  // MONTANA
  {
    metro: "Montana",
    state: "MT",
    country: "US",
    abbreviation: "montana-mt",
    cities: ["Billings", "Missoula", "Great Falls", "Bozeman", "Helena", "Kalispell"]
  },
  // NEBRASKA
  {
    metro: "Omaha / Lincoln",
    state: "NE",
    country: "US",
    abbreviation: "omaha-ne",
    cities: ["Omaha", "Lincoln", "Bellevue", "Council Bluffs IA", "Papillion", "La Vista", "Fremont", "Grand Island", "Kearney"]
  },
  // NEVADA
  {
    metro: "Las Vegas",
    state: "NV",
    country: "US",
    abbreviation: "las-vegas-nv",
    cities: ["Las Vegas", "Henderson", "Summerlin", "North Las Vegas", "Boulder City", "Mesquite"]
  },
  {
    metro: "Reno",
    state: "NV",
    country: "US",
    abbreviation: "reno-nv",
    cities: ["Reno", "Sparks", "Carson City", "Fernley"]
  },
  // NEW MEXICO
  {
    metro: "Albuquerque",
    state: "NM",
    country: "US",
    abbreviation: "albuquerque-nm",
    cities: ["Albuquerque", "Rio Rancho", "Santa Fe", "Las Cruces", "Farmington"]
  },
  // NEW YORK
  {
    metro: "NYC Metro",
    state: "NY",
    country: "US",
    abbreviation: "nyc-metro",
    cities: ["New York City", "Brooklyn", "Queens", "The Bronx", "Staten Island", "Long Island City", "Flushing", "Jamaica", "Hempstead", "Garden City", "Great Neck", "White Plains", "Yonkers", "Mount Vernon", "New Rochelle", "Hoboken NJ", "Jersey City NJ", "Newark NJ", "Stamford CT"]
  },
  {
    metro: "Buffalo / Rochester",
    state: "NY",
    country: "US",
    abbreviation: "buffalo-ny",
    cities: ["Buffalo", "Rochester", "Niagara Falls", "Amherst", "Cheektowaga", "Syracuse", "Albany", "Troy", "Saratoga Springs"]
  },
  // NORTH CAROLINA
  {
    metro: "Charlotte",
    state: "NC",
    country: "US",
    abbreviation: "charlotte-nc",
    cities: ["Charlotte", "Concord", "Gastonia", "Rock Hill SC", "Huntersville", "Mooresville", "Matthews", "Pineville", "Kannapolis", "Columbia SC"]
  },
  {
    metro: "Raleigh / Durham",
    state: "NC",
    country: "US",
    abbreviation: "raleigh-nc",
    cities: ["Raleigh", "Durham", "Chapel Hill", "Cary", "Apex", "Morrisville", "Wake Forest", "Greensboro", "Winston-Salem", "High Point"]
  },
  // NORTH DAKOTA
  {
    metro: "Fargo",
    state: "ND",
    country: "US",
    abbreviation: "fargo-nd",
    cities: ["Fargo", "Moorhead MN", "West Fargo", "Bismarck", "Grand Forks", "Minot"]
  },
  // OHIO
  {
    metro: "Columbus",
    state: "OH",
    country: "US",
    abbreviation: "columbus-oh",
    cities: ["Columbus", "Dublin", "Westerville", "Hilliard", "Gahanna", "Grove City", "Newark", "Lancaster", "Delaware"]
  },
  {
    metro: "Cleveland",
    state: "OH",
    country: "US",
    abbreviation: "cleveland-oh",
    cities: ["Cleveland", "Akron", "Parma", "Lakewood", "Euclid", "Strongsville", "Mentor", "Lorain", "Elyria", "Canton", "Youngstown"]
  },
  {
    metro: "Cincinnati",
    state: "OH",
    country: "US",
    abbreviation: "cincinnati-oh",
    cities: ["Cincinnati", "Covington KY", "Florence KY", "Mason", "West Chester", "Blue Ash", "Fairfield", "Hamilton", "Dayton", "Kettering"]
  },
  // OKLAHOMA
  {
    metro: "Oklahoma City Metro",
    state: "OK",
    country: "US",
    abbreviation: "okc-ok",
    cities: ["Oklahoma City", "Edmond", "Norman", "Moore", "Yukon", "Mustang", "Midwest City", "Del City", "Tuttle", "Piedmont", "Guthrie", "Shawnee"]
  },
  {
    metro: "Tulsa Metro",
    state: "OK",
    country: "US",
    abbreviation: "tulsa-ok",
    cities: ["Tulsa", "Broken Arrow", "Bixby", "Owasso", "Jenks", "Sand Springs", "Sapulpa", "Claremore", "Bartlesville", "Muskogee"]
  },
  // OREGON
  {
    metro: "Portland Metro",
    state: "OR",
    country: "US",
    abbreviation: "portland-or",
    cities: ["Portland", "Beaverton", "Hillsboro", "Gresham", "Lake Oswego", "Tigard", "Tualatin", "Salem", "Vancouver WA", "Eugene", "Bend"]
  },
  // PENNSYLVANIA
  {
    metro: "Philadelphia Metro",
    state: "PA",
    country: "US",
    abbreviation: "philadelphia-pa",
    cities: ["Philadelphia", "Main Line", "Cherry Hill NJ", "Mount Laurel NJ", "Wilmington DE", "Newark DE", "Allentown", "Bethlehem", "Reading", "King of Prussia", "Ardmore", "Bala Cynwyd", "Jenkintown", "Doylestown", "West Chester"]
  },
  {
    metro: "Pittsburgh",
    state: "PA",
    country: "US",
    abbreviation: "pittsburgh-pa",
    cities: ["Pittsburgh", "Mt. Lebanon", "Upper St. Clair", "Bethel Park", "Monroeville", "Cranberry Township", "Weirton WV", "Wheeling WV", "Morgantown WV"]
  },
  // SOUTH CAROLINA
  {
    metro: "Columbia SC",
    state: "SC",
    country: "US",
    abbreviation: "columbia-sc",
    cities: ["Columbia", "Lexington", "Irmo", "Sumter", "Florence", "Myrtle Beach", "Hilton Head", "Greenville", "Spartanburg", "Anderson"]
  },
  // SOUTH DAKOTA
  {
    metro: "Sioux Falls",
    state: "SD",
    country: "US",
    abbreviation: "sioux-falls-sd",
    cities: ["Sioux Falls", "Rapid City", "Aberdeen", "Brookings"]
  },
  // TENNESSEE
  {
    metro: "Nashville Metro",
    state: "TN",
    country: "US",
    abbreviation: "nashville-tn",
    cities: ["Nashville", "Franklin", "Brentwood", "Murfreesboro", "Hendersonville", "Smyrna", "Gallatin", "Spring Hill", "Columbia", "Clarksville"]
  },
  {
    metro: "Memphis",
    state: "TN",
    country: "US",
    abbreviation: "memphis-tn",
    cities: ["Memphis", "Germantown", "Collierville", "Bartlett", "Southaven MS", "Olive Branch MS", "Jonesboro AR", "Jackson TN"]
  },
  {
    metro: "Knoxville",
    state: "TN",
    country: "US",
    abbreviation: "knoxville-tn",
    cities: ["Knoxville", "Maryville", "Oak Ridge", "Farragut", "Morristown", "Chattanooga", "Johnson City", "Kingsport", "Bristol"]
  },
  // TEXAS
  {
    metro: "Dallas / Fort Worth",
    state: "TX",
    country: "US",
    abbreviation: "dfw-tx",
    cities: ["Dallas", "Fort Worth", "Plano", "Frisco", "Arlington", "Irving", "McKinney", "Allen", "Richardson", "Garland", "Mesquite", "Carrollton", "Lewisville", "Denton", "Grapevine", "Southlake", "Flower Mound", "Euless", "Bedford", "Colleyville", "Keller", "Mansfield", "Grand Prairie", "Cedar Hill"]
  },
  {
    metro: "Houston",
    state: "TX",
    country: "US",
    abbreviation: "houston-tx",
    cities: ["Houston", "Sugar Land", "The Woodlands", "Pearland", "Katy", "Cypress", "Spring", "Pasadena", "Friendswood", "League City", "Baytown", "Missouri City", "Stafford", "Humble", "Conroe"]
  },
  {
    metro: "Austin",
    state: "TX",
    country: "US",
    abbreviation: "austin-tx",
    cities: ["Austin", "Round Rock", "Cedar Park", "Pflugerville", "Georgetown", "San Marcos", "Kyle", "Buda", "Leander", "Lakeway", "Dripping Springs", "Waco"]
  },
  {
    metro: "San Antonio",
    state: "TX",
    country: "US",
    abbreviation: "san-antonio-tx",
    cities: ["San Antonio", "New Braunfels", "Schertz", "Converse", "Universal City", "Boerne", "Seguin", "Kerrville", "Laredo"]
  },
  {
    metro: "El Paso",
    state: "TX",
    country: "US",
    abbreviation: "el-paso-tx",
    cities: ["El Paso", "Ciudad Juarez", "Las Cruces NM", "Odessa", "Midland", "Lubbock", "Amarillo"]
  },
  // UTAH
  {
    metro: "Salt Lake City",
    state: "UT",
    country: "US",
    abbreviation: "salt-lake-city-ut",
    cities: ["Salt Lake City", "Provo", "Orem", "Ogden", "Park City", "Sandy", "South Jordan", "West Jordan", "Layton", "Draper", "Murray", "Taylorsville", "St. George"]
  },
  // VIRGINIA
  {
    metro: "Richmond",
    state: "VA",
    country: "US",
    abbreviation: "richmond-va",
    cities: ["Richmond", "Henrico", "Chesterfield", "Midlothian", "Chester", "Mechanicsville", "Fredericksburg", "Charlottesville"]
  },
  {
    metro: "Virginia Beach / Norfolk",
    state: "VA",
    country: "US",
    abbreviation: "hampton-roads-va",
    cities: ["Virginia Beach", "Norfolk", "Chesapeake", "Newport News", "Hampton", "Portsmouth", "Suffolk", "Williamsburg"]
  },
  // WASHINGTON
  {
    metro: "Seattle Metro",
    state: "WA",
    country: "US",
    abbreviation: "seattle-wa",
    cities: ["Seattle", "Bellevue", "Redmond", "Kirkland", "Tacoma", "Everett", "Renton", "Kent", "Federal Way", "Shoreline", "Bothell", "Issaquah", "Sammamish", "Lynnwood", "Puyallup", "Olympia"]
  },
  {
    metro: "Spokane",
    state: "WA",
    country: "US",
    abbreviation: "spokane-wa",
    cities: ["Spokane", "Spokane Valley", "Coeur d'Alene ID", "Post Falls ID", "Kennewick", "Richland", "Pasco", "Yakima"]
  },
  // WISCONSIN
  {
    metro: "Milwaukee",
    state: "WI",
    country: "US",
    abbreviation: "milwaukee-wi",
    cities: ["Milwaukee", "Wauwatosa", "West Allis", "Greenfield", "Oak Creek", "Waukesha", "Brookfield", "Racine", "Kenosha", "Sheboygan"]
  },
  {
    metro: "Madison",
    state: "WI",
    country: "US",
    abbreviation: "madison-wi",
    cities: ["Madison", "Fitchburg", "Middleton", "Sun Prairie", "Janesville", "Beloit", "Appleton", "Green Bay", "Oshkosh"]
  }
];

export default METRO_REGIONS;

/**
 * Find the metro region for a given city name.
 * Uses case-insensitive matching.
 * Returns null if no metro region contains the city.
 */
export function findMetroForCity(cityName: string): MetroRegion | null {
  const normalized = cityName.toLowerCase().trim();
  for (const metro of METRO_REGIONS) {
    for (const city of metro.cities) {
      if (city.toLowerCase() === normalized) {
        return metro;
      }
    }
  }
  return null;
}

/**
 * Find metro region by abbreviation (slug).
 */
export function findMetroByAbbreviation(abbreviation: string): MetroRegion | null {
  return METRO_REGIONS.find((m) => m.abbreviation === abbreviation) || null;
}

/**
 * Get a human-readable subtitle listing covered cities.
 * e.g. "Tulsa, Broken Arrow, Bixby, Owasso, Jenks, and surrounding areas"
 */
export function getMetroCitiesSubtitle(metro: MetroRegion, maxCities: number = 5): string {
  const cities = metro.cities.slice(0, maxCities);
  if (metro.cities.length > maxCities) {
    return cities.join(", ") + ", and surrounding areas";
  }
  if (cities.length <= 2) {
    return cities.join(" and ");
  }
  return cities.slice(0, -1).join(", ") + ", and " + cities[cities.length - 1];
}

/**
 * Get all metro regions that have at least one game listing.
 * Returns metros with game counts.
 */
export function getMetrosWithGames(
  citiesWithGames: { city: string; state: string; count: number }[]
): { metro: MetroRegion; totalGames: number; activeCities: string[] }[] {
  const metroMap = new Map<string, { metro: MetroRegion; totalGames: number; activeCities: string[] }>();

  for (const cityData of citiesWithGames) {
    const metro = findMetroForCity(cityData.city);
    if (metro) {
      const existing = metroMap.get(metro.abbreviation);
      if (existing) {
        existing.totalGames += cityData.count;
        if (!existing.activeCities.includes(cityData.city)) {
          existing.activeCities.push(cityData.city);
        }
      } else {
        metroMap.set(metro.abbreviation, {
          metro,
          totalGames: cityData.count,
          activeCities: [cityData.city],
        });
      }
    }
  }

  return Array.from(metroMap.values()).sort((a, b) => b.totalGames - a.totalGames);
}
