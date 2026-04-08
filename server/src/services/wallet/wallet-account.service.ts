import prisma from "../../connect";

// getOrCreateWalletService: Ensures a client has a wallet record; creates one with zero balance if missing
export const getOrCreateWalletService = async (clientId: string) => {
  let wallet = await prisma.walletAccount.findUnique({
    where: { clientId },
  });

  if (!wallet) {
    wallet = await prisma.walletAccount.create({
      data: {
        clientId,
        currency: "NPR",
        availableBalance: 0,
      },
    });
  }

  return wallet;
};

// getBalanceService: Logic to fetch and format a client's current available wallet balance
export const getBalanceService = async (clientId: string) => {
  const wallet = await getOrCreateWalletService(clientId);
  return {
    clientId: wallet.clientId,
    currency: wallet.currency,
    availableBalance: Number(wallet.availableBalance),
  };
};
