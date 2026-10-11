/*
 * Runs the 3psLCCA-core engine (Brython build, 3psLCCA-core web-dev branch) in a worker.
 * Brython compiles Python to JS at runtime (eval / new Function); the page's CSP does
 * not allow that and does not apply here, so the engine runs in this worker instead.
 *
 * Message in:  { id, inputJson, costsJson, wpiJson }
 * Message out: { id, result } | { id, error }
 */
importScripts('brython.min.js', 'brython_stdlib.js', 'three_ps_lcca_core.brython.js');

__BRYTHON__.runPythonSource(`
import json
from browser import self as scope
from three_ps_lcca_core.core.main import run_full_lcc_analysis

def run(input_json, costs_json, wpi_json=None):
    try:
        wpi = json.loads(wpi_json) if wpi_json else None
        result = run_full_lcc_analysis(json.loads(input_json), json.loads(costs_json), wpi=wpi)
        return json.dumps({"result": result})
    except Exception as e:
        return json.dumps({"error": f"{type(e).__name__}: {e}"})

scope.runLCCA = run
`);

self.onmessage = ({ data: { id, inputJson, costsJson, wpiJson } }) => {
  try {
    self.postMessage({ id, ...JSON.parse(self.runLCCA(inputJson, costsJson, wpiJson ?? null)) });
  } catch (err) {
    self.postMessage({ id, error: String(err?.message || err) });
  }
};
