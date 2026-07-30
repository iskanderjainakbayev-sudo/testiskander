import type { GameSnapshot } from '../../lib/odyssey/types';

export type ExpeditionTheme = 'solace' | 'nacre';

export interface ExpeditionPresentation {
  theme: ExpeditionTheme;
  planet: string;
  site: string;
  location: string;
  corridorLabel: string;
  landingAction: string;
  surveyLabel: string;
  vectorLabel: string;
  atmosphere: string;
  weather: string;
  archiveLabel: string;
  sampleLabel: string;
  interactionVerb: string;
  landingStatus: string;
  ascentStatus: string;
}

export function expeditionPresentation(snapshot: GameSnapshot): ExpeditionPresentation {
  const landingLocation = snapshot.landingSiteName?.trim()
    || snapshot.locationName?.trim()
    || snapshot.targetName;
  const location = snapshot.locationName?.trim() || landingLocation;
  const theme = detectTheme(landingLocation, location, snapshot.target);
  const parts = landingLocation.split('/').map((part) => part.trim()).filter(Boolean);
  const planet = (parts.length > 1 ? parts[0] : snapshot.targetName).toUpperCase();
  const site = (parts.length > 1 ? parts.slice(1).join(' / ') : parts[0] ?? location).toUpperCase();

  if (theme === 'nacre') {
    return {
      theme,
      planet,
      site,
      location,
      corridorLabel: `${planet} SILICA DESCENT CORRIDOR`,
      landingAction: `DESCEND TO ${site}`,
      surveyLabel: 'PRISMATIC SURVEY COMPLETE',
      vectorLabel: 'CANYON VECTOR ACQUIRED',
      atmosphere: '0.61',
      weather: '−22°C · SILICA DUST',
      archiveLabel: 'PRISM ARCHIVE',
      sampleLabel: 'PRISM CHOIR CALIBRATED',
      interactionVerb: 'CALIBRATE',
      landingStatus: 'SILICA CORRIDOR STABLE',
      ascentStatus: 'DUST ESCAPE ENVELOPE STABLE',
    };
  }
  return {
    theme,
    planet,
    site,
    location,
    corridorLabel: `${planet} DESCENT CORRIDOR`,
    landingAction: `LAND ON ${site}`,
    surveyLabel: 'BIOLOGICAL SURVEY COMPLETE',
    vectorLabel: 'DESCENT VECTOR ACQUIRED',
    atmosphere: '0.84',
    weather: '7.2°C · BIOACTIVE RAIN',
    archiveLabel: 'FIELD ARCHIVE',
    sampleLabel: 'ECHO BLOOMS RESONATED',
    interactionVerb: 'RESONATE',
    landingStatus: 'LANDING CORRIDOR STABLE',
    ascentStatus: 'ESCAPE ENVELOPE STABLE',
  };
}

function detectTheme(
  landingLocation: string,
  location: string,
  target: GameSnapshot['target'],
): ExpeditionTheme {
  const identity = `${landingLocation} ${location}`.toUpperCase();
  return identity.includes('NACRE') || target === 'nacre' ? 'nacre' : 'solace';
}
