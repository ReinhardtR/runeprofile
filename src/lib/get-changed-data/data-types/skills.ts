export type SkillChange = {
  name: string;
  orderIdx: number;
};

export type GetSkillChangesInputData = {
  name: string;
  orderIdx: number;
}[];

export function getSkillChanges(
  oldData: GetSkillChangesInputData | undefined,
  newData: GetSkillChangesInputData
): SkillChange[] {
  const changes: SkillChange[] = [];

  for (const newSkill of newData) {
    const oldSkill = oldData?.find((s) => s.name === newSkill.name);

    if (
      !oldSkill || //
      oldSkill.orderIdx !== newSkill.orderIdx
    ) {
      changes.push({
        name: newSkill.name,
        orderIdx: newSkill.orderIdx,
      });
    }
  }

  return changes;
}

export type AccountSkillChange = {
  name: string;
  xp: number;
};

export type GetAccountSkillChangesInputData = {
  name: string;
  xp: number;
}[];

export function getAccountSkillChanges(
  oldData: GetAccountSkillChangesInputData | undefined,
  newData: GetAccountSkillChangesInputData
): AccountSkillChange[] {
  const changes: AccountSkillChange[] = [];

  for (const newSkill of newData) {
    const oldSkill = oldData?.find((s) => s.name === newSkill.name);

    if (
      !oldSkill || //
      oldSkill.xp !== newSkill.xp
    ) {
      changes.push({
        name: newSkill.name,
        xp: newSkill.xp,
      });
    }
  }

  return changes;
}
