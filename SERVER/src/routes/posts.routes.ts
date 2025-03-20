import { Router } from "express";
import { getTopUsers } from "../controller/postController";

const route = Router();

route.get("/get-top-users", getTopUsers);

export default route