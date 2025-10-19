import { Request, Response } from "express";
import { UserRegisterSchema } from "../validations/user.validation";

const registerUser = async (req: Request, res: Response) => {
  const result = UserRegisterSchema.safeParse(req.body);
  if (!result.success) {
    const message = result.error;
    console.log(message);

    return res.status(400).json({ errors: message });
  }

  const data = result.data;
  res.status(200).json({ message: "User registered", user: data });
};

export { registerUser };
