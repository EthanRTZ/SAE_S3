const prestataires = [
  { id: 'p-1', name: 'Plage Events', type: 'location', contacts: { email: 'contact@plage.fr' }, location: { lat: 43.0, lng: -1.0 } },
  { id: 'p-2', name: 'Eau & Co', type: 'fournisseur', contacts: { phone: '0123456789' } }
];

const services = [
  { id: 's-1', name: 'Branchement électrique', description: 'Point électrique 220V', requirements: ['accès', 'espace'] },
  { id: 's-2', name: 'Eau potable', description: 'Distribution eau', requirements: ['point d\'eau'] }
];

const manifestations = [
  { id: 'm-1', title: 'Festival Plage 2024', start: '2024-08-01', end: '2024-08-03', location: { city: 'Golden Coast' }, services: ['s-1','s-2'], prestataires: ['p-1'] }
];

module.exports = { prestataires, services, manifestations };

