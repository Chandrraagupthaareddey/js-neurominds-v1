/**
 * JS Neurominds V1 — gas-public-api/SheetService.gs
 * Thin data-access layer over Google Sheets. Rules enforced here:
 *   - NEVER SpreadsheetApp.getActiveSheet(); always getSheetByName.
 *   - All writes wrapped in LockService to avoid race conditions.
 *   - Rows are returned as header-keyed objects so callers never index columns.
 */

var SheetService = {
  _openById: function (spreadsheetId) {
    return SpreadsheetApp.openById(spreadsheetId);
  },

  _sheet: function (spreadsheetId, tabName) {
    var ss = SheetService._openById(spreadsheetId);
    var sheet = ss.getSheetByName(tabName);
    if (!sheet) throw new Error('Tab not found: ' + tabName);
    return sheet;
  },

  /** Read all data rows of a tab as header-keyed objects. */
  readAll: function (spreadsheetId, tabName) {
    var sheet = SheetService._sheet(spreadsheetId, tabName);
    var range = sheet.getDataRange().getValues();
    if (range.length < 2) return [];
    var headers = range[0];
    var out = [];
    for (var r = 1; r < range.length; r++) {
      var row = range[r];
      if (row.join('') === '') continue; // skip blank lines
      var obj = {};
      for (var c = 0; c < headers.length; c++) {
        obj[headers[c]] = row[c];
      }
      out.push(obj);
    }
    return out;
  },

  /** Read rows filtered by a column value (e.g. status === 'published'). */
  readWhere: function (spreadsheetId, tabName, column, value) {
    return SheetService.readAll(spreadsheetId, tabName).filter(function (r) {
      return String(r[column]) === String(value);
    });
  },

  /** Find first row where column equals value. */
  findOne: function (spreadsheetId, tabName, column, value) {
    var rows = SheetService.readAll(spreadsheetId, tabName);
    for (var i = 0; i < rows.length; i++) {
      if (String(rows[i][column]) === String(value)) return rows[i];
    }
    return null;
  },

  /**
   * Append an object as a row, aligning to the tab's headers. Acquires a
   * document lock so concurrent submissions never collide. Returns the row.
   */
  append: function (spreadsheetId, tabName, obj) {
    var lock = LockService.getScriptLock();
    lock.waitLock(20000); // wait up to 20s for the lock
    try {
      var sheet = SheetService._sheet(spreadsheetId, tabName);
      var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
      var row = headers.map(function (h) { return obj[h] != null ? obj[h] : ''; });
      sheet.appendRow(row);
      return obj;
    } finally {
      lock.releaseLock();
    }
  },

  /**
   * Update the first row matching keyColumn===keyValue with the given patch.
   * Locked. Returns true if a row was updated.
   */
  update: function (spreadsheetId, tabName, keyColumn, keyValue, patch) {
    var lock = LockService.getScriptLock();
    lock.waitLock(20000);
    try {
      var sheet = SheetService._sheet(spreadsheetId, tabName);
      var values = sheet.getDataRange().getValues();
      var headers = values[0];
      var keyIdx = headers.indexOf(keyColumn);
      if (keyIdx === -1) throw new Error('Key column not found: ' + keyColumn);
      for (var r = 1; r < values.length; r++) {
        if (String(values[r][keyIdx]) === String(keyValue)) {
          for (var c = 0; c < headers.length; c++) {
            if (patch.hasOwnProperty(headers[c])) values[r][c] = patch[headers[c]];
          }
          sheet.getRange(r + 1, 1, 1, headers.length).setValues([values[r]]);
          return true;
        }
      }
      return false;
    } finally {
      lock.releaseLock();
    }
  }
};
