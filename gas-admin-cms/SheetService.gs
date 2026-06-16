/**
 * JS Neurominds V1 — gas-admin-cms/SheetService.gs
 * Data-access layer for the Admin CMS. Same rules as the public API:
 *   - explicit getSheetByName (never getActiveSheet)
 *   - LockService around every write
 *   - rows returned as header-keyed objects
 */
var SheetService = {
  _sheet: function (spreadsheetId, tabName) {
    var ss = SpreadsheetApp.openById(spreadsheetId);
    var sheet = ss.getSheetByName(tabName);
    if (!sheet) throw new Error('Tab not found: ' + tabName);
    return sheet;
  },
  readAll: function (spreadsheetId, tabName) {
    var sheet = SheetService._sheet(spreadsheetId, tabName);
    var range = sheet.getDataRange().getValues();
    if (range.length < 2) return [];
    var headers = range[0]; var out = [];
    for (var r = 1; r < range.length; r++) {
      if (range[r].join('') === '') continue;
      var obj = {};
      for (var c = 0; c < headers.length; c++) obj[headers[c]] = range[r][c];
      out.push(obj);
    }
    return out;
  },
  readWhere: function (id, tab, col, val) {
    return SheetService.readAll(id, tab).filter(function (r) { return String(r[col]) === String(val); });
  },
  findOne: function (id, tab, col, val) {
    var rows = SheetService.readAll(id, tab);
    for (var i = 0; i < rows.length; i++) if (String(rows[i][col]) === String(val)) return rows[i];
    return null;
  },
  append: function (spreadsheetId, tabName, obj) {
    var lock = LockService.getScriptLock(); lock.waitLock(20000);
    try {
      var sheet = SheetService._sheet(spreadsheetId, tabName);
      var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
      sheet.appendRow(headers.map(function (h) { return obj[h] != null ? obj[h] : ''; }));
      return obj;
    } finally { lock.releaseLock(); }
  },
  /** Append many rows efficiently in one locked write. */
  appendMany: function (spreadsheetId, tabName, objs) {
    if (!objs || !objs.length) return 0;
    var lock = LockService.getScriptLock(); lock.waitLock(30000);
    try {
      var sheet = SheetService._sheet(spreadsheetId, tabName);
      var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
      var rows = objs.map(function (obj) { return headers.map(function (h) { return obj[h] != null ? obj[h] : ''; }); });
      sheet.getRange(sheet.getLastRow() + 1, 1, rows.length, headers.length).setValues(rows);
      return rows.length;
    } finally { lock.releaseLock(); }
  },
  update: function (spreadsheetId, tabName, keyColumn, keyValue, patch) {
    var lock = LockService.getScriptLock(); lock.waitLock(20000);
    try {
      var sheet = SheetService._sheet(spreadsheetId, tabName);
      var values = sheet.getDataRange().getValues();
      var headers = values[0]; var keyIdx = headers.indexOf(keyColumn);
      if (keyIdx === -1) throw new Error('Key column not found: ' + keyColumn);
      for (var r = 1; r < values.length; r++) {
        if (String(values[r][keyIdx]) === String(keyValue)) {
          for (var c = 0; c < headers.length; c++) if (patch.hasOwnProperty(headers[c])) values[r][c] = patch[headers[c]];
          sheet.getRange(r + 1, 1, 1, headers.length).setValues([values[r]]);
          return true;
        }
      }
      return false;
    } finally { lock.releaseLock(); }
  }
};
