import type { SVGProps } from "react";

import { getFolderAccentColor, getFolderBorderColor, getFolderFillColor, getFolderIconVariant } from "@/lib/folder-utils";

export function CaretDownIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true" {...props}>
      <path d="M10.9991 6C11.4251 6 11.6476 6.49301 11.3906 6.81151L11.3526 6.85351L8.35257 9.85357C8.26647 9.93966 8.15192 9.99137 8.0304 9.99901C7.90889 10.0067 7.78876 9.9697 7.69256 9.89507L7.64555 9.85357L4.6455 6.85351L4.604 6.80651L4.577 6.76801L4.55 6.72001L4.5415 6.70201L4.528 6.66851L4.512 6.61451L4.507 6.58801L4.502 6.55801L4.5 6.52951V6.47051L4.5025 6.44151L4.507 6.41151L4.512 6.38551L4.528 6.33151L4.5415 6.29801L4.5765 6.232L4.609 6.187L4.6455 6.1465L4.6925 6.105L4.731 6.078L4.779 6.051L4.79701 6.0425L4.83051 6.029L4.88451 6.013L4.91101 6.008L4.94101 6.003L4.96951 6.001L10.9991 6Z" fill="currentColor" />
    </svg>
  );
}

export function HomeIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true" {...props}>
      <path fillRule="evenodd" clipRule="evenodd" d="M8.17678 2.38377C8.07915 2.28614 7.92085 2.28614 7.82322 2.38377L3.5 6.70699V13.2499C3.5 13.388 3.61193 13.4999 3.75 13.4999H6V10.7499C6 10.0595 6.55964 9.49989 7.25 9.49989H8.75C9.44036 9.49989 10 10.0595 10 10.7499V13.4999H12.25C12.3881 13.4999 12.5 13.388 12.5 13.2499V6.70699L8.17678 2.38377ZM13.5 7.70699L14.1464 8.35344C14.3417 8.5487 14.6583 8.5487 14.8536 8.35344C15.0488 8.15818 15.0488 7.84159 14.8536 7.64633L8.88388 1.67666C8.39573 1.18851 7.60427 1.18851 7.11612 1.67666L1.14645 7.64633C0.951184 7.84159 0.951184 8.15818 1.14645 8.35344C1.34171 8.5487 1.65829 8.5487 1.85355 8.35344L2.5 7.70699V13.2499C2.5 13.9402 3.05964 14.4999 3.75 14.4999H12.25C12.9404 14.4999 13.5 13.9402 13.5 13.2499V7.70699ZM9 13.4999H7V10.7499C7 10.6118 7.11193 10.4999 7.25 10.4999H8.75C8.88807 10.4999 9 10.6118 9 10.7499V13.4999Z" fill="currentColor" />
    </svg>
  );
}

export function LibraryIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true" {...props}>
      <path d="M10.6919 7.05273H5.30738C3.67693 7.05273 2.86171 7.05273 2.48686 7.59122C2.11202 8.1297 2.39061 8.90061 2.9478 10.4424L3.63256 12.3372C3.92308 13.141 4.06835 13.543 4.39263 13.7715C4.71691 14.0001 5.14199 14.0001 5.99212 14.0001H10.0072C10.8573 14.0001 11.2823 14.0001 11.6067 13.7715C11.9309 13.543 12.0762 13.141 12.3668 12.3372L13.0515 10.4424C13.6087 8.90061 13.8873 8.1297 13.5124 7.59122C13.1376 7.05273 12.3224 7.05273 10.6919 7.05273Z" stroke="currentColor" strokeLinecap="square" />
      <path d="M12.4212 5.47374C12.4212 5.17946 12.4212 5.03232 12.3731 4.91625C12.309 4.7615 12.1861 4.63854 12.0313 4.57444C11.9152 4.52637 11.7681 4.52637 11.4738 4.52637H4.52647C4.23219 4.52637 4.08505 4.52637 3.96899 4.57444C3.81423 4.63854 3.69128 4.7615 3.62718 4.91625C3.5791 5.03232 3.5791 5.17946 3.5791 5.47374" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10.8424 2.94737C10.8424 2.65309 10.8424 2.50595 10.7944 2.38989C10.7302 2.23513 10.6073 2.11217 10.4525 2.04808C10.3365 2 10.1893 2 9.89505 2H6.10557C5.81129 2 5.66415 2 5.54809 2.04808C5.39333 2.11217 5.27038 2.23513 5.20628 2.38989C5.1582 2.50595 5.1582 2.65309 5.1582 2.94737" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function PageIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true" {...props}>
      <path d="M5.40039 11.25H10.6004" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5.40039 8.6499H8.00039" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8.6498 1.825V2.15C8.6498 3.98848 8.6498 4.90772 9.22096 5.47886C9.79211 6.05 10.7113 6.05 12.5498 6.05H12.8748M13.1998 7.12699V9.3C13.1998 11.7513 13.1998 12.977 12.4383 13.7385C11.6768 14.5 10.4511 14.5 7.9998 14.5C5.5485 14.5 4.32285 14.5 3.56133 13.7385C2.7998 12.977 2.7998 11.7513 2.7998 9.3V6.3463C2.7998 4.23703 2.7998 3.1824 3.37575 2.46806C3.49211 2.32375 3.62356 2.1923 3.76787 2.07595C4.48221 1.5 5.53684 1.5 7.64607 1.5C8.10471 1.5 8.33397 1.5 8.54398 1.57411C8.58766 1.58952 8.63043 1.60725 8.67223 1.62724C8.87314 1.72331 9.03525 1.88545 9.35954 2.20972L12.4383 5.28848C12.814 5.66422 13.0019 5.85209 13.1009 6.09099C13.1998 6.32989 13.1998 6.59558 13.1998 7.12699Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function MoreIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true" {...props}>
      <path d="M3.71429 7.99993V7.64279M12.2857 7.99993V7.64279M8 7.99993V7.64279M4.42857 7.99993C4.42857 7.60543 4.10877 7.28564 3.71429 7.28564C3.31979 7.28564 3 7.60543 3 7.99993C3 8.39443 3.31979 8.71422 3.71429 8.71422C4.10877 8.71422 4.42857 8.39443 4.42857 7.99993ZM13 7.99993C13 7.60543 12.6802 7.28564 12.2857 7.28564C11.8912 7.28564 11.5714 7.60543 11.5714 7.99993C11.5714 8.39443 11.8912 8.71422 12.2857 8.71422C12.6802 8.71422 13 8.39443 13 7.99993ZM8.71429 7.99993C8.71429 7.60543 8.3945 7.28564 8 7.28564C7.6055 7.28564 7.28572 7.60543 7.28572 7.99993C7.28572 8.39443 7.6055 8.71422 8 8.71422C8.3945 8.71422 8.71429 8.39443 8.71429 7.99993Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

type FolderIconProps = SVGProps<SVGSVGElement> & {
  fillColor?: string;
  accentColor?: string;
  borderColor?: string;
};

export function FolderEmptyIcon({ fillColor, borderColor, ...props }: FolderIconProps) {
  const strokeColor = borderColor && borderColor !== fillColor ? borderColor : undefined;

  if (fillColor) {
    return (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
        <path d="M7.08264 2.25004C8.11205 2.24959 8.82373 2.24927 9.4626 2.48884C10.8581 3.01213 11.4704 4.25129 11.9425 5.20644C12.0838 5.48917 12.3409 6.00278 12.4128 6.11571C12.4348 6.15263 12.5044 6.22825 12.6064 6.23539C12.7396 6.24916 12.92 6.25008 13.2361 6.25008H16.7905C17.8095 6.25007 18.6312 6.25006 19.2905 6.31713C19.9711 6.38636 20.5613 6.53321 21.0834 6.88207C21.4929 7.15567 21.8444 7.50723 22.118 7.91669C22.4669 8.4388 22.6137 9.02901 22.683 9.70957C22.75 10.3689 22.75 11.2734 22.75 12.2924C22.75 14.0121 22.75 15.3603 22.6408 16.4337C22.5295 17.5284 22.2983 18.4203 21.781 19.1946C21.3614 19.8225 20.8224 20.3615 20.1945 20.7811C19.4202 21.2984 18.5283 21.5296 17.4336 21.6409C16.3602 21.7501 15.012 21.7501 13.2923 21.7501H11.9426C9.63423 21.7501 7.82519 21.7501 6.41371 21.5604C4.96897 21.3661 3.82895 20.9608 2.93414 20.066C2.03933 19.1712 1.63399 18.0311 1.43975 16.5864C1.24998 15.1749 1.24999 13.3659 1.25 11.0575V7.90959C1.24999 7.26428 1.24999 6.71065 1.26997 6.23539C1.27719 6.06348 1.28704 5.90182 1.30044 5.74978C1.35242 5.16004 1.46238 4.64396 1.7254 4.17266C2.06428 3.56542 2.56533 3.06436 3.17258 2.72548C3.64388 2.46246 4.15996 2.35251 4.7497 2.30052C5.32205 2.25007 6.2039 2.25003 7.08264 2.25004Z" fill={fillColor} stroke={strokeColor} strokeWidth={strokeColor ? 1 : undefined} />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path d="M8.22233 7.27778H16.4862C18.4759 7.27778 19.4707 7.27778 20.1853 7.75528C20.4947 7.962 20.7603 8.22762 20.967 8.537C21.4446 9.25163 21.4446 10.2464 21.4446 12.2361C21.4446 15.5522 21.4446 17.2102 20.6487 18.4014C20.3042 18.9169 19.8615 19.3597 19.3459 19.7041C18.1548 20.5 16.4968 20.5 13.1807 20.5H12.0001C7.54795 20.5 5.32188 20.5 3.93877 19.1169C2.55566 17.7338 2.55566 15.5077 2.55566 11.0556V8.16959C2.55566 6.45403 2.55566 5.59625 2.91486 4.95261C3.17089 4.49381 3.54947 4.11523 4.00828 3.85919C4.65192 3.5 5.5097 3.5 7.22525 3.5C8.32435 3.5 8.8739 3.5 9.35497 3.6804C10.4533 4.09228 10.9063 5.09005 11.4019 6.08129L12.0001 7.27778" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function FolderFilledIcon({ fillColor, accentColor, borderColor, ...props }: FolderIconProps) {
  const strokeColor = borderColor && borderColor !== fillColor ? borderColor : undefined;

  if (fillColor) {
    return (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
        <path d="M8 7H16.75C18.8567 7 19.91 7 20.6667 7.50559C20.9943 7.72447 21.2755 8.00572 21.4944 8.33329C22 9.08996 22 10.1433 22 12.25C22 15.7612 22 17.5167 21.1573 18.7779C20.7926 19.3238 20.3238 19.7926 19.7779 20.1573C18.5167 21 16.7612 21 13.25 21H12C7.28595 21 4.92893 21 3.46447 19.5355C2 18.0711 2 15.714 2 11V7.94427C2 6.1278 2 5.21956 2.38032 4.53806C2.65142 4.05227 3.05227 3.65142 3.53806 3.38032C4.21956 3 5.1278 3 6.94427 3C8.10802 3 8.6899 3 9.19926 3.19101C10.3622 3.62712 10.8418 4.68358 11.3666 5.73313L12 7" fill={fillColor} stroke={strokeColor} strokeWidth={strokeColor ? 1 : undefined} />
        <path d="M14.0391 1.37778C14.9168 1.04048 15.8948 1.47494 17.8506 2.34458C19.8064 3.21424 20.7847 3.64943 21.1221 4.5272C21.3243 5.05385 20.926 6.21387 20.6455 7.00181C20.6455 7.00181 20.1922 6.51938 19.3525 6.51938H12.3643L11.5146 4.91001C12.3843 2.95432 13.1613 1.7152 14.0391 1.37778ZM15.7344 3.81333C15.4791 3.70854 15.1871 3.8306 15.082 4.08579C14.9771 4.34119 15.0991 4.63315 15.3545 4.73813L17.2285 5.50864C17.4839 5.61345 17.7759 5.49152 17.8809 5.23618C17.9857 4.98087 17.8636 4.68887 17.6084 4.58384L15.7344 3.81333Z" fill={accentColor ?? fillColor} />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path d="M20.542 7.462C21.146 6.069 21.405 5.263 21.122 4.528C20.785 3.65 19.807 3.215 17.851 2.345C15.895 1.476 14.917 1.041 14.04 1.378C13.162 1.716 12.727 2.694 11.857 4.649L11.333 5.828" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M15.545 4.276L17.419 5.047" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M8 7H16.75C18.8567 7 19.91 7 20.6667 7.50559C20.9943 7.72447 21.2755 8.00572 21.4944 8.33329C22 9.08996 22 10.1433 22 12.25C22 15.7612 22 17.5167 21.1573 18.7779C20.7926 19.3238 20.3238 19.7926 19.7779 20.1573C18.5167 21 16.7612 21 13.25 21H12C7.28595 21 4.92893 21 3.46447 19.5355C2 18.0711 2 15.714 2 11V7.94427C2 6.1278 2 5.21956 2.38032 4.53806C2.65142 4.05227 3.05227 3.65142 3.53806 3.38032C4.21956 3 5.1278 3 6.94427 3C8.10802 3 8.6899 3 9.19926 3.19101C10.3622 3.62712 10.8418 4.68358 11.3666 5.73313L12 7" fill="white" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function FolderListIcon({
  childCount,
  folderColor,
  ...props
}: SVGProps<SVGSVGElement> & {
  childCount: number;
  folderColor?: string;
}) {
  const fillColor = getFolderFillColor(folderColor);
  const accentColor = getFolderAccentColor(folderColor);
  const borderColor = getFolderBorderColor(folderColor);

  return getFolderIconVariant(childCount) === "filled" ? (
    <FolderFilledIcon fillColor={fillColor} accentColor={accentColor} borderColor={borderColor} {...props} />
  ) : (
    <FolderEmptyIcon fillColor={fillColor} borderColor={borderColor} {...props} />
  );
}

export const FolderFillIcon = FolderEmptyIcon;
export const FolderLineIcon = FolderEmptyIcon;

export function CanvasIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path d="M4 8C4 5.17157 4 3.75736 5.00421 2.87868C6.00841 2 7.62465 2 10.8571 2H13.1429C16.3753 2 17.9916 2 18.9958 2.87868C20 3.75736 20 5.17157 20 8V17H4V8Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M3 17H21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M10.6987 5.56588C11.9289 5.38957 13.9674 5.4601 12.2803 7.15266C10.1715 9.26836 7.00839 14.0289 10.6987 12.4421C14.3891 10.8554 15.9709 11.9132 14.3893 13.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 17V21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M5 22L8 17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M19 22L16 17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function PageLayoutIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true" {...props}>
      <path d="M2.4519 13.5481C1.5 12.5962 1.5 11.0641 1.5 8C1.5 4.93587 1.5 3.40381 2.4519 2.4519C3.4038 1.5 4.93587 1.5 8 1.5C11.0641 1.5 12.5962 1.5 13.5481 2.4519C14.5 3.4038 14.5 4.93587 14.5 8C14.5 11.0641 14.5 12.5962 13.5481 13.5481C12.5962 14.5 11.0641 14.5 8 14.5C4.93587 14.5 3.40381 14.5 2.4519 13.5481Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M1.5 5.94727H14.5" stroke="currentColor" />
      <path d="M5.2627 14.4999V5.94727" stroke="currentColor" />
    </svg>
  );
}

export function ContainerIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true" {...props}>
      <path d="M2.4519 13.5481C1.5 12.5962 1.5 11.0641 1.5 8C1.5 4.93587 1.5 3.40381 2.4519 2.4519C3.4038 1.5 4.93587 1.5 8 1.5C11.0641 1.5 12.5962 1.5 13.5481 2.4519C14.5 3.4038 14.5 4.93587 14.5 8C14.5 11.0641 14.5 12.5962 13.5481 13.5481C12.5962 14.5 11.0641 14.5 8 14.5C4.93587 14.5 3.40381 14.5 2.4519 13.5481Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5.2627 14.4998V1.6709" stroke="currentColor" />
      <path d="M10.7373 14.4998V1.6709" stroke="currentColor" />
    </svg>
  );
}

export function FullWidthIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true" {...props}>
      <path d="M2.4519 13.5481C1.5 12.5962 1.5 11.0641 1.5 8C1.5 4.93587 1.5 3.40381 2.4519 2.4519C3.4038 1.5 4.93587 1.5 8 1.5C11.0641 1.5 12.5962 1.5 13.5481 2.4519C14.5 3.4038 14.5 4.93587 14.5 8C14.5 11.0641 14.5 12.5962 13.5481 13.5481C12.5962 14.5 11.0641 14.5 8 14.5C4.93587 14.5 3.40381 14.5 2.4519 13.5481Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M3.26367 14.2037V1.6709" stroke="currentColor" />
      <path d="M12.7363 14.2037V1.6709" stroke="currentColor" />
    </svg>
  );
}
