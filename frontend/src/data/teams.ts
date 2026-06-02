export type Confederation =
  | "CONMEBOL"
  | "UEFA"
  | "CAF"
  | "CONCACAF"
  | "AFC"
  | "OFC";

export interface TeamMeta {
  es: string;
  flag: string;
  confederation: Confederation;
}

// Keys match exactly the team names used in the backend matches.json
export const TEAM_META: Record<string, TeamMeta> = {
  // CONMEBOL (6)
  Argentina: { es: "Argentina", flag: "🇦🇷", confederation: "CONMEBOL" },
  Brazil: { es: "Brasil", flag: "🇧🇷", confederation: "CONMEBOL" },
  Colombia: { es: "Colombia", flag: "🇨🇴", confederation: "CONMEBOL" },
  Ecuador: { es: "Ecuador", flag: "🇪🇨", confederation: "CONMEBOL" },
  Paraguay: { es: "Paraguay", flag: "🇵🇾", confederation: "CONMEBOL" },
  Uruguay: { es: "Uruguay", flag: "🇺🇾", confederation: "CONMEBOL" },

  // UEFA (16)
  Austria: { es: "Austria", flag: "🇦🇹", confederation: "UEFA" },
  Belgium: { es: "Bélgica", flag: "🇧🇪", confederation: "UEFA" },
  "Bosnia-Herzegovina": { es: "Bosnia", flag: "🇧🇦", confederation: "UEFA" },
  Croatia: { es: "Croacia", flag: "🇭🇷", confederation: "UEFA" },
  "Czech Republic": {
    es: "República Checa",
    flag: "🇨🇿",
    confederation: "UEFA",
  },
  England: { es: "Inglaterra", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", confederation: "UEFA" },
  France: { es: "Francia", flag: "🇫🇷", confederation: "UEFA" },
  Germany: { es: "Alemania", flag: "🇩🇪", confederation: "UEFA" },
  Netherlands: { es: "Países Bajos", flag: "🇳🇱", confederation: "UEFA" },
  Norway: { es: "Noruega", flag: "🇳🇴", confederation: "UEFA" },
  Portugal: { es: "Portugal", flag: "🇵🇹", confederation: "UEFA" },
  Scotland: { es: "Escocia", flag: "🏴󠁧󠁢󠁳󠁣󠁴󠁿", confederation: "UEFA" },
  Spain: { es: "España", flag: "🇪🇸", confederation: "UEFA" },
  Sweden: { es: "Suecia", flag: "🇸🇪", confederation: "UEFA" },
  Switzerland: { es: "Suiza", flag: "🇨🇭", confederation: "UEFA" },
  Turkey: { es: "Turquía", flag: "🇹🇷", confederation: "UEFA" },

  // CAF (10)
  Algeria: { es: "Argelia", flag: "🇩🇿", confederation: "CAF" },
  "Cape Verde": { es: "Cabo Verde", flag: "🇨🇻", confederation: "CAF" },
  "Congo DR": { es: "RD Congo", flag: "🇨🇩", confederation: "CAF" },
  Egypt: { es: "Egipto", flag: "🇪🇬", confederation: "CAF" },
  Ghana: { es: "Ghana", flag: "🇬🇭", confederation: "CAF" },
  "Ivory Coast": { es: "Costa de Marfil", flag: "🇨🇮", confederation: "CAF" },
  Morocco: { es: "Marruecos", flag: "🇲🇦", confederation: "CAF" },
  Senegal: { es: "Senegal", flag: "🇸🇳", confederation: "CAF" },
  "South Africa": { es: "Sudáfrica", flag: "🇿🇦", confederation: "CAF" },
  Tunisia: { es: "Túnez", flag: "🇹🇳", confederation: "CAF" },

  // CONCACAF (6)
  Canada: { es: "Canadá", flag: "🇨🇦", confederation: "CONCACAF" },
  Curaçao: { es: "Curazao", flag: "🇨🇼", confederation: "CONCACAF" },
  Haiti: { es: "Haití", flag: "🇭🇹", confederation: "CONCACAF" },
  Mexico: { es: "México", flag: "🇲🇽", confederation: "CONCACAF" },
  Panama: { es: "Panamá", flag: "🇵🇦", confederation: "CONCACAF" },
  USA: { es: "Estados Unidos", flag: "🇺🇸", confederation: "CONCACAF" },

  // AFC (9)
  Australia: { es: "Australia", flag: "🇦🇺", confederation: "AFC" },
  Iran: { es: "Irán", flag: "🇮🇷", confederation: "AFC" },
  Iraq: { es: "Irak", flag: "🇮🇶", confederation: "AFC" },
  Japan: { es: "Japón", flag: "🇯🇵", confederation: "AFC" },
  Jordan: { es: "Jordania", flag: "🇯🇴", confederation: "AFC" },
  Qatar: { es: "Qatar", flag: "🇶🇦", confederation: "AFC" },
  "Saudi Arabia": { es: "Arabia Saudita", flag: "🇸🇦", confederation: "AFC" },
  "South Korea": { es: "Corea del Sur", flag: "🇰🇷", confederation: "AFC" },
  Uzbekistan: { es: "Uzbekistán", flag: "🇺🇿", confederation: "AFC" },

  // OFC (1)
  "New Zealand": { es: "Nueva Zelanda", flag: "🇳🇿", confederation: "OFC" },
};

const confedOrder: Confederation[] = [
  "CONMEBOL",
  "UEFA",
  "CAF",
  "CONCACAF",
  "AFC",
  "OFC",
];

export const TEAMS_BY_CONFEDERATION: Record<Confederation, string[]> =
  confedOrder.reduce(
    (acc, conf) => {
      acc[conf] = Object.entries(TEAM_META)
        .filter(([, m]) => m.confederation === conf)
        .map(([name]) => name);
      return acc;
    },
    {} as Record<Confederation, string[]>,
  );

export const CONFEDERATION_LABELS: Record<Confederation, string> = {
  CONMEBOL: "CONMEBOL",
  UEFA: "UEFA",
  CAF: "CAF (África)",
  CONCACAF: "CONCACAF",
  AFC: "AFC (Asia)",
  OFC: "OFC (Oceanía)",
};

export const TEAM_COUNTRY_CODES: Record<string, string> = {
  Argentina: "AR",
  Brazil: "BR",
  Colombia: "CO",
  Ecuador: "EC",
  Paraguay: "PY",
  Uruguay: "UY",
  Austria: "AT",
  Belgium: "BE",
  "Bosnia-Herzegovina": "BA",
  Croatia: "HR",
  "Czech Republic": "CZ",
  England: "GB",
  France: "FR",
  Germany: "DE",
  Netherlands: "NL",
  Norway: "NO",
  Portugal: "PT",
  Scotland: "GB",
  Spain: "ES",
  Sweden: "SE",
  Switzerland: "CH",
  Turkey: "TR",
  Algeria: "DZ",
  "Cape Verde": "CV",
  "Congo DR": "CD",
  Egypt: "EG",
  Ghana: "GH",
  "Ivory Coast": "CI",
  Morocco: "MA",
  Senegal: "SN",
  "South Africa": "ZA",
  Tunisia: "TN",
  Canada: "CA",
  Curaçao: "CW",
  Haiti: "HT",
  Mexico: "MX",
  Panama: "PA",
  USA: "US",
  Australia: "AU",
  Iran: "IR",
  Iraq: "IQ",
  Japan: "JP",
  Jordan: "JO",
  Qatar: "QA",
  "Saudi Arabia": "SA",
  "South Korea": "KR",
  Uzbekistan: "UZ",
  "New Zealand": "NZ",
};
