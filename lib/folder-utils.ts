export const DEFAULT_FOLDER_NAME = "Untitled";
export const DEFAULT_FOLDER_COLOR = "neutral";

export const folderColorOptions = [
  {
    value: "neutral",
    label: "Neutral",
    swatch: "bg-[#B2B2B2]",
    icon: "text-[#B2B2B2]",
    fill: "#B2B2B2",
    tab: "#B2B2B2",
    border: "#B2B2B2",
    tabBorder: "#D9D9D9",
    sheet: "#F5F5F5",
    sheetBorder: "#D9D9D9",
    text: "#1A1A1A",
    mutedText: "#727272",
    menu: "#1E1E1E",
  },
  {
    value: "amber",
    label: "Yellow",
    swatch: "bg-[#E8B931]",
    icon: "text-[#E8B931]",
    fill: "#E8B931",
    tab: "#E6A000",
    border: "#BF6A02",
    tabBorder: "#BF6A02",
    sheet: "#FFF1C2",
    sheetBorder: "#BF6A02",
    text: "#1E1E1E",
    mutedText: "#5A5A5A",
    menu: "#1E1E1E",
  },
  {
    value: "green",
    label: "Green",
    swatch: "bg-[#14AE5C]",
    icon: "text-[#14AE5C]",
    fill: "#14AE5C",
    tab: "#009951",
    border: "#02542D",
    tabBorder: "#02542D",
    sheet: "#CFF7D3",
    sheetBorder: "#14AE5C",
    text: "#FFFFFF",
    mutedText: "#F3F3F3",
    menu: "#F3F3F3",
  },
  {
    value: "red",
    label: "Red",
    swatch: "bg-[#EC221F]",
    icon: "text-[#EC221F]",
    fill: "#EC221F",
    tab: "#C00F0C",
    border: "#900B09",
    tabBorder: "#900B09",
    sheet: "#FDD3D0",
    sheetBorder: "#EC221F",
    text: "#FFFFFF",
    mutedText: "#F3F3F3",
    menu: "#F3F3F3",
  },
  {
    value: "purple",
    label: "Purple",
    swatch: "bg-[#9F31E8]",
    icon: "text-[#9F31E8]",
    fill: "#9F31E8",
    tab: "#9102CF",
    border: "#771BB4",
    tabBorder: "#771BB4",
    sheet: "#ECC2FF",
    sheetBorder: "#AA4EE7",
    text: "#FFFFFF",
    mutedText: "#F3F3F3",
    menu: "#F3F3F3",
  },
  {
    value: "pink",
    label: "Pink",
    swatch: "bg-[#FF31AD]",
    icon: "text-[#FF31AD]",
    fill: "#FF31AD",
    tab: "#E1329B",
    border: "#B41B98",
    tabBorder: "#B41B98",
    sheet: "#FDACDC",
    sheetBorder: "#F45BB7",
    text: "#FFFFFF",
    mutedText: "#F3F3F3",
    menu: "#F3F3F3",
  },
  {
    value: "blue",
    label: "Blue",
    swatch: "bg-[#319CE8]",
    icon: "text-[#319CE8]",
    fill: "#319CE8",
    tab: "#0287CF",
    border: "#1B6AB4",
    tabBorder: "#1B6AB4",
    sheet: "#C2E6FF",
    sheetBorder: "#4E9DE7",
    text: "#FFFFFF",
    mutedText: "#F3F3F3",
    menu: "#F3F3F3",
  },
  {
    value: "orange",
    label: "Orange",
    swatch: "bg-[#FC8B3A]",
    icon: "text-[#FC8B3A]",
    fill: "#FC8B3A",
    tab: "#E27324",
    border: "#B4651B",
    tabBorder: "#B4651B",
    sheet: "#FDCFAE",
    sheetBorder: "#F49551",
    text: "#FFFFFF",
    mutedText: "#F3F3F3",
    menu: "#F3F3F3",
  },
] as const;

export type FolderColor = (typeof folderColorOptions)[number]["value"];
export type FolderIconVariant = "empty" | "filled";

export function getFolderColorOption(folderColor?: string) {
  return folderColorOptions.find((option) => option.value === folderColor) ?? folderColorOptions[0];
}

export function getFolderFillColor(folderColor?: string) {
  return getFolderColorOption(folderColor).fill;
}

export function getFolderAccentColor(folderColor?: string) {
  return getFolderColorOption(folderColor).tab;
}

export function getFolderBorderColor(folderColor?: string) {
  return getFolderColorOption(folderColor).border;
}

export function getFolderIconVariant(childCount: number): FolderIconVariant {
  return childCount > 0 ? "filled" : "empty";
}
