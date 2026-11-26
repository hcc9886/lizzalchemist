import density from './density.js';
import solubility from './solubility.js';
import titration from './titration.js';
import chromatography from './chromatography.js';
import gaslaws from './gaslaws.js';
import rate from './rate.js';
import cell from './cell.js';
import calorimetry from './calorimetry.js';
import molecule from './molecule.js';
import ptable from './ptable.js';
import combustion from './combustion.js';
import distill from './distill.js';
import sandbox from './sandbox.js';

export const EXPERIMENTS = {
  density, solubility, titration, chromatography, gaslaws, rate, cell, calorimetry,
  molecule, ptable, combustion, distill, sandbox
};

export function expById(id) {
  return EXPERIMENTS[id] || null;
}
