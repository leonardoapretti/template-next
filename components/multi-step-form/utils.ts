//packages/design-system/components/multi-step-form/utils.ts
const REGEX_ADD_SPACE_BEFORE_CAPITALS = /([A-Z])/g;
const REGEX_CAPITALIZE_FIRST_LETTER = /^./;

export function formatStepName(name: string): string {
  return name
    .replace(REGEX_ADD_SPACE_BEFORE_CAPITALS, ' \$1')
    .replace(REGEX_CAPITALIZE_FIRST_LETTER, (str) => str.toUpperCase())
    .trim();
}