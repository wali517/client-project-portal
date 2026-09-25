import asyncHandler from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/apiResponse.js";
import * as userService from "../services/user.service.js";

export const listUsers = asyncHandler(async (req, res) => {
  const { items, pagination } = await userService.listUsers(req.query);
  return sendSuccess(res, { message: "Users loaded", data: items, pagination });
});

export const getUser = asyncHandler(async (req, res) => {
  const user = await userService.getUserById(req.params.id);
  return sendSuccess(res, { message: "User loaded", data: user });
});

export const createUser = asyncHandler(async (req, res) => {
  const user = await userService.createUser(req.body, req.user);
  return sendSuccess(res, {
    statusCode: 201,
    message: "User created",
    data: user,
  });
});

export const updateUser = asyncHandler(async (req, res) => {
  const user = await userService.updateUser(req.params.id, req.body, req.user);
  return sendSuccess(res, { message: "User updated", data: user });
});

export const deleteUser = asyncHandler(async (req, res) => {
  const user = await userService.deactivateUser(req.params.id, req.user);
  return sendSuccess(res, { message: "User deactivated", data: user });
});

export const permanentlyDeleteUser = asyncHandler(async (req, res) => {
  const snapshot = await userService.permanentlyDeleteUser(
    req.params.id,
    req.user,
  );
  return sendSuccess(res, {
    message: "User permanently deleted",
    data: snapshot,
  });
});
