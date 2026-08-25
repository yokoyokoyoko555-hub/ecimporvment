const OCHANOKO_TITLE_NAMES: Record<string, string> = {
  onepiece: "ワンピースカード",
  digimon: "デジモンカードゲーム",
  lorcana: "ディズニー・ロルカナ",
  "xross-stars": "Xross Stars",
  harrypotter: "ハリー・ポッター カードゲーム",
};

export function ochanokoCategoryName(titleKey: string, displayName: string) {
  return OCHANOKO_TITLE_NAMES[titleKey] || displayName;
}

export function ochanokoSubcategoryName(setName: string) {
  return setName.replace(/\s+【/g, "【").trim();
}

const OCHANOKO_IMAGE_FOLDERS: Record<string, string> = {
  digimon: "DiGiMON",
};

export function ochanokoImagePath(
  sourceType: string,
  imageFileName: string | null,
) {
  if (!imageFileName) return null;
  const folder = OCHANOKO_IMAGE_FOLDERS[sourceType];
  return folder ? `${folder}/${imageFileName.replace(/^\/+/, "")}` : imageFileName;
}
