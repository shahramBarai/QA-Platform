import * as userService from "../services/userService.js";

const getUserInfo = async (req, urlPatternResult) => {
  const userId = urlPatternResult.pathname.groups.userId;
  const user = await userService.getUser(userId);
  return Response.json(user[0]);
};

const addUser = async (req) => {
  const name = "No name";
  const userUuid = crypto.randomUUID().toString();
  const user = await userService.addUser(userUuid, name);

  return Response.json(user[0]);
};

export { getUserInfo, addUser };
