/**
 * Google Workspace integration helpers (Drive & Sheets APIs)
 */

export interface DriveFolder {
  id: string;
  name: string;
}

/**
 * Creates a Google Spreadsheet in a specific Drive folder (or root if empty)
 * and populates it with student comments.
 */
export async function saveCourseToDrive(params: {
  accessToken: string;
  folderId?: string;
  courseName: string;
  comments: Array<{ name: string; date: string; comment: string }>;
  existingSpreadsheetId?: string | null;
}): Promise<{ spreadsheetId: string; webViewLink: string }> {
  const { accessToken, folderId, courseName, comments, existingSpreadsheetId } = params;

  let spreadsheetId = existingSpreadsheetId;
  let webViewLink = '';

  // Step 1: Create a new spreadsheet if we don't have an existing one
  if (!spreadsheetId) {
    const driveMetadata: any = {
      name: `${courseName} - Comentarios Pedagógicos`,
      mimeType: 'application/vnd.google-apps.spreadsheet',
    };

    if (folderId && folderId.trim() !== '') {
      driveMetadata.parents = [folderId.trim()];
    }

    console.log('Creating spreadsheet in Drive via Drive API v3...', driveMetadata);
    const createRes = await fetch('https://www.googleapis.com/drive/v3/files', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(driveMetadata),
    });

    if (!createRes.ok) {
      const errorData = await createRes.json();
      throw new Error(`Error al crear archivo en Google Drive: ${errorData?.error?.message || createRes.statusText}`);
    }

    const fileData = await createRes.json();
    spreadsheetId = fileData.id;
  }

  if (!spreadsheetId) {
    throw new Error('No se pudo obtener el ID de la planilla.');
  }

  // Fetch the webViewLink for the file so the user can open it directly!
  const getFileRes = await fetch(`https://www.googleapis.com/drive/v3/files/${spreadsheetId}?fields=webViewLink`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  if (getFileRes.ok) {
    const fileMeta = await getFileRes.json();
    webViewLink = fileMeta.webViewLink;
  }

  // Step 2: Write/Update values inside the spreadsheet
  // We want to write headers and then the comment rows.
  // We'll use the spreadsheets.values.update endpoint to write from A1
  const headerRow = ['Estudiante', 'Fecha de Registro', 'Comentario Pedagógico'];
  const dataRows = comments.map(c => [c.name, c.date, c.comment]);
  const allRows = [headerRow, ...dataRows];

  // We write to the range "A1:C" of the first sheet (represented by "A1")
  const range = 'A1';
  const sheetsUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?valueInputOption=RAW`;

  console.log('Writing values to spreadsheet...', sheetsUrl);
  const writeRes = await fetch(sheetsUrl, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      range: range,
      majorDimension: 'ROWS',
      values: allRows,
    }),
  });

  if (!writeRes.ok) {
    const errorData = await writeRes.json();
    throw new Error(`Error al escribir en Google Sheets: ${errorData?.error?.message || writeRes.statusText}`);
  }

  return {
    spreadsheetId,
    webViewLink: webViewLink || `https://docs.google.com/spreadsheets/d/${spreadsheetId}`,
  };
}

/**
 * Validates if a folder ID is accessible or exists in Google Drive
 */
export async function validateDriveFolder(accessToken: string, folderId: string): Promise<boolean> {
  if (!folderId || folderId.trim() === '') return true; // Empty folder ID refers to root, which is always accessible

  try {
    const res = await fetch(`https://www.googleapis.com/drive/v3/files/${folderId}?fields=id,name,mimeType`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    if (!res.ok) {
      return false;
    }
    const data = await res.json();
    return data.mimeType === 'application/vnd.google-apps.folder';
  } catch (e) {
    console.error('Error validating Drive folder:', e);
    return false;
  }
}
