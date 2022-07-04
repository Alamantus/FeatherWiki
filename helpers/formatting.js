/**
 * This file is part of Feather Wiki.
 *
 * Feather Wiki is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 *
 * Feather Wiki is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License along with Feather Wiki. If not, see https://www.gnu.org/licenses/.
 */
export const slugify = s => s.toLowerCase().replace(/\s/g, '_').replace(/\W/g, '-');

export const formatDate = d => {
  const pad = s => s.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${d.getHours() % 12}:${pad(d.getMinutes())} ${d.getHours() / 12 < 1 ? 'a' : 'p'}m`;
};

export const tidyArray = ar => { // For arrays of strings (like tags) only
  const a = ar.map(v => v.trim());
  return a.filter((v, i) => v.length && a.indexOf(v) === i).sort();
};
