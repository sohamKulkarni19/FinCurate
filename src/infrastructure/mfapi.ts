// types
export interface MfApiSchemeInfo {
  schemeCode: number;
  schemeName: string;
}

export interface MfApiNavData {
  date: string;
  nav: string;
}

export interface MfApiResponse {
  meta: {
    fund_house: string;
    scheme_type: string;
    scheme_category: string;
    scheme_code: number;
    scheme_name: string;
  };
  data: MfApiNavData[];
}

/**
 * Fetches the master list of all mutual funds from MFapi.in
 */
export async function fetchSchemeList(): Promise<MfApiSchemeInfo[]> {
  const res = await fetch("https://api.mfapi.in/mf");
  if (!res.ok) {
    throw new Error(`Failed to fetch scheme list. Status: ${res.status}`);
  }
  return res.json();
}

/**
 * Fetches the complete historical NAV data for a specific scheme
 */
export async function fetchSchemeNavHistory(schemeCode: number): Promise<MfApiResponse> {
  const res = await fetch(`https://api.mfapi.in/mf/${schemeCode}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch NAV data for scheme ${schemeCode}. Status: ${res.status}`);
  }
  return res.json();
}
