import multer from 'multer';
import { nanoid } from 'nanoid';
import { attachmentsDir } from './paths.js';
import fs from 'fs';

function ensureAttachmentsDir() {
	if (!fs.existsSync(attachmentsDir)) {
		fs.mkdirSync(attachmentsDir, { recursive: true });
	}
}

const storage = multer.diskStorage({
	destination: (req, file, cb) => {
		ensureAttachmentsDir();
		cb(null, attachmentsDir);
	},
	filename: (req, file, cb) => {
		const uniqueName = `${nanoid(12)}-${file.originalname}`;
		cb(null, uniqueName);
	}
});

const fileFilter = (req, file, cb) => {
	const allowedMimes = [
		'image/jpeg',
		'image/jpg',
		'image/png',
		'image/gif',
		'image/webp',
		'application/pdf'
	];
	if (allowedMimes.includes(file.mimetype)) {
		cb(null, true);
	} else {
		cb(new Error('Only images (JPG, PNG, GIF, WEBP) and PDF files are allowed'), false);
	}
};

export const upload = multer({
	storage,
	fileFilter,
	limits: { fileSize: 10 * 1024 * 1024 }
});


