const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/**
 * create new purchase transaction
 * payload:
 *  - utorid: string (utorid of customer making purchase)
 *  - type: string (must be "purchase")
 *  - spent: number (dollar amount spent)
 *  - promotionIds: array (ids of promotions to apply)
 *  - remark: string (any remark)
 */
async function createPurchaseTransaction(req, res) {
  const { utorid, type, spent, promotionIds, remark } = req.body;

  if (type !== "purchase") {
    return res.status(400).json({ error: "invalid transaction type" });
  }
  if (!utorid || spent == null) {
    return res.status(400).json({ error: "missing required fields" });
  }
  if (typeof spent !== "number" || spent <= 0) {
    return res.status(400).json({ error: "spent must be a number" });
  }

  // Find customer by utorid
  const customer = await prisma.user.findUnique({ where: { utorid } });
  if (!customer) {
    return res.status(404).json({ error: "customer not found" });
  }

  // Check promotions validity
  let validPromotions = [];
  if (promotionIds) {
    if (!Array.isArray(promotionIds)) {
      return res.status(400).json({ error: "promotionIds must be an array" });
    }
    for (const pid of promotionIds) {
      const promo = await prisma.promotion.findUnique({ where: { id: pid } });
      if (!promo) {
        return res
          .status(400)
          .json({ error: `promotion id ${pid} does not exist` });
      }
      const now = new Date();
      if (promo.startTime > now || promo.endTime < now) {
        return res
          .status(400)
          .json({ error: `promotion id ${pid} is expired or not active` });
      }
      if (promo.type === "ONE_TIME") {
        const userPromo = await prisma.userPromotion.findUnique({
          where: {
            userId_promotionId: { userId: customer.id, promotionId: pid },
          },
        });
        if (userPromo && userPromo.used) {
          return res
            .status(400)
            .json({ error: `promotion id ${pid} has already been used` });
        }
      }
      validPromotions.push(promo);
    }
  }

  // Fetch automatic promotions
  const automaticPromotions = await prisma.promotion.findMany({
    where: {
      type: 'automatic',
      startTime: { lte: new Date() },
      endTime: { gte: new Date() },
      OR: [
        { minSpending: null },
        { minSpending: { lte: spent } }
      ]
    }
  });

  const promotions = [...automaticPromotions, ...validPromotions];

  // Compute earned points (1 point per 25 cents spent, rounded)
  let earned = Math.round(spent * 4);

  // Add promotion points
  for (const promotion of promotions) {
    if (promotion.points) {
      earned += promotion.points;
    }
    if (promotion.rate) {
      earned += Math.round(spent * 100 * promotion.rate);
    }
  }

  // Fetch the full cashier record
  const cashier = await prisma.user.findUnique({ where: { id: req.user.id } });
  const isSuspicious = cashier && cashier.suspicious === true;

  const creditedPoints = isSuspicious ? 0 : earned;

  // Create transaction record using creditedPoints
  let transaction;
  try {
    transaction = await prisma.transaction.create({
      data: {
        type: "PURCHASE",
        spent: spent,
        amount: earned,
        suspicious: isSuspicious,
        remark: remark || "",
        user: { connect: { id: customer.id } },
        createdBy: { connect: { id: req.user.id } },
      },
    });
  } catch (error) {
    console.error("Error creating transaction:", error);
    return res
      .status(500)
      .json({ error: "server error while creating transaction" });
  }

  // Attach promotions to transaction
  if (promotions.length > 0) {
    for (const promo of promotions) {
      try {
        await prisma.transactionPromotion.create({
          data: {
            transactionId: transaction.id,
            promotionId: promo.id,
          },
        });
        if (promo.type === "ONE_TIME") {
          await prisma.userPromotion.upsert({
            where: {
              userId_promotionId: {
                userId: customer.id,
                promotionId: promo.id,
              },
            },
            update: { used: true },
            create: {
              userId: customer.id,
              promotionId: promo.id,
              used: true,
            },
          });
        }
      } catch (error) {
        console.error("Error applying promotion:", promo.id, error);
        return res
          .status(500)
          .json({ error: "server error while applying promotions" });
      }
    }
  }

  // Update customer's points balance if not suspicious
  if (!isSuspicious) {
    try {
      await prisma.user.update({
        where: { id: customer.id },
        data: { points: customer.points + creditedPoints },
      });
    } catch (error) {
      console.error("Error updating customer points:", error);
      return res
        .status(500)
        .json({ error: "server error while updating user points" });
    }
  }

  return res.status(201).json({
    id: transaction.id,
    utorid: customer.utorid,
    type: "purchase",
    spent: spent,
    earned: creditedPoints,
    remark: remark || "",
    promotionIds: promotions.map((p) => p.id),
    createdBy: cashier.utorid,
  });
}

/**
 * create new adjustment transaction
 * payload:
 *  - utorid: string (utorid of user whose transaction is adjusted)
 *  - type: string (must be "adjustment")
 *  - amount: number (point amount adjusted)
 *  - relatedId: number (id of related transaction)
 *  - promotionIds: array (ids of promotions to apply)
 *  - remark: string (any remark)
 */
async function createAdjustmentTransaction(req, res) {
  const { utorid, type, amount, relatedId, promotionIds, remark } = req.body;

  if (type !== "adjustment") {
    return res.status(400).json({ error: "invalid transaction type" });
  }
  if (!utorid || amount == null || relatedId == null) {
    return res.status(400).json({ error: "missing required fields" });
  }
  if (typeof amount !== "number" || typeof relatedId !== "number") {
    return res
      .status(400)
      .json({ error: "amount and relatedId must be numbers" });
  }

  // Find customer by utorid
  const customer = await prisma.user.findUnique({ where: { utorid } });
  if (!customer) {
    return res.status(404).json({ error: "customer not found" });
  }

  // Check promotions validity
  let validPromotions = [];
  if (promotionIds) {
    if (!Array.isArray(promotionIds)) {
      return res.status(400).json({ error: "promotionIds must be an array" });
    }
    for (const pid of promotionIds) {
      const promo = await prisma.promotion.findUnique({ where: { id: pid } });
      if (!promo) {
        return res
          .status(400)
          .json({ error: `promotion id ${pid} does not exist` });
      }
      const now = new Date();
      if (promo.startTime > now || promo.endTime < now) {
        return res
          .status(400)
          .json({ error: `promotion id ${pid} is expired or not active` });
      }
      if (promo.type === "ONE_TIME") {
        const userPromo = await prisma.userPromotion.findUnique({
          where: {
            userId_promotionId: { userId: customer.id, promotionId: pid },
          },
        });

        if (userPromo && userPromo.used) {
          return res
            .status(400)
            .json({ error: `promotion id ${pid} has already been used` });
        }
      }
      validPromotions.push(promo);
    }
  }

  // Check for related transaction
  const relatedTransaction = await prisma.transaction.findUnique({
    where: { id: relatedId },
  });

  if (!relatedTransaction) {
    return res.status(404).json({ error: "related transaction not found" });
  }

  // Update customer's points balance
  try {
    await prisma.user.update({
      where: { id: customer.id },
      data: { points: customer.points + amount },
    });
  } catch (error) {
    console.error("DEBUG: Error updating user points:", error);
    return res
      .status(500)
      .json({ error: "server error while updating user points" });
  }

  // Create adjustment transaction record
  let transaction;
  try {
    const transactionData = {
      type: "ADJUSTMENT",
      amount: amount,
      remark: remark || "",
      relatedId: relatedId,
      user: { connect: { id: customer.id } },
      createdBy: { connect: { id: req.user.id } },
    };
    transaction = await prisma.transaction.create({ data: transactionData });
  } catch (error) {
    console.error("DEBUG: Error creating transaction:", error);
    return res
      .status(500)
      .json({ error: "server error while creating transaction" });
  }

  // Attach promotions if any
  if (validPromotions.length > 0) {
    for (const promo of validPromotions) {
      try {
        await prisma.transactionPromotion.create({
          data: {
            transactionId: transaction.id,
            promotionId: promo.id,
          },
        });
        if (promo.type === "ONE_TIME") {
          await prisma.userPromotion.upsert({
            where: {
              userId_promotionId: {
                userId: customer.id,
                promotionId: promo.id,
              },
            },
            update: { used: true },
            create: { userId: customer.id, promotionId: promo.id, used: true },
          });
        }
      } catch (error) {
        console.error(
          "DEBUG: Error applying promotion id",
          promo.id,
          ":",
          error
        );
        return res
          .status(500)
          .json({ error: "server error while applying promotions" });
      }
    }
  }

  const responsePayload = {
    id: transaction.id,
    utorid: customer.utorid,
    amount: amount,
    type: "adjustment",
    relatedId,
    remark: remark || "",
    promotionIds: validPromotions.map((p) => p.id),
    createdBy: req.user.utorid,
  };
  return res.status(201).json(responsePayload);
}

/**
 * list transactions
 * payload:
 *  - name: string (filter by utorid or name)
 *  - createdBy: string (filter by creator)
 *  - suspicious: boolean (filter by suspicious flag)
 *  - promotionId: number (filter by promotion applied)
 *  - type: string (filter by transaction type)
 *  - relatedId: number (filter by related id, must be used with type)
 *  - amount: number (filter by point amount)
 *  - operator: string (one of "gte" or "lte")
 *  - page: number (page number for pagination, default 1)
 *  - limit: number (number per page, default 10)
 */
async function listTransactions(req, res) {
  const {
    name,
    createdBy,
    suspicious,
    promotionId,
    type,
    relatedId,
    amount,
    operator,
    page = 1,
    limit = 10,
  } = req.query;

  if (relatedId != null && !type) {
    return res
      .status(400)
      .json({ error: "relatedId filter must be used with type filter" });
  }

  const where = {};
  if (type) {
    where.type = type.toUpperCase();
  }
  if (relatedId != null) {
    where.relatedId = Number(relatedId);
  }
  if (suspicious != null) {
    if (suspicious === "true") {
      where.suspicious = true;
    } else if (suspicious === "false") {
      where.suspicious = false;
    }
  }
  if (amount != null) {
    if (!operator || (operator !== "gte" && operator !== "lte")) {
      return res.status(400).json({
        error:
          'operator must be provided as "gte" or "lte" when filtering by amount',
      });
    }
    const amt = Number(amount);
    if (isNaN(amt)) {
      return res.status(400).json({ error: "amount must be a number" });
    }
    where.amount = operator === "gte" ? { gte: amt } : { lte: amt };
  }

  const transactionWhere = {
    ...where,
    user: name
      ? { OR: [{ utorid: { contains: name } }, { name: { contains: name } }] }
      : undefined,
    createdBy: createdBy ? { utorid: { contains: createdBy } } : undefined,
    transactionPromotions: promotionId
      ? { some: { promotionId: Number(promotionId) } }
      : undefined,
  };

  try {
    const skip = (Number(page) - 1) * Number(limit);
    const [count, transactions] = await Promise.all([
      prisma.transaction.count({ where: transactionWhere }),
      prisma.transaction.findMany({
        where: transactionWhere,
        include: {
          user: true,
          createdBy: true,
          transactionPromotions: { select: { promotionId: true } },
        },
        skip: skip,
        take: Number(limit),
        orderBy: { createdAt: "desc" },
      }),
    ]);
    const results = transactions.map((tx) => ({
      id: tx.id,
      utorid: tx.user ? tx.user.utorid : null,
      amount: tx.amount,
      type: tx.type.toLowerCase(),
      spent: tx.spent,
      promotionIds: tx.transactionPromotions.map((tp) => tp.promotionId),
      suspicious: tx.suspicious,
      remark: tx.remark,
      relatedId: tx.relatedId,
      createdBy: tx.createdBy ? tx.createdBy.utorid : null,
    }));
    return res.json({ count, results });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ error: "server error while retrieving transactions" });
  }
}

/**
 * get single transaction
 * no payload
 */
async function getTransaction(req, res) {
  const transactionId = Number(req.params.transactionId);
  if (isNaN(transactionId)) {
    return res.status(400).json({ error: "invalid transaction id" });
  }
  try {
    const tx = await prisma.transaction.findUnique({
      where: { id: transactionId },
      include: {
        user: true,
        createdBy: true,
        transactionPromotions: { select: { promotionId: true } },
      },
    });
    if (!tx) {
      return res.status(404).json({ error: "transaction not found" });
    }
    return res.json({
      id: tx.id,
      utorid: tx.user ? tx.user.utorid : null,
      type: tx.type.toLowerCase(),
      spent: tx.spent,
      amount: tx.amount,
      promotionIds: tx.transactionPromotions.map((tp) => tp.promotionId),
      suspicious: tx.suspicious,
      remark: tx.remark || "",
      createdBy: tx.createdBy ? tx.createdBy.utorid : null,
      relatedId: tx.relatedId
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ error: "server error while retrieving transaction" });
  }
}

/**
 * update transaction suspicious flag
 * payload:
 *  - suspicious: boolean (true or false)
 */
async function updateTransactionSuspicious(req, res) {
  const transactionId = Number(req.params.transactionId);
  if (isNaN(transactionId)) {
    return res.status(400).json({ error: "invalid transaction id" });
  }
  const { suspicious } = req.body;
  if (suspicious == null) {
    return res.status(400).json({ error: "missing required field suspicious" });
  }
  if (typeof suspicious !== "boolean") {
    return res.status(400).json({ error: "suspicious must be boolean" });
  }
  try {
    // use transaction for atomicity
    const updatedTx = await prisma.$transaction(async (prisma) => {
      const tx = await prisma.transaction.findUnique({
        where: { id: transactionId },
      });
      if (!tx) {
        throw { status: 404, message: "transaction not found" };
      }
      if (tx.suspicious === suspicious) {
        return tx;
      }
      let delta = 0;
      if (!tx.suspicious && suspicious) {
        // marking as suspicious: deduct points
        delta = -tx.amount;
      } else if (tx.suspicious && !suspicious) {
        // unmarking suspicious: credit points
        delta = tx.amount;
      }
      const updatedTx = await prisma.transaction.update({
        where: { id: transactionId },
        data: { suspicious },
      });
      await prisma.user.update({
        where: { id: tx.userId },
        data: { points: { increment: delta } },
      });
      return updatedTx;
    });
    // fetch complete transaction details
    const txFull = await prisma.transaction.findUnique({
      where: { id: updatedTx.id },
      include: {
        user: true,
        createdBy: true,
        transactionPromotions: { select: { promotionId: true } },
      },
    });
    return res.json({
      id: txFull.id,
      utorid: txFull.user ? txFull.user.utorid : null,
      type: txFull.type.toLowerCase(),
      spent: txFull.spent,
      amount: txFull.amount,
      promotionIds: txFull.transactionPromotions.map((tp) => tp.promotionId),
      suspicious: txFull.suspicious,
      remark: txFull.remark || "",
      createdBy: txFull.createdBy ? txFull.createdBy.utorid : null,
    });
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({ error: error.message });
    }
    console.error(error);
    return res
      .status(500)
      .json({ error: "server error while updating suspicious flag" });
  }
}

/**
 * create new transfer transaction
 * payload:
 *  - type: string (must be "transfer")
 *  - amount: number (points amount to be transferred)
 *  - remark: string (any remark)
 */
async function createTransferTransaction(req, res) {
  const recipientId = Number(req.params.userId);
  if (isNaN(recipientId)) {
    return res.status(400).json({ error: "invalid recipient id" });
  }
  const { type, amount, remark } = req.body;
  if (type !== "transfer") {
    return res.status(400).json({ error: "invalid transaction type" });
  }
  if (amount == null || typeof amount !== "number") {
    return res.status(400).json({ error: "invalid or missing amount" });
  }
  try {
    // fetch sender and recipient from db
    const sender = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!sender) {
      return res.status(404).json({ error: "sender not found" });
    }
    if (!sender.verified) {
      return res.status(403).json({ error: "sender not verified" });
    }
    if (sender.points < amount) {
      return res.status(400).json({ error: "not enough points" });
    }
    const recipient = await prisma.user.findUnique({
      where: { id: recipientId },
    });
    if (!recipient) {
      return res.status(404).json({ error: "recipient not found" });
    }
    // use transaction for atomicity
    const [senderTx, receiverTx, ,] = await prisma.$transaction([
      prisma.transaction.create({
        data: {
          type: "TRANSFER",
          amount: -amount,
          remark: remark || "",
          relatedId: recipient.id,
          user: { connect: { id: sender.id } },
          createdBy: { connect: { id: sender.id } },
          senderId: sender.id,
          recipientId: recipient.id,
        },
      }),
      prisma.transaction.create({
        data: {
          type: "TRANSFER",
          amount: amount,
          remark: remark || "",
          relatedId: sender.id,
          user: { connect: { id: recipient.id } },
          createdBy: { connect: { id: sender.id } },
          senderId: sender.id,
          recipientId: recipient.id,
        },
      }),
      prisma.user.update({
        where: { id: sender.id },
        data: { points: { decrement: amount } },
      }),
      prisma.user.update({
        where: { id: recipient.id },
        data: { points: { increment: amount } },
      }),
    ]);
    return res.status(201).json({
      id: senderTx.id,
      sender: sender.utorid,
      recipient: recipient.utorid,
      type: "transfer",
      sent: amount,
      remark: remark || "",
      createdBy: sender.utorid,
      // promotionIds: []
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ error: "server error while creating transfer transaction" });
  }
}

/**
 * create new redemption transaction
 * payload:
 *  - type: string (must be "redemption")
 *  - amount: number (amount to redeem)
 *  - remark: string (any remark)
 */
async function createRedemptionTransaction(req, res) {
  if (req.body.type !== "redemption") {
    return res.status(400).json({ error: "invalid transaction type" });
  }

  const sender = await prisma.user.findUnique({ where: { id: req.user.id } });
  if (!sender) {
    return res.status(404).json({ error: "sender not found" });
  }
  if (!sender.verified) {
    return res.status(403).json({ error: "sender not verified" });
  }

  const { amount, remark } = req.body;
  if (amount == null || typeof amount !== "number") {
    return res.status(400).json({ error: "invalid or missing amount" });
  }

  if (sender.points < amount) {
    return res
      .status(400)
      .json({ error: "redeem amount exceeds user point balance" });
  }
  try {
    const tx = await prisma.transaction.create({
      data: {
        type: "REDEMPTION",
        amount: amount,
        remark: remark || "",
        // processedBy remains null until processed
        user: { connect: { id: req.user.id } },
        createdBy: { connect: { id: req.user.id } },
      },
    });
    return res.status(201).json({
      id: tx.id,
      utorid: req.user.utorid,
      type: "redemption",
      processedBy: null,
      amount: tx.amount,
      remark: tx.remark || "",
      createdBy: req.user.utorid,
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ error: "server error while creating redemption transaction" });
  }
}

/**
 * list transactions for current user
 * payload:
 *  - type: string (filter by transaction type)
 *  - relatedId: number (filter by related id, must be used with type)
 *  - promotionId: number (filter by promotion applied)
 *  - amount: number (filter by point amount, must be used with operator)
 *  - operator: string (one of "gte" or "lte")
 *  - page: number (page number, default 1)
 *  - limit: number (number per page, default 10)
 */
async function listMyTransactions(req, res) {
  const {
    type,
    relatedId,
    promotionId,
    amount,
    operator,
    page = 1,
    limit = 10,
  } = req.query;

  let where = { userId: req.user.id };

  if (type) {
    where.type = type.toUpperCase();
  }

  if (relatedId != null) {
    if (!type) {
      return res
        .status(400)
        .json({ error: "relatedId filter must be used with type filter" });
    }
    where.relatedId = Number(relatedId);
  }

  if (amount != null) {
    if (!operator || (operator !== "gte" && operator !== "lte")) {
      return res.status(400).json({
        error:
          'operator must be provided as "gte" or "lte" when filtering by amount',
      });
    }

    const amt = Number(amount);
    if (isNaN(amt)) {
      return res.status(400).json({ error: "amount must be a number" });
    }
    where.amount = operator === "gte" ? { gte: amt } : { lte: amt };
  }

  if (promotionId != null) {
    where.transactionPromotions = {
      some: { promotionId: Number(promotionId) },
    };
  }
  try {
    const skip = (Number(page) - 1) * Number(limit);

    const [count, transactions] = await Promise.all([
      prisma.transaction.count({ where }),
      prisma.transaction.findMany({
        where,
        include: {
          createdBy: true,
          transactionPromotions: { select: { promotionId: true } },
        },
        skip,
        take: Number(limit),
        orderBy: { createdAt: "desc" },
      }),
    ]);
    const results = transactions.map((tx) => {
      let result = {
        id: tx.id,
        type: tx.type.toLowerCase(),
        spent: tx.spent,
        amount: tx.amount,
        promotionIds: tx.transactionPromotions.map((tp) => tp.promotionId),
        remark: tx.remark || "",
        createdBy: tx.createdBy ? tx.createdBy.utorid : null,
      };

      if (tx.relatedId !== null && tx.relatedId != null) {
        result.relatedId = tx.relatedId;
      }

      return result;
    });

    return res.json({ count, results });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ error: "server error while retrieving transactions" });
  }
}

/**
 * process redemption transaction
 * payload:
 *  - processed: boolean (can only be true)
 */
async function processRedemptionTransaction(req, res) {
  const transactionId = Number(req.params.transactionId);
  if (isNaN(transactionId)) {
    return res.status(400).json({ error: "invalid transaction id" });
  }
  const { processed } = req.body;
  if (processed !== true) {
    return res.status(400).json({ error: "processed must be true" });
  }
  try {
    const updatedTx = await prisma.$transaction(async (prisma) => {
      const tx = await prisma.transaction.findUnique({
        where: { id: transactionId },
      });

      if (!tx) {
        throw { status: 404, message: "transaction not found" };
      }

      if (tx.type !== "REDEMPTION") {
        throw {
          status: 400,
          message: "transaction is not a redemption transaction",
        };
      }

      if (tx.processedById !== null) {
        throw {
          status: 400,
          message: "transaction has already been processed",
        };
      }

      const updTx = await prisma.transaction.update({
        where: { id: transactionId },
        data: { processedBy: { connect: { id: req.user.id } } },
      });

      await prisma.user.update({
        where: { id: tx.userId },
        data: { points: { decrement: tx.amount } },
      });

      return updTx;
    });
    const txFull = await prisma.transaction.findUnique({
      where: { id: updatedTx.id },
      include: {
        user: true,
        createdBy: true,
        processedBy: true,
        transactionPromotions: { select: { promotionId: true } },
      },
    });

    return res.json({
      id: txFull.id,
      utorid: txFull.user ? txFull.user.utorid : null,
      type: txFull.type.toLowerCase(),
      processedBy: txFull.processedBy ? txFull.processedBy.utorid : null,
      redeemed: txFull.amount,
      remark: txFull.remark || "",
      createdBy: txFull.createdBy ? txFull.createdBy.utorid : null,
    });
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({ error: error.message });
    }

    console.error(error);
    return res
      .status(500)
      .json({ error: "server error while processing redemption transaction" });
  }
}

module.exports = {
  createPurchaseTransaction,
  createAdjustmentTransaction,
  listTransactions,
  getTransaction,
  updateTransactionSuspicious,
  createTransferTransaction,
  createRedemptionTransaction,
  listMyTransactions,
  processRedemptionTransaction,
};
