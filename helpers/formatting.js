/**
 * This file is part of Feather Wiki.
 *
 * Feather Wiki is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 *
 * Feather Wiki is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License along with Feather Wiki. If not, see https://www.gnu.org/licenses/.
 */
// Replace whitespace with _ then all ASCII punctuation (except _) & non-print characters with -
// Only ASCII ranges are replaced to allow non-English characters to be used
export const slugify = s => s?.toLowerCase().replace(/\s/g, '_').replace(/[\x00-\x2F\x3A-\x40[\\\]^`\x7B-\x7F]/g, '-');

export const formatDate = d => d.toLocaleString();

// For arrays of strings (like tags) only
export const tidyArray = ar => ar.map(v => v.trim()).filter((v, i) => v.length && a.indexOf(v) === i).sort();
