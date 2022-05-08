import {
  Group,
  PrismaClient,
  GroupRoster,
  User,
  Category,
  UserCategory,
  CategoryType,
  Record,
} from "@prisma/client";

const prisma = new PrismaClient();
const userData: Array<User> = [
  {
    id: 1,
    username: "Alicia",
    email: "user1@gmail.com",
    password: "12345678",
    icon: null,
    refreshToken: null,
  },
  {
    id: 2,
    username: "Bob",
    email: "user2@gmail.com",
    password: "12345678",
    icon: null,
    refreshToken: null,
  },
];

const categoryData: Array<Category> = [
  {
    id: 1,
    name: "薪水",
    type: CategoryType.REVENUE,
    icon: null,
  },
  {
    id: 2,
    name: "午餐",
    type: CategoryType.EXPENSE,
    icon: null,
  },
  {
    id: 3,
    name: "晚餐",
    type: CategoryType.EXPENSE,
    icon: null,
  },
  {
    id: 4,
    name: "早餐",
    type: CategoryType.EXPENSE,
    icon: null,
  },
  {
    id: 5,
    name: "交通",
    type: CategoryType.EXPENSE,
    icon: null,
  },
];

const groupData: Group = {
  id: 1,
  name: "美國旅遊",
  adminId: 1,
  capacity: 2,
  memberCount: 1,
};

const groupRosterData: Array<GroupRoster> = [
  {
    id: 1,
    groupId: 1,
    userId: 1,
  },
  {
    id: 1,
    groupId: 1,
    userId: 2,
  },
];

const userCategoryData: Array<UserCategory> = [
  ...categoryData.map((data) => ({
    id: data.id,
    userId: 1,
    categoryId: data.id,
  })),
  {
    id: categoryData.length + 1,
    userId: 2,
    categoryId: 1,
  },
];

const recordData: Array<Record> = [
  {
    id: 1,
    name: "薪水",
    merchant: "stark tech",
    amount: 10000,
    userId: 1,
    groupId: null,
    categoryId: 1,
  },
  {
    id: 2,
    name: "貴族牛排",
    amount: 1000,
    userId: 1,
    merchant: null,
    groupId: null,
    categoryId: 2,
  },
  {
    id: 2,
    name: "機票",
    merchant: "星宇航空",
    amount: 20000,
    userId: 1,
    groupId: 1,
    categoryId: 5,
  },
  {
    id: 2,
    name: "機票",
    merchant: "星宇航空",
    amount: 20000,
    userId: 2,
    groupId: 1,
    categoryId: 5,
  },
];

const main = async function () {
  await Promise.all([
    prisma.user.createMany({
      data: userData,
      skipDuplicates: true,
    }),
    prisma.category.createMany({
      data: categoryData,
      skipDuplicates: true,
    }),
    prisma.group.create({
      data: groupData,
    }),
    prisma.groupRoster.createMany({
      data: groupRosterData,
      skipDuplicates: true,
    }),
    prisma.userCategory.createMany({
      data: userCategoryData,
      skipDuplicates: true,
    }),
    prisma.record.createMany({
      data: recordData,
      skipDuplicates: true,
    }),
  ]);
};

main();
