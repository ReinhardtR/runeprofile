import { createCacheProvider } from "./lib/cache";
import { loadCombatAchievements } from "./lib/combat-achievements";

scrapeCombatAchievements()
  .then(() => console.log("\nFinished scraping combat achievements."))
  .catch((error) => {
    console.error("Error:", error);
    process.exitCode = 1;
  });

async function scrapeCombatAchievements() {
  const provider = createCacheProvider();
  const { tasks, bosses } = await loadCombatAchievements(provider);

  console.log(`\nTotal tasks: ${tasks.length}`);
  console.log(
    `Index range: ${tasks[0]?.index} - ${tasks[tasks.length - 1]?.index}`,
  );

  // Count per tier
  for (let tierId = 1; tierId <= 6; tierId++) {
    const count = tasks.filter((t) => t.tierId === tierId).length;
    console.log(`  Tier ${tierId}: ${count} tasks`);
  }

  // Output the TypeScript array
  console.log("\n// --- Generated COMBAT_ACHIEVEMENT_BOSSES array ---\n");
  console.log("export const COMBAT_ACHIEVEMENT_BOSSES = [");
  for (const name of bosses) {
    console.log(`  '${name.replace(/'/g, "\\'")}',`);
  }
  console.log("] as const;\n");

  console.log("// --- Generated COMBAT_ACHIEVEMENT_TASKS array ---\n");
  console.log(
    "export const COMBAT_ACHIEVEMENT_TASKS: CombatAchievementTask[] = [",
  );
  for (const task of tasks) {
    const escapedName = task.name.replace(/'/g, "\\'");
    const escapedDesc = task.description.replace(/'/g, "\\'");
    const escapedMonster = task.monster.replace(/'/g, "\\'");
    console.log(
      `  { index: ${task.index}, tierId: ${task.tierId}, name: '${escapedName}', description: '${escapedDesc}', type: '${task.type}', monster: '${escapedMonster}' },`,
    );
  }
  console.log("] as const;");
}
