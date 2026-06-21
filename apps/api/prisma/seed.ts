import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const seedData = [
  { englishExpression: 'relevant', japaneseTranslation: '関連する' },
  { englishExpression: 'look after', japaneseTranslation: '～の世話をする' },
  { englishExpression: 'be responsible for', japaneseTranslation: '～の責任を持つ' },
  { englishExpression: 'involve', japaneseTranslation: '含む、巻き込む' },
  { englishExpression: 'establish', japaneseTranslation: '設立する、確立する' },
  { englishExpression: 'implement', japaneseTranslation: '実施する、実装する' },
  { englishExpression: 'significant', japaneseTranslation: '重要な、著しい' },
  { englishExpression: 'consist of', japaneseTranslation: '～から成る' },
  { englishExpression: 'in terms of', japaneseTranslation: '～の観点から' },
  { englishExpression: 'take into account', japaneseTranslation: '考慮に入れる' },
  { englishExpression: 'put off', japaneseTranslation: '延期する' },
  { englishExpression: 'come up with', japaneseTranslation: '思いつく' },
  { englishExpression: 'deal with', japaneseTranslation: '対処する' },
  { englishExpression: 'bring about', japaneseTranslation: '引き起こす' },
  { englishExpression: 'regardless of', japaneseTranslation: '～に関わらず' },
];

async function main() {
  console.log('Seeding database...');
  await prisma.vocabulary.createMany({ data: seedData, skipDuplicates: false });
  console.log(`Seeded ${seedData.length} vocabularies.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
