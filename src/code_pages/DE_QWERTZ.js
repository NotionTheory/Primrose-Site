/* 
 * Copyright (C) 2015 Sean T. McBeth <sean@seanmcbeth.com>
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

CodePage.DE_QWERTZ = new CodePage("Deutsch: QWERTZ", "de", {
    deadKeys: [220, 221, 160, 192],
    NORMAL: {
        "48": "0",
        "49": "1",
        "50": "2",
        "51": "3",
        "52": "4",
        "53": "5",
        "54": "6",
        "55": "7",
        "56": "8",
        "57": "9",
        "60": "<",
        "63": "ß",
        "160": CodePage.DEAD(3),
        "163": "#",
        "171": "+",
        "173": "-",
        "186": "ü",
        "187": "+",
        "188": ",",
        "189": "-",
        "190": ".",
        "191": "#",
        "192": CodePage.DEAD(4),
        "219": "ß",
        "220": CodePage.DEAD(1),
        "221": CodePage.DEAD(2),
        "222": "ä",
        "226": "<"
    },
    DEAD1NORMAL: {
        "65": "â",
        "69": "ê",
        "73": "î",
        "79": "ô",
        "85": "û",
        "190": "."
    },
    DEAD2NORMAL: {
        "65": "á",
        "69": "é",
        "73": "í",
        "79": "ó",
        "83": "s",
        "85": "ú",
        "89": "ý"
    },
    SHIFT: {
        "48": "=",
        "49": "!",
        "50": "\"",
        "51": "§",
        "52": "$",
        "53": "%",
        "54": "&",
        "55": "/",
        "56": "(",
        "57": ")",
        "60": ">",
        "63": "?",
        "163": "'",
        "171": "*",
        "173": "_",
        "186": "Ü",
        "187": "*",
        "188": ";",
        "189": "_",
        "190": ":",
        "191": "'",
        "192": "Ö",
        "219": "?",
        "222": "Ä",
        "226": ">"
    },
    CTRLALT: {
        "48": "}",
        "50": "²",
        "51": "³",
        "55": "{",
        "56": "[",
        "57": "]",
        "60": "|",
        "63": "\\",
        "69": "€",
        "77": "µ",
        "81": "@",
        "171": "~",
        "187": "~",
        "219": "\\",
        "226": "|"
    },
    CTRLALTSHIFT: {
        "63": "ẞ",
        "219": "ẞ"
    },
    DEAD3NORMAL: {
        "65": "a",
        "69": "e",
        "73": "i",
        "79": "o",
        "85": "u",
        "190": "."
    },
    DEAD4NORMAL: {
        "65": "a",
        "69": "e",
        "73": "i",
        "79": "o",
        "83": "s",
        "85": "u",
        "89": "y"
    }
});