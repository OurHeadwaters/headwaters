export const getHwHeaders = () => {
  return {
    headers: {
      'x-hw-passphrase': localStorage.getItem('hw-auth') ?? '',
    },
  };
};

export const RISK_PROFILES = [
  { value: 1, label: 'Tight' },
  { value: 2, label: 'Guided' },
  { value: 3, label: 'Balanced' },
  { value: 4, label: 'Open' },
  { value: 5, label: 'Self-directed' },
];

export const ZONES = [
  { value: 'zone-0', label: 'The Self' },
  { value: 'zone-1', label: 'The Home' },
  { value: 'zone-2', label: 'The Garden' },
  { value: 'zone-3', label: 'The Homestead' },
  { value: 'zone-4', label: 'The Forest' },
  { value: 'zone-5', label: 'The Wild' },
];

export const getRiskProfileLabel = (value: number) => {
  return RISK_PROFILES.find((r) => r.value === value)?.label || 'Unknown';
};

export const getZoneLabel = (value: string) => {
  return ZONES.find((z) => z.value === value)?.label || value;
};
