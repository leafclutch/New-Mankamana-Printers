import prisma from "../../connect";
import { AppError } from "../../utils/apperror";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

// CLIENT AUTH LOGIC
// loginClientService: Handles client authentication using phone number OR client code, returning a JWT
export const loginClientService = async ({
  phone_number,
  password,
}: {
  phone_number: string;
  password: string;
}) => {
  if (!phone_number || !password) {
    throw new AppError("Phone number and password required", 400);
  }

  // Support login by phone number OR client code
  const client = await prisma.client.findFirst({
    where: {
      OR: [
        { phone_number: phone_number },
        { client_code: phone_number },
      ],
    },
  });

  if (!client) {
    throw new AppError("Invalid credentials", 401);
  }

  const isHashedPassword = client.password.startsWith("$2");
  const passwordMatches = isHashedPassword
    ? await bcrypt.compare(password, client.password)
    : password === client.password;

  if (!passwordMatches) {
    throw new AppError("Invalid credentials", 401);
  }

  // Upgrade legacy plain-text client passwords after a successful login.
  if (!isHashedPassword) {
    const hashedPassword = await bcrypt.hash(password, 10);
    await prisma.client.update({
      where: { id: client.id },
      data: { password: hashedPassword },
    });
  }

  if (client.status !== "active") {
    throw new AppError("Account is inactive", 403);
  }

  const token = jwt.sign(
    { id: client.id, role: "CLIENT", business_name: client.business_name },
    process.env.JWT_SECRET as string,
    { expiresIn: "7d" }
  );

  return {
    message: "Login successful",
    token,
    client: {
      id: client.id,
      client_code: client.client_code,
      phone: client.phone_number,
      business_name: client.business_name,
      owner_name: client.owner_name,
      email: client.email,
      role: "CLIENT",
    },
  };
};

// ADMIN AUTH LOGIC
// loginAdminService: Authenticates administrators via email and password, returning a role-based JWT
export const loginAdminService = async ({
  email,
  password,
}: {
  email: string;
  password: string;
}) => {
  if (!email || !password) {
    throw new AppError("Email and password required", 400);
  }

  const admin = await prisma.adminUser.findUnique({
    where: { email },
  });

  if (!admin) {
    throw new AppError("Invalid credentials", 401); // don't reveal whether email exists
  }

  // Support legacy plain-text admin passwords with auto-upgrade to bcrypt
  const isHashed = admin.password.startsWith("$2");
  const passwordMatches = isHashed
    ? await bcrypt.compare(password, admin.password)
    : password === admin.password;

  if (!passwordMatches) {
    throw new AppError("Invalid credentials", 401);
  }

  if (!isHashed) {
    const hashed = await bcrypt.hash(password, 12);
    await prisma.adminUser.update({ where: { id: admin.id }, data: { password: hashed } });
  }

  const token = jwt.sign(
    { id: admin.id, role: admin.role, name: admin.name },
    process.env.JWT_SECRET as string,
    { expiresIn: "1d" }
  );

  return {
    message: "Admin login successful",
    token,
    admin: {
      id: admin.id,
      name: admin.name,
      email: admin.email,
      role: admin.role,
    },
  };
};

// logoutService: Standard logout response; actual token invalidation is handled client-side
export const logoutService = async () => {
  return {
    message: "Logout successful",
  };
};
