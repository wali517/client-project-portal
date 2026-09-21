import { Router } from 'express';
import * as userController from '../controllers/user.controller.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';
import validate from '../middleware/validate.js';
import { PERMISSIONS } from '../constants/permissions.js';
import { idParam } from '../validators/common.validator.js';
import { createUserSchema, updateUserSchema, listUsersQuery } from '../validators/user.validator.js';

const router = Router();
router.use(authenticate);

router.get('/', authorize(PERMISSIONS.USER_READ), validate({ query: listUsersQuery }), userController.listUsers);
router.get('/:id', authorize(PERMISSIONS.USER_READ), validate({ params: idParam }), userController.getUser);
router.post('/', authorize(PERMISSIONS.USER_WRITE), validate({ body: createUserSchema }), userController.createUser);
router.patch(
  '/:id',
  authorize(PERMISSIONS.USER_WRITE),
  validate({ params: idParam, body: updateUserSchema }),
  userController.updateUser
);
router.delete('/:id', authorize(PERMISSIONS.USER_DELETE), validate({ params: idParam }), userController.deleteUser);
router.delete(
  '/:id/permanent',
  authorize(PERMISSIONS.USER_DELETE),
  validate({ params: idParam }),
  userController.permanentlyDeleteUser
);

export default router;
