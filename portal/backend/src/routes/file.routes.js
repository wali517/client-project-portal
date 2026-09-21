import { Router } from 'express';
import * as fileController from '../controllers/file.controller.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';
import validate from '../middleware/validate.js';
import { uploadMany } from '../middleware/upload.js';
import { PERMISSIONS } from '../constants/permissions.js';
import { idParam } from '../validators/common.validator.js';
import { uploadFileSchema, listFilesQuery } from '../validators/file.validator.js';

const router = Router();
router.use(authenticate);

router.post(
  '/upload',
  authorize(PERMISSIONS.FILE_UPLOAD),
  uploadMany,
  validate({ body: uploadFileSchema }),
  fileController.uploadFiles
);
router.get('/', authorize(PERMISSIONS.FILE_READ), validate({ query: listFilesQuery }), fileController.listFiles);
router.get('/:id', authorize(PERMISSIONS.FILE_READ), validate({ params: idParam }), fileController.getFile);
router.get(
  '/:id/download',
  authorize(PERMISSIONS.FILE_READ),
  validate({ params: idParam }),
  fileController.downloadFile
);
router.delete('/:id', authorize(PERMISSIONS.FILE_DELETE), validate({ params: idParam }), fileController.deleteFile);

export default router;
