// @types/express/index.d.ts
import { IUser } from "../models/User"; // Adjust path as needed

declare global {
  namespace Express {
    interface Request {
      user?: IUser;
    }
  }
}
