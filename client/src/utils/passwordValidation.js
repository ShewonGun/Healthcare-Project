export const PASSWORD_MIN_LENGTH = 8;

export const getPasswordValidation = (password = "") => {
  const value = String(password);

  const checks = {
    minLength: value.length >= PASSWORD_MIN_LENGTH,
    uppercase: /[A-Z]/.test(value),
    number: /\d/.test(value),
    special: /[^A-Za-z0-9]/.test(value),
  };

  const metCount = Object.values(checks).filter(Boolean).length;
  const lengthBonus = value.length >= 12 ? 1 : 0;
  const score = value ? Math.min(5, metCount + lengthBonus) : 0;

  let label = "Very Weak";
  if (score >= 5) label = "Very Strong";
  else if (score >= 4) label = "Strong";
  else if (score >= 3) label = "Good";
  else if (score >= 2) label = "Fair";
  else if (score >= 1) label = "Weak";

  return {
    checks,
    score,
    label,
    isValid: Object.values(checks).every(Boolean),
  };
};

export const getPasswordStrengthClasses = (score) => {
  if (score >= 5) return "bg-emerald-600";
  if (score >= 4) return "bg-green-600";
  if (score >= 3) return "bg-blue-600";
  if (score >= 2) return "bg-amber-500";
  if (score >= 1) return "bg-red-500";
  return "bg-gray-300";
};

export const getPasswordFirstError = (validation) => {
  if (!validation?.checks?.minLength) {
    return "Password must be at least 8 characters.";
  }
  if (!validation?.checks?.uppercase) {
    return "Password must include at least 1 uppercase letter.";
  }
  if (!validation?.checks?.number) {
    return "Password must include at least 1 number.";
  }
  if (!validation?.checks?.special) {
    return "Password must include at least 1 special character.";
  }
  return "";
};
