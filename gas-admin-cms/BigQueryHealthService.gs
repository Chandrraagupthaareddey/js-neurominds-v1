/**
 * JS Neurominds V1 — gas-admin-cms/BigQueryHealthService.gs
 * HEALTH CHECK ONLY. This service confirms the BigQuery sandbox dataset is
 * reachable. It NEVER writes and NEVER uses BigQuery.Tabledata.insertAll()
 * (the sandbox blocks streaming inserts). BigQuery is an optional future
 * archive; dashboards use the GA4 Data API, not BigQuery.
 */
var BigQueryHealthService = {
  check: function (user) {
    RoleService.requireView(user, 'health');
    var result = { bigquery: 'unknown', project: bigQueryProjectId_(), streaming_inserts: 'disabled_by_design', at: Utils.nowIso() };
    try {
      if (typeof BigQuery === 'undefined') { result.bigquery = 'advanced_service_disabled'; return result; }
      // A read-only dataset list confirms reachability without any write.
      var datasets = BigQuery.Datasets.list(bigQueryProjectId_());
      result.bigquery = datasets ? 'reachable' : 'no_datasets';
    } catch (e) {
      result.bigquery = 'error';
      result.detail = String(e && e.message).slice(0, 160);
    }
    return result;
  }
  // NOTE: intentionally no insert/stream methods. If batch loads are added in a
  // future version, they MUST use load jobs from a Sheets buffer, never insertAll.
};
