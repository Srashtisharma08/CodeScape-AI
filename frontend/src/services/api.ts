import { ParseRequest, ParseResponse, ExecuteRequest, ExecuteResponse } from '../types';

const API_BASE = '/api';

export async function parseCode(request: ParseRequest): Promise<ParseResponse> {
  const url = `${API_BASE}/parse`;
  console.log('[API Request] Sending parse request:', { url, language: request.language, codeLength: request.code.length });

  let response: Response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });
  } catch (netErr) {
    const errorMsg = netErr instanceof Error ? netErr.message : String(netErr);
    console.error('[API Network Error]:', netErr);
    throw new Error(`Network Error: Failed to reach backend at ${url}. (${errorMsg}). Is the FastAPI server running on http://127.0.0.1:8000?`);
  }

  console.log('[API Response Status]:', response.status, response.statusText);

  if (!response.ok) {
    let errorDetail = `HTTP ${response.status} ${response.statusText}`.trim();
    try {
      const errorJson = await response.json();
      console.error('[API Response Error Payload]:', errorJson);

      if (typeof errorJson.detail === 'string') {
        errorDetail = errorJson.detail;
      } else if (Array.isArray(errorJson.detail)) {
        errorDetail = errorJson.detail.map((d: any) => d.msg || JSON.stringify(d)).join('; ');
      } else if (errorJson.error) {
        errorDetail = errorJson.error;
      } else if (errorJson.message) {
        errorDetail = errorJson.message;
      }
    } catch {
      const rawText = await response.text().catch(() => '');
      if (rawText) {
        console.error('[API Response Raw Text]:', rawText);
        errorDetail += `: ${rawText.slice(0, 150)}`;
      }
    }

    throw new Error(`Backend Error (${response.status}): ${errorDetail}`);
  }

  try {
    const data: ParseResponse = await response.json();
    console.log('[API Parse Success]:', {
      nodeCount: data.parse_info?.node_count,
      parseTimeMs: data.parse_info?.parse_time_ms,
      rootType: data.ast?.type,
    });
    return data;
  } catch (jsonErr) {
    console.error('[API Invalid JSON Response]:', jsonErr);
    throw new Error('Invalid Response: Server returned non-JSON data on parse success.');
  }
}

export async function executeCode(request: ExecuteRequest): Promise<ExecuteResponse> {
  const url = `${API_BASE}/execute`;
  console.log('[API Request] Sending execute request:', { url, language: request.language });

  let response: Response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });
  } catch (netErr) {
    const errorMsg = netErr instanceof Error ? netErr.message : String(netErr);
    console.error('[API Network Error]:', netErr);
    throw new Error(`Network Error: Could not connect to execution server at ${url}. (${errorMsg})`);
  }

  if (!response.ok) {
    let errorDetail = `HTTP ${response.status} ${response.statusText}`.trim();
    try {
      const errorJson = await response.json();
      if (typeof errorJson.detail === 'string') {
        errorDetail = errorJson.detail;
      } else if (errorJson.error) {
        errorDetail = errorJson.error;
      }
    } catch {
      const rawText = await response.text().catch(() => '');
      if (rawText) errorDetail += `: ${rawText.slice(0, 150)}`;
    }
    throw new Error(`Execution Error (${response.status}): ${errorDetail}`);
  }

  try {
    const data: ExecuteResponse = await response.json();
    console.log('[API Execute Success]:', {
      totalSteps: data.trace?.total_steps,
      status: data.trace?.status,
    });
    return data;
  } catch (jsonErr) {
    console.error('[API Invalid Execution JSON Response]:', jsonErr);
    throw new Error('Invalid Response: Execution engine returned malformed data.');
  }
}

export async function fetchSupportedLanguages(): Promise<string[]> {
  const url = `${API_BASE}/languages`;
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status} ${response.statusText}`);
    }
    const data = await response.json();
    return data.languages || [];
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error('[API fetchSupportedLanguages Error]:', err);
    throw new Error(`Failed to fetch supported languages: ${errorMsg}`);
  }
}
