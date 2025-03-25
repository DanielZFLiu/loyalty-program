const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/**
 * create new promotion
 * payload:
 *  - name: string (name of promotion)
 *  - description: string (description of promotion)
 *  - type: string (either "automatic" or "one-time")
 *  - startTime: string (iso 8601 format)
 *  - endTime: string (iso 8601 format, must be after startTime)
 *  - minSpending: number (optional, minimum spending required)
 *  - rate: number (optional, promotional rate)
 *  - points: number (optional, promotional points, default 0)
 */
async function createPromotion(req, res) {
  const {
    name,
    description,
    type,
    startTime,
    endTime,
    minSpending,
    rate,
    points,
  } = req.body;
  if (!name || !description || !type || !startTime || !endTime) {
    return res.status(400).json({ error: "missing required fields" });
  }

  let promoType = "";
  if (type === "automatic") {
    promoType = "AUTOMATIC";
  } else if (type === "one-time") {
    promoType = "ONE_TIME";
  } else {
    return res.status(400).json({ error: "invalid promotion type" });
  }

  const start = new Date(startTime);
  const end = new Date(endTime);
  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return res.status(400).json({ error: "invalid date format" });
  }
  if (end <= start) {
    return res.status(400).json({ error: "endTime must be after startTime" });
  }

  if (
    minSpending != null &&
    (!Number(minSpending) || Number(minSpending) <= 0)
  ) {
    return res.status(400).json({ error: "invalid minspending" });
  }

  if (rate != null && (!Number(rate) || Number(rate) <= 0)) {
    return res.status(400).json({ error: "invalid rate" });
  }

  if (points != null && (typeof points !== "number" || Number(points) < 0)) {
    return res.status(400).json({ error: "invalid points" });
  }

  try {
    const promotion = await prisma.promotion.create({
      data: {
        name,
        description,
        type: promoType,
        startTime: start,
        endTime: end,
        minSpending: minSpending != null ? minSpending : null,
        rate: rate != null ? rate : null,
        points: points != null ? points : 0,
      },
    });
    // return type in lower case format as specified
    const returnType = promotion.type === "ONE_TIME" ? "one-time" : "automatic";
    return res.status(201).json({
      id: promotion.id,
      name: promotion.name,
      description: promotion.description,
      type: returnType,
      startTime: promotion.startTime.toISOString(),
      endTime: promotion.endTime.toISOString(),
      minSpending: promotion.minSpending,
      rate: promotion.rate,
      points: promotion.points,
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ error: "server error while creating promotion" });
  }
}

/**
 * list promotions
 * payload:
 *  - name: string (filter by name)
 *  - type: string (filter by type; either "automatic" or "one-time")
 *  - page: number (page number, default 1)
 *  - limit: number (number per page, default 10)
 * additional for managers:
 *  - started: boolean (filter promotions that have started)
 *  - ended: boolean (filter promotions that have ended)
 */
async function getPromotions(req, res) {
  const { name, type, page = 1, limit = 10, started, ended } = req.query;
  const now = new Date();
  let where = {};
  // common filters
  if (name) {
    where.name = { contains: name, mode: "insensitive" };
  }
  if (type) {
    if (type === "automatic") {
      where.type = "AUTOMATIC";
    } else if (type === "one-time") {
      where.type = "ONE_TIME";
    } else {
      return res.status(400).json({ error: "invalid type filter" });
    }
  }
  if (page != null && (!Number(page) || Number(page) <= 0)) {
    return res.status(400).json({ error: "page must be a postive number" });
  }
  if (limit != null && (!Number(limit) || Number(limit) <= 0)) {
    return res.status(400).json({ error: "limit must be a postive number" });
  }
  // check user clearance: managers (or higher) get extra filters
  const managerRoles = ["MANAGER", "SUPERUSER"];
  if (managerRoles.includes(req.user.role.toUpperCase())) {
    if (started != null && ended != null) {
      return res
        .status(400)
        .json({ error: "cannot specify both started and ended" });
    }
    if (started != null) {
      if (started === "true") {
        where.startTime = { lte: now };
      } else if (started === "false") {
        where.startTime = { gt: now };
      }
    }
    if (ended != null) {
      if (ended === "true") {
        where.endTime = { lte: now };
      } else if (ended === "false") {
        where.endTime = { gt: now };
      }
    }
  } else {
    // regular users: only see active promotions that have not been used
    // where.startTime = { lte: now };
    where.endTime = { gte: now };
    where.OR = [
      { type: "AUTOMATIC" },
      {
        type: "ONE_TIME",
        userPromotions: { none: { userId: req.user.id, used: true } },
      },
    ];
  }
  try {
    const skip = (Number(page) - 1) * Number(limit);
    const [count, promotions] = await Promise.all([
      prisma.promotion.count({ where }),
      prisma.promotion.findMany({
        where,
        orderBy: { startTime: "asc" },
        skip,
        take: Number(limit),
        select: {
          id: true,
          name: true,
          type: true,
          startTime: true,
          endTime: true,
          minSpending: true,
          rate: true,
          points: true,
        },
      }),
    ]);
    // convert type to lower case format (and for one-time, use hyphen)
    const results = promotions.map((promo) => {
      let returnType = "";
      if (promo.type === "AUTOMATIC") {
        returnType = "automatic";
      } else if (promo.type === "ONE_TIME") {
        returnType = "one-time";
      }
      return {
        id: promo.id,
        name: promo.name,
        type: returnType,
        startTime: promo.startTime.toISOString(),
        endTime: promo.endTime.toISOString(),
        minSpending: promo.minSpending,
        rate: promo.rate,
        points: promo.points,
      };
    });
    return res.json({ count, results });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ error: "server error while retrieving promotions" });
  }
}

/**
 * get single promotion
 * no payload
 * regular view: if inactive (not started or ended) return 404
 * manager view: returns full details
 */
async function getPromotion(req, res) {
  const promotionId = Number(req.params.promotionId);
  if (isNaN(promotionId)) {
    return res.status(400).json({ error: "invalid promotion id" });
  }
  try {
    const promotion = await prisma.promotion.findUnique({
      where: { id: promotionId },
    });
    if (!promotion) {
      return res.status(404).json({ error: "promotion not found" });
    }
    const now = new Date();
    const managerRoles = ["MANAGER", "SUPERUSER"];
    if (!managerRoles.includes(req.user.role)) {
      // regular users only see active promotions
      if (promotion.startTime > now || promotion.endTime < now) {
        return res.status(404).json({ error: "promotion not found" });
      }
      return res.json({
        id: promotion.id,
        name: promotion.name,
        description: promotion.description,
        type: promotion.type === "AUTOMATIC" ? "automatic" : "one-time",
        endTime: promotion.endTime.toISOString(),
        minSpending: promotion.minSpending,
        rate: promotion.rate,
        points: promotion.points,
      });
    } else {
      // manager view returns full details
      return res.json({
        id: promotion.id,
        name: promotion.name,
        description: promotion.description,
        type: promotion.type === "AUTOMATIC" ? "automatic" : "one-time",
        startTime: promotion.startTime.toISOString(),
        endTime: promotion.endTime.toISOString(),
        minSpending: promotion.minSpending,
        rate: promotion.rate,
        points: promotion.points,
      });
    }
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ error: "server error while retrieving promotion" });
  }
}

/**
 * PATCH /promotions/:promotionId
 * Update an existing promotion.
 *
 * Payload:
 *  - name: string (optional)
 *  - description: string (optional)
 *  - type: string (optional, either "automatic" or "one-time")
 *  - startTime: string (optional, ISO 8601 format)
 *  - endTime: string (optional, ISO 8601 format, must be after startTime)
 *  - minSpending: number (optional, positive numeric)
 *  - rate: number (optional, positive numeric)
 *  - points: number (optional, non-negative integer)
 */
async function updatePromotion(req, res) {
  const promotionId = Number(req.params.promotionId);
  if (isNaN(promotionId)) {
    return res.status(400).json({ error: "invalid promotion id" });
  }
  const promotion = await prisma.promotion.findUnique({
    where: { id: promotionId },
  });
  if (!promotion) {
    return res.status(404).json({ error: "promotion not found" });
  }

  const {
    name,
    description,
    type,
    startTime,
    endTime,
    minSpending,
    rate,
    points,
  } = req.body;

  // check if any field is provided
  if (
    name == null &&
    description == null &&
    type == null &&
    startTime == null &&
    endTime == null &&
    minSpending == null &&
    rate == null &&
    points == null
  ) {
    return res.json({
      id: promotion.id,
      name: promotion.name,
      type: promotion.type === "AUTOMATIC" ? "automatic" : "one-time",
    });
  }

  const now = new Date();
  const promotionStartTime = new Date(promotion.startTime);
  const promotionEndTime = new Date(promotion.endTime);

  // if promotion started, only allow updating endTime
  if (now > promotionStartTime) {
    if (
      name != null ||
      description != null ||
      type != null ||
      startTime != null ||
      minSpending != null ||
      rate != null ||
      points != null
    ) {
      return res
        .status(400)
        .json({ error: "only endtime can be updated after promotion starts" });
    }
  }

  // if promotion ended, updating endTime not allowed
  if (endTime != null && now > promotionEndTime) {
    return res
      .status(400)
      .json({ error: "endTime cannot be updated after promotion ends" });
  }

  // build the updateData object
  let updateData = {};

  if (name != null) {
    updateData.name = name;
  }

  if (description != null) {
    updateData.description = description;
  }

  if (type != null) {
    let promoType = "";
    if (type === "automatic") {
      promoType = "AUTOMATIC";
    } else if (type === "one-time") {
      promoType = "ONE_TIME";
    } else {
      return res.status(400).json({ error: "invalid promotion type" });
    }
    updateData.type = promoType;
  }

  // process startTime and endTime
  let newStart, newEnd;
  if (startTime != null) {
    newStart = new Date(startTime);
    if (isNaN(newStart.getTime())) {
      return res.status(400).json({ error: "invalid date format" });
    }
    if (newStart < now) {
      return res.status(400).json({ error: "startTime must be in the future" });
    }
    updateData.startTime = newStart;
  }

  if (endTime != null) {
    newEnd = new Date(endTime);
    if (isNaN(newEnd.getTime())) {
      return res.status(400).json({ error: "invalid date format" });
    }
    if (newEnd < now) {
      return res.status(400).json({ error: "endTime must be in the future" });
    }
    updateData.endTime = newEnd;
  }

  // validate that endTime is after startTime
  if (startTime != null && endTime != null) {
    if (newEnd <= newStart) {
      return res.status(400).json({ error: "endTime must be after startTime" });
    }
  } else if (startTime != null && endTime == null) {
    if (newStart >= promotionEndTime) {
      return res
        .status(400)
        .json({ error: "startTime must be before current endTime" });
    }
  } else if (endTime != null && startTime == null) {
    if (newEnd <= promotionStartTime) {
      return res
        .status(400)
        .json({ error: "endTime must be after current startTime" });
    }
  }

  if (minSpending != null) {
    if (!Number(minSpending) || Number(minSpending) <= 0) {
      return res.status(400).json({ error: "invalid minSpending" });
    }
    updateData.minSpending = minSpending;
  }

  if (rate != null) {
    if (!Number(rate) || Number(rate) <= 0) {
      return res.status(400).json({ error: "invalid rate" });
    }
    updateData.rate = rate;
  }

  if (points != null) {
    if (typeof points !== "number" || points < 0) {
      return res.status(400).json({ error: "invalid points" });
    }
    updateData.points = points;
  }

  try {
    const updated = await prisma.promotion.update({
      where: { id: promotionId },
      data: updateData,
    });

    // build the response
    let response = {
      id: updated.id,
      name: updated.name,
      type: updated.type === "AUTOMATIC" ? "automatic" : "one-time",
    };

    if (updateData.startTime != null) {
      response.startTime = updated.startTime.toISOString();
    }
    if (updateData.endTime != null) {
      response.endTime = updated.endTime.toISOString();
    }
    if (updateData.description != null) {
      response.description = updated.description;
    }
    if (updateData.minSpending != null) {
      response.minSpending = updated.minSpending;
    }
    if (updateData.rate != null) {
      response.rate = updated.rate;
    }
    if (updateData.points != null) {
      response.points = updated.points;
    }

    return res.json(response);
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ error: "server error while updating promotion" });
  }
}

/**
 * delete promotion
 * no payload
 */
async function deletePromotion(req, res) {
  const promotionId = Number(req.params.promotionId);
  if (isNaN(promotionId)) {
    return res.status(400).json({ error: "invalid promotion id" });
  }
  const promotion = await prisma.promotion.findUnique({
    where: { id: promotionId },
  });
  if (!promotion) {
    return res.status(404).json({ error: "promotion not found" });
  }
  const now = new Date();
  if (promotion.startTime <= now) {
    return res
      .status(403)
      .json({ error: "cannot delete promotion that has already started" });
  }
  try {
    await prisma.promotion.delete({ where: { id: promotionId } });
    return res.status(204).send();
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ error: "server error while deleting promotion" });
  }
}

module.exports = {
  createPromotion,
  getPromotions,
  getPromotion,
  updatePromotion,
  deletePromotion,
};
