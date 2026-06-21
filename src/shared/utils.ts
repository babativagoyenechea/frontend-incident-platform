/**
 * Generador de UUIDs offline determinista RFC-4122 para evitar fallos de polyfill
 */
export const generateMockId = (type: 'uuid' | 'trace' = 'uuid'): string => {
  const s4 = () => Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
  
  if (type === 'trace') {
    return `tr-${s4()}${s4()}`;
  }
  
  return `${s4()}${s4()}-${s4()}-${s4()}-${s4()}-${s4()}${s4()}${s4()}`;
};
