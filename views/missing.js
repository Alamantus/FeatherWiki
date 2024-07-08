/**
 * This file is part of Feather Wiki.
 *
 * Feather Wiki is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 *
 * Feather Wiki is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License along with Feather Wiki. If not, see https://www.gnu.org/licenses/.
 */
export const missingView = (s, e) => {
  const missing = FW.missing();
  return [
    html`<header>
      <h1>{{translate:missingPages}}</h1>
    </header>`,
    html`<article>
      <p>{{translate:referencedButNotCreated}}</p>
      <ul>
        ${
          missing.map(el => html`<li>${el}</li>`)
        }
      </ul>
    </article>`
  ];
}