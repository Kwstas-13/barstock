export const CATEGORIES = ["SPIRIT", "LIQUEUR", "WINE", "BEER", "MIXER", "SYRUP", "GARNISH", "OTHER"];

export const UNITS = ["ml", "τεμ"];

export const POUR_COST_TARGET = 24;

export const MANAGER_USER_ID = 1;

export const SHIFT_STATUS_LABELS = {
  OPEN: "🟢 Ανοιχτή",
  PAUSED: "🟡 Σε παύση",
  CLOSED: "⚪ Κλειστή",
};

// Οι επιλογές της φόρμας (όπως αποφασίσαμε: 3 επιλογές)
export const LOSS_TYPE_OPTIONS = [
  { value: "STAFF_DRINK", label: "🍹 Ποτό προσωπικού" },
  { value: "BREAKAGE", label: "💔 Σπάσιμο / Χύσιμο" },
  { value: "OTHER", label: "❓ Άλλο" },
];

// Για εμφάνιση στη λίστα (μαζί με το SPILLAGE, αν υπάρχει από παλιά)
export const LOSS_TYPE_LABELS = {
  STAFF_DRINK: "🍹 Ποτό προσωπικού",
  BREAKAGE: "💔 Σπάσιμο / Χύσιμο",
  SPILLAGE: "💔 Σπάσιμο / Χύσιμο",
  OTHER: "❓ Άλλο",
};

export const STANDARD_POUR_ML = 40;