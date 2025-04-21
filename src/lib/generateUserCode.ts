// Utility to generate a 6-digit unique code for business users
export function generateBusinessUserCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Utility to generate a 10-digit unique code for normal users
export function generateNormalUserCode(): string {
  return Math.floor(1000000000 + Math.random() * 9000000000).toString();
}
