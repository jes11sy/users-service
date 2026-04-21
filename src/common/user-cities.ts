import { PrismaService } from '../prisma/prisma.service';

export type UserCityUserType = 'master' | 'director' | 'operator' | 'admin';

function normalizeCityIds(cityIds: number[] | undefined): number[] {
  if (!Array.isArray(cityIds)) {
    return [];
  }

  return Array.from(
    new Set(
      cityIds.filter((cityId): cityId is number => Number.isInteger(cityId) && cityId > 0),
    ),
  ).sort((a, b) => a - b);
}

export async function getUserCityIds(
  prisma: PrismaService,
  userType: UserCityUserType,
  userId: number,
): Promise<number[]> {
  const rows = await prisma.userCity.findMany({
    where: { userType, userId },
    select: { cityId: true },
    orderBy: { cityId: 'asc' },
  });

  return rows.map((row) => row.cityId);
}

export async function getUserCityIdsMap(
  prisma: PrismaService,
  userType: UserCityUserType,
  userIds: number[],
): Promise<Map<number, number[]>> {
  const normalizedUserIds = Array.from(new Set(userIds.filter((id) => Number.isInteger(id) && id > 0)));
  const result = new Map<number, number[]>();

  if (normalizedUserIds.length === 0) {
    return result;
  }

  const rows = await prisma.userCity.findMany({
    where: {
      userType,
      userId: { in: normalizedUserIds },
    },
    select: {
      userId: true,
      cityId: true,
    },
    orderBy: [{ userId: 'asc' }, { cityId: 'asc' }],
  });

  for (const row of rows) {
    const cityIds = result.get(row.userId) ?? [];
    cityIds.push(row.cityId);
    result.set(row.userId, cityIds);
  }

  return result;
}

export async function getUserIdsByCityIds(
  prisma: PrismaService,
  userType: UserCityUserType,
  cityIds: number[],
): Promise<number[]> {
  const normalizedCityIds = normalizeCityIds(cityIds);

  if (normalizedCityIds.length === 0) {
    return [];
  }

  const rows = await prisma.userCity.findMany({
    where: {
      userType,
      cityId: { in: normalizedCityIds },
    },
    select: { userId: true },
  });

  return Array.from(new Set(rows.map((row) => row.userId)));
}

export async function syncUserCityIds(
  prisma: PrismaService,
  userType: UserCityUserType,
  userId: number,
  cityIds: number[] | undefined,
): Promise<void> {
  if (cityIds === undefined) {
    return;
  }

  const normalizedCityIds = normalizeCityIds(cityIds);

  await prisma.$transaction(async (tx) => {
    await tx.userCity.deleteMany({
      where: { userType, userId },
    });

    if (normalizedCityIds.length > 0) {
      await tx.userCity.createMany({
        data: normalizedCityIds.map((cityId) => ({
          userType,
          userId,
          cityId,
        })),
      });
    }
  });
}

export function attachCityIds<T extends { id: number }>(
  items: T[],
  cityIdsMap: Map<number, number[]>,
): Array<T & { cityIds: number[] }> {
  return items.map((item) => ({
    ...item,
    cityIds: cityIdsMap.get(item.id) ?? [],
  }));
}
