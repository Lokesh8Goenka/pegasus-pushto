// Target list and sky-position maths. The Sun is deliberately not in the list.
'use strict';

const TARGETS = [
  { group: 'Solar system', name: 'Moon', body: 'Moon' },
  { group: 'Solar system', name: 'Jupiter', body: 'Jupiter' },
  { group: 'Solar system', name: 'Saturn', body: 'Saturn' },
  { group: 'Solar system', name: 'Mars', body: 'Mars' },
  { group: 'Solar system', name: 'Venus', body: 'Venus' },
  { group: 'Solar system', name: 'Mercury', body: 'Mercury' },
  { group: 'Solar system', name: 'Uranus', body: 'Uranus' },
  { group: 'Solar system', name: 'Neptune', body: 'Neptune' },

  // Stars and deep-sky objects: right ascension in hours, declination in degrees (J2000).
  { group: 'Bright stars', name: 'Sirius', ra: 6.7525, dec: -16.7161 },
  { group: 'Bright stars', name: 'Canopus', ra: 6.3992, dec: -52.6957 },
  { group: 'Bright stars', name: 'Arcturus', ra: 14.2610, dec: 19.1825 },
  { group: 'Bright stars', name: 'Vega', ra: 18.6156, dec: 38.7837 },
  { group: 'Bright stars', name: 'Capella', ra: 5.2782, dec: 45.9980 },
  { group: 'Bright stars', name: 'Rigel', ra: 5.2423, dec: -8.2016 },
  { group: 'Bright stars', name: 'Procyon', ra: 7.6550, dec: 5.2250 },
  { group: 'Bright stars', name: 'Betelgeuse', ra: 5.9195, dec: 7.4071 },
  { group: 'Bright stars', name: 'Altair', ra: 19.8464, dec: 8.8683 },
  { group: 'Bright stars', name: 'Aldebaran', ra: 4.5987, dec: 16.5093 },
  { group: 'Bright stars', name: 'Antares', ra: 16.4901, dec: -26.4320 },
  { group: 'Bright stars', name: 'Spica', ra: 13.4199, dec: -11.1613 },
  { group: 'Bright stars', name: 'Pollux', ra: 7.7553, dec: 28.0262 },
  { group: 'Bright stars', name: 'Fomalhaut', ra: 22.9608, dec: -29.6222 },
  { group: 'Bright stars', name: 'Deneb', ra: 20.6905, dec: 45.2803 },
  { group: 'Bright stars', name: 'Regulus', ra: 10.1395, dec: 11.9672 },
  { group: 'Bright stars', name: 'Polaris (Pole Star)', ra: 2.5303, dec: 89.2641 },

  { group: 'Double stars', name: 'Albireo', ra: 19.5120, dec: 27.9597 },
  { group: 'Double stars', name: 'Mizar', ra: 13.3987, dec: 54.9254 },

  { group: 'Clusters and nebulae', name: 'Pleiades (M45)', ra: 3.7900, dec: 24.1167 },
  { group: 'Clusters and nebulae', name: 'Orion Nebula (M42)', ra: 5.5881, dec: -5.3911 },
  { group: 'Clusters and nebulae', name: 'Andromeda Galaxy (M31)', ra: 0.7123, dec: 41.2692 },
  { group: 'Clusters and nebulae', name: 'Double Cluster', ra: 2.3333, dec: 57.1333 },
  { group: 'Clusters and nebulae', name: 'Beehive (M44)', ra: 8.6700, dec: 19.6700 },
  { group: 'Clusters and nebulae', name: 'Hercules Cluster (M13)', ra: 16.6949, dec: 36.4613 },
  { group: 'Clusters and nebulae', name: 'Lagoon Nebula (M8)', ra: 18.0603, dec: -24.3867 },
  { group: 'Clusters and nebulae', name: 'Ptolemy Cluster (M7)', ra: 17.8980, dec: -34.7930 },
];

// Where the target is in the sky right now: altitude (degrees above the horizon)
// and azimuth (degrees clockwise from north), with atmospheric refraction.
function targetAltAz(target, date, lat, lon) {
  const observer = new Astronomy.Observer(lat, lon, 1200);
  let body = target.body;
  if (!body) {
    Astronomy.DefineStar('Star1', target.ra, target.dec, 1000);
    body = 'Star1';
  }
  const eq = Astronomy.Equator(body, date, observer, true, true);
  const hor = Astronomy.Horizon(date, observer, eq.ra, eq.dec, 'normal');
  return { alt: hor.altitude, az: hor.azimuth };
}
