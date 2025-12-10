import path from 'path';
import { fileURLToPath } from 'url';

const currentFileUrl = fileURLToPath(import.meta.url);
const currentDir = path.dirname(currentFileUrl);

export const dataDir = path.join(currentDir, '..', '..', 'data');
export const attachmentsDir = path.join(currentDir, '..', '..', '..', 'attachments_storage');

