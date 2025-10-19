import { z } from "zod";

export const UserRegisterSchema = z.object({
  fullName: z.string().min(5, "fullname should be at least 5 characters"),
  email: z.string().email(),
  password: z.string().min(8, "password should be atleast 8 characters")
});

export type UserRegisterInput = z.infer<typeof UserRegisterSchema>;
