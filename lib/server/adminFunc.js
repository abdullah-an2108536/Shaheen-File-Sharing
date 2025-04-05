import crypto from "crypto";

/**
 *****
 * functions for admin sign in
 *****
 */

export async  function hashPasswordServer(password, salt) {
  const hash = crypto
    .createHash("sha256")
    .update(password + salt)
    .digest("base64");
  return hash;
}

export async function comparePasswordsServer(inputPassword, storedHash, salt) {
  const hashedInput =await hashPasswordServer(inputPassword, salt);
  // console.log("HASH RESULT INSIDE ADMIN FUNCT:", hashedInput);
  return hashedInput === storedHash;
}
