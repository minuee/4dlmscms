export interface signinType {
  email?: string;
  password?: string;
}

export function signIn({email, password}: signinType) {
  console.log(email);
  console.log(password);
  return null;
}