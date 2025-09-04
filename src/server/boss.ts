import PgBoss from 'pg-boss';
import { env } from '@/lib/env';

let boss: PgBoss | null = null;

export async function ensureBoss() {
  if (!boss) {
    boss = new PgBoss(env.database.url);
    await boss.start();
  }
  return boss;
}

export async function getBoss() {
  if (!boss) {
    await ensureBoss();
  }
  return boss!;
}

export async function stopBoss() {
  if (boss) {
    await boss.stop();
    boss = null;
  }
}
