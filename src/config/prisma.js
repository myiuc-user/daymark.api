import pkg from '@prisma/client';
const { PrismaClient } = pkg;

let prismaInstance;
let isReconnecting = false;

function createPrismaClient() {
  return new PrismaClient({
    errorFormat: 'pretty',
  });
}

if (process.env.NODE_ENV === 'production') {
  prismaInstance = createPrismaClient();
} else {
  if (!global.prismaInstance) {
    global.prismaInstance = createPrismaClient();
  }
  prismaInstance = global.prismaInstance;
}

async function reconnectPrisma() {
  if (isReconnecting) return;
  isReconnecting = true;

  try {
    await prismaInstance.$disconnect();
  } catch (e) {
    // ignore
  }

  let retries = 0;
  while (retries < 5) {
    try {
      prismaInstance = createPrismaClient();
      if (process.env.NODE_ENV !== 'production') {
        global.prismaInstance = prismaInstance;
      }
      await prismaInstance.$connect();
      console.log('✅ Database reconnected');
      isReconnecting = false;
      return true;
    } catch (error) {
      retries++;
      console.warn(`⚠️  Reconnection attempt ${retries}/5`);
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  isReconnecting = false;
  return false;
}

prismaInstance.$on('error', async (error) => {
  if (error.message?.includes('connection') || error.message?.includes('closed')) {
    console.error('❌ Database connection lost');
    await reconnectPrisma();
  }
});

const prisma = new Proxy(prismaInstance, {
  get(target, prop) {
    return prismaInstance[prop];
  }
});

export { reconnectPrisma };
export default prisma;
